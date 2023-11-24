class BeatTick {
    obj;

    constructor() {
        this.obj = new PIXI.Sprite(Timeline.beatLines.tickTexture);
        this.obj.anchor.set(0.5, 1);
        Timeline.beatLines.obj.addChild(this.obj);
    }

    draw(denominator, index, step, delta) {
        const center = Timeline.WIDTH / 2;

        this.obj.tint = BeatLines.BEAT_LINE_COLOR[denominator] ?? 0x929292;

        this.obj.x = center + index * step - delta;
        this.obj.y = Timeline.HEIGHT;

        if (denominator !== 1) this.obj.scale.set(1, 0.5);
    }
}

class BeatLines {
    obj;
    ticks = [];
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
    };

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

        // console.log(whiteTicksNum);
        const step = dividedStep * (Timeline.ZOOM_DISTANCE / 500);
        const delta = (timestamp - nearestTick) * (Timeline.ZOOM_DISTANCE / 500);
        const ticksNumber = Math.floor(range / dividedStep);

        while (this.ticks.length < ticksNumber * 2 + 1) {
            this.ticks.push(new BeatTick());
        }

        while (this.ticks.length > ticksNumber * 2 + 1) {
            const sprite = this.ticks.pop();

            if (!sprite) break;
            this.obj.removeChild(sprite.obj);
            sprite.obj.destroy();
        }

        for (let i = -ticksNumber; i <= ticksNumber; i++) {
            const tickTime = nearestTick + i * dividedStep - offset;
            const whiteTickPassed = Math.round(tickTime / currentBeatStep);
            const nearestWhiteTick = offset + whiteTickPassed * currentBeatStep;
            let denominator = Math.round(currentBeatStep / Math.abs(nearestWhiteTick - (nearestTick + i * dividedStep)));

            if (snap === 5 || snap === 10) denominator = 5;
            if (denominator > 48) denominator = 1;

            this.ticks[i + ticksNumber].draw(denominator, i, step, delta);
        }
    }
}
