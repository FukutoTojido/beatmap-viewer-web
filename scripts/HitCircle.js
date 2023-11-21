class HitCircle {
    startTime;
    hitTime;

    endTime;
    killTime;

    positionX;
    positionY;

    originalX;
    originalY;

    stackHeight = 0;
    time;

    obj;
    selected;
    judgementObj;

    hitCircleSprite;
    hitCircleOverlaySprite;

    number;
    approachCircleObj;

    comboIdx = 1;
    colourIdx = 1;
    colourHaxedIdx = 1;

    opacity = 0;

    drawSelected() {
        const circleBaseScale = Beatmap.moddedStats.radius / 54.4;

        const stackHeight = this.stackHeight;
        const currentStackOffset = Beatmap.moddedStats.stackOffset;

        const x = this.originalX + stackHeight * currentStackOffset;
        const y = !mods.HR ? this.originalY + stackHeight * currentStackOffset : 384 - this.originalY + stackHeight * currentStackOffset;

        this.selected.x = x * Game.SCALE_RATE;
        this.selected.y = y * Game.SCALE_RATE;

        this.selected.scale.set(circleBaseScale * Game.SCALE_RATE * (236 / 256) ** 2);
    }

    draw(timestamp) {
        const skinType = Skinning.SKIN_ENUM[skinning.type];
        const textures = skinType !== "CUSTOM" ? Texture[skinType] : Texture.CUSTOM[Skinning.SKIN_IDX];

        this.hitCircleSprite.texture = textures.HIT_CIRCLE.texture;
        this.hitCircleSprite.scale.set(textures.HIT_CIRCLE.isHD ? 0.5 : 1);

        this.hitCircleOverlaySprite.texture = textures.HIT_CIRCLE_OVERLAY.texture;
        this.hitCircleOverlaySprite.scale.set(textures.HIT_CIRCLE_OVERLAY.isHD ? 0.5 : 1);

        // Calculate object radius on HR / EZ toggle
        const circleBaseScale = (Beatmap.moddedStats.radius / 54.4) * (skinType === "ARGON" ? 0.95 : 1);

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
        this.opacity = currentOpacity;

        if (this.hitTime > this.killTime && timestamp > this.killTime) currentOpacity = 0;

        // Calculate object expandation
        let currentExpand = 1;
        if (sliderAppearance.hitAnim && timestamp > this.hitTime) {
            currentExpand = 0.5 * Clamp((timestamp - this.hitTime) / 240, 0, 1) + 1;
        }
        currentExpand = Math.max(currentExpand, 1);

        // if (this.time === 254369)
        // console.log(this.time, currentExpand);

        // Calculate stack offset for this object
        const stackHeight = this.stackHeight;
        const currentStackOffset = Beatmap.moddedStats.stackOffset;

        // Untint HitCircle on hit when hit animation is disabled
        if (sliderAppearance.hitAnim || timestamp < this.hitTime) {
            const colors = sliderAppearance.ignoreSkin ? Skinning.DEFAULT_COLORS : Beatmap.COLORS;
            const idx = sliderAppearance.ignoreSkin ? this.colourIdx : this.colourHaxedIdx;
            const color = colors[idx % colors.length];
            
            this.hitCircleSprite.tint = color;

            if (skinning.type === "1") {
                this.hitCircleSprite.tint = parseInt(
                    d3
                        .color(`#${color.toString(16).padStart(6, "0")}`)
                        .darker()
                        .hex()
                        .slice(1),
                    16
                );
            }
        } else {
            this.hitCircleSprite.tint = 0xffffff;
        }

        // Set HitCircle alpha and scale
        this.obj.alpha = currentOpacity;
        this.obj.scale.set(currentExpand * circleBaseScale * Game.SCALE_RATE * (236 / 256) ** 2);

        // Set HitCircle position
        const x = this.originalX + stackHeight * currentStackOffset;
        const y = !mods.HR ? this.originalY + stackHeight * currentStackOffset : 384 - this.originalY + stackHeight * currentStackOffset;
        this.obj.x = x * Game.SCALE_RATE;
        this.obj.y = y * Game.SCALE_RATE;

        if (skinning.type !== "0") {
            this.hitCircleSprite.alpha = 0.9;
        } else {
            this.hitCircleSprite.alpha = 1;
        }

        this.number.draw(timestamp);
        this.approachCircleObj.draw(timestamp);
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
            this.hitTime = this.killTime;
            this.killTime = this.time + Beatmap.hitWindows.MEH;
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

    constructor(positionX, positionY, time) {
        this.originalX = parseInt(positionX);
        this.originalY = parseInt(positionY);

        this.time = time;
        this.endTime = time;
        this.hitTime = time;

        this.startTime = time - Beatmap.stats.preempt;
        this.killTime = time + 240;

        const selected = new PIXI.Sprite(Texture.SELECTED.texture);
        selected.anchor.set(0.5);
        this.selected = selected;

        const hitCircleOverlaySprite = new PIXI.Sprite(Texture.ARGON.HIT_CIRCLE_OVERLAY.texture);
        hitCircleOverlaySprite.anchor.set(0.5);
        hitCircleOverlaySprite.scale.set(Texture.ARGON.HIT_CIRCLE_OVERLAY.isHD ? 0.5 : 1);
        this.hitCircleOverlaySprite = hitCircleOverlaySprite;

        const hitCircleSprite = new PIXI.Sprite(Texture.ARGON.HIT_CIRCLE.texture);
        hitCircleSprite.anchor.set(0.5);
        hitCircleSprite.scale.set(Texture.ARGON.HIT_CIRCLE.isHD ? 0.5 : 1);
        this.hitCircleSprite = hitCircleSprite;

        this.number = new NumberSprite(this);

        const hitCircleContainer = new PIXI.Container();
        hitCircleContainer.addChild(hitCircleSprite);
        hitCircleContainer.addChild(hitCircleOverlaySprite);
        hitCircleContainer.addChild(this.number.obj);
        hitCircleContainer.x = (this.originalX * Game.WIDTH) / 512;
        hitCircleContainer.y = (this.originalY * Game.WIDTH) / 512;

        this.approachCircleObj = new ApproachCircle(this);

        this.obj = hitCircleContainer;
    }
}
