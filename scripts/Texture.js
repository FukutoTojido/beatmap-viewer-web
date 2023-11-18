class Texture {
    static SELECTED;
    static HIT_CIRCLE;
    static HIT_CIRCLE_OVERLAY;
    static HIT_CIRCLE_LEGACY;
    static HIT_CIRCLE_OVERLAY_LEGACY;
    static APPROACH_CIRCLE;
    static SLIDER_B;
    static REVERSE_ARROW;
    static DEFAULTS;
    static ARGON_DEFAULTS;

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

    static createHitCircleLegacy() {
        const hitCircle = new PIXI.Graphics();

        const circle_0 = new PIXI.Graphics().beginFill(0x202020).drawCircle(0, 0, 59).endFill();

        const circle_1 = new PIXI.Graphics().beginFill(0xffffff).drawCircle(0, 0, 50).endFill();

        const circle_2 = new PIXI.Graphics().beginFill(0x9a9a9a).drawCircle(0, 0, 40).endFill();

        const circle_3 = new PIXI.Graphics().beginFill(0x2f2f2f).drawCircle(0, 0, 30).endFill();

        hitCircle.addChild(circle_0);
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
            .arc(0, 0, 69, 0, Math.PI * 2);
    }

    static createHitCircleOverlayLegacy() {
        return new PIXI.Graphics()
            .lineStyle({
                width: 4,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .arc(0, 0, 59, 0, Math.PI * 2);
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
            .arc(0, 0, 59, 0, Math.PI * 2);
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

    static createTexture(type) {
        let graphics = null;

        switch (type) {
            case "SELECTED_HIT_CIRCLE":
                graphics = Texture.createSelectedHitCircle();
                break;
            case "HIT_CIRCLE":
                graphics = Texture.createHitCircle();
                break;
            case "HIT_CIRCLE_LEGACY":
                graphics = Texture.createHitCircleLegacy();
                break;
            case "HIT_CIRCLE_OVERLAY":
                graphics = Texture.createHitCircleOverlay();
                break;
            case "HIT_CIRCLE_OVERLAY_LEGACY":
                graphics = Texture.createHitCircleOverlayLegacy();
                break;
            case "APPROACH_CIRCLE":
                graphics = Texture.createApproachCircle();
                break;
            case "SLIDER_BALL":
                graphics = Texture.createSliderBall();
                break;
            case "SLIDER_BALL_BG":
                return Texture.createSliderBallBG();
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
            texture: Texture.createTexture("SELECTED_HIT_CIRCLE"),
            isHD: false,
        };
        Texture.updateTextureFor("HIT_CIRCLE");
        Texture.updateTextureFor("HIT_CIRCLE_OVERLAY");
        Texture.updateTextureFor("SLIDER_B");
        Texture.APPROACH_CIRCLE = {
            texture: Texture.createTexture("APPROACH_CIRCLE"),
            isHD: false,
        };
        Texture.REVERSE_ARROW = {
            arrow: {
                texture: PIXI.Texture.from("static/reversearrow@2x.png"),
                isHD: false,
            },
            ring: {
                texture: PIXI.Texture.from("static/repeat-edge-piece.png"),
                isHD: false,
            },
        };
        Texture.updateNumberTextures([...Array(10)].fill({}, 0, 10));
        Texture.ARGON_DEFAULTS = [...Array(10)].fill(null, 0, 10).map((_, idx) => {
            return {
                texture: PIXI.Texture.from(`static/argon/default-${idx}@2x.png`),
                isHD: false
            }
        })
    }

    static updateNumberTextures(arr) {
        Texture.DEFAULTS = arr.map(({ base64, isHD }, idx) => {
            return {
                texture: base64 ? PIXI.Texture.from(base64) : PIXI.Texture.from(`static/default-${idx}@2x.png`),
                isHD: base64 ? isHD : false
            }
        })
    }

    static updateTextureFor(type, base64, isHD) {
        switch (type) {
            case "HIT_CIRCLE":
                Texture.HIT_CIRCLE = {
                    texture: Texture.createTexture("HIT_CIRCLE"),
                    isHD: false,
                };
                Texture.HIT_CIRCLE_LEGACY = {
                    texture: base64 ? PIXI.Texture.from(base64) : PIXI.Texture.from("static/hitcircle@2x.png"),
                    isHD: base64 ? isHD : false,
                };
                break;
            case "HIT_CIRCLE_OVERLAY":
                Texture.HIT_CIRCLE_OVERLAY = {
                    texture: Texture.createTexture("HIT_CIRCLE_OVERLAY"),
                    isHD: false,
                };
                Texture.HIT_CIRCLE_OVERLAY_LEGACY = {
                    texture: base64 ? PIXI.Texture.from(base64) : PIXI.Texture.from("static/hitcircleoverlay@2x.png"),
                    isHD: base64 ? isHD : false,
                };
                break;
            case "SLIDER_B":
                if (base64) {
                    Texture.SLIDER_B = {
                        ring: {
                            texture: PIXI.Texture.from(base64),
                            isHD,
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
                }

                Texture.SLIDER_B = {
                    ring: {
                        texture: Texture.createTexture("SLIDER_BALL"),
                        isHD: false,
                    },
                    arrow: {
                        texture: PIXI.Texture.from("static/arrow.png"),
                        isHD: false,
                    },
                    gradient: {
                        texture: Texture.createTexture("SLIDER_BALL_BG"),
                        isHD: false,
                    },
                };
                break;
            case "REVERSE_ARROW":
                Texture.REVERSE_ARROW = {
                    arrow: {
                        texture: PIXI.Texture.from(base64 ?? "static/reversearrow@2x.png"),
                        isHD,
                    },
                    ring: {
                        texture: PIXI.Texture.from(base64 ? "static/empty.png" : "static/repeat-edge-piece.png"),
                        isHD: false,
                    },
                };
                break;
        }
    }
}
