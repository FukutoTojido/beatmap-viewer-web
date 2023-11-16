class HitObjectSprite {
    static createSelectedHitCircle(diameter) {
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

    static createHitCircle(diameter) {
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

    static createHitCircleLegacy(diameter) {
        const hitCircle = new PIXI.Graphics();

        const circle_0 = new PIXI.Graphics()
            .beginFill(0x202020)
            .drawCircle(0, 0, 59)
            .endFill();

        const circle_1 = new PIXI.Graphics()
            .beginFill(0xffffff)
            .drawCircle(0, 0, 50)
            .endFill();

        const circle_2 = new PIXI.Graphics()
            .beginFill(0x9a9a9a)
            .drawCircle(0, 0, 40)
            .endFill();

        const circle_3 = new PIXI.Graphics()
            .beginFill(0x2f2f2f)
            .drawCircle(0, 0, 30)
            .endFill();

        hitCircle.addChild(circle_0);
        hitCircle.addChild(circle_1);
        hitCircle.addChild(circle_2);
        hitCircle.addChild(circle_3);

        return hitCircle;
    }

    static createHitCircleOverlay(diameter) {
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

    static createHitCircleOverlayLegacy(diameter) {
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

    static createApproachCircle(diameter) {
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

    static createSliderBall(diameter) {
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

    static createSliderBallBG(diameter) {
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

    static createSprite(type, diameter) {
        let graphics = null;

        switch (type) {
            case "SELECTED_HIT_CIRCLE":
                graphics = HitObjectSprite.createSelectedHitCircle(diameter);
                break;
            case "HIT_CIRCLE":
                graphics = HitObjectSprite.createHitCircle(diameter);
                break;
            case "HIT_CIRCLE_LEGACY":
                graphics = HitObjectSprite.createHitCircleLegacy(diameter);
                break;
            case "HIT_CIRCLE_OVERLAY":
                graphics = HitObjectSprite.createHitCircleOverlay(diameter);
                break;
            case "HIT_CIRCLE_OVERLAY_LEGACY":
                graphics = HitObjectSprite.createHitCircleOverlayLegacy(diameter);
                break;
            case "APPROACH_CIRCLE":
                graphics = HitObjectSprite.createApproachCircle(diameter);
                break;
            case "SLIDER_BALL":
                graphics = HitObjectSprite.createSliderBall(diameter);
                break;
            case "SLIDER_BALL_BG":
                return HitObjectSprite.createSliderBallBG(diameter);
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
}
