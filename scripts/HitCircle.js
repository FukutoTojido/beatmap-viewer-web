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
    selected;
    hitCircleSprite;
    hitCircleOverlaySprite;
    numberSprite;
    approachCircleObj;
    tempModsHR = mods.HR;
    tempModsEZ = mods.EZ;
    tempW = w;
    tempH = h;

    drawSelected(passedStackHeight) {
        const HRMultiplier = !mods.HR ? 1 : 4 / 3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        const circleModScale = (54.4 - 4.48 * circleSize * HRMultiplier * EZMultiplier) / (54.4 - 4.48 * circleSize);

        const stackHeight = !passedStackHeight ? this.stackHeight : passedStackHeight;
        const currentStackOffset = (-6.4 * (1 - (0.7 * (circleSize * HRMultiplier * EZMultiplier - 5)) / 5)) / 2;

        const x = ((this.originalX + stackHeight * currentStackOffset) * w) / 512;
        const y = !mods.HR
            ? ((this.originalY + stackHeight * currentStackOffset) * w) / 512
            : ((384 - this.originalY + stackHeight * currentStackOffset) * w) / 512;

        this.selected.x = x;
        this.selected.y = y;

        this.selected.scale.set(circleModScale);
    }

    draw(timestamp, opacity, trol, expandRate, preemptRate, colour, colourIdx, comboIdx, currentScaleFactor, sliderStackHeight) {
        // console.log(this.time, opacity);
        const HRMultiplier = !mods.HR ? 1 : 4 / 3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        const circleModScale = (54.4 - 4.48 * circleSize * HRMultiplier * EZMultiplier) / (54.4 - 4.48 * circleSize);

        if (this.tempW !== w || this.tempH !== h) {
            this.tempW = w;
            this.tempH = h;

            this.hitCircleOverlaySprite.texture = hitCircleOverlayTemplate;
            this.hitCircleSprite.texture = hitCircleTemplate;
            this.approachCircleObj.obj.texture = approachCircleTemplate;

            this.numberSprite.scale.set((w / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * circleSize));
        }

        if (this.tempModsHR !== mods.HR || this.tempModsEZ !== mods.EZ) {
            this.numberSprite.scale.set((w / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * circleSize));
        }

        const currentOpacity = Clamp(
            timestamp - this.time < 0 ? opacity : 1 - Math.abs(timestamp - this.time) / (sliderAppearance.hitAnim ? 240 : 800),
            0,
            1
        );
        const currentExpand = sliderAppearance.hitAnim ? (timestamp - this.time < 0 ? 1 : 1 - currentOpacity + 1) : 1;

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

        this.hitCircleOverlaySprite.scale.set(sliderAppearance.legacy ? 236 / 272 : 1);

        this.numberSprite.text = comboIdx.toString();
        this.numberSprite.alpha = timestamp > this.time ? (!sliderAppearance.hitAnim ? 1 : 0) : 1;

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

        const selected = new Sprite(selectedHitCircleTemplate);
        selected.anchor.set(0.5);
        this.selected = selected;

        const hitCircleOverlaySprite = new Sprite(hitCircleOverlayTemplate);
        hitCircleOverlaySprite.anchor.set(0.5);
        this.hitCircleOverlaySprite = hitCircleOverlaySprite;

        const hitCircleSprite = new Sprite(hitCircleTemplate);
        hitCircleSprite.anchor.set(0.5);
        this.hitCircleSprite = hitCircleSprite;

        const numberSprite = new PIXI.Text("0", {
            fontFamily: "Torus",
            fontSize: 40,
            fontWeight: 600,
            fill: 0xffffff,
            align: "center",
        });
        numberSprite.anchor.set(0.5);
        numberSprite.y = (-1 * w) / 512;
        numberSprite.scale.set((w / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * circleSize));
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
