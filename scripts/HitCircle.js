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
    colour;
    colourIdx;
    comboIdx;

    drawSelected() {
        const HRMultiplier = !mods.HR ? 1 : 1.3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        const circleModScale = (54.4 - 4.48 * Beatmap.stats.circleSize * HRMultiplier * EZMultiplier) / (54.4 - 4.48 * Beatmap.stats.circleSize);

        const stackHeight = this.stackHeight;
        const currentStackOffset = (-6.4 * (1 - (0.7 * (Beatmap.stats.circleSize * HRMultiplier * EZMultiplier - 5)) / 5)) / 2;

        const x = ((this.originalX + stackHeight * currentStackOffset) * w) / 512;
        const y = !mods.HR
            ? ((this.originalY + stackHeight * currentStackOffset) * w) / 512
            : ((384 - this.originalY + stackHeight * currentStackOffset) * w) / 512;

        this.selected.x = x;
        this.selected.y = y;

        this.selected.scale.set(circleModScale);
    }

    draw(timestamp) {
        // if (this.time === 468) console.log(this.time, opacity, opacityHD);

        // Calculate object radius on HR / EZ toggle
        const HRMultiplier = !mods.HR ? 1 : 4 / 3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        const circleModScale = (54.4 - 4.48 * Beatmap.stats.circleSize * HRMultiplier * EZMultiplier) / (54.4 - 4.48 * Beatmap.stats.circleSize);

        // Re-scale on playfield size change
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

        // Re-scale on HR / EZ toggle
        if (this.tempModsHR !== mods.HR || this.tempModsEZ !== mods.EZ) {
            this.numberSprite.scale.set((w / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * Beatmap.stats.circleSize));
        }

        // Calculate current timing stats
        const currentAR = Clamp(Beatmap.stats.approachRate * (mods.HR ? 1.4 : 1) * (mods.EZ ? 0.5 : 1), 0, 10);
        const currentPreempt = Beatmap.difficultyRange(currentAR, 1800, 1200, 450);
        const currentFadeIn = Beatmap.difficultyRange(currentAR, 1200, 800, 300);
        const fadeOutTime = sliderAppearance.hitAnim ? 240 : 800;

        // Calculate object opacity
        let currentOpacity = 0;
        if (!mods.HD) {
            if (timestamp < this.hitTime) {
                currentOpacity = (timestamp - (this.time - currentPreempt)) / currentFadeIn;
            } else {
                currentOpacity = 1 - (timestamp - this.hitTime) / fadeOutTime;
            }
        } else {
            if (timestamp < this.time - currentPreempt + currentFadeIn) {
                currentOpacity = (timestamp - (this.time - currentPreempt)) / currentFadeIn;
            } else {
                currentOpacity = 1 - (timestamp - (this.time - currentPreempt + currentFadeIn)) / (currentPreempt * 0.3);
            }
        }
        currentOpacity = Clamp(currentOpacity, 0, 1);

        // Calculate object expandation
        let currentExpand = 1;
        if (sliderAppearance.hitAnim && timestamp > this.hitTime) {
            currentExpand = (timestamp - this.hitTime) / 240 + 1;
        }
        currentExpand = Math.max(currentExpand, 1);

        // Calculate stack offset for this object
        const stackHeight = this.stackHeight;
        const currentStackOffset = (-6.4 * (1 - (0.7 * (Beatmap.stats.circleSize * HRMultiplier * EZMultiplier - 5)) / 5)) / 2;

        // Untint HitCircle on hit when hit animation is disabled
        if (sliderAppearance.hitAnim || timestamp < this.hitTime) {
            this.hitCircleSprite.tint = this.colour;
            this.hitCircleLegacySprite.tint = this.colour;
        } else {
            this.hitCircleSprite.tint = 0xffffff;
            this.hitCircleLegacySprite.tint = 0xffffff;
        }

        // Set HitCircle alpha and scale
        this.obj.alpha = currentOpacity;
        this.obj.scale.set(currentExpand * circleModScale);

        // Set HitCircle position
        const x = ((this.originalX + stackHeight * currentStackOffset) * w) / 512;
        const y = !mods.HR
            ? ((this.originalY + stackHeight * currentStackOffset) * w) / 512
            : ((384 - this.originalY + stackHeight * currentStackOffset) * w) / 512;
        this.obj.x = x;
        this.obj.y = y;

        if (sliderAppearance.legacy) {
            // Hide Lazer HitCircle
            this.hitCircleSprite.alpha = 0;
            this.hitCircleOverlaySprite.alpha = 0;

            // Show Legacy HitCircle
            this.hitCircleLegacySprite.alpha = 0.9;
            this.hitCircleOverlayLegacySprite.alpha = 1;

            // Re-scale Number Sprite
            this.numberSprite.scale.set(((w / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * Beatmap.stats.circleSize)) / 1.3);
        } else {
            // Show Lazer HitCircle
            this.hitCircleSprite.alpha = 1;
            this.hitCircleOverlaySprite.alpha = 1;

            // Hide Legacy HitCircle
            this.hitCircleLegacySprite.alpha = 0;
            this.hitCircleOverlayLegacySprite.alpha = 0;

            // Re-scale Number Sprite
            this.numberSprite.scale.set((w / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * Beatmap.stats.circleSize));
        }

        // Set Number Sprite text and alpha
        this.numberSprite.text = this.comboIdx.toString();
        if (timestamp < this.hitTime || !sliderAppearance.hitAnim) {
            this.numberSprite.alpha = 1;
        } else {
            this.numberSprite.alpha = 0;
        }

        // Set Approach Circle opacity and expand
        let approachRateExpandRate = 1;
        if (timestamp <= this.time) {
            const preemptRate = (timestamp - (this.time - currentPreempt)) / currentPreempt;
            approachRateExpandRate = Math.max(-3 * Math.min(preemptRate, 1) + 4, 1);
        }
        this.approachCircleObj.obj.x = x;
        this.approachCircleObj.obj.y = y;
        const approachRateSize = approachRateExpandRate * circleModScale;
        if (mods.HD || timestamp > this.time) {
            this.approachCircleObj.draw(0, approachRateSize, this.colour);
        } else {
            this.approachCircleObj.draw(currentOpacity, approachRateSize, this.colour);
        }
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
