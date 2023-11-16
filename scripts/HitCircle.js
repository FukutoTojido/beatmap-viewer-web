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
    judgementObj;

    hitCircleSprite;
    hitCircleLegacySprite;
    hitCircleOverlaySprite;
    hitCircleOverlayLegacySprite;

    numberSprite;
    approachCircleObj;

    tempModsHR = mods.HR;
    tempModsEZ = mods.EZ;
    tempW = Game.WIDTH;
    tempH = Game.HEIGHT;

    hitTime;
    colour;
    colourIdx;
    comboIdx;

    drawSelected() {
        const circleBaseScale = Beatmap.moddedStats.radius / 54.4;

        const stackHeight = this.stackHeight;
        const currentStackOffset = Beatmap.moddedStats.stackOffset;

        const x = (this.originalX + stackHeight * currentStackOffset);
        const y = !mods.HR
            ? (this.originalY + stackHeight * currentStackOffset) 
            : (384 - this.originalY + stackHeight * currentStackOffset);

        this.selected.x = x * Game.SCALE_RATE;
        this.selected.y = y * Game.SCALE_RATE;

        this.selected.scale.set(circleBaseScale * Game.SCALE_RATE * (hitCircleTemplate.width / hitCircleOverlayTemplate.width));
    }

    draw(timestamp) {
        // if (this.time === 468) console.log(this.time, opacity, opacityHD);

        // Calculate object radius on HR / EZ toggle
        const circleModScale = Beatmap.moddedStats.radius / Beatmap.stats.radius;
        const circleBaseScale = Beatmap.moddedStats.radius / 54.4;

        // Re-scale on playfield size change
        if (this.tempW !== Game.APP.view.width || this.tempH !== Game.APP.view.height) {
            this.tempW = Game.APP.view.width;
            this.tempH = Game.APP.view.height;

            this.hitCircleOverlaySprite.texture = hitCircleOverlayTemplate;
            this.hitCircleOverlayLegacySprite.texture = hitCircleOverlayLegacyTemplate;
            this.hitCircleSprite.texture = hitCircleTemplate;
            this.hitCircleLegacySprite.texture = hitCircleLegacyTemplate;
            this.approachCircleObj.obj.texture = approachCircleTemplate;

            // this.numberSprite.scale.set((Game.WIDTH / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * Beatmap.stats.circleSize));
        }

        // Re-scale on HR / EZ toggle
        if (this.tempModsHR !== mods.HR || this.tempModsEZ !== mods.EZ) {
            // this.numberSprite.scale.set((Game.WIDTH / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * Beatmap.stats.circleSize));
        }

        // Calculate current timing stats
        const currentPreempt = Beatmap.moddedStats.preempt;
        const currentFadeIn = Beatmap.moddedStats.fadeIn;
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

        if (this.hitTime > this.endTime && timestamp > this.endTime) currentOpacity = 0;

        // Calculate object expandation
        let currentExpand = 1;
        if (sliderAppearance.hitAnim && timestamp > this.hitTime) {
            currentExpand = (timestamp - this.hitTime) / 240 + 1;
        }
        currentExpand = Math.max(currentExpand, 1);

        // if (this.time === 254369)
        // console.log(this.time, currentExpand);

        // Calculate stack offset for this object
        const stackHeight = this.stackHeight;
        const currentStackOffset = Beatmap.moddedStats.stackOffset;

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
        this.obj.scale.set(currentExpand * circleBaseScale * Game.SCALE_RATE * (236 / 256) ** 2);

        // Set HitCircle position
        const x = (this.originalX + stackHeight * currentStackOffset);
        const y = !mods.HR
            ? (this.originalY + stackHeight * currentStackOffset)
            : (384 - this.originalY + stackHeight * currentStackOffset);
        this.obj.x = x * Game.SCALE_RATE;
        this.obj.y = y * Game.SCALE_RATE;

        if (sliderAppearance.legacy) {
            // Hide Lazer HitCircle
            this.hitCircleSprite.alpha = 0;
            this.hitCircleOverlaySprite.alpha = 0;

            // Show Legacy HitCircle
            this.hitCircleLegacySprite.alpha = 0.9;
            this.hitCircleOverlayLegacySprite.alpha = 1;

            // Re-scale Number Sprite
            // this.numberSprite.scale.set(((Game.WIDTH / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * Beatmap.stats.circleSize)) / 1.3);
        } else {
            // Show Lazer HitCircle
            this.hitCircleSprite.alpha = 1;
            this.hitCircleOverlaySprite.alpha = 1;

            // Hide Legacy HitCircle
            this.hitCircleLegacySprite.alpha = 0;
            this.hitCircleOverlayLegacySprite.alpha = 0;

            // Re-scale Number Sprite
            // this.numberSprite.scale.set((Game.WIDTH / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * Beatmap.stats.circleSize));
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
        this.approachCircleObj.obj.x = x * Game.SCALE_RATE;
        this.approachCircleObj.obj.y = y * Game.SCALE_RATE;
        const approachRateSize = approachRateExpandRate * circleBaseScale * Game.SCALE_RATE * (236 / 256) ** 2;
        if (mods.HD || timestamp > this.time) {
            this.approachCircleObj.draw(0, approachRateSize, this.colour);
        } else {
            this.approachCircleObj.draw(currentOpacity, approachRateSize, this.colour);
        }

        // if (this.judgementObj) {
        //     if (timestamp >= this.hitTime) this.judgementObj.draw(timestamp);
        // }
        // console.log(this.time, currentExpand, timestamp - this.time > 0, timestamp);
    }

    eval(inputIdx) {
        const radius = Beatmap.moddedStats.radius;
        const currentInput = ScoreParser.CURSOR_DATA[inputIdx];

        if (!currentInput) {
            return null;
        }

        // Input before Hit Window
        if (currentInput.time - this.time <= -Beatmap.hitWindows.MEH) return null;
        // Input after Hit Window
        if (currentInput.time - this.time >= Beatmap.hitWindows.MEH) return { val: 0, valV2: 0 };
        // Input during Note Lock
        if (
            ScoreParser.EVAL_LIST.at(-1)?.eval === 0 &&
            Math.abs(currentInput.time - (ScoreParser.EVAL_LIST.at(-1)?.time ?? currentInput.time)) < Beatmap.hitWindows.MEH
        )
            return null;

        // Input while not pressing any keys / releasing keys
        const prevInput = ScoreParser.CURSOR_DATA[inputIdx - 1];
        if (
            currentInput.inputArray.length === 0 ||
            prevInput.inputArray.length > currentInput.inputArray.length ||
            (prevInput.inputArray.length === currentInput.inputArray.length &&
                JSON.stringify(prevInput.inputArray) === JSON.stringify(currentInput.inputArray))
        )
            return null;

        const currentStackOffset = Beatmap.moddedStats.stackOffset;
        const additionalMemory = {
            x: this.stackHeight * currentStackOffset,
            y: this.stackHeight * currentStackOffset,
        };

        // if (this.time === 45886) {
        //     console.log(
        //         Fixed(
        //             Dist(
        //                 currentInput,
        //                 mods.HR
        //                     ? Add(FlipHR({ x: this.originalX, y: this.originalY }), additionalMemory)
        //                     : Add({ x: this.originalX, y: this.originalY }, additionalMemory)
        //             ) / radius,
        //             2
        //         )
        //     );
        // }

        // Misaim
        if (
            Fixed(
                Dist(
                    currentInput,
                    mods.HR
                        ? Add(FlipHR({ x: this.originalX, y: this.originalY }), additionalMemory)
                        : Add({ x: this.originalX, y: this.originalY }, additionalMemory)
                ) / radius,
                2
            ) > 1
        ) {
            this.hitTime = this.endTime;
            this.endTime = this.time + Beatmap.hitWindows.MEH;
            return null;
        }

        let val = 0;
        const delta = Math.abs(currentInput.time - this.time);

        if (delta < Beatmap.hitWindows.GREAT) val = 300;
        if (delta >= Beatmap.hitWindows.GREAT && delta < Beatmap.hitWindows.OK) val = 100;
        if (delta >= Beatmap.hitWindows.OK && delta < Beatmap.hitWindows.MEH) val = 50;

        if (val !== 0) this.hitTime = currentInput.time;

        return { val, valV2: val, delta: currentInput.time - this.time, inputTime: currentInput.time };
    }

    constructor(positionX, positionY, time, isSliderHead, isNewCombo) {
        this.originalX = parseInt(positionX);
        this.originalY = parseInt(positionY);

        this.time = time;
        this.hitTime = time;
        this.startTime = time - Beatmap.stats.preempt;
        this.endTime = time + 240;

        this.isNewCombo = isNewCombo;

        const selected = new PIXI.Sprite(selectedHitCircleTemplate);
        selected.anchor.set(0.5);
        this.selected = selected;

        const hitCircleOverlaySprite = new PIXI.Sprite(hitCircleOverlayTemplate);
        hitCircleOverlaySprite.anchor.set(0.5);
        this.hitCircleOverlaySprite = hitCircleOverlaySprite;

        const hitCircleOverlayLegacySprite = new PIXI.Sprite(hitCircleOverlayLegacyTemplate);
        hitCircleOverlayLegacySprite.anchor.set(0.5);
        this.hitCircleOverlayLegacySprite = hitCircleOverlayLegacySprite;

        const hitCircleSprite = new PIXI.Sprite(hitCircleTemplate);
        hitCircleSprite.anchor.set(0.5);
        this.hitCircleSprite = hitCircleSprite;

        const hitCircleLegacySprite = new PIXI.Sprite(hitCircleLegacyTemplate);
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
        numberSprite.y = (-1 * Game.WIDTH) / 512;
        // numberSprite.scale.set((Game.WIDTH / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * Beatmap.stats.circleSize));
        this.numberSprite = numberSprite;

        const hitCircleContainer = new PIXI.Container();
        hitCircleContainer.addChild(hitCircleSprite);
        hitCircleContainer.addChild(hitCircleLegacySprite);
        hitCircleContainer.addChild(hitCircleOverlaySprite);
        hitCircleContainer.addChild(hitCircleOverlayLegacySprite);
        hitCircleContainer.addChild(numberSprite);
        hitCircleContainer.x = (this.originalX * Game.WIDTH) / 512;
        hitCircleContainer.y = (this.originalY * Game.WIDTH) / 512;

        this.approachCircleObj = new ApproachCircle(this.originalX, this.originalY);

        this.obj = hitCircleContainer;
    }
}
