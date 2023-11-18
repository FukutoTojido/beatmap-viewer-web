class SliderBall {
    baseSlider;

    obj;
    arrow;
    ring;
    bg;
    followCircle;
    sliderB;

    constructor(baseSlider) {
        this.baseSlider = baseSlider;
        this.obj = new PIXI.Container();

        const sliderFollowCircle = new PIXI.Graphics()
            .lineStyle({
                width: 4,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .beginFill(0xffffff, 0.3)
            .drawCircle(0, 0, 54.4)
            .endFill();

        const sprite = new PIXI.Sprite(Texture.SLIDER_B.arrow.texture);
        const outerRing = new PIXI.Sprite(Texture.SLIDER_B.ring.texture);
        const bgMask = new PIXI.Graphics().beginFill(0xffffff).drawCircle(0, 0, 59).endFill();
        const bgSprite = new PIXI.Sprite(Texture.SLIDER_B.gradient.texture);
        bgSprite.mask = bgMask;

        sprite.anchor.set(0.5);
        outerRing.anchor.set(0.5);
        bgSprite.anchor.set(0.5);

        outerRing.scale.set(Texture.SLIDER_B.ring.isHD ? 0.5 : 1);

        const sliderB = new PIXI.Container();
        sliderB.addChild(bgMask);
        sliderB.addChild(bgSprite);
        sliderB.addChild(sprite);
        sliderB.addChild(outerRing);

        this.obj.addChild(sliderFollowCircle);
        this.obj.addChild(sliderB);

        this.arrow = sprite;
        this.ring = outerRing;
        this.bg = bgSprite;
        this.followCircle = sliderFollowCircle;
        this.sliderB = sliderB;
    }

    draw(timestamp) {
        this.arrow.texture = (Texture.SLIDER_B.arrow.texture);
        this.ring.texture = (Texture.SLIDER_B.ring.texture);
        this.bg.texture = (Texture.SLIDER_B.gradient.texture);
        this.ring.scale.set(Texture.SLIDER_B.ring.isHD ? 0.5 : 1);


        this.obj.alpha = 1;
        this.sliderB.alpha = 1;
        this.followCircle.alpha = 1;
        this.followCircle.scale.set(2.4);

        if (timestamp < this.baseSlider.time || timestamp >= this.baseSlider.endTime - 39) this.obj.alpha = 0;
        if (timestamp >= this.baseSlider.time && timestamp < this.baseSlider.time + 300) {
            const alphaB = Clamp((timestamp - this.baseSlider.time) / 200, 0, 1);
            const alphaF = Clamp((timestamp - this.baseSlider.time) / 100, 0, 1);

            this.sliderB.alpha = easeOutQuint(alphaB);
            this.followCircle.alpha = easeOutQuint(alphaF);
            this.followCircle.scale.set(1 + alphaF * 1.4);
        }

        this.arrow.scale.set(0.7, 0.8);

        let point = this.baseSlider.getPointAtTime(timestamp) ?? this.baseSlider.realTrackPoints.at(-1);

        if (timestamp < this.baseSlider.time)
            point = this.baseSlider.realTrackPoints.at(0);

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

        this.followCircle.tint = this.baseSlider.colour;

        if (timestamp >= this.baseSlider.endTime - 239 && timestamp < this.baseSlider.endTime - 39) {
            const alphaB = Clamp((timestamp - (this.baseSlider.endTime - 239)) / 100, 0, 1);
            const alphaF = Clamp((timestamp - (this.baseSlider.endTime - 239)) / 100, 0, 1);

            this.sliderB.alpha = 1 - easeOutQuint(alphaB);
            this.followCircle.alpha = 1 - easeOutQuint(alphaF);
            this.followCircle.scale.set(1 + (1 - alphaF) * 1.4);
        }
    }
}
