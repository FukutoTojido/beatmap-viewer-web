class HitCircle {
    startTime;
    endTime;
    positionX;
    positionY;
    isNewCombo;
    originalX;
    originalY;

    drawApproachCircle(approachRateExpandRate, colour) {
        const pseudoCanvas = new OffscreenCanvas(window.innerWidth, window.innerHeight);
        const pseudoCtx = pseudoCanvas.getContext("2d");

        pseudoCtx.drawImage(
            sampleApproachCircle,
            Math.round(this.positionX - ((hitCircleSize + 5) * textureScaleFactor * approachRateExpandRate - hitCircleSize * textureScaleFactor) / 2),
            Math.round(this.positionY - ((hitCircleSize + 5) * textureScaleFactor * approachRateExpandRate - hitCircleSize * textureScaleFactor) / 2),
            Math.round((hitCircleSize + 5) * textureScaleFactor * approachRateExpandRate),
            Math.round((hitCircleSize + 5) * textureScaleFactor * approachRateExpandRate)
        );

        pseudoCtx.globalCompositeOperation = "source-atop";
        pseudoCtx.fillStyle = colour;
        pseudoCtx.rect(0, 0, window.innerWidth, window.innerHeight);
        pseudoCtx.fill();

        return pseudoCanvas;
    }

    draw(opacity, trol, expandRate, preemptRate, colour, colourObject) {
        const normalizedExpandRate = opacity >= 0 ? 1 : 1 + (1 - expandRate) * 0.5;
        const approachRateExpandRate = opacity >= 0 ? -3 * Math.min(preemptRate, 1) + 4 : 0;

        // const pseudoCanvas = new OffscreenCanvas(window.innerWidth, window.innerHeight);
        // const pseudoCtx = pseudoCanvas.getContext("2d");

        ctx.beginPath();
        ctx.globalAlpha = opacity >= 0 ? opacity : expandRate >= 0 ? expandRate : 0;

        // ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        // console.log(colourObject);

        ctx.drawImage(
            colourObject.approachCircle,
            Math.round(
                this.positionX - ((hitCircleSize + 12) * textureScaleFactor * approachRateExpandRate - hitCircleSize * textureScaleFactor) / 2
            ),
            Math.round(
                this.positionY - ((hitCircleSize + 12) * textureScaleFactor * approachRateExpandRate - hitCircleSize * textureScaleFactor) / 2
            ),
            Math.round((hitCircleSize + 10) * textureScaleFactor * approachRateExpandRate),
            Math.round((hitCircleSize + 10) * textureScaleFactor * approachRateExpandRate)
        );

        ctx.drawImage(
            colourObject.hitCircle,
            Math.round(this.positionX - ((hitCircleSize + 10) * textureScaleFactor * normalizedExpandRate - hitCircleSize * textureScaleFactor) / 2),
            Math.round(this.positionY - ((hitCircleSize + 10) * textureScaleFactor * normalizedExpandRate - hitCircleSize * textureScaleFactor) / 2),
            Math.round((hitCircleSize + 10) * textureScaleFactor * normalizedExpandRate),
            Math.round((hitCircleSize + 10) * textureScaleFactor * normalizedExpandRate)
        );

        // const approachCircleCanvas = this.drawApproachCircle(approachRateExpandRate, colour);

        // ctx.drawImage(approachCircleCanvas, 0, 0);

        // console.log(colour);

        // ctx.drawImage(pseudoCanvas, 0, 0);
        ctx.globalAlpha = 1;
        ctx.closePath();
    }

    constructor(positionX, positionY, time, isSliderHead, isNewCombo, isStacked, nextPosition) {
        // const hit = document.createElement("div");
        // hit.classList.add("hitCircle");
        // hit.style.left = `${positionX * scaleFactor - (hitCircleSize * textureScaleFactor) / 2}px`;
        // hit.style.top = `${positionY * scaleFactor - (hitCircleSize * textureScaleFactor) / 2}px`;
        // hit.style.width = `${hitCircleSize * textureScaleFactor}px`;
        // hit.style.height = `${hitCircleSize * textureScaleFactor}px`;
        // this.domObject = hit;
        this.originalX = isSliderHead ? positionX : positionX * scaleFactor + (window.innerWidth - 512 * scaleFactor) / 2;
        this.originalY = isSliderHead ? positionY : positionY * scaleFactor + (window.innerHeight - 384 * scaleFactor) / 2;

        this.startTime = time - preempt;
        this.endTime = time + 240;

        this.positionX = isSliderHead
            ? Math.round(positionX - (hitCircleSize * textureScaleFactor) / 2)
            : Math.round(positionX * scaleFactor + (window.innerWidth - 512 * scaleFactor) / 2 - (hitCircleSize * textureScaleFactor) / 2);
        this.positionY = isSliderHead
            ? Math.round(positionY - (hitCircleSize * textureScaleFactor) / 2)
            : Math.round(positionY * scaleFactor + (window.innerHeight - 384 * scaleFactor) / 2 - (hitCircleSize * textureScaleFactor) / 2);

        this.isNewCombo = isNewCombo;
    }
}
