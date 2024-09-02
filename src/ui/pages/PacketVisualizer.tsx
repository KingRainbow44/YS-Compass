import { MutableRefObject, useEffect, useRef, useState } from "react";

import { FixedSizeList } from "react-window";
import { Item, ItemParams, Menu } from "react-contexify";
import AutoSizer from "react-virtualized-auto-sizer";
import classNames from "classnames";

import { IoMdArrowDown, IoMdClose, IoMdSave } from "react-icons/io";

import Button from "@components/Button.tsx";
import JSONEditor from "@components/JSONEditor.tsx";
import Packet from "@components/visualizer/Packet.tsx";

import useConfig from "@stores/config.ts";

import usePacketList from "@hooks/usePacketList.ts";

import type { Packet as PacketType } from "@backend/types.ts";

import "@css/pages/PacketVisualizer.scss";
import useViewport from "@hooks/useViewport.ts";

/// <editor-fold desc="Filtering">
type ComplexFilters = {
    matchAll?: boolean;
    length?: number;
};

/**
 * Creates a packet filter from a packet and the current filters.
 *
 * orand - true == AND, false == OR
 * filter - packet name filter
 * jsonFilter - packet content filter
 */
function packetFilter(
    {
        data: { packetId, packetName, length, data },
        textFilter, jsonFilter, orand
    }: {
        data: PacketType;
        textFilter: string;
        jsonFilter: string;
        orand: boolean; // When true, both filters must match.
    }
) {
    // Compare the packet's name and ID to the filter.
    const filterResult =
        textFilter.trim().length == 0 ||
        packetId.toString() == textFilter ||
        packetName.toLowerCase().includes(textFilter.toLowerCase());

    // Compare the packet's data to the JSON filter.
    const filters: ComplexFilters = {};
    let parsedFilter = jsonFilter.trim();
    if (parsedFilter.startsWith("@")) {
        let parts = parsedFilter.split(";").map(v => v.trim());
        parsedFilter = parts[parts.length - 1];

        parts = parts.slice(0, parts.length - 1);
        for (const part of parts) {
            const action = part.substring(1);
            const segments = action.split(".").map(v => v.trim());
            switch (segments[0]) {
                case "some":
                    filters.matchAll = false;
                    break;
                case "len":
                case "length":
                    filters.length = parseInt(segments[1]);
                    break;
            }
        }
    }

    // Parse the filters and do the comparison.
    let parsed: any | undefined = undefined;
    try {
        parsed = JSON.parse(parsedFilter);
    } catch (e) {
        parsed = parsedFilter
            .split(",")
            .map((v: string) => v.trim());
    }

    let jsonResult = false;
    try {
        jsonResult = jsonFilter.trim().length == 0 ||
        (
            recursiveCompare(JSON.parse(data), parsed, filters.matchAll ?? true) &&
            (filters.length != undefined ? length >= filters.length : true)
        );
    } catch {

    }

    return orand ?
        filterResult && jsonResult :
        filterResult || jsonResult;
}

/**
 * Recursively determines all values in an object.
 *
 * @param data The data to determine values for.
 */
function allValues(data: any): any[] {
    let values: any[] = [];
    for (const key in data) {
        if (typeof data[key] == "object") {
            values = values.concat(allValues(data[key]));
        } else if (Array.isArray(data[key])) {
            values = values.concat(data[key]);
        } else {
            values.push(data[key]);
        }
    }
    return values;
}

/**
 * Compare two objects recursively by their values.
 *
 * A filter with the following structure:
 * ["test1", "test2"] will match { "randomKey": "test1", "other": "test2", "nested": { "key": "something else" } }
 *
 * A filter with the following structure:
 * ["something else"] will match { "randomKey": "test1", "other": "test2", "nested": { "key": "something else" } }
 *
 * @param data The data to compare.
 * @param filters The filters to compare against. Must match all to return true.
 *
 * @param matchAll Should all filters match to return true?
 */
function recursiveCompare(
    data: object, filters: any[],
    matchAll: boolean = true
): boolean {
    const values = allValues(data);

    // declare array of filters as [false]
    // for-each filter as filterVal; if filterVal is in values, mark filter as true
    // if all filters are true, return true

    let passed: boolean[] = [];
    for (const filterVal of filters) {
        passed.push(values.includes(filterVal));
    }

    return matchAll ?
        passed.every(v => v) :
        passed.some(v => v);
}
/// </editor-fold>

