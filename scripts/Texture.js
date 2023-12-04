import { Game } from "./Game.js"
import * as PIXI from "pixi.js";

export class Texture {
    static SELECTED;
    static ARGON = {
        DEFAULTS: null,
        HIT_CIRCLE: null,
        HIT_CIRCLE_OVERLAY: null,
        SLIDER_B: null,
        REVERSE_ARROW: null,
        SLIDER_FOLLOW_CIRCLE: null,
        APPROACH_CIRCLE: null,
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
            .lineStyle({
                width: 10,
                color: 0xf2cc0f,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .arc(0, 0, 59, 0, Math.PI * 2);
    }

    static createHitCircle() {
        const hitCircle = new PIXI.Graphics();

        const circle_1 = new PIXI.Graphics();
        circle_1.beginFill(0xffffff);
        circle_1.drawCircle(0, 0, 59);
        circle_1.endFill();

        const circle_2 = new PIXI.Graphics();
        circle_2.beginFill(0x9a9a9a);
        circle_2.drawCircle(0, 0, 47);
        circle_2.endFill();

        const circle_3 = new PIXI.Graphics();
        circle_3.beginFill(0x2f2f2f);
        circle_3.drawCircle(0, 0, 35);
        circle_3.endFill();

        hitCircle.addChild(circle_1);
        hitCircle.addChild(circle_2);
        hitCircle.addChild(circle_3);

        return hitCircle;
    }

    static createHitCircleOverlay() {
        return new PIXI.Graphics()
            .lineStyle({
                width: 4,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .arc(0, 0, 67, 0, Math.PI * 2);
    }

    static createApproachCircle() {
        return new PIXI.Graphics()
            .lineStyle({
                width: 4,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 1,
            })
            .drawCircle(0, 0, 59);
    }

    static createSliderBall() {
        const sliderBallOutLine = new PIXI.Graphics()
            .lineStyle({
                width: 15,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .arc(0, 0, 59, 0, Math.PI * 2);

        const sliderBallContainer = new PIXI.Container();
        sliderBallContainer.addChild(sliderBallOutLine);

        return sliderBallContainer;
    }

    static createSliderBallBG() {
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

        const tx = PIXI.Texture.from(canvas);
        return tx;

        // const bg = new PIXI.Graphics().beginTextureFill(tx).drawRect(0, 0, radius * 2, radius * 2).endFill();
        // const cont = new PIXI.Container();
        // cont.addChild(bg);

        // return cont;
    }

    static createSliderFollowCircle() {
        const graphic = new PIXI.Graphics()
            .lineStyle({
                width: 8,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .beginFill(0xffffff, 0.3)
            .drawCircle(0, 0, 128)
            .endFill();

        return graphic;
    }

    static createTexture(type) {
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
                return Texture.createSliderBallBG();
            case "SLIDER_FOLLOW_CIRCLE":
                graphics = Texture.createSliderFollowCircle();
                break;
        }

        if (!graphics) return null;
        const { width, height } = graphics;

        const renderTexture = PIXI.RenderTexture.create({
            width: width,
            height: height,
            multisample: PIXI.MSAA_QUALITY.MEDIUM,
            // resolution: window.devicePixelRatio,
        });

        Game.APP.renderer.render(graphics, {
            renderTexture,
            transform: new PIXI.Matrix(1, 0, 0, 1, width / 2, height / 2),
        });

        Game.APP.renderer.framebuffer.blit();

        graphics.destroy(true);

        return renderTexture;
    }

    static generateDefaultTextures() {
        Texture.SELECTED = {
            texture: PIXI.Texture.from("/static/legacy/hitcircleselect@2x.png"),
            isHD: false,
        };
        Texture.ARGON.HIT_CIRCLE = {
            texture: Texture.createTexture("HIT_CIRCLE"),
            isHD: false,
        };
        Texture.ARGON.HIT_CIRCLE_OVERLAY = {
            texture: Texture.createTexture("HIT_CIRCLE_OVERLAY"),
            isHD: false,
        };
        Texture.ARGON.SLIDER_B = {
            ring: {
                texture: Texture.createTexture("SLIDER_BALL"),
                isHD: false,
            },
            arrow: {
                texture: PIXI.Texture.from("/static/arrow.png"),
                isHD: false,
            },
            gradient: {
                texture: Texture.createTexture("SLIDER_BALL_BG"),
                isHD: false,
            },
        };
        Texture.ARGON.REVERSE_ARROW = {
            arrow: {
                texture: PIXI.Texture.from("/static/argon/reversearrow@2x.png"),
                isHD: false,
            },
            ring: {
                texture: PIXI.Texture.from("/static/argon/repeat-edge-piece.png"),
                isHD: false,
            },
        };
        Texture.ARGON.SLIDER_FOLLOW_CIRCLE = {
            texture: Texture.createTexture("SLIDER_FOLLOW_CIRCLE"),
            isHD: false,
        };
        Texture.ARGON.APPROACH_CIRCLE = {
            texture: PIXI.Texture.from("/static/argon/approachcircle@2x.png"),
            isHD: false,
        };
        Texture.ARGON.DEFAULTS = [...Array(10)].fill(null, 0, 10).map((_, idx) => {
            return {
                texture: PIXI.Texture.from(`static/argon/default-${idx}@2x.png`),
                isHD: false,
            };
        });

        Texture.updateTextureFor("HIT_CIRCLE");
        Texture.updateTextureFor("HIT_CIRCLE_OVERLAY");
        Texture.updateTextureFor("SLIDER_B");
        Texture.updateTextureFor("SLIDER_FOLLOW_CIRCLE");
        Texture.updateTextureFor("REVERSE_ARROW");
        Texture.updateTextureFor("APPROACH_CIRCLE");
        Texture.updateNumberTextures([...Array(10)].fill({}, 0, 10));
    }

    static updateNumberTextures(arr, forIdx) {
        if (forIdx) {
            Texture.CUSTOM[forIdx].DEFAULTS = arr.map(({ base64, isHD }, idx) => {
                return {
                    texture: base64 ? PIXI.Texture.from(base64) : PIXI.Texture.from(`static/legacy/default-${idx}@2x.png`),
                    isHD: base64 ? isHD : false,
                };
            });
            return;
        }

        Texture.LEGACY.DEFAULTS = arr.map(({ base64, isHD }, idx) => {
            return {
                texture: base64 ? PIXI.Texture.from(base64) : PIXI.Texture.from(`static/legacy/default-${idx}@2x.png`),
                isHD: base64 ? isHD : false,
            };
        });
    }

    static updateTextureFor(type, base64, isHD, forIdx) {
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
                    texture: base64 ? PIXI.Texture.from(base64) : PIXI.Texture.from("static/legacy/hitcircle@2x.png"),
                    isHD: base64 ? isHD : false,
                };
                break;
            case "HIT_CIRCLE_OVERLAY":
                textureSet.HIT_CIRCLE_OVERLAY = {
                    texture: base64 ? PIXI.Texture.from(base64) : PIXI.Texture.from("static/legacy/hitcircleoverlay@2x.png"),
                    isHD: base64 ? isHD : false,
                };
                break;
            case "SLIDER_B":
                textureSet.SLIDER_B = {
                    ring: {
                        texture: base64 ? PIXI.Texture.from(base64) : PIXI.Texture.from("static/legacy/sliderb0@2x.png"),
                        isHD: base64 ? isHD : false,
                    },
                    arrow: {
                        texture: PIXI.Texture.from("static/empty.png"),
                        isHD: false,
                    },
                    gradient: {
                        texture: PIXI.Texture.from("static/empty.png"),
                        isHD: false,
                    },
                };
                break;
            case "REVERSE_ARROW":
                textureSet.REVERSE_ARROW = {
                    arrow: {
                        texture: PIXI.Texture.from(base64 ?? "static/legacy/reversearrow@2x.png"),
                        isHD: base64 ? isHD : false,
                    },
                    ring: {
                        texture: PIXI.Texture.from("static/empty.png"),
                        isHD: false,
                    },
                };
                break;
            case "SLIDER_FOLLOW_CIRCLE":
                textureSet.SLIDER_FOLLOW_CIRCLE = {
                    texture: PIXI.Texture.from(base64 ?? "static/legacy/sliderfollowcircle@2x.png"),
                    isHD: base64 ? isHD : false,
                };
                break;
            case "APPROACH_CIRCLE":
                textureSet.APPROACH_CIRCLE = {
                    texture: PIXI.Texture.from(base64 ?? "static/legacy/approachcircle@2x.png"),
                    isHD: base64 ? isHD : false,
                };
                break;
        }
    }
}
