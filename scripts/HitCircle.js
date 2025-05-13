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
    time;

    drawSelected(passedStackHeight) {
        const currentScaleFactor = Math.min(canvas.height / 480, canvas.width / 640);
        const HRMultiplier = !mods.HR ? 1 : 4 / 3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        let currentHitCircleSize = 2 * (54.4 - 4.48 * circleSize * HRMultiplier * EZMultiplier);

        let currentSliderBorderThickness = !sliderAppearance.legacy
            ? (currentHitCircleSize * (236 - 140)) / 2 / 256 / 2
            : (currentHitCircleSize * (236 - 190)) / 2 / 256 / 2;

        const drawOffset = (currentHitCircleSize * currentScaleFactor) / 2;
        const inverse = mods.HR ? -1 : 1;
        const stackHeight = passedStackHeight ? passedStackHeight : this.stackHeight;
        const objectSize = currentHitCircleSize * currentScaleFactor * (118 / 128);

        this.positionX =
            (this.originalX + stackOffset * stackHeight) * currentScaleFactor +
            (canvas.width - 512 * currentScaleFactor) / 2; /* - (currentHitCircleSize * currentScaleFactor * 276) / 256 / 2; */
        this.positionY =
            (this.originalY + inverse * stackOffset * stackHeight) * currentScaleFactor +
            (canvas.height - 384 * currentScaleFactor) / 2; /* - (currentHitCircleSize * currentScaleFactor * 276) / 256 / 2; */

        ctx.beginPath();
        if (mods.HR) {
            ctx.save();
            ctx.translate(0, this.positionY - drawOffset);
            ctx.scale(1, -1);
        }

        const pseudoCanvas = new OffscreenCanvas(drawOffset * 2 + 6, drawOffset * 2 + 6);
        const pseudoCtx = pseudoCanvas.getContext("2d");

        const center = (drawOffset * 2 + 3) / 2;
        // console.log(drawOffset);

        pseudoCtx.beginPath();
        pseudoCtx.strokeStyle = "rgb(255, 123, 0)";
        pseudoCtx.fillStyle = "rgba(252, 186, 3, 0.2)";
        pseudoCtx.lineWidth = (objectSize - (currentHitCircleSize - currentSliderBorderThickness * 2.5) * currentScaleFactor * (118 / 128)) / 2;
        pseudoCtx.arc(center, center, drawOffset * (236 / 272) - 2, 0, Math.PI * 2, 0);
        pseudoCtx.fill();
        pseudoCtx.stroke();
        pseudoCtx.closePath();

        ctx.drawImage(pseudoCanvas, this.positionX - drawOffset - 2, !mods.HR ? this.positionY - drawOffset - 2 : -drawOffset * 2 - 2);

        if (mods.HR) {
            ctx.restore();
        }

        ctx.closePath();
    }

    draw(timestamp, opacity, trol, expandRate, preemptRate, colour, colourIdx, comboIdx, currentScaleFactor, sliderStackHeight) {
        // console.log(this.time, opacity);
        const normalizedExpandRate = sliderAppearance.hitAnim ? (opacity >= 0 ? 1 : 1 + (1 - expandRate) * 0.5) : 1;
        const approachRateExpandRate = opacity >= 0 ? -3 * Math.min(preemptRate, 1) + 4 : 1;
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

        const stackHeight = sliderStackHeight === undefined ? this.stackHeight : sliderStackHeight;

        this.positionX =
            (this.originalX + stackOffset * stackHeight) * currentScaleFactor +
            (canvas.width - 512 * currentScaleFactor) / 2; /* - (currentHitCircleSize * currentScaleFactor * 276) / 256 / 2; */
        this.positionY =
            (this.originalY + inverse * stackOffset * stackHeight) * currentScaleFactor +
            (canvas.height - 384 * currentScaleFactor) / 2; /* - (currentHitCircleSize * currentScaleFactor * 276) / 256 / 2; */

        const currentDrawSize = (currentHitCircleSize * currentScaleFactor * normalizedExpandRate * 272) / 256;
        const baseDrawSize = (currentHitCircleSize * currentScaleFactor * sampleApproachCircle.width.baseVal.value) / 256;

        ctx.beginPath();
        ctx.globalAlpha =
            opacity >= 0 ? opacity : sliderAppearance.hitAnim ? (expandRate >= 0 ? expandRate : 0) : 1 - Math.min((timestamp - this.time) / 800, 1);

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
        pseudoCtx.fillStyle = sliderAppearance.hitAnim ? colour : opacity >= 0 ? colour : "white";
        pseudoCtx.arc(center, center, (currentDrawSize / 2) * (236 / 272), 0, Math.PI * 2, 0);
        pseudoCtx.fill();
        pseudoCtx.closePath();

        pseudoCtx.beginPath();
        pseudoCtx.fillStyle = sliderAppearance.hitAnim ? `rgb(${dark2})` : opacity >= 0 ? `rgb(${dark2})` : `rgb(154,154,154)`;
        pseudoCtx.arc(center, center, (currentDrawSize / 2) * (186 / 272), 0, Math.PI * 2, 0);
        pseudoCtx.fill();
        pseudoCtx.closePath();

        pseudoCtx.beginPath();
        pseudoCtx.fillStyle = sliderAppearance.hitAnim ? `rgb(${dark1})` : opacity >= 0 ? `rgb(${dark1})` : `rgb(47,47,47)`;
        pseudoCtx.arc(center, center, (currentDrawSize / 2) * (140 / 272), 0, Math.PI * 2, 0);
        pseudoCtx.fill();
        pseudoCtx.closePath();

        pseudoCtx.beginPath();
        pseudoCtx.strokeStyle = "white";
        pseudoCtx.lineWidth = !sliderAppearance.legacy ? 4 : 6;
        pseudoCtx.arc(center, center, !sliderAppearance.legacy ? currentDrawSize / 2 : ((currentDrawSize - 5) / 2) * (236 / 272), 0, Math.PI * 2, 0);
        pseudoCtx.stroke();
        pseudoCtx.closePath();

        ctx.drawImage(
            pseudoCanvas,
            this.positionX - drawOffset * normalizedExpandRate - 2,
            !mods.HR ? this.positionY - drawOffset * normalizedExpandRate - 2 : drawOffset - 4
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
            ctx.globalAlpha = sliderAppearance.hitAnim ? Math.max((expandRate - 0.6) / 0.4, 0) : 1 - Math.min((timestamp - this.time) / 800, 1);
        }

        if (mods.HR) {
            ctx.save();
            ctx.translate(0, this.positionY + (currentHitCircleSize * currentScaleFactor * 276) / 256);
            ctx.scale(1, -1);
        }

        const numberCanvas = new OffscreenCanvas(drawOffset * 2, drawOffset * 2);
        const numberCtx = numberCanvas.getContext("2d");

        const numberCenter = drawOffset;
        const comboStr = comboIdx.toString().split("");
        const digitCounts = comboStr.length - 1;
        const numberOffset = 30;

        // numberCtx.moveTo(0, 0);
        // numberCtx.fillStyle = "red";
        // numberCtx.arc(0, 0, 10, 0, Math.PI * 2, 0);
        // numberCtx.fill();

        // console.log(this.startTime, comboStr);

        comboStr.forEach((num, idx) => {
            numberCtx.drawImage(
                defaultArr[num],
                numberCenter - drawOffset + (idx - digitCounts / 2) * numberOffset,
                numberCenter - drawOffset,
                (currentHitCircleSize * currentScaleFactor * 276) / 256,
                (currentHitCircleSize * currentScaleFactor * 276) / 256
            );
        });

        ctx.drawImage(numberCanvas, this.positionX - drawOffset, !mods.HR ? this.positionY - drawOffset : drawOffset);

        if (mods.HR) {
            ctx.restore();
        }

        ctx.globalAlpha = 1;
        ctx.closePath();
    }

    constructor(positionX, positionY, time, isSliderHead, isNewCombo) {
        this.originalX = parseInt(positionX);
        this.originalY = parseInt(positionY);

        this.time = time;
        this.startTime = time - preempt;
        this.endTime = time + 240;

        this.positionX = positionX * scaleFactor + (canvas.width - 512 * scaleFactor) / 2 - (hitCircleSize * scaleFactor * 276) / 256 / 2;
        this.positionY = positionY * scaleFactor + (canvas.height - 384 * scaleFactor) / 2 - (hitCircleSize * scaleFactor * 276) / 256 / 2;

        this.isNewCombo = isNewCombo;
    }
}
