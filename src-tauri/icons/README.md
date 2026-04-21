# App icons

`tauri.conf.json` references the following files in this directory:

- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

Generate them all from a single 1024×1024 source PNG:

```bash
npm run tauri icon path/to/source-icon.png
```

The CLI writes the full icon set into this folder. Do this once before the
first `npm run desktop:build` — `desktop:dev` will also nag about missing
icons but still launch.
