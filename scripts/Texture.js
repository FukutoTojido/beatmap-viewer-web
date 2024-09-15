import { Game } from "./Game.js";
import { Database } from "./Database.js";
import * as PIXI from "pixi.js";

export class Texture {
    static SELECTED;
    static SELECTED_ARGON;
    static FOLLOWPOINT;
    static ARGON = {
        DEFAULTS: null,
        HIT_CIRCLE: null,
        HIT_CIRCLE_OVERLAY: null,
        SLIDER_B: null,
        REVERSE_ARROW: null,
        SLIDER_FOLLOW_CIRCLE: null,
        APPROACH_CIRCLE: null,
        GLOW: null
    };
    static LEGACY = {
        DEFAULTS: null,
        HIT_CIRCLE: null,
        HIT_CIRCLE_OVERLAY: null,
        SLIDER_B: null,
        REVERSE_ARROW: null,
        SLIDER_FOLLOW_CIRCLE: null,
        APPROACH_CIRCLE: null,
    };
    static CUSTOM = {};
    static SLIDER_TEXTURE;

    static createSelectedHitCircle() {
        return new PIXI.Graphics()
        .setStrokeStyle({
            width: 12,
            color: 0xedab00,
            alpha: 1,
            cap: "round",
            alignment: 1,
        })
        .arc(0, 0, 59, 0, Math.PI * 2).stroke();
    }

    static createHitCircle() {
        const hitCircle = new PIXI.Container();

        const circle_1 = new PIXI.Graphics().circle(0, 0, 59).fill(0xffffff);
        const circle_2 = new PIXI.Graphics().circle(0, 0, 47).fill(0x9a9a9a);
        const circle_3 = new PIXI.Graphics().circle(0, 0, 35).fill(0x2f2f2f);

        hitCircle.addChild(circle_1);
        hitCircle.addChild(circle_2);
        hitCircle.addChild(circle_3);

        return hitCircle;
    }

    static createHitCircleOverlay() {
        return new PIXI.Graphics()
            .setStrokeStyle({
                width: 4,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 1,
            })
            .arc(0, 0, 67, 0, Math.PI * 2).stroke();
    }

