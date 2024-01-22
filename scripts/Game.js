import { Cursor } from "./Cursor.js";
import { ObjectsController } from "./HitObjects/ObjectsController.js";
import { Timestamp } from "./Timestamp.js";
import { ProgressBar } from "./Progress.js";
import { Timeline } from "./Timeline/Timeline.js";
import { Slider } from "./HitObjects/Slider.js";
import { handleCanvasDrag, checkCollide } from "./DragWindow.js";
import { HitSample } from "./Audio.js";
import { TimingPanel } from "./TimingPanel.js";
import { Component } from "./WindowManager.js";
import * as TWEEN from "@tweenjs/tween.js";
import * as PIXI from "pixi.js";
import { PlayContainer } from "./PlayButtons.js";
import { BPM } from "./BPM.js";
import { MetadataPanel } from "./SidePanel.js";
import { TitleArtist } from "./TitleArtist.js";
import { Stats } from "./Stats.js";

export class Game {
    static APP;
    static WRAPPER;
    static MASTER_CONTAINER;
    static CONTAINER;
    static GRID;
    static DRAG_WINDOW;
    static FPS;
    static CURSOR;

    static WIDTH;
    static HEIGHT;
    static SLIDER_ACCURACY = 1 / 500;
    static OFFSET_X;
    static OFFSET_Y;

    static SCALE_RATE = 1;

    static IS_CLICKED = false;
    static IS_DRAGGING = false;
    static IS_RESIZING = false;
    static DID_MOVE = false;
    static START_X = 0;
    static START_Y = 0;
    static CURRENT_X = -1;
    static CURRENT_Y = -1;
    static DRAGGING_START = 0;
    static DRAGGING_END = 0;

    static IS_DRAGSCROLL = false;
    static START_DRAG_Y = 0;

    static AUDIO_CTX = new AudioContext();
    static PLAYBACK_RATE = 1;

    static SELECTED = [];

    static MODS = {
        HD: false,
        HR: false,
        EZ: false,
        DT: false,
        HT: false,
    };

    static SLIDER_APPEARANCE;
    static SKINNING;
    static MAPPING;

    static MASTER_VOL;
    static MUSIC_VOL;
    static HS_VOL;

    static DIFF_FILE_NAME = "";
    static DROP_BLOB = null;
    static BEATMAP_FILE = undefined;

    static COLOR_PALETTES = {
        accent1: 0x88c0d0,
        primary1: 0x171a1f,
        primary2: 0x2e3440,
        primary3: 0x3b4252,
        primary4: 0x434c5e,
        primary5: 0x4c566a,
    };

    static SHOW_METADATA = false;
    static SHOW_TIMING_PANEL = false;
    static REDUCTION = 0;

    // Add certain objects from container
    static addToContainer(objectsList) {
        objectsList.forEach((o) => {
            if (o) Game.CONTAINER.addChild(o.obj);
        });
    }

    // Remove certain objects from container
    static removeFromContainer(objectsList) {
        objectsList.forEach((o) => {
            if (o) Game.CONTAINER.removeChild(o.obj);
        });
    }

    static CursorInit() {
        return new Cursor();
    }

    static FPSInit() {
        PIXI.BitmapFont.from(
            "Torus",
            {
                fontFamily: "Torus",
                fontSize: 20,
                fontWeight: 500,
                fill: 0xffffff,
                align: "right",
            },
            {
                chars: [["a", "z"], ["A", "Z"], ["0", "9"], ". :"],
            }
        );

        const fpsSprite = new PIXI.BitmapText(`0fps\nInfinite ms`, {
            fontName: "Torus",
            align: "right",
            fontSize: 15,
        });

        fpsSprite.anchor.set(1, 1);
        fpsSprite.x = Game.APP.view.width - 10;
        fpsSprite.y = Game.APP.view.height - 10;

        return fpsSprite;
    }

    static dragWindowInit() {
        // Drag window initialize
        const dragWindow = new PIXI.Graphics().lineStyle({
            width: 2,
            color: 0xffffff,
            alpha: 1,
            alignment: 0,
        });

        // Set drag window initial position
        dragWindow.x = Game.OFFSET_X;
        dragWindow.y = Game.OFFSET_Y;
        dragWindow.alpha = 0;

        return dragWindow;
    }

