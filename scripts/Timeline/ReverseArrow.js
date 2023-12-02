import { Beatmap } from "../Beatmap.js";
import { Texture } from "../Texture.js";
import { TimelineHitCircle } from "./HitCircle.js";
import { Skinning } from "../Skinning.js";
import { Game } from "../Game.js";
import * as PIXI from "pixi.js";

export class TimelineReverseArrow extends TimelineHitCircle {
    hitObject;
    slider;

    constructor(hitObject, slider) {
        super(hitObject);

        this.hitObject = hitObject;
        this.slider = slider;

        this.obj.removeChild(this.numberSprite.obj);

        this.numberSprite = new PIXI.Sprite(Texture.LEGACY.REVERSE_ARROW.arrow.texture);
        this.numberSprite.anchor.set(0.5);

        this.numberSprite.scale.set(1);
        this.obj.addChildAt(this.numberSprite, 2);
    }

    draw(timestamp) {
        super.draw(timestamp, true);

        const colors = Game.SLIDER_APPEARANCE.ignoreSkin ? Skinning.DEFAULT_COLORS : Beatmap.COLORS;
        const idx = Game.SLIDER_APPEARANCE.ignoreSkin ? this.slider.colourIdx : this.slider.colourHaxedIdx;
        this.hitCircle.tint = colors[idx % colors.length];
        
        const skinType = Skinning.SKIN_ENUM[Game.SKINNING.type];
        const textures = skinType !== "CUSTOM" ? Texture.LEGACY : Texture.CUSTOM[Skinning.SKIN_IDX];

        this.numberSprite.texture = textures.REVERSE_ARROW.arrow.texture;

        this.numberSprite.scale.set(textures.REVERSE_ARROW.arrow.isHD ? 0.5 : 1);
    }
}
