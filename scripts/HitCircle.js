class HitCircle {
    startTime;
    endTime;
    positionX;
    positionY;
    isNewCombo;
    isSliderHead;
    originalX;
    originalY;

    draw(opacity, trol, expandRate, preemptRate, colour, colourObject, currentScaleFactor) {
        const normalizedExpandRate = opacity >= 0 ? 1 : 1 + (1 - expandRate) * 0.5;
        const approachRateExpandRate = opacity >= 0 ? -3 * Math.min(preemptRate, 1) + 4 : 0;

        this.positionX =
            this.originalX * currentScaleFactor +
            (canvas.width - 512 * currentScaleFactor) / 2 -
            (hitCircleSize * currentScaleFactor * 276) / 256 / 2;
        this.positionY =
            this.originalY * currentScaleFactor +
            (canvas.height - 384 * currentScaleFactor) / 2 -
            (hitCircleSize * currentScaleFactor * 276) / 256 / 2;

        // console.log(this.positionX, this.positionY)

        const currentDrawSize = (hitCircleSize * currentScaleFactor * normalizedExpandRate * 276) / 256;
        const baseDrawSize = (hitCircleSize * currentScaleFactor * sampleApproachCircle.width.baseVal.value) / 256;

        ctx.beginPath();
        ctx.globalAlpha = opacity >= 0 ? opacity : expandRate >= 0 ? expandRate : 0;

        ctx.drawImage(
            colourObject.approachCircle,
            this.positionX - (baseDrawSize * approachRateExpandRate - baseDrawSize) / 2,
            this.positionY - (baseDrawSize * approachRateExpandRate - baseDrawSize) / 2,
            baseDrawSize * approachRateExpandRate,
            baseDrawSize * approachRateExpandRate
        );

        ctx.drawImage(
            colourObject.hitCircle,
            this.positionX - (currentDrawSize - currentDrawSize / normalizedExpandRate) / 2,
            this.positionY - (currentDrawSize - currentDrawSize / normalizedExpandRate) / 2,
            currentDrawSize,
            currentDrawSize
        );

        ctx.globalAlpha = 1;
        ctx.closePath();
    }

    constructor(positionX, positionY, time, isSliderHead, isNewCombo) {
        this.originalX = positionX;
        this.originalY = positionY;

        this.startTime = time - preempt;
        this.endTime = time + 240;

        this.positionX = positionX * scaleFactor + (canvas.width - 512 * scaleFactor) / 2 - (hitCircleSize * scaleFactor * 276) / 256 / 2;
        this.positionY = positionY * scaleFactor + (canvas.height - 384 * scaleFactor) / 2 - (hitCircleSize * scaleFactor * 276) / 256 / 2;

        this.isNewCombo = isNewCombo;
    }
}
