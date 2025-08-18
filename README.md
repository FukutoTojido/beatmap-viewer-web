# osu! Web Beatmap Viewer
An osu! beatmap viewer on the web.

## The 2.0 version of JoSu! is being developed and can be tested out here: [https://beatmap.try-z.net/dev](https://beatmap.try-z.net/dev)
- 2.0 Development Branch: https://github.com/FukutoTojido/beatmap-viewer-web/tree/feature/2.0

## Special Thanks
- Beatmap Mirror from [Nerinyan](https://nerinyan.moe) by **[Zeee2](https://github.com/zeee2)**
- Slider Implementation inspired by **[Marvin](https://github.com/minetoblend)** from [osu-cad](https://github.com/minetoblend/osu-cad/)
- Slider Shader from [webosu](https://github.com/111116/webosu) by **[111116](https://github.com/111116)**
- [node-osr-parser](https://github.com/minhducsun2002/node-osr-parser) by **[minhducsun2002](https://github.com/minhducsun2002)**
- [phaze](https://github.com/olvb/phaze) by **[olvb](https://github.com/olvb)**

## Features
- Play a beatmap (custom hitsounds supported, keysounding are also supported)
- Change beatmap clockrate to match DT and HT (Audio might has some artifacts while playing)
- Change beatmap visual to match HR and EZ
- Switching between Argon slider style and Legacy slider style
- Background dim, background blur, etc. You know it
- **Watch replay (experimental, unstable af)**
- Import skins

## osu! mapping features
- Snap scrolling to the current beatsnap divisor similar to the osu! beatmap editor
- Change beatsnap divisor
- 1ms scrolling by hold `Shift` key while scrolling
- Select hitobject(s) and copy their timestamp to the clipboard by pressing `Ctrl + C` similar to the osu! beatmap editor

## Usage
### Beatmap Preview
- Grab an osu!standard beatmap ID (not beatmapset ID) from [osu! beatmap listing](https://osu.ppy.sh/beatmapsets?m=0) and paste it in the input box on the website.

![bID](https://i.imgur.com/044ifKu.png)

- Alternatively, you can directly load the map by using the `b` query on the URL. Which will look like this: `https://preview.tryz.id.vn/?b=3574847`. Replace the `3574847` with your desired beatmap ID.

- You can also drag and drop / load a local `.osz` file to load the map.

- The loading time of the map really depends on your machine, your internet speed and the map itself. The website might take a long time to load maps with many files bundled inside of the `.osz` (for example: keysounding) or with a poor internet connection. Please be patient. In case it takes forever to load, just create an issue on this repo and I'll have a look at it.

### Replay View (Beta)
- Drag and drop the `.osr` file. Make sure the map of the replay is up to date and not a local map.

## Screenshots
![1](https://i.imgur.com/ZeXNNkz.png)
![2](https://i.imgur.com/Xo8QFFI.png)
![3](https://i.imgur.com/bQxPX7v.png)
![4](https://i.imgur.com/GmYhmfS.png)

## Issue
- Should there be any issue happening on the site, please create a new issue on this repository.
- Also, since I haven't tested this site on many different kinds of browsers (such as Firefox, Safari, Opera, etc), inconsistencies are expected to happen between each one of them.

