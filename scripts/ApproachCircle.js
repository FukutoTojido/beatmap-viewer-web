class ApproachCircle {
    obj;
    hitCircle;

    constructor(hitCircle) {
        this.hitCircle = hitCircle;

        const approachCircle = new PIXI.Sprite(Texture.ARGON.APPROACH_CIRCLE.texture);
        approachCircle.anchor.set(0.5);
        this.obj = approachCircle;
    }

    draw(timestamp) {
        const skinType = skinning.type === "0" ? "ARGON" : "LEGACY";
        const hdScale = Texture[skinType].APPROACH_CIRCLE.isHD ? 0.5 : 1;
        this.obj.texture = Texture[skinType].APPROACH_CIRCLE.texture;

        this.obj.tint = this.hitCircle.colour;

        let approachRateExpandRate = 1;

        if (timestamp <= this.hitCircle.time) {
            const preemptRate = (timestamp - (this.hitCircle.time - Beatmap.moddedStats.preempt)) / Beatmap.moddedStats.preempt;
            approachRateExpandRate = Math.max(-3 * Math.min(preemptRate, 1) + 4, 1);
        }

        const x = this.hitCircle.originalX;
        const y = !mods.HR ? this.hitCircle.originalY : 384 - this.hitCircle.originalY;
        const stackDistance = this.hitCircle.stackHeight * Beatmap.moddedStats.stackOffset;

        this.obj.x = (x + stackDistance) * Game.SCALE_RATE;
        this.obj.y = (y + stackDistance) * Game.SCALE_RATE;

        const circleBaseScale = Beatmap.moddedStats.radius / 54.4;

        this.obj.scale.set(
            hdScale * approachRateExpandRate * Game.SCALE_RATE * circleBaseScale * (236 / 256) ** 2 * (skinType === "ARGON" ? 0.95 : 1)
        );
        this.obj.alpha = this.hitCircle.opacity;

        if (mods.HD || timestamp > this.hitCircle.time) this.obj.alpha = 0;
    }
}
