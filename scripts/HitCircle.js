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
    obj;
    hitCircleSprite;
    hitCircleOverlaySprite;
    numberSprite;
    approachCircleObj;

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
        const currentOpacity = Clamp(
            timestamp - this.time < 0 ? opacity : 1 - Math.abs(timestamp - this.time) / (sliderAppearance.hitAnim ? 240 : 800),
            0,
            1
        );
        const currentExpand = sliderAppearance.hitAnim ? (timestamp - this.time < 0 ? 1 : 1 - currentOpacity + 1) : 1;

        const HRMultiplier = !mods.HR ? 1 : 4 / 3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        const circleModScale = (54.4 - 4.48 * circleSize * HRMultiplier * EZMultiplier) / (54.4 - 4.48 * circleSize);

        const stackHeight = sliderStackHeight === undefined ? this.stackHeight : sliderStackHeight;
        const currentStackOffset = (-6.4 * (1 - (0.7 * (circleSize * HRMultiplier * EZMultiplier - 5)) / 5)) / 2;

        const convertedColor = colour;
        this.hitCircleSprite.tint = sliderAppearance.hitAnim ? convertedColor : timestamp - this.time < 0 ? convertedColor : 0xffffff;

        this.obj.alpha = currentOpacity;
        this.obj.scale.set(currentExpand * circleModScale);

        const x = ((this.originalX + stackHeight * currentStackOffset) * w) / 512;
        const y = !mods.HR
            ? ((this.originalY + stackHeight * currentStackOffset) * w) / 512
            : ((384 - this.originalY + stackHeight * currentStackOffset) * w) / 512;

        this.obj.x = x;
        this.obj.y = y;

        this.hitCircleOverlaySprite.scale.set(sliderAppearance.legacy ? 236 / 256 : 1);

        this.numberSprite.text = comboIdx.toString();
        this.numberSprite.alpha = timestamp > this.time ? 0 : 1;

        const approachRateExpandRate = opacity >= 0 ? -3 * Math.min(preemptRate, 1) + 4 : 1;
        this.approachCircleObj.obj.x = x;
        this.approachCircleObj.obj.y = y;
        this.approachCircleObj.draw(
            sliderAppearance.hitAnim ? (timestamp > this.time ? 0 : currentOpacity) : currentOpacity,
            approachRateExpandRate * circleModScale,
            convertedColor
        );
        // console.log(this.time, currentExpand, timestamp - this.time > 0, timestamp);
    }

    constructor(positionX, positionY, time, isSliderHead, isNewCombo) {
        this.originalX = parseInt(positionX);
        this.originalY = parseInt(positionY);

        this.time = time;
        this.startTime = time - preempt;
        this.endTime = time + 240;

        // this.positionX = positionX * scaleFactor + (canvas.width - 512 * scaleFactor) / 2 - (hitCircleSize * scaleFactor * 276) / 256 / 2;
        // this.positionY = positionY * scaleFactor + (canvas.height - 384 * scaleFactor) / 2 - (hitCircleSize * scaleFactor * 276) / 256 / 2;

        this.isNewCombo = isNewCombo;

        const hitCircleOverlaySprite = new Sprite(hitCircleOverlayTemplate);
        // hitCircleOverlaySprite.x = x;
        // hitCircleOverlaySprite.y = y;
        hitCircleOverlaySprite.anchor.set(0.5);
        this.hitCircleOverlaySprite = hitCircleOverlaySprite;

        const hitCircleSprite = new Sprite(hitCircleTemplate);
        // hitCircleSprite.x = x;
        // hitCircleSprite.y = y;
        hitCircleSprite.anchor.set(0.5);
        this.hitCircleSprite = hitCircleSprite;

        const numberSprite = new PIXI.Text("0", {
            fontFamily: "Torus",
            fontSize: (40 * 4) / circleSize,
            fontWeight: 600,
            fill: 0xffffff,
            align: "center",
        });
        numberSprite.anchor.set(0.5);
        numberSprite.y = (-1 * w) / 512;
        this.numberSprite = numberSprite;

        const hitCircleContainer = new Container();
        hitCircleContainer.addChild(hitCircleSprite);
        hitCircleContainer.addChild(hitCircleOverlaySprite);
        hitCircleContainer.addChild(numberSprite);
        hitCircleContainer.x = (this.originalX * w) / 512;
        hitCircleContainer.y = (this.originalY * w) / 512;

        this.approachCircleObj = new ApproachCircle(this.originalX, this.originalY);

        this.obj = hitCircleContainer;
    }
}
