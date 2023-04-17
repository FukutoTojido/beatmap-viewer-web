class HitCircle {
    startTime;
    endTime;
    positionX;
    positionY;
    isNewCombo;
    isSliderHead;
    originalX;
    originalY;
    stackHeight = 0;

    draw(opacity, trol, expandRate, preemptRate, colour, colourIdx, comboIdx, currentScaleFactor) {
        const normalizedExpandRate = opacity >= 0 ? 1 : 1 + (1 - expandRate) * 0.5;
        const approachRateExpandRate = opacity >= 0 ? -3 * Math.min(preemptRate, 1) + 4 : 0;
        const HRMultiplier = !mods.HR ? 1 : 4 / 3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        let currentHitCircleSize = 2 * (54.4 - 4.48 * circleSize * HRMultiplier * EZMultiplier);
        const drawOffset = (currentHitCircleSize * currentScaleFactor * 276) / 256 / 2;
        const dark1 = colour
            .replaceAll("rgb(", "")
            .replaceAll(")", "")
            .split(",")
            .map((val) => Math.round((val / 256) * (47 / 256) * 256))
            .join(",");
        const dark2 = colour
            .replaceAll("rgb(", "")
            .replaceAll(")", "")
            .split(",")
            .map((val) => Math.round((val / 256) * (154 / 256) * 256))
            .join(",");

        const inverse = mods.HR ? -1 : 1;

        this.positionX =
            (this.originalX + stackOffset * this.stackHeight) * currentScaleFactor +
            (canvas.width - 512 * currentScaleFactor) / 2; /* - (currentHitCircleSize * currentScaleFactor * 276) / 256 / 2; */
        this.positionY =
            (this.originalY + inverse * stackOffset * this.stackHeight) * currentScaleFactor +
            (canvas.height - 384 * currentScaleFactor) / 2; /* - (currentHitCircleSize * currentScaleFactor * 276) / 256 / 2; */

        const currentDrawSize = (currentHitCircleSize * currentScaleFactor * normalizedExpandRate * 272) / 256;
        const baseDrawSize = (currentHitCircleSize * currentScaleFactor * sampleApproachCircle.width.baseVal.value) / 256;

        ctx.beginPath();
        ctx.globalAlpha = opacity >= 0 ? opacity : expandRate >= 0 ? expandRate : 0;

        ctx.drawImage(
            approachCircleArr[colourIdx],
            this.positionX - (baseDrawSize * approachRateExpandRate - baseDrawSize) / 2 - drawOffset,
            this.positionY - (baseDrawSize * approachRateExpandRate - baseDrawSize) / 2 - drawOffset,
            baseDrawSize * approachRateExpandRate,
            baseDrawSize * approachRateExpandRate
        );

        if (mods.HR) {
            ctx.save();
            ctx.translate(0, this.positionY - (currentDrawSize - currentDrawSize / normalizedExpandRate) / 2 + currentDrawSize);
            ctx.scale(1, -1);
        }
        // ctx.drawImage(
        //     hitCircleArr[colourIdx],
        //     this.positionX - (currentDrawSize - currentDrawSize / normalizedExpandRate) / 2,
        //     !mods.HR ? this.positionY - (currentDrawSize - currentDrawSize / normalizedExpandRate) / 2 : 0,
        //     currentDrawSize,
        //     currentDrawSize
        // );

        const pseudoCanvas = new OffscreenCanvas(currentDrawSize + 6, currentDrawSize + 6);
        const pseudoCtx = pseudoCanvas.getContext("2d");

        const center = (currentDrawSize + 6) / 2;

        pseudoCtx.beginPath();
        pseudoCtx.fillStyle = colour;
        pseudoCtx.arc(center, center, (currentDrawSize / 2) * (236 / 272), 0, Math.PI * 2, 0);
        pseudoCtx.fill();
        pseudoCtx.closePath();

        pseudoCtx.beginPath();
        pseudoCtx.fillStyle = `rgb(${dark2})`;
        pseudoCtx.arc(center, center, (currentDrawSize / 2) * (186 / 272), 0, Math.PI * 2, 0);
        pseudoCtx.fill();
        pseudoCtx.closePath();

        pseudoCtx.beginPath();
        pseudoCtx.fillStyle = `rgb(${dark1})`;
        pseudoCtx.arc(center, center, (currentDrawSize / 2) * (140 / 272), 0, Math.PI * 2, 0);
        pseudoCtx.fill();
        pseudoCtx.closePath();

        pseudoCtx.beginPath();
        pseudoCtx.strokeStyle = "white";
        pseudoCtx.lineWidth = !sliderAppearance.legacy ? 4 : 10;
        pseudoCtx.arc(center, center, !sliderAppearance.legacy ? currentDrawSize / 2 : ((currentDrawSize - 5) / 2) * (236 / 272), 0, Math.PI * 2, 0);
        pseudoCtx.stroke();
        pseudoCtx.closePath();

        ctx.drawImage(
            pseudoCanvas,
            this.positionX - drawOffset * normalizedExpandRate - 2,
            !mods.HR ? this.positionY - drawOffset * normalizedExpandRate - 2 : drawOffset - 2
        );

        if (mods.HR) {
            ctx.restore();
        }

        // ctx.beginPath();
        // ctx.fillStyle = "yellow";
        // ctx.strokeStyle = "yellow";
        // ctx.arc(
        //     this.positionX,
        //     this.positionY - (currentDrawSize - currentDrawSize / normalizedExpandRate) / 2 + currentDrawSize / 2,
        //     2,
        //     0,
        //     Math.PI * 2,
        //     0
        // );
        // ctx.stroke();
        // ctx.fill();
        // ctx.closePath();

        if (opacity < 0) {
            ctx.globalAlpha = Math.max((expandRate - 0.6) / 0.4, 0);
        }

        if (mods.HR) {
            ctx.save();
            ctx.translate(0, this.positionY + (currentHitCircleSize * currentScaleFactor * 276) / 256);
            ctx.scale(1, -1);
        }
        ctx.drawImage(
            defaultArr[comboIdx],
            this.positionX - drawOffset,
            !mods.HR ? this.positionY - drawOffset : drawOffset,
            (currentHitCircleSize * currentScaleFactor * 276) / 256,
            (currentHitCircleSize * currentScaleFactor * 276) / 256
        );
        if (mods.HR) {
            ctx.restore();
        }

        ctx.globalAlpha = 1;
        ctx.closePath();
    }

    constructor(positionX, positionY, time, isSliderHead, isNewCombo) {
        this.originalX = parseInt(positionX);
        this.originalY = parseInt(positionY);

        this.startTime = time - preempt;
        this.endTime = time + 240;

        this.positionX = positionX * scaleFactor + (canvas.width - 512 * scaleFactor) / 2 - (hitCircleSize * scaleFactor * 276) / 256 / 2;
        this.positionY = positionY * scaleFactor + (canvas.height - 384 * scaleFactor) / 2 - (hitCircleSize * scaleFactor * 276) / 256 / 2;

        this.isNewCombo = isNewCombo;
    }
}
