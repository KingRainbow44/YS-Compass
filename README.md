# YS-Compass

A desktop application for managing and interacting with Yuan Shen (Genshin Impact).

## Features

- [ ] Data Export
  - [ ] [GOOD](https://github.com/Andrewthe13th/Inventory_Kamera/blob/master/InventoryKamera/data/GOOD.cs) format
- [ ] Game Management
  - [ ] Inventory filtering
- [ ] Sandbox Mode
  - [ ] Add/remove items
  - [ ] Change item quantity
  - [ ] Modify artifact stats
- [ ] Developer Features
  - [ ] High-level game/server inspector
  - [ ] Packet sniffer
  - [ ] Runtime definition dumper & deobfuscator

## For Developers

### Building

Run the following commands to build the application:
```bash
bun install
tauri build
```

This requires:
- [Bun Runtime](https://bun.sh/)
- [Rust & Cargo](https://www.rust-lang.org/tools/install)

### YSP Format

YSP stands for *Yuan Shen Protocol*, and is a GRPC-based protocol for interacting with servers.\
It is currently implemented in [Open Shen](https://github.com/KingRainbow44/Open-Shen/).

> [!NOTE]
> See the YSP [Protobuf Definition](ysp.proto) for information.

### Technologies

This is an HTML5-based application using the following technologies:
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PostCSS](https://postcss.org/)
- [sass](https://sass-lang.com/)
- [Prettier](https://prettier.io/)
  - [prettier-plugin-sort-imports](https://github.com/trivago/prettier-plugin-sort-imports)
- [Tauri](https://tauri.app/)

### TypeScript Path Aliases

- `@app` -> `./src`
- `@components` -> `./src/ui/components` (for general components)
- `@pages` -> `./src/ui/pages` (for general components)
- `@hooks` -> `./src/hooks`
- `@stores` -> `./src/stores` (for Zustand stores)
- `@backend` -> `./src/backend` (for any backend code)
- `@css` -> `./src/ui/css` (for global css)

## License

- This project is distributed under the [MIT license](LICENSE).
- This project uses third-party libraries and other resources that may be distributed under other licenses.

---

All rights reserved by © Cognosphere Pte. Ltd. This project is not affiliated with nor endorsed by HoYoverse. Genshin Impact™ and other properties belong to their respective owners.
