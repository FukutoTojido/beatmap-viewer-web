class HitObjectSprite {
    static createSelectedHitCircle(diameter) {
        return new PIXI.Graphics()
            .lineStyle({
                width: ((((diameter / 2) * 50) / 236) * Game.WIDTH) / 512,
                color: 0xf2cc0f,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .arc(0, 0, ((diameter / 2) * Game.WIDTH) / 512, 0, Math.PI * 2);
    }

    static createHitCircle(diameter) {
        const hitCircle = new PIXI.Graphics();

        const circle_1 = new PIXI.Graphics();
        circle_1.beginFill(0xffffff);
        circle_1.drawCircle(0, 0, ((diameter / 2) * Game.WIDTH) / 512);
        circle_1.endFill();

        const circle_2 = new PIXI.Graphics();
        circle_2.beginFill(0x9a9a9a);
        circle_2.drawCircle(0, 0, ((((diameter / 2) * 186) / 236) * Game.WIDTH) / 512);
        circle_2.endFill();

        const circle_3 = new PIXI.Graphics();
        circle_3.beginFill(0x2f2f2f);
        circle_3.drawCircle(0, 0, ((((diameter / 2) * 140) / 236) * Game.WIDTH) / 512);
        circle_3.endFill();

        hitCircle.addChild(circle_1);
        hitCircle.addChild(circle_2);
        hitCircle.addChild(circle_3);

        return hitCircle;
    }

    static createHitCircleLegacy(diameter) {
        const hitCircle = new PIXI.Graphics();

        const circle_0 = new PIXI.Graphics();
        circle_0.beginFill(0x202020);
        circle_0.drawCircle(0, 0, ((diameter / 2) * Game.WIDTH) / 512);
        circle_0.endFill();

        const circle_1 = new PIXI.Graphics();
        circle_1.beginFill(0xffffff);
        circle_1.drawCircle(0, 0, ((((diameter / 2) * 200) / 236) * Game.WIDTH) / 512);
        circle_1.endFill();

        const circle_2 = new PIXI.Graphics();
        circle_2.beginFill(0x9a9a9a);
        circle_2.drawCircle(0, 0, ((((diameter / 2) * 160) / 236) * Game.WIDTH) / 512);
        circle_2.endFill();

        const circle_3 = new PIXI.Graphics();
        circle_3.beginFill(0x2f2f2f);
        circle_3.drawCircle(0, 0, ((((diameter / 2) * 120) / 236) * Game.WIDTH) / 512);
        circle_3.endFill();

        hitCircle.addChild(circle_0);
        hitCircle.addChild(circle_1);
        hitCircle.addChild(circle_2);
        hitCircle.addChild(circle_3);

        return hitCircle;
    }

    static createHitCircleOverlay(diameter) {
        return new PIXI.Graphics()
            .lineStyle({
                width: (4 * Game.WIDTH) / 1024,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .arc(0, 0, ((((diameter / 2) * 272) / 236) * Game.WIDTH) / 512, 0, Math.PI * 2);
    }

    static createHitCircleOverlayLegacy(diameter) {
        return new PIXI.Graphics()
            .lineStyle({
                width: (4 * Game.WIDTH) / 1024,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .arc(0, 0, ((diameter / 2) * Game.WIDTH) / 512, 0, Math.PI * 2);
    }

    static createApproachCircle(diameter) {
        return new PIXI.Graphics()
            .lineStyle({
                width: (4 * Game.WIDTH) / 1024,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 1,
            })
            .arc(0, 0, ((diameter / 2) * Game.WIDTH) / 512, 0, Math.PI * 2);
    }

    static createSliderBall(diameter) {
        const sliderBallOutLine = new PIXI.Graphics()
            .lineStyle({
                width: (15 * Game.WIDTH) / 1024,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .arc(0, 0, ((diameter / 2) * Game.WIDTH) / 512, 0, Math.PI * 2);

        const sliderBallContainer = new PIXI.Container();
        sliderBallContainer.addChild(sliderBallOutLine);

        return sliderBallContainer;
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