    static createApproachCircle() {
        return new PIXI.Graphics()
            .setStrokeStyle({
                width: 4,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .circle(0, 0, 59).stroke();
    }

    static createSliderBall() {
        const sliderBallOutLine = new PIXI.Graphics()
            .setStrokeStyle({
                width: 15,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 1,
            })
            .arc(0, 0, 59, 0, Math.PI * 2).stroke();

        const sliderBallContainer = new PIXI.Container();
        sliderBallContainer.addChild(sliderBallOutLine);

        return sliderBallContainer;
    }

    static async createSliderBallBG() {
        const radius = 59;

        const canvas = document.createElement("canvas");
        canvas.width = radius * 2;
        canvas.height = radius * 2;

        const ctx = canvas.getContext("2d");

        const gradient = ctx.createLinearGradient(0, 0, 0, radius * 2);
        gradient.addColorStop(0, "white");
        gradient.addColorStop(1, "rgb(74, 74, 74)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, radius * 2, radius * 2);

        const tx = await PIXI.Assets.load(canvas.toDataURL());
        return tx;

        // const bg = new PIXI.Graphics().beginTextureFill(tx).drawRect(0, 0, radius * 2, radius * 2).endFill();
        // const cont = new PIXI.Container();
        // cont.addChild(bg);

        // return cont;
    }

    static createSliderFollowCircle() {
        const graphic = new PIXI.Graphics()
            .setStrokeStyle({
                width: 8,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 1,
            })
            .circle(0, 0, 128)
            .fill({ color: 0xffffff, alpha: 0.3} ).stroke()

        return graphic;
    }

    static createGlow() {
        const graphic = new PIXI.Graphics().circle(0, 0, 59).fill(0xffffff);
        return graphic;
    }

    static async createTexture(type) {
        let graphics = null;

        switch (type) {
            case "SELECTED_HIT_CIRCLE":
                graphics = Texture.createSelectedHitCircle();
                break;
            case "HIT_CIRCLE":
                graphics = Texture.createHitCircle();
                break;
            case "HIT_CIRCLE_OVERLAY":
                graphics = Texture.createHitCircleOverlay();
                break;
            case "SLIDER_BALL":
                graphics = Texture.createSliderBall();
                break;
            case "SLIDER_BALL_BG":
                return await Texture.createSliderBallBG();
            case "SLIDER_FOLLOW_CIRCLE":
                graphics = Texture.createSliderFollowCircle();
                break;
            case "GLOW":
                graphics = Texture.createGlow();
        }

        if (!graphics) return null;
        const { width, height } = graphics;

        const renderTexture = PIXI.RenderTexture.create({
            width: width,
            height: height,
            antialias: true
            // resolution: window.devicePixelRatio,
        });

        Game.APP.renderer.render({
            container: graphics,
            target: renderTexture,
            clearColor: new PIXI.Color([0, 0, 0, 0.0]),
            transform: new PIXI.Matrix(1, 0, 0, 1, width / 2, height / 2),
        });

        // Game.APP.renderer.framebuffer.blit();

        graphics.destroy(true);

        return renderTexture;
    }

    static async generateDefaultTextures() {
        Texture.SELECTED = {
            // texture: PIXI.Texture.from("/static/legacy/hitcircleselect@2x.png"),
            texture: await PIXI.Assets.load(await Database.getDefaults("base64s", "hitcircleselect@2x", "legacy")),
            isHD: true,
        };
        Texture.SELECTED_ARGON = {
            texture: await Texture.createTexture("SELECTED_HIT_CIRCLE"),
            isHD: false,
        }
        Texture.FOLLOWPOINT = {
            texture: await PIXI.Assets.load("/static/followpoint@2x.png"),
            isHD: true
        }
        Texture.ARGON.HIT_CIRCLE = {
            texture: await Texture.createTexture("HIT_CIRCLE"),
            isHD: false,
        };
        Texture.ARGON.HIT_CIRCLE_OVERLAY = {
            texture: await Texture.createTexture("HIT_CIRCLE_OVERLAY"),
            isHD: false,
        };
        Texture.ARGON.SLIDER_B = {
            ring: {
                texture: await Texture.createTexture("SLIDER_BALL"),
                isHD: false,
            },
            arrow: {
                texture: await PIXI.Assets.load("/static/arrow.png"),
                isHD: false,
            },
            gradient: {
                texture: await Texture.createTexture("SLIDER_BALL_BG"),
                isHD: false,
            },
        };
        Texture.ARGON.REVERSE_ARROW = {
            arrow: {
                // texture: PIXI.Texture.from("/static/argon/reversearrow@2x.png"),
                texture: await PIXI.Assets.load(await Database.getDefaults("base64s", "reversearrow@2x", "argon")),
                isHD: true,
            },
            ring: {
                // texture: PIXI.Texture.from("/static/argon/repeat-edge-piece.png"),
                texture: await PIXI.Assets.load(await Database.getDefaults("base64s", "repeat-edge-piece", "argon")),
                isHD: false,
            },
        };
        Texture.ARGON.SLIDER_FOLLOW_CIRCLE = {
            texture: await Texture.createTexture("SLIDER_FOLLOW_CIRCLE"),
            isHD: false,
        };
        Texture.ARGON.APPROACH_CIRCLE = {
            // texture: PIXI.Texture.from("/static/argon/approachcircle@2x.png"),
            texture: await PIXI.Assets.load(await Database.getDefaults("base64s", "approachcircle@2x", "argon")),
            isHD: true,
        };
        Texture.ARGON.DEFAULTS = [];
        for (const idx in [...Array(10)].fill(null, 0, 10)) {
            Texture.ARGON.DEFAULTS.push({
                // texture: PIXI.Texture.from(`static/argon/default-${idx}@2x.png`),
                texture: await PIXI.Assets.load(await Database.getDefaults("base64s", `default-${idx}@2x`, "argon")),
                isHD: true,
            });
        }
        Texture.ARGON.GLOW = {
            texture: await Texture.createTexture("GLOW"),
            isHD: false
        }

        await Texture.updateTextureFor("HIT_CIRCLE");
        await Texture.updateTextureFor("HIT_CIRCLE_OVERLAY");
        await Texture.updateTextureFor("SLIDER_B");
        await Texture.updateTextureFor("SLIDER_FOLLOW_CIRCLE");
        await Texture.updateTextureFor("REVERSE_ARROW");
        await Texture.updateTextureFor("APPROACH_CIRCLE");

        const LEGACY_NUM = [];
        for (const idx in [...Array(10)].fill(null, 0, 10)) {
            LEGACY_NUM.push({
                // texture: PIXI.Texture.from(`static/argon/default-${idx}@2x.png`),
                base64: await Database.getDefaults("base64s", `default-${idx}@2x`, "legacy"),
                isHD: true,
            });
        }

        // console.log(LEGACY_NUM);
        await Texture.updateNumberTextures(LEGACY_NUM);
        
        Texture.BALL_SPEC = {
            texture: await PIXI.Assets.load("static/sliderb-spec@2x.png"),
            isHD: true,
        }
        
        Texture.BALL_ND = {
            texture: await PIXI.Assets.load("static/sliderb-nd@2x.png"),
            isHD: true,
        }
    }

    static async updateNumberTextures(arr, forIdx) {
        if (forIdx) {
            Texture.CUSTOM[forIdx].DEFAULTS = [];
            for (const [idx, obj] of arr.entries()) {
                const { base64, isHD } = obj;

                Texture.CUSTOM[forIdx].DEFAULTS.push({
                    texture: base64 ? await PIXI.Assets.load(base64) : await PIXI.Assets.load(`static/legacy/default-${idx}@2x.png`),
                    isHD: base64 ? isHD : false,
                });
            }
            return;
        }

        Texture.LEGACY.DEFAULTS = [];
        for (const [idx, obj] of arr.entries()) {
            const { base64, isHD } = obj;
            const texture = base64 ? await PIXI.Assets.load(base64) : await PIXI.Assets.load(`static/legacy/default-${idx}@2x.png`);
            
            Texture.LEGACY.DEFAULTS.push({
                texture,
                isHD: base64 ? isHD : false,
            });
        }
    }

    static async updateTextureFor(type, base64, isHD, forIdx) {
        if (forIdx && !Texture.CUSTOM[forIdx]) {
            Texture.CUSTOM[forIdx] = {
                DEFAULTS: null,
                HIT_CIRCLE: null,
                HIT_CIRCLE_OVERLAY: null,
                SLIDER_B: null,
                REVERSE_ARROW: null,
                SLIDER_FOLLOW_CIRCLE: null,
                APPROACH_CIRCLE: null,
            };
        }

        const textureSet = forIdx ? Texture.CUSTOM[forIdx] : Texture.LEGACY;

        switch (type) {
            case "HIT_CIRCLE":
                textureSet.HIT_CIRCLE = {
                    // texture: base64 ? PIXI.Texture.from(base64) : PIXI.Texture.from("static/legacy/hitcircle@2x.png"),
                    texture: await PIXI.Assets.load(base64 ?? (await Database.getDefaults("base64s", `hitcircle@2x`, "legacy"))),
                    isHD: base64 ? isHD : true,
                };
                break;
            case "HIT_CIRCLE_OVERLAY":
                textureSet.HIT_CIRCLE_OVERLAY = {
                    // texture: base64 ? PIXI.Texture.from(base64) : PIXI.Texture.from("static/legacy/hitcircleoverlay@2x.png"),
                    texture: await PIXI.Assets.load(base64 ?? (await Database.getDefaults("base64s", `hitcircleoverlay@2x`, "legacy"))),
                    isHD: base64 ? isHD : true,
                };
                break;
            case "SLIDER_B":
                textureSet.SLIDER_B = {
                    ring: {
                        // texture: base64 ? PIXI.Texture.from(base64) : PIXI.Texture.from("static/legacy/sliderb0@2x.png"),
                        texture: await PIXI.Assets.load(base64 ?? (await Database.getDefaults("base64s", `sliderb0@2x`, "legacy"))),
                        isHD: base64 ? isHD : true,
                    },
                    arrow: {
                        texture: await PIXI.Assets.load("static/empty.png"),
                        isHD: false,
                    },
                    gradient: {
                        texture: await PIXI.Assets.load("static/empty.png"),
                        isHD: false,
                    },
                };
                break;
            case "REVERSE_ARROW":
                textureSet.REVERSE_ARROW = {
                    arrow: {
                        // texture: PIXI.Texture.from(base64 ?? "static/legacy/reversearrow@2x.png"),
                        texture: await PIXI.Assets.load(base64 ?? (await Database.getDefaults("base64s", `reversearrow@2x`, "legacy"))),
                        isHD: base64 ? isHD : true,
                    },
                    ring: {
                        texture: await PIXI.Assets.load("static/empty.png"),
                        isHD: false,
                    },
                };
                break;
            case "SLIDER_FOLLOW_CIRCLE":
                textureSet.SLIDER_FOLLOW_CIRCLE = {
                    // texture: PIXI.Texture.from(base64 ?? "static/legacy/sliderfollowcircle@2x.png"),
                    texture: await PIXI.Assets.load(base64 ?? (await Database.getDefaults("base64s", `sliderfollowcircle@2x`, "legacy"))),
                    isHD: base64 ? isHD : true,
                };
                break;
            case "APPROACH_CIRCLE":
                textureSet.APPROACH_CIRCLE = {
                    // texture: PIXI.Texture.from(base64 ?? "static/legacy/approachcircle@2x.png"),
                    texture: await PIXI.Assets.load(base64 ?? (await Database.getDefaults("base64s", `approachcircle@2x`, "legacy"))),
                    isHD: base64 ? isHD : true,
                };
                break;
        }
    }
}
