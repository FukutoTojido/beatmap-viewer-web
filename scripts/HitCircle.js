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
    hitCircleLegacySprite;
    hitCircleOverlaySprite;
    hitCircleOverlayLegacySprite;
    numberSprite;
    approachCircleObj;
    tempModsHR = mods.HR;
    tempModsEZ = mods.EZ;
    tempW = w;
    tempH = h;
    hitTime;

    drawSelected(passedStackHeight) {
        const HRMultiplier = !mods.HR ? 1 : 1.3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        const circleModScale = (54.4 - 4.48 * Beatmap.stats.circleSize * HRMultiplier * EZMultiplier) / (54.4 - 4.48 * Beatmap.stats.circleSize);

        const stackHeight = !passedStackHeight ? this.stackHeight : passedStackHeight;
        const currentStackOffset = (-6.4 * (1 - (0.7 * (Beatmap.stats.circleSize * HRMultiplier * EZMultiplier - 5)) / 5)) / 2;

        const x = ((this.originalX + stackHeight * currentStackOffset) * w) / 512;
        const y = !mods.HR
            ? ((this.originalY + stackHeight * currentStackOffset) * w) / 512
            : ((384 - this.originalY + stackHeight * currentStackOffset) * w) / 512;

        this.selected.x = x;
        this.selected.y = y;

        this.selected.scale.set(circleModScale);
    }

    draw(timestamp, opacity, trol, expandRate, preemptRate, colour, colourIdx, comboIdx, currentScaleFactor, sliderStackHeight, opacityHD) {
        // if (this.time === 468) console.log(this.time, opacity, opacityHD);

        const HRMultiplier = !mods.HR ? 1 : 4 / 3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        const circleModScale = (54.4 - 4.48 * Beatmap.stats.circleSize * HRMultiplier * EZMultiplier) / (54.4 - 4.48 * Beatmap.stats.circleSize);

        if (this.tempW !== w || this.tempH !== h) {
            this.tempW = w;
            this.tempH = h;

            this.hitCircleOverlaySprite.texture = hitCircleOverlayTemplate;
            this.hitCircleOverlayLegacySprite.texture = hitCircleOverlayLegacyTemplate;
            this.hitCircleSprite.texture = hitCircleTemplate;
            this.hitCircleLegacySprite.texture = hitCircleLegacyTemplate;
            this.approachCircleObj.obj.texture = approachCircleTemplate;

            this.numberSprite.scale.set((w / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * Beatmap.stats.circleSize));
        }

        if (this.tempModsHR !== mods.HR || this.tempModsEZ !== mods.EZ) {
            this.numberSprite.scale.set((w / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * Beatmap.stats.circleSize));
        }

        const currentOpacity = Clamp(
            !mods.HD
                ? timestamp - this.time < 0
                    ? opacity
                    : 1 - Math.abs(timestamp - this.time) / (sliderAppearance.hitAnim ? 240 : 800)
                : opacityHD,
            0,
            1
        );
        const currentExpand = sliderAppearance.hitAnim ? (timestamp - this.time < 0 ? 1 : 1 - currentOpacity + 1) : 1;

        const stackHeight = sliderStackHeight === undefined ? this.stackHeight : sliderStackHeight;
        const currentStackOffset = (-6.4 * (1 - (0.7 * (Beatmap.stats.circleSize * HRMultiplier * EZMultiplier - 5)) / 5)) / 2;

        const convertedColor = colour;
        this.hitCircleSprite.tint = sliderAppearance.hitAnim ? convertedColor : timestamp - this.time < 0 ? convertedColor : 0xffffff;
        this.hitCircleLegacySprite.tint = sliderAppearance.hitAnim ? convertedColor : timestamp - this.time < 0 ? convertedColor : 0xffffff;

        this.obj.alpha = currentOpacity;
        this.obj.scale.set(currentExpand * circleModScale);

        const x = ((this.originalX + stackHeight * currentStackOffset) * w) / 512;
        const y = !mods.HR
            ? ((this.originalY + stackHeight * currentStackOffset) * w) / 512
            : ((384 - this.originalY + stackHeight * currentStackOffset) * w) / 512;

        this.obj.x = x;
        this.obj.y = y;

        if (sliderAppearance.legacy) {
            this.hitCircleSprite.alpha = 0;
            this.hitCircleLegacySprite.alpha = 0.9;
            this.hitCircleOverlayLegacySprite.alpha = 1;
            this.hitCircleOverlaySprite.alpha = 0;
            this.numberSprite.scale.set(((w / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * Beatmap.stats.circleSize)) / 1.3);
        } else {
            this.hitCircleSprite.alpha = 1;
            this.hitCircleLegacySprite.alpha = 0;
            this.hitCircleOverlayLegacySprite.alpha = 0;
            this.hitCircleOverlaySprite.alpha = 1;
            this.numberSprite.scale.set((w / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * Beatmap.stats.circleSize));
        }

        // this.hitCircleOverlaySprite.scale.set(sliderAppearance.legacy ? 236 / 272 : 1);

        this.numberSprite.text = comboIdx.toString();
        this.numberSprite.alpha = timestamp > this.time ? (!sliderAppearance.hitAnim ? 1 : 0) : 1;

        const approachRateExpandRate = opacity >= 0 ? -3 * Math.min(preemptRate, 1) + 4 : 1;
        this.approachCircleObj.obj.x = x;
        this.approachCircleObj.obj.y = y;
        this.approachCircleObj.draw(
            sliderAppearance.hitAnim ? (!mods.HD ? (timestamp > this.time ? 0 : currentOpacity) : 0) : currentOpacity,
            approachRateExpandRate * circleModScale,
            convertedColor
        );
        // console.log(this.time, currentExpand, timestamp - this.time > 0, timestamp);
    }

    constructor(positionX, positionY, time, isSliderHead, isNewCombo) {
        this.originalX = parseInt(positionX);
        this.originalY = parseInt(positionY);

        this.time = time;
        this.hitTime = time;
        this.startTime = time - Beatmap.stats.preempt;
        this.endTime = time + 240;

        this.isNewCombo = isNewCombo;

        const selected = new Sprite(selectedHitCircleTemplate);
        selected.anchor.set(0.5);
        this.selected = selected;

        const hitCircleOverlaySprite = new Sprite(hitCircleOverlayTemplate);
        hitCircleOverlaySprite.anchor.set(0.5);
        this.hitCircleOverlaySprite = hitCircleOverlaySprite;

        const hitCircleOverlayLegacySprite = new Sprite(hitCircleOverlayLegacyTemplate);
        hitCircleOverlayLegacySprite.anchor.set(0.5);
        this.hitCircleOverlayLegacySprite = hitCircleOverlayLegacySprite;

        const hitCircleSprite = new Sprite(hitCircleTemplate);
        hitCircleSprite.anchor.set(0.5);
        this.hitCircleSprite = hitCircleSprite;

        const hitCircleLegacySprite = new Sprite(hitCircleLegacyTemplate);
        hitCircleLegacySprite.anchor.set(0.5);
        this.hitCircleLegacySprite = hitCircleLegacySprite;

        const numberSprite = new PIXI.Text("0", {
            fontFamily: "Torus",
            fontSize: 40,
            fontWeight: 600,
            fill: 0xffffff,
            align: "center",
        });
        numberSprite.anchor.set(0.5);
        numberSprite.y = (-1 * w) / 512;
        numberSprite.scale.set((w / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * Beatmap.stats.circleSize));
        this.numberSprite = numberSprite;

        const hitCircleContainer = new Container();
        hitCircleContainer.addChild(hitCircleSprite);
        hitCircleContainer.addChild(hitCircleLegacySprite);
        hitCircleContainer.addChild(hitCircleOverlaySprite);
        hitCircleContainer.addChild(hitCircleOverlayLegacySprite);
        hitCircleContainer.addChild(numberSprite);
        hitCircleContainer.x = (this.originalX * w) / 512;
        hitCircleContainer.y = (this.originalY * w) / 512;

        this.approachCircleObj = new ApproachCircle(this.originalX, this.originalY);

        this.obj = hitCircleContainer;
    }
}
