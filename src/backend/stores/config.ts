import { create } from "zustand";

import { ServerAddress } from "@backend/types.ts";

export type Config = {
    server_address: ServerAddress;
};

const useConfig = create<Config>()(() => ({
    // default config values here...
    server_address: "127.0.0.1:8080"
}));

export default useConfig;
