class SliderTick {
    hitTime = -1;
    info;
    spanIdx;

    obj;
    graphic;

    slider;

    scale;

    constructor(info, slider, spanIdx) {
        this.info = info;
        this.slider = slider;

        this.obj = new PIXI.Container();
        this.graphic = new PIXI.Graphics()
            .lineStyle({
                width: 3,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .drawCircle(0, 0, 4);
        this.obj.addChild(this.graphic);
        this.scale = Beatmap.moddedStats.radius / 54.4;

        this.spanIdx = spanIdx;
    }

    draw(timestamp) {
        // This appears to be a very bullshit implementation from me so please do not follow T.T
        const appearTime =
            this.slider.time -
            Beatmap.moddedStats.preempt / 2 +
            this.spanIdx * (Beatmap.moddedStats.preempt / 2 / this.slider.sliderParts.filter((p) => p.type === "Slider Tick").length);

        const currentStackOffset = Beatmap.moddedStats.stackOffset;
        const circleBaseScale = Beatmap.moddedStats.radius / 54.4;

        let { x, y } = this.info;
        if (mods.HR) y = 384 - y;

        this.obj.x = (x + this.slider.stackHeight * currentStackOffset) * Game.SCALE_RATE;
        this.obj.y = (y + this.slider.stackHeight * currentStackOffset) * Game.SCALE_RATE;

        this.graphic.tint = 0xffffff;
        if (skinning.type != "2") this.graphic.tint = this.slider.colour;

        if (timestamp < appearTime) {
            this.obj.alpha = 0;
            return;
        }

        if (timestamp > appearTime && timestamp < appearTime + 600) {
            const alpha = Clamp((timestamp - appearTime) / 150, 0, 1);
            this.obj.alpha = alpha;

            const t = Clamp((timestamp - appearTime) / 600, 0, 1);
            const scale = easeOutElastic(t);
            this.obj.scale.set(circleBaseScale * Game.SCALE_RATE * (0.5 + scale * 0.5));
            return;
        }

        this.obj.alpha = 1;
        this.obj.scale.set(circleBaseScale * Game.SCALE_RATE);

        if (timestamp > this.info.time) this.obj.alpha = 0;
    }
}
