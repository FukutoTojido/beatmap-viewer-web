import { Beatmap } from "../Beatmap.js";
import { Texture } from "../Texture.js";
import { TimelineHitCircle } from "./HitCircle.js";
import { Skinning } from "../Skinning.js";
import { Game } from "../Game.js";
import { Timeline } from "./Timeline.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
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

        if (skinType === "ARGON") {
            this.numberSprite.visible = false;

            const [R, G, B] =
                idx === -1
                    ? [1.0, 1.0, 1.0, 1.0]
                    : [
                          ...Object.values(d3.rgb(`#${colors[idx % colors.length].toString(16).padStart(6, "0")}`)).map((val) => val / 255),
                          1.0,
                      ];

            const lumi = 0.299 * R + 0.587 * G + 0.114 * B;
            if (lumi > 0.5) {
                this.meshHead.shader.resources.customUniforms.uniforms.nodeTint = [0.2, 0.2, 0.2, 1.0];
                this.meshTail.shader.resources.customUniforms.uniforms.nodeTint = [0.2, 0.2, 0.2, 1.0];
            } else {
                this.meshHead.shader.resources.customUniforms.uniforms.nodeTint = [0.9, 0.9, 0.9, 1.0];
                this.meshTail.shader.resources.customUniforms.uniforms.nodeTint = [0.9, 0.9, 0.9, 1.0];
            }

            this.meshHead.shader.resources.customUniforms.uniforms.isReverse = true;
            this.meshTail.shader.resources.customUniforms.uniforms.isReverse = true;

            this.meshHead.scale.set(Timeline.HEIGHT / (Timeline.SHOW_GREENLINE ? 1.5 : 1) / 60 / 2);
            this.meshTail.scale.set(Timeline.HEIGHT / (Timeline.SHOW_GREENLINE ? 1.5 : 1) / 60 / 2);
        }
    }
}
