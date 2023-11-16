class SliderBall {
    baseSlider;

    obj;
    arrow;
    ring;
    bg;

    constructor(baseSlider) {
        this.baseSlider = baseSlider;
        this.obj = new PIXI.Container();

        const sprite = new PIXI.Sprite(sliderBallTexture);
        const outerRing = new PIXI.Sprite(sliderBallTemplate);
        const bgMask = new PIXI.Graphics()
            .beginFill(0xffffff)
            .drawCircle(0, 0, 59)
            .endFill();
        const bgSprite = new PIXI.Sprite(sliderBallGradientTexture);
        bgSprite.mask = bgMask;

        sprite.anchor.set(0.5);
        outerRing.anchor.set(0.5);
        bgSprite.anchor.set(0.5);

        this.obj.addChild(bgMask);
        this.obj.addChild(bgSprite);
        this.obj.addChild(sprite);
        this.obj.addChild(outerRing);

        this.arrow = sprite;
        this.ring = outerRing;
        this.bg = bgSprite;
    }

    draw(timestamp) {
        this.obj.alpha = 1;
        if (timestamp < this.baseSlider.time || timestamp > this.baseSlider.endTime - 239) this.obj.alpha = 0;

        this.arrow.scale.set(0.7, 0.8);

        const point = this.baseSlider.getPointAtTime(timestamp) ?? this.baseSlider.realTrackPoints.at(-1);
        this.obj.angle = !mods.HR ? point.angle : -point.angle;

        const currentStackOffset = Beatmap.moddedStats.stackOffset;

        let { x, y } = point;
        if (mods.HR) y = 384 - y;

        const circleBaseScale = Beatmap.moddedStats.radius / 54.4;
        this.obj.scale.set(circleBaseScale * Game.SCALE_RATE * (236 / 256) ** 2);

        this.obj.x = (x + this.baseSlider.stackHeight * currentStackOffset) * (Game.WIDTH / 512);
        this.obj.y = (y + this.baseSlider.stackHeight * currentStackOffset) * (Game.WIDTH / 512);
        this.bg.tint = this.baseSlider.colour;
        this.bg.angle = -this.obj.angle;
    }
}