/**
 * Invoked when a 'Copy' action from the context menu is selected.
 */
async function copyPacket({ id, props: { packet } }: ItemParams) {
    try {
        await navigator.clipboard.writeText(
            id == "copy" ?
                packet.data :
                packet.binary ?? packet.data
        );
    } catch (error) {
        alert("Failed to copy packet to clipboard.");
        console.error("Failed to copy packet to clipboard.", error);
    }
}

function Labels() {
    return (
        <div className={"Visualizer_Labels"}>
            <span className={"time"}>Time</span>
            <span className={"index"}>#</span>
            <span className={"source"}>Source</span>
            <span className={"id"}>ID</span>
            <span className={"packet-name"}>Packet Name</span>
            <span className={"length"}>Length</span>
            <span className={"data"}>Data</span>
        </div>
    );
}

interface IListProps {
    listRef: MutableRefObject<FixedSizeList | null>;
    height: number;
    width: number;
    packets: PacketType[];
    setSelected: (index: number) => void;
    setContent: (data: unknown) => void;
    selected: number | undefined;

    isFiltered?: boolean;
}

function PacketList(props: IListProps) {
    const { packets } = props;

    return (
        <FixedSizeList
            ref={props.listRef}
            height={props.height} width={props.width}
            itemSize={34} itemCount={packets.length}
        >
            { ({ index, style }) => (
                <Packet
                    onClick={() => {
                        if (props.isFiltered) {
                            props.listRef.current?.scrollToItem(index, "start");
                        }
                        props.setSelected(index);
                        props.setContent(JSON.parse(packets[index].data));
                    }}
                    index={index} style={style}
                    selected={!props.isFiltered && index == props.selected}
                    data={packets[index]}
                />
            ) }
        </FixedSizeList>
    );
}

/**
 * A React-port of Crepe-Inc/Iridium (now KingRainbow44/Packet-Visualizer).
 */
