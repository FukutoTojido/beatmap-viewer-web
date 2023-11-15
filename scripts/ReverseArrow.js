class ReverseArrow {
    baseSlider;
    time;
    willHit = false;
    idx;

    position;
    angle;
    stackHeight;

    obj;
    ringSprite;
    arrowSprite;
    baseUnit = 200 / 2;

    constructor(baseSlider, time, position, angle, stackHeight, idx) {
        this.baseSlider = baseSlider;
        this.time = time;
        this.position = position;
        this.angle = angle;
        this.stackHeight = stackHeight;
        this.idx = idx;

        const arrowSprite = new PIXI.Sprite(reverseArrowTextures.arrow);
        arrowSprite.anchor.set(0.5);
        this.arrowSprite = arrowSprite;

        const ringSprite = new PIXI.Sprite(reverseArrowTextures.ring);
        ringSprite.anchor.set(0.5);
        ringSprite.scale.set(0.5 * (229 / 200));
        this.ringSprite = ringSprite;

        this.obj = new PIXI.Container();
        this.obj.addChild(ringSprite);
        this.obj.addChild(arrowSprite);

        // this.baseUnit = Math.max(this.obj.width, this.obj.height);
    }

    calculatePulseAtTime(timestamp) {
        const modulo = timestamp % 300;
        let pulseRate = 0;

        if (modulo <= 35) pulseRate = modulo / 35;
        if (modulo > 35 && modulo < 35 + 250) pulseRate = 1 - (modulo - 35) / 250;

        return pulseRate;
    }

    draw(timestamp) {
        const HRMultiplier = !mods.HR ? 1 : 1.3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        const currentStackOffset = (-6.4 * (1 - (0.7 * (Beatmap.stats.circleSize * HRMultiplier * EZMultiplier - 5)) / 5)) / 2;

        const y = !mods.HR ? this.position.y : 384 - this.position.y;

        this.obj.x = (this.position.x + this.stackHeight * currentStackOffset) * (Game.WIDTH / 512);
        this.obj.y = (y + this.stackHeight * currentStackOffset) * (Game.WIDTH / 512);
        this.obj.rotation = !mods.HR ? this.angle : Math.PI * 2 - this.angle;

        let pulseRate = this.calculatePulseAtTime(timestamp);

        const radius = 54.4 - 4.48 * Beatmap.stats.circleSize * HRMultiplier * EZMultiplier;
        const baseScale = (radius / (this.baseUnit * (640 / 1024))) * (Game.WIDTH / 512);

        this.arrowSprite.scale.set(baseScale + easeOutSine(pulseRate) * 0.3);
        this.ringSprite.scale.set(0.5 * (229 / 200) * baseScale);
        this.ringSprite.x = easeOutSine(pulseRate) * -12 * (512 / Game.WIDTH);
        this.obj.scale.set(1);
        this.obj.alpha = 0;

        if (this.idx === 0 && timestamp < this.baseSlider.time) {
            this.obj.alpha = Clamp((this.baseSlider.opacity - 0.5) * 2, 0, 1);
            return;
        }

        const fadeInTime = Math.min(300, this.baseSlider.sliderTime);
        if (this.idx !== 0) {
            if (timestamp < this.time - this.baseSlider.sliderTime * 2) return;
            if (timestamp >= this.time - this.baseSlider.sliderTime * 2 && timestamp < this.time - this.baseSlider.sliderTime * 2 + fadeInTime) {
                this.obj.alpha = (timestamp - (this.time - this.baseSlider.sliderTime * 2)) / fadeInTime;
                return;
            }
        }

        if (timestamp < this.time) {
            this.obj.alpha = 1;
            return;
        }

        if (mods.HD) {
            this.obj.alpha = 1;

            if (timestamp > this.time) this.obj.alpha = 0;
            return;
        }

        // if (ScoreParser.REPLAY_DATA) {
        //     return;
        // }

        const spanTime = this.baseSlider.endTime - 240 - this.baseSlider.time;
        const animationDuration = Math.min(300, spanTime);
        this.arrowSprite.scale.set(baseScale);
        this.ringSprite.x = 0;

        const percentage = (timestamp - this.time) / animationDuration;
        this.obj.scale.set(Clamp(easeOutSine(percentage), 0, 1) * 0.5 + 1);
        this.obj.alpha = Clamp(1 - easeOutSine(percentage), 0, 1);

        if (timestamp > this.time + animationDuration) this.obj.alpha = 0;
    }
}