    static gridInit() {
        // Grid initialize
        const graphics = new PIXI.Graphics()
            .lineStyle({
                width: 1,
                color: 0xffffff,
                alpha: 0.1,
                alignment: 0.5,
            })
            .drawRect(0, 0, 512, 384);

        // Draw grid
        const gridWidth = 512 / 16;
        const gridHeight = 384 / 12;
        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 12; j++) {
                graphics.drawRect(i * gridWidth, j * gridHeight, gridWidth, gridHeight);
            }
        }

        // Create grid texture and sprite
        const texture = Game.APP.renderer.generateTexture(graphics);

        const grid = new PIXI.Sprite(texture);
        grid.width = 512;
        grid.height = 384;
        grid.x = Game.OFFSET_X;
        grid.y = Game.OFFSET_Y;
        grid.alpha = 1;
        grid.scale.set(Game.SCALE_RATE);

        // grid.interactive = true;
        grid.eventMode = "static";

        const clickControl = (e) => {
            if (!Game.BEATMAP_FILE || !Game.BEATMAP_FILE.isLoaded) return;

            const currentTime = Game.BEATMAP_FILE.audioNode.getCurrentTime();

            let { x, y } = e.global;
            x -= Game.OFFSET_X;
            y -= Game.OFFSET_Y + Game.MASTER_CONTAINER.y + Game.WRAPPER.y;

            x /= Game.SCALE_RATE;
            y /= Game.SCALE_RATE;

            const selectedObjList = Game.BEATMAP_FILE.beatmapRenderData.objectsController.filtered.filter((o) => checkCollide(x, y, o));

            const selectedObj = selectedObjList.length
                ? selectedObjList.reduce((prev, curr) => {
                      const prevOffset = Math.abs(prev.time - currentTime);
                      const currOffset = Math.abs(curr.time - currentTime);

                      return prevOffset > currOffset ? curr : prev;
                  })
                : undefined;

            if (selectedObj) {
                if (!e.ctrlKey) {
                    Game.SELECTED = [selectedObj.obj.time];
                } else {
                    Game.SELECTED = Game.SELECTED.concat([selectedObj.obj.time]).filter((t, idx, a) => a.indexOf(t) === idx);
                }
            } else if (!Game.DID_MOVE) {
                Game.SELECTED = [];
            }

            Game.DID_MOVE = false;
        };

        Game.MASTER_CONTAINER.masterContainer.on("click", (e) => {
            clickControl(e);
        });
        Game.MASTER_CONTAINER.masterContainer.on("touchstart", (e) => {
            clickControl(e);
        });

        Game.MASTER_CONTAINER.masterContainer.on("touchend", (e) => {});

        Game.MASTER_CONTAINER.masterContainer.on("mousedown", (e) => {
            if (!Game.BEATMAP_FILE || !Game.BEATMAP_FILE.isLoaded) return;

            let { x, y } = e.global;
            x -= Game.OFFSET_X;
            y -= Game.OFFSET_Y + Game.MASTER_CONTAINER.y + Game.WRAPPER.y;

            x /= Game.WIDTH / 512;
            y /= Game.WIDTH / 512;

            Game.IS_DRAGGING = true;
            Game.DRAGGING_START = Game.BEATMAP_FILE.audioNode.getCurrentTime();
            Game.START_X = x;
            Game.START_Y = y;

            Game.DRAG_WINDOW.clear();
            Game.DRAG_WINDOW.lineStyle({
                width: 1,
                color: 0xffffff,
                alpha: 1,
                alignment: 0,
            });

            Game.DRAG_WINDOW.beginFill(0xffffff, 0.2).drawRect(x, y, 0, 0).endFill();

            Game.DRAG_WINDOW.alpha = 1;

            // console.log("Mouse DOWN");
        });

        Game.MASTER_CONTAINER.masterContainer.on("mouseup", (e) => {
            if (!Game.BEATMAP_FILE || !Game.BEATMAP_FILE.isLoaded) return;

            if (Game.CURRENT_X !== -1 && Game.CURRENT_Y !== -1) {
            }

            Game.IS_DRAGGING = false;
            Game.DRAG_WINDOW.alpha = 0;
            // console.log("Mouse UP");
        });

        Game.MASTER_CONTAINER.masterContainer.on("mousemove", (e) => {
            if (!Game.BEATMAP_FILE || !Game.BEATMAP_FILE.isLoaded) return;

            let { x, y } = e.global;
            x -= Game.OFFSET_X;
            y -= Game.OFFSET_Y + Game.MASTER_CONTAINER.y + Game.WRAPPER.y;

            x /= Game.SCALE_RATE;
            y /= Game.SCALE_RATE;

            // console.log(x, y);

            if (Game.IS_DRAGGING) {
                Game.DID_MOVE = true;
                Game.DRAGGING_END = Game.BEATMAP_FILE.audioNode.getCurrentTime();
                Game.CURRENT_X = x;
                Game.CURRENT_Y = y;
                // console.log("Moving");
                handleCanvasDrag(e);

                Game.DRAG_WINDOW.clear();
                Game.DRAG_WINDOW.lineStyle({
                    width: 1,
                    color: 0xffffff,
                    alpha: 1,
                    alignment: 0,
                });

                Game.DRAG_WINDOW.beginFill(0xffffff, 0.2)
                    .drawRect(
                        (Math.min(Game.START_X, x) * Game.WIDTH) / 512,
                        (Math.min(Game.START_Y, y) * Game.WIDTH) / 512,
                        (Math.abs(x - Game.START_X) * Game.WIDTH) / 512,
                        (Math.abs(y - Game.START_Y) * Game.WIDTH) / 512
                    )
                    .endFill();
            }

            const currentTime = Game.BEATMAP_FILE.audioNode.getCurrentTime();
            const inRender = Game.BEATMAP_FILE.beatmapRenderData.objectsController.filtered.filter(
                (o) => o.obj instanceof Slider && checkCollide(x, y, o)
            );
            const selectedSlider = inRender.reduce((selected, current) => {
                if (Math.abs(current.obj.time - currentTime) < Math.abs(selected.obj.time - currentTime)) return current;

                return selected;
            }, inRender[0] ?? null);

            Game.BEATMAP_FILE.beatmapRenderData.objectsController.slidersList.forEach((o) => (o.obj.isHover = false));

            if (selectedSlider) selectedSlider.obj.isHover = true;
        });

        return grid;
    }

    static containerInit() {
        // Container initialize
        const container = new PIXI.Container();

        // Set container offset
        container.x = Game.OFFSET_X;
        container.y = Game.OFFSET_Y;
        container.eventMode = "static";

        return container;
    }

    static appResize() {
        if (innerWidth / innerHeight < 1) {
            Game.WRAPPER.borderRadius = 0;
        } else {
            Game.WRAPPER.borderRadius = 10;
        }

        // Resize Game Field
        Game.appSizeSetup();
        Game.gameSizeSetup();

        // Reposition grid
        Game.GRID.x = Game.OFFSET_X;
        Game.GRID.y = Game.OFFSET_Y;
        Game.GRID.scale.set(Game.SCALE_RATE);

        // Reposition container
        Game.CONTAINER.x = Game.OFFSET_X;
        Game.CONTAINER.y = Game.OFFSET_Y;

        // Reposition drag window
        Game.DRAG_WINDOW.x = Game.OFFSET_X;
        Game.DRAG_WINDOW.y = Game.OFFSET_Y;

        // Reposition FPS
        Game.FPS.x = Game.MASTER_CONTAINER.w - 10;
        Game.FPS.y = Game.MASTER_CONTAINER.h - 10;

        Game.STATS.update();
        Game.INFO.update();
    }

    static appSizeSetup() {
        // Set renderer size to container size
        let { width, height } = getComputedStyle(document.querySelector(".contentWrapper"));
        width = parseInt(width) * window.devicePixelRatio;
        height = parseInt(height) * window.devicePixelRatio;
        const preHeight = height;

        if (innerWidth / innerHeight < 1) {
            height = Math.max(height, (ProgressBar?.MASTER_CONTAINER?.y ?? 0) + (ProgressBar?.MASTER_CONTAINER?.h ?? 0) + 70 * devicePixelRatio);

            if (preHeight !== height) {
                document.querySelector(".contentWrapper").style.height = `${height}px`;
            }
        }

        if (Game.APP.renderer.width === width && Game.APP.renderer.height === height) return;
        Game.APP.renderer.resize(width, height);

        Game.APP.view.style.transform = `scale(${1 / window.devicePixelRatio})`;
    }

    static appInit() {
        // App initialize
        Game.APP = new PIXI.Application({
            width: parseInt(getComputedStyle(document.querySelector(".contentWrapper")).width),
            height: parseInt(getComputedStyle(document.querySelector(".contentWrapper")).height),
            antialias: true,
            autoDensity: true,
            backgroundAlpha: 0,
        });

        Game.appSizeSetup();
        Game.gameInit();
    }

    static gameSizeSetup() {
        Game.WRAPPER.y = 70 * devicePixelRatio;

        Game.WRAPPER.w = Game.APP.renderer.width - (Game.REDUCTION / 400) * 410 * devicePixelRatio;
        Game.WRAPPER.h = Game.APP.renderer.height - 70 * devicePixelRatio;

        Game.MASTER_CONTAINER.w = Game.WRAPPER.w;

        if (innerWidth / innerHeight < 1) {
            Game.MASTER_CONTAINER.h = Game.WRAPPER.w * (3 / 4);
        } else {
            Game.MASTER_CONTAINER.h = Game.WRAPPER.h - 60 * devicePixelRatio;
        }

        if (Game.WIDTH === Game.MASTER_CONTAINER.w && Game.HEIGHT === Game.MASTER_CONTAINER.h) return;

        Game.WIDTH = Game.MASTER_CONTAINER.w;
        Game.HEIGHT = Game.MASTER_CONTAINER.h;

        // Change game width and height to match 4:3 aspect ratio
        if (Game.WIDTH / 512 > Game.HEIGHT / 384) {
            Game.WIDTH = (Game.HEIGHT / 384) * 512;
        } else {
            Game.HEIGHT = (Game.WIDTH / 512) * 384;
        }

        // Re-scale game size by 80% to make space for padding
        Game.WIDTH *= 0.8;
        Game.HEIGHT *= 0.8;

        // Calculate offset
        Game.OFFSET_X = (Game.MASTER_CONTAINER.w - Game.WIDTH) / 2;
        Game.OFFSET_Y = (Game.MASTER_CONTAINER.h - Game.HEIGHT) / 2;

        // Re-scale Game Canvas on Retina / Mobile devices

        // ...
        Game.SCALE_RATE = Game.WIDTH / 512;
    }

    static gameInit() {
        Game.WRAPPER = new Component(0, 70 * devicePixelRatio, Game.APP.renderer.width, Game.APP.renderer.height - 70);
        Game.WRAPPER.color = 0x000000;
        Game.WRAPPER.alpha = 0.01;
        Game.WRAPPER.borderRadius = 10;

        Game.WRAPPER.masterContainer.eventMode = "dynamic";

        Game.WRAPPER.masterContainer.on("touchstart", (e) => {
            Game.START_DRAG_Y = e.global.y;
            Game.IS_DRAGSCROLL = true;
        })

        Game.WRAPPER.masterContainer.on("touchmove", (e) => {
            if (!Game.IS_DRAGSCROLL) return;

            const delta =  e.global.y - Game.START_DRAG_Y;
            window.scrollBy(0, -delta / devicePixelRatio);
            Game.START_DRAG_Y = e.global.y;
        })

        Game.WRAPPER.masterContainer.on("touchend", (e) => {
            Game.START_DRAG_Y = 0;
            Game.IS_DRAGSCROLL = false;
        })


        Game.MASTER_CONTAINER = new Component(0, 0, Game.APP.renderer.width, Game.APP.renderer.height - 60);
        Game.gameSizeSetup();
    }

    static init() {
        Game.appInit();
        Game.CONTAINER = Game.containerInit();
        Game.GRID = Game.gridInit();
        Game.DRAG_WINDOW = Game.dragWindowInit();
        Game.FPS = Game.FPSInit();
        Game.CURSOR = Game.CursorInit();
        Game.INFO = new TitleArtist("", "", "", "");
        Game.STATS = new Stats();

        Game.MASTER_CONTAINER.container.addChild(Game.GRID);
        Game.MASTER_CONTAINER.container.addChild(Game.DRAG_WINDOW);
        Game.MASTER_CONTAINER.container.addChild(Game.CONTAINER);
        Game.MASTER_CONTAINER.container.addChild(Game.FPS);
        Game.MASTER_CONTAINER.container.addChild(Game.CURSOR.obj);

        Game.APP.stage.addChild(Game.WRAPPER.masterContainer);
        Game.WRAPPER.container.addChild(Game.MASTER_CONTAINER.masterContainer);

        Game.WRAPPER.container.addChild(Game.INFO.MASTER_CONTAINER.masterContainer);
        Game.WRAPPER.container.addChild(Game.STATS.container.container);

        Timestamp.init();
        Game.WRAPPER.container.addChild(Timestamp.MASTER_CONTAINER.masterContainer);

        BPM.init();
        Game.WRAPPER.container.addChild(BPM.MASTER_CONTAINER.masterContainer);

        PlayContainer.init();
        Game.WRAPPER.container.addChild(PlayContainer.MASTER_CONTAINER.container);

        ProgressBar.init();
        Game.WRAPPER.container.addChild(ProgressBar.MASTER_CONTAINER.masterContainer);

        Timeline.init();
        Game.APP.stage.addChild(Timeline.MASTER_CONTAINER.masterContainer);

        TimingPanel.init();
        Game.APP.stage.addChild(TimingPanel.MASTER_CONTAINER.masterContainer);

        MetadataPanel.init();
        Game.APP.stage.addChild(MetadataPanel.MASTER_CONTAINER.masterContainer);

        // Add Game Canvas to DOM
        document.querySelector(".contentWrapper").appendChild(Game.APP.view);
        globalThis.__PIXI_APP__ = Game.APP;

        HitSample.masterGainNode = Game.AUDIO_CTX.createGain();
        HitSample.masterGainNode.gain.value = Game.HS_VOL * Game.MASTER_VOL;
        HitSample.masterGainNode.connect(Game.AUDIO_CTX.destination);

        Game.APP.ticker.add(() => {
            TWEEN.update();
            ObjectsController.render();
        });
    }
}