function PacketVisualizer() {
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const listRef = useRef<FixedSizeList | null>(null);

    /// <editor-fold desc="State variables">
    const [selected, setSelected] = useState<number | undefined>(undefined);
    const [jsonContent, setContent] = useState<unknown | undefined>(undefined);
    const [editorWidth, setEditorWidth] = useState<number>(30);
    const [lockScroll, setLockScroll] = useState<boolean>(false);
    const [searchBoth, setSearchBoth] = useState<boolean>(false);

    const [filteredPackets, setFilteredPackets] = useState<PacketType[]>([]);
    const [nameFilter, setNameFilter] = useState<string | undefined>(undefined);
    const [jsonFilter, setJsonFilter] = useState<string | undefined>(undefined);
    /// </editor-fold>

    const config = useConfig();
    const { height: viewportHeight } = useViewport();
    const { packets, clear } = usePacketList(config.server_address);

    /// <editor-fold desc="Resize functions">
    const onMouseMove = (event: MouseEvent) => {
        const body = bodyRef.current;
        if (!body) return;

        const box = body.getBoundingClientRect();
        const newWidth = Math.min(Math.max(100 - (
            ((event.clientX - box.left) / body.offsetWidth) * 100
        ), 10), 50);

        setEditorWidth(newWidth);
    };
    const onMouseUp = () => {
        if (!bodyRef.current) return;

        bodyRef.current.style.userSelect = "auto";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    };
    /// </editor-fold>

    useEffect(() => {
        if (!lockScroll) return;
        listRef.current?.scrollToItem(packets.length - 1, "end");
    }, [packets]);

    useEffect(() => {
        if (!nameFilter && !jsonFilter) return;
        setFilteredPackets(packets
            .map(packet => {
                const result = packetFilter({
                    data: packet,
                    textFilter: nameFilter ?? "",
                    jsonFilter: jsonFilter ?? "",
                    orand: searchBoth
                });
                return result ? packet : undefined;
            })
            .filter(result => result != undefined)
        );
    }, [packets, nameFilter, jsonFilter, searchBoth]);

    return (
        <div
            ref={bodyRef}
            id={"visualizer"}
            className={"w-full h-screen flex flex-row bg-[#333]"}
        >
            <div
                id={"visualizer-sidebar"}
                className={"flex flex-col justify-between bg-black-100"}
            >
                <Button
                    id={"visualizer-clear"}
                    className={"bg-red-800 hover:bg-red-900"}
                    onClick={() => {
                        clear(); // Clear the packet list.
                        setSelected(undefined); // Clear the selected packet.
                        setContent(undefined); // Clear the JSON content.
                    }}
                    tooltip={"Clear the packet list"}
                >
                    <IoMdClose />
                </Button>

                <div className={"flex flex-col-reverse gap-4"}>
                    <Button
                        id={"visualizer-save"}
                        className={"bg-aqua hover:brightness-150"}
                        onClick={() => {
                            const data = JSON.stringify(packets, null, 4);

                            const download = document.createElement("a");
                            download.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
                            download.download = "packets.json";
                            download.click();
                            download.remove();

                            console.log("Packets have been saved as 'packets.json'.");
                        }}
                        tooltip={"Save all packets as a JSON file"}
                    >
                        <IoMdSave />
                    </Button>

                    <Button
                        id={"visualizer-scroll"}
                        className={classNames(
                            "bg-aqua hover:brightness-150",
                            { "bg-green-600": lockScroll }
                        )}
                        onClick={() => setLockScroll(!lockScroll)}
                    >
                        <IoMdArrowDown />
                    </Button>
                </div>
            </div>

            <div
                id={"visualizer-content"}
                className={"flex flex-col flex-grow h-full bg-black-200"}
            >
                <div
                    id={"visualizer-search"}
                    className={"flex flex-row"}
                >
                    <input
                        placeholder={"🔍 Packet Name"}
                        className={"Visualizer_Input"}
                        onChange={({ target: { value } }) => {
                            const text = value.trim();
                            setNameFilter(text.length != 0 ? text : undefined)
                        }}
                    />

                    <div
                        className={"Visualizer_Mode"}
                        onClick={() => setSearchBoth(!searchBoth)}
                    >
                        <span className={searchBoth ? "!bg-blue-400" : undefined}>and</span>
                        <span className={!searchBoth ? "!bg-blue-400" : undefined}>or</span>
                    </div>

                    <input
                        placeholder={"🔍 Packet Data (JSON)"}
                        className={"Visualizer_Input"}
                        onChange={({ target: { value } }) => {
                            const text = value.trim();
                            setJsonFilter(text.length != 0 ? text : undefined)
                        }}
                    />
                </div>

                { jsonFilter || nameFilter ? (
                    <div className={"flex flex-col bg-black-900 border-b-white border-b-2"}>
                        <Labels />

                        <AutoSizer>
                            {({ width }) => (
                                <PacketList
                                    listRef={listRef}
                                    height={viewportHeight * 0.3} // 30% of the screen height.
                                    width={width}
                                    packets={filteredPackets}
                                    setSelected={setSelected}
                                    setContent={setContent}
                                    selected={selected}
                                    isFiltered={true}
                                />
                            )}
                        </AutoSizer>

                        <div style={{ height: viewportHeight * 0.3 }} />
                    </div>
                ) : undefined }

                <Labels />

                <AutoSizer>
                    {({ height, width }) => (
                        <PacketList
                            listRef={listRef}
                            height={height}
                            width={width}
                            packets={packets}
                            setSelected={setSelected}
                            setContent={setContent}
                            selected={selected}
                        />
                    )}
                </AutoSizer>
            </div>

            <div
                id={"visualizer-resizer"}
                onMouseDown={() => {
                    if (!bodyRef.current) return;

                    bodyRef.current.style.userSelect = "none";
                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                }}
            />

            <div
                id={"visualizer-editor"}
                style={{ width: `${editorWidth}%` }}
            >
                { jsonContent == undefined ?
                    <></> :
                    <JSONEditor
                        readOnly={true}
                        content={{ json: jsonContent }}
                        className={"w-full h-full"}
                    />
                }
            </div>

            <Menu
                className={"!scale-90"}
                id={"visualizer-menu"}
                theme={"dark"}
            >
                <Item id={"copy"} onClick={copyPacket}>Copy</Item>
                <Item id={"copy-raw"} onClick={copyPacket}>Copy Binary Data</Item>
            </Menu>
        </div>
    );
}

export default PacketVisualizer;
