import { Game } from "../Game.js";
import { Beatmap } from "../Beatmap.js";
import { ObjectsController } from "./ObjectsController.js";
import { Texture } from "../Texture.js";
import { ProgressBar } from "../Progress.js";
import { ApproachCircle } from "./ApproachCircle.js";
import { NumberSprite } from "./NumberSprite.js";
import { Clamp, Fixed, Dist, Add, FlipHR, binarySearch, easeOutElastic, easeOutElasticHalf, easeOutQuint } from "../Utils.js";
import { Skinning } from "../Skinning.js";
import { ScoreParser } from "../ScoreParser.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as PIXI from "pixi.js";

export class HitCircle {
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

    hitSounds;

    skinIdx = 0;
    skinType = 0;
    props = {
        color: null,
        opacity: null,
        glowOpacity: null,
        blendMode: null,
        expand: null,
        x: null,
        y: null,
    };

    judgementContainer;
    judgement;

    isHit = false;

    drawSelected() {
        const circleBaseScale = Beatmap.moddedStats.radius / 54.4;

        const stackHeight = this.stackHeight;
        const currentStackOffset = Beatmap.moddedStats.stackOffset;

        const x = this.originalX + stackHeight * currentStackOffset;
        const y = !Game.MODS.HR ? this.originalY + stackHeight * currentStackOffset : 384 - this.originalY + stackHeight * currentStackOffset;

        this.selected.x = x * Game.SCALE_RATE;
        this.selected.y = y * Game.SCALE_RATE;

        this.selected.scale.set(circleBaseScale * Game.SCALE_RATE * (236 / 256) ** 2 * 0.5);
    }

    playHitsound(timestamp) {
        if (!this.hitSounds) return;
        if (!Game.BEATMAP_FILE.audioNode.isPlaying) return;
        if (timestamp < this.hitTime || ObjectsController.lastTimestamp >= this.hitTime) return;
        if (this.judgement && this.judgement.val === 0) return;

        if (!ScoreParser.REPLAY_DATA) {
            this.hitSounds.play();
            return;
        }

        // Will reimplement later for optimization
        const evaluation = binarySearch(ScoreParser.EVAL_LIST, this.time, (evaluation, time) => {
            if (evaluation.time < time) return -1;
            if (evaluation.time > time) return 1;
            return 0;
        });

        if (evaluation !== -1) this.hitSounds.play();
    }

    handleSkinChange() {
        if (this.skinIdx === Skinning.SKIN_IDX && this.skinType === Game.SKINNING.type) return;
        this.skinIdx = Skinning.SKIN_IDX;
        this.skinType = Game.SKINNING.type;

        const skinType = Skinning.SKIN_ENUM[this.skinType];
        const textures = skinType !== "CUSTOM" ? Texture[skinType] : Texture.CUSTOM[this.skinIdx];

        this.hitCircleSprite.texture = textures.HIT_CIRCLE.texture;
        this.hitCircleSprite.scale.set(textures.HIT_CIRCLE.isHD ? 0.5 : 1);

        this.hitCircleOverlaySprite.texture = textures.HIT_CIRCLE_OVERLAY.texture;
        this.hitCircleOverlaySprite.scale.set(textures.HIT_CIRCLE_OVERLAY.isHD ? 0.5 : 1);

        if (this.skinType !== "0") {
            this.hitCircleSprite.alpha = 0.9;
        } else {
            this.hitCircleSprite.alpha = 1;
        }
    }

    updateColor(timestamp) {
        // Untint HitCircle on hit when hit animation is disabled
        const colors = Game.SLIDER_APPEARANCE.ignoreSkin ? Skinning.DEFAULT_COLORS : Beatmap.COLORS;
        const idx = Game.SLIDER_APPEARANCE.ignoreSkin ? this.colourIdx : this.colourHaxedIdx;
        let color = colors[idx % colors.length];

        if (this.skinType === "1") {
            color = parseInt(
                d3
                    .color(`#${color.toString(16).padStart(6, "0")}`)
                    .darker()
                    .hex()
                    .slice(1),
                16
            );
        }

        if (this.skinType === "0" && timestamp > this.hitTime) {
            color = parseInt(
                d3
                    .color(`#${color.toString(16).padStart(6, "0")}`)
                    .brighter(1.0)
                    .hex()
                    .slice(1),
                16
            );
        }

        if (!Game.SLIDER_APPEARANCE.hitAnim && timestamp > this.hitTime) {
            color = 0xffffff;
        }

        if (this.props.color === color) return;

        this.props.color = color;
        this.hitCircleSprite.tint = this.props.color;
    }

