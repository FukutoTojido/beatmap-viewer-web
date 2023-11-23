class BeatLines {
    obj;
    tickTexture;

    static BEAT_LINE_COLOR = {
        1: 0xffffff,
        2: 0xff0000,
        3: 0xb706b7,
        4: 0x3276e6,
        5: 0xe6e605,
        6: 0x843e84,
        7: 0xe6e605,
        8: 0xe6e605,
        9: 0xe6e605,
    }

    constructor() {
        this.obj = new PIXI.Container();
        this.createTickTexture();
    }

    createTickTexture() {
        const graphic = new PIXI.Graphics().beginFill(0xffffff).drawRect(0, 0, 2, 40).endFill();

        const { width, height } = graphic;

        const renderTexture = PIXI.RenderTexture.create({
            width: width,
            height: height,
            multisample: PIXI.MSAA_QUALITY.MEDIUM,
        });

        Timeline.APP.renderer.render(graphic, {
            renderTexture,
            transform: new PIXI.Matrix(1, 0, 0, 1, width / 2, height / 2),
        });

        Timeline.APP.renderer.framebuffer.blit();
        graphic.destroy(true);

        this.tickTexture = renderTexture;
    }

    draw(timestamp) {
        const { beatstep: currentBeatStep, time: offset } =
            Beatmap.beatStepsList.findLast((timingPoint) => timingPoint.time < timestamp) ?? Beatmap.beatStepsList[0];
        const range = (Timeline.WIDTH / 2 / Timeline.ZOOM_DISTANCE) * 500;

        const snap = parseInt(beatsnap);
        const dividedStep = currentBeatStep / snap;

        const relativePosition = timestamp - offset;
        const relativeTickPassed = Math.round(relativePosition / dividedStep);
        const nearestTick = offset + relativeTickPassed * dividedStep;

        const center = Timeline.WIDTH / 2;

        const removedChildren = this.obj.removeChildren();
        removedChildren.forEach((sprite) => sprite.destroy());
    
        // console.log(whiteTicksNum);
        const step = (dividedStep) * (Timeline.ZOOM_DISTANCE / 500);
        const delta = (timestamp - nearestTick) * (Timeline.ZOOM_DISTANCE / 500); 

        for (let i = 0; nearestTick - i * dividedStep > nearestTick - range; i++) {
            const sprite = new PIXI.Sprite(this.tickTexture);
            sprite.anchor.set(0.5, 1);

            const tickTime = nearestTick - i * dividedStep - offset;
            const whiteTickPassed = Math.round(tickTime / currentBeatStep);
            const nearestWhiteTick = offset + whiteTickPassed * currentBeatStep;
            let denominator = Math.round((currentBeatStep) / Math.abs(nearestWhiteTick - (nearestTick - i * dividedStep)));

            if (denominator > 48) denominator = 1;

            sprite.tint = BeatLines.BEAT_LINE_COLOR[denominator] ?? 0x929292;

            sprite.x = center - i * step - delta;
            sprite.y = Timeline.HEIGHT;

            if (denominator !== 1) sprite.scale.set(1, 0.5);
            this.obj.addChild(sprite);
        }

        for (let i = 0; nearestTick + i * dividedStep < nearestTick + range; i++) {
            const sprite = new PIXI.Sprite(this.tickTexture);
            sprite.anchor.set(0.5, 1);

            const tickTime = nearestTick + i * dividedStep - offset;
            const whiteTickPassed = Math.round(tickTime / currentBeatStep);
            const nearestWhiteTick = offset + whiteTickPassed * currentBeatStep;
            let denominator = Math.round((currentBeatStep) / Math.abs(nearestWhiteTick - (nearestTick + i * dividedStep)));

            if (denominator > 48) denominator = 1;

            sprite.tint = BeatLines.BEAT_LINE_COLOR[denominator] ?? 0x929292;

            sprite.x = center + i * step - delta;
            sprite.y = Timeline.HEIGHT;

            if (denominator !== 1) sprite.scale.set(1, 0.5);
            this.obj.addChild(sprite);
        }
    }
}
