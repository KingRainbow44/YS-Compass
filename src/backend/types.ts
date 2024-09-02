export type ServerAddress = `${string}:${number}`;

/**
 * JSON-serialized packet information.
 */
export type Packet = {
    time: number;
    source: "client" | "server";
    packetId: number;
    packetName: string;
    length: number;
    data: string; // This is a JSON string.

    binary?: string; // Base64-encoded raw packet data.
};
