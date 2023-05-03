# osu! Web Beatmap Viewer
An osu! beatmap viewer on the web.

## Special Thanks
- Beatmap Mirror from [Nerinyan](https://nerinyan.moe) by **[Zeee2](https://github.com/zeee2)**
- Slider Shader from [webosu](https://github.com/111116/webosu) by **[111116](https://github.com/111116)**

## Features
- Play a beatmap (custom hitsounds supported, keysounding are also supported)
- Change beatmap clockrate to match ~~DT~~ NC and ~~HT~~ Daycore (This is a limitation of WebAudio API. I'll try to find a way to fix the pitch issue)
- Change beatmap visual to match HR and EZ
- Switching between Argon slider style and Legacy slider style
- Background dim, background blur, etc. You know it

## osu! mapping features
- Snap scrolling to the current beatsnap divisor similar to the osu! beatmap editor
- Change beatsnap divisor
- Precise scrolling at 1/48 beatsnap divisor by hold `Shift` key while scrolling
- Select hitobject(s) and copy their timestamp to the clipboard by pressing `Ctrl + C` similar to the osu! beatmap editor

## Usage
- Grab an osu!standard beatmap ID (not beatmapset ID) from [osu! beatmap listing](https://osu.ppy.sh/beatmapsets?m=0) and paste it in the input box on the website.

![bID](https://i.imgur.com/044ifKu.png)

- Alternatively, you can directly load the map by using the `b` query on the URL. Which will look like this: `https://fukutotojido.github.io/beatmap-viewer-how?b=3574847`. Replace the `3574847` with your desired beatmap ID.

- The loading time of the map really depends on your machine, your internet speed and the map itself. The website might take a long time to load maps with many files bundled inside of the `.osz` (for example: keysounding) or with a poor internet connection. Please be patient. In case it takes forever to load, just create an issue on this repo and I'll have a look at it.

## Screenshots
![1](https://i.imgur.com/1BJ1867.png)
![2](https://i.imgur.com/OfeXc3k.png)

## Issue
- Should there be any issue happening on the site, please create a new issue on this repository.
- Also, since I haven't tested this site on many different kinds of browsers (such as Firefox, Safari, Opera, etc), inconsistencies are expected to happen between each one of them.
- Spinners never existSpinners never existSpinners never existSpinners never existSpinners never existSpinners never existSpinners never existSpinners never existSpinners never exist
