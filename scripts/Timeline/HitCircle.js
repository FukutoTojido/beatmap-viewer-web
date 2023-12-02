import { Beatmap } from "../Beatmap.js";
import { Texture } from "../Texture.js";
import { Timeline } from "./Timeline.js";
import { TintedNumberSprite } from "./NumberSprite.js";
import { Skinning } from "../Skinning.js";
import { Game } from "../Game.js";
import * as PIXI from "pixi.js";

export class TimelineHitCircle {
    obj;
    hitCircle;
    hitCircleOverlay;
    selected;
    NumberSprite;
    hitObject;

    constructor(hitObject) {
        this.obj = new PIXI.Container();
        this.obj.interactive = true;
        this.hitObject = hitObject;

        const hitCircle = new PIXI.Sprite(Texture.LEGACY.HIT_CIRCLE.texture);
        const hitCircleOverlay = new PIXI.Sprite(Texture.LEGACY.HIT_CIRCLE_OVERLAY.texture);
        const selected = new PIXI.Sprite(Texture.SELECTED.texture);
        const numberSprite = new TintedNumberSprite(hitObject);

        hitCircle.anchor.set(0.5, 0.5);
        hitCircleOverlay.anchor.set(0.5, 0.5);
        selected.anchor.set(0.5, 0.5);

        this.hitCircle = hitCircle;
        this.hitCircle.tint = 0xffffff;

        this.hitCircleOverlay = hitCircleOverlay;
        this.selected = selected;

        this.numberSprite = numberSprite;

        this.obj.addChild(hitCircle);
        this.obj.addChild(hitCircleOverlay);
        this.obj.addChild(numberSprite.obj);
        this.obj.addChild(selected);

        this.obj.scale.set(Timeline.HEIGHT / 1.5 / this.hitCircle.height);
        this.obj.x = 0;
        this.obj.y = Timeline.HEIGHT / 2;

        const handleClickEvent = (e) => {
            const { x, y } = this.obj.toLocal(e.global);
            if (Game.SELECTED.includes(this.hitObject.time)) return;
            if (Math.abs(x) > Timeline.HEIGHT / 2 / 2) return;

            if (!e.ctrlKey) Game.SELECTED = [];
            if (!Game.SELECTED.includes(this.hitObject.time)) Game.SELECTED.push(this.hitObject.time);
            Timeline.hitArea.isObjectSelecting = true;
        };

        this.obj.on("mousedown", handleClickEvent);
        this.obj.on("touchstart", handleClickEvent);
    }

    addSelfToContainer(container) {
        container.addChild(this.obj);
    }

    removeSelfFromContainer(container) {
        container.removeChild(this.obj);
    }

    draw(timestamp, isSliderTail) {
        const time = this.hitObject.time;
        const delta = timestamp - time;

        const center = Timeline.WIDTH / 2;

        this.obj.x = center - (delta / 500) * Timeline.ZOOM_DISTANCE;

        const colors = Game.SLIDER_APPEARANCE.ignoreSkin ? Skinning.DEFAULT_COLORS : Beatmap.COLORS;
        const idx = Game.SLIDER_APPEARANCE.ignoreSkin ? this.hitObject.colourIdx : this.hitObject.colourHaxedIdx;

        const skinType = Skinning.SKIN_ENUM[Game.SKINNING.type];
        const textures = skinType !== "CUSTOM" ? Texture.LEGACY : Texture.CUSTOM[Skinning.SKIN_IDX];

        this.hitCircle.tint = colors[idx % colors.length] ?? 0;

        this.hitCircle.texture = textures.HIT_CIRCLE.texture;
        this.hitCircle.scale.set(textures.HIT_CIRCLE.isHD ? 0.5 : 1);

        this.hitCircleOverlay.texture = textures.HIT_CIRCLE_OVERLAY.texture;
        this.hitCircleOverlay.scale.set(textures.HIT_CIRCLE_OVERLAY.isHD ? 0.5 : 1);

        this.obj.scale.set(Timeline.HEIGHT / (Timeline.SHOW_GREENLINE ? 1.5 : 1) / this.hitCircle.height);
        this.obj.y = Timeline.HEIGHT / 2;

        this.selected.visible = false;
        if (Game.SELECTED.includes(time)) {
            this.selected.visible = true;
        }

        if (isSliderTail) return;

        this.numberSprite.draw(timestamp, this.hitObject.comboIdx);
    }
}
