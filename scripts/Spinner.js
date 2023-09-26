class Spinner {
    time;
    endTime;
    obj;
    approachCircle;

    draw(timestamp) {
        if (timestamp < this.time) {
            let currentAR = Clamp(Beatmap.stats.approachRate * (mods.HR ? 1.4 : 1) * (mods.EZ ? 0.5 : 1), 0, 10);
            const currentFadeIn = currentAR < 5 ? 800 + (400 * (5 - currentAR)) / 5 : currentAR > 5 ? 800 - (500 * (currentAR - 5)) / 5 : 800;

            this.obj.alpha = 1 - Math.min(1, Math.max(0, (this.time - timestamp) / currentFadeIn));
            this.approachCircle.scale.set(1.0);
            return;
        }

        if (this.time <= timestamp && timestamp <= this.hitTime) {
            const scale = 1 - Math.max(0, Math.min(1, (timestamp - this.time) / (this.hitTime - this.time)));
            this.approachCircle.scale.set(scale);
            this.obj.alpha = 1;
            return;
        }

        if (timestamp > this.hitTime) {
            this.obj.alpha = 1 - Math.min(1, Math.max(0, (timestamp - this.hitTime) / 240));
            this.approachCircle.scale.set(0.0);
            return;
        }
    }

    constructor(startTime, endTime) {
        this.time = startTime;
        this.hitTime = endTime;
        this.endTime = endTime + 240;

        const container = new Container();

        const approachCircleContainer = new Container();
        const approachCircle = new Graphics()
            .lineStyle({
                width: (4 * w) / 1024,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .arc(0, 0, (192 * w) / 512, 0, Math.PI * 2);
        // graphics.x = (256 * w) / 512;
        // graphics.y = (192 * w) / 512;
        // graphics.anchor.set(0.5);

        approachCircleContainer.addChild(approachCircle);

        const spinner = new Graphics()
            .lineStyle({
                width: (4 * w) / 1024,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .arc(0, 0, (5 * w) / 512, 0, Math.PI * 2);

        container.addChild(approachCircleContainer);
        container.addChild(spinner);
        container.x = (256 * w) / 512;
        container.y = (192 * w) / 512;

        this.obj = container;
        this.approachCircle = approachCircleContainer;
    }
}