    updateOpacity(timestamp) {
        // Calculate current timing stats
        const currentPreempt = Beatmap.moddedStats.preempt;
        const currentFadeIn = Beatmap.moddedStats.fadeIn;
        const fadeOutTime = Game.SLIDER_APPEARANCE.hitAnim ? 240 : 800;

        // Calculate object opacity
        let currentOpacity = 0;
        if (!Game.MODS.HD) {
            if (timestamp < this.hitTime) {
                currentOpacity = (timestamp - (this.time - currentPreempt)) / currentFadeIn;
            } else {
                if (this.skinType !== "0" || (this.skinType === "0" && !Game.SLIDER_APPEARANCE.hitAnim)) {
                    currentOpacity = 1 - (timestamp - this.hitTime) / fadeOutTime;
                } else {
                    currentOpacity = 1 - easeOutQuint((timestamp - this.hitTime) / 800);
                }
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
        if (currentOpacity === this.props.opacity) return;

        this.props.opacity = currentOpacity;
        this.hitCircleContainer.alpha = this.props.opacity;
    }

    updateExpand(timestamp) {
        // Calculate object radius on HR / EZ toggle
        const circleBaseScale = (Beatmap.moddedStats.radius / 54.4) * (this.skinIdx === 0 ? 0.95 : 1);

        // Calculate object expandation
        let currentExpand = 1;

        if (this.skinType !== "0") {
            if (Game.SLIDER_APPEARANCE.hitAnim && timestamp > this.hitTime) {
                currentExpand = 0.5 * Clamp((timestamp - this.hitTime) / 240, 0, 1) + 1;
            }
            currentExpand = Math.max(currentExpand, 1);
        } else {
            if (Game.SLIDER_APPEARANCE.hitAnim && timestamp > this.hitTime) {
                currentExpand = 1 - 0.2 * easeOutElasticHalf(Clamp((timestamp - this.hitTime) / 400, 0, 1));
            }
        }

        const scale = currentExpand * circleBaseScale * Game.SCALE_RATE * (236 / 256) ** 2;
        if (this.props.expand === scale) return;

        this.props.expand = scale;
        this.hitCircleContainer.scale.set(this.props.expand);
    }

    updatePosition() {
        // Calculate stack offset for this object
        const stackHeight = this.stackHeight;
        const currentStackOffset = Beatmap.moddedStats.stackOffset;

        // Set HitCircle position
        const x = this.originalX + stackHeight * currentStackOffset;
        const y = !Game.MODS.HR ? this.originalY + stackHeight * currentStackOffset : 384 - this.originalY + stackHeight * currentStackOffset;

        if (this.props.x !== x || Game.EMIT_STACK.length !== 0) {
            this.props.x = x;
            this.obj.x = x * Game.SCALE_RATE;
        }

        if (this.props.y !== y || Game.EMIT_STACK.length !== 0) {
            this.props.y = y;
            this.obj.y = y * Game.SCALE_RATE;
        }
    }

    updateJudgement(timestamp) {
        if (!this.judgement) return;
        this.judgement.draw(timestamp);
    }

    updateSprite(timestamp) {
        let opacity = 1;
        if (timestamp > this.hitTime && this.skinType === "0" && Game.SLIDER_APPEARANCE.hitAnim) {
            opacity = 1 - Clamp((timestamp - this.hitTime) / 400, 0, 1);
        }

        if (this.props.glowOpacity !== opacity) {
            this.props.glowOpacity = opacity;
            this.hitCircleSprite.alpha = this.props.glowOpacity;
        }

        if (this.skinType !== "0") {
            let blendMode = this.props.blendMode;
            blendMode = "normal";

            if (this.props.blendMode !== blendMode) {
                this.props.blendMode = blendMode;
                this.hitCircleSprite.blendMode = this.props.blendMode;
            }

            return;
        }

        if (this.isHit === timestamp > this.hitTime) return;
        this.isHit = timestamp > this.hitTime;

        let blendMode = this.props.blendMode;

        if (!this.isHit) {
            this.hitCircleSprite.texture = Texture.ARGON.HIT_CIRCLE.texture;
            blendMode = "normal";
        }

        if (this.isHit) {
            this.hitCircleSprite.texture = Texture.ARGON.GLOW.texture;
            blendMode = "add";
        }

        if (this.props.blendMode !== blendMode) {
            this.props.blendMode = blendMode;
            this.hitCircleSprite.blendMode = this.props.blendMode;
        }
    }

    draw(timestamp) {
        this.handleSkinChange();
        this.updateSprite(timestamp);
        this.updateColor(timestamp);
        this.updateOpacity(timestamp);
        this.updateExpand(timestamp);
        this.updatePosition();
        this.updateJudgement(timestamp);

        this.number.draw(timestamp);
        this.approachCircleObj.draw(timestamp);

        if (!ProgressBar.IS_DRAGGING) this.playHitsound(timestamp);
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
                    Game.MODS.HR
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

    constructor(positionX, positionY, time, hitSounds) {
        this.originalX = parseInt(positionX);
        this.originalY = parseInt(positionY);

        this.time = time;
        this.endTime = time;
        this.hitTime = time;

        this.startTime = time - Beatmap.stats.preempt;
        this.killTime = time + 240;

        const selected = new PIXI.Sprite(Texture.SELECTED.texture);
        selected.anchor.set(0.5);
        selected.scale.set(0.5);
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
        this.judgementContainer = new PIXI.Container();

        const hitCircleContainer = new PIXI.Container();
        hitCircleContainer.addChild(hitCircleSprite);
        hitCircleContainer.addChild(hitCircleOverlaySprite);
        hitCircleContainer.addChild(this.number.obj);

        this.hitCircleContainer = hitCircleContainer;
        // hitCircleContainer.x = (this.originalX * Game.WIDTH) / 512;
        // hitCircleContainer.y = (this.originalY * Game.WIDTH) / 512;

        const container = new PIXI.Container();
        container.addChild(this.judgementContainer);
        container.addChild(this.hitCircleContainer);

        this.approachCircleObj = new ApproachCircle(this);

        this.obj = container;

        this.hitSounds = hitSounds;
    }
}
