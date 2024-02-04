import { Texture } from "../Texture.js";
import { Skinning } from "../Skinning.js";
import { Game } from "../Game.js";
import * as PIXI from "pixi.js";

export class NumberSprite {
    obj;

    hitObject;
    number = 0;

    sprites = [];

    constructor(hitObject) {
        this.hitObject = hitObject;
        this.obj = new PIXI.Container();
    }

    draw(timestamp) {
        if (this.number !== this.hitObject.comboIdx) {
            const removedChildren = this.obj.removeChildren();
            removedChildren.forEach((element) => element.destroy());
            this.sprites.length = 0;

            this.number = this.hitObject.comboIdx ?? 0;
            this.number.toString()
            .split("")
            .forEach((value, idx) => {
                const sprite = new PIXI.Sprite();
                sprite.anchor.set(0.5);

                this.sprites.push(sprite);
                this.obj.addChild(sprite);
            })
        }

        let prevSprite = null;
        this.number
            .toString()
            .split("")
            .forEach((value, idx) => {
                const skinType = Skinning.SKIN_ENUM[Game.SKINNING.type];
                const textures = skinType !== "CUSTOM" ? Texture[skinType] : Texture.CUSTOM[Skinning.SKIN_IDX];

                const sprite = this.sprites[idx];
                sprite.texture = (textures.DEFAULTS[value].texture);
                sprite.scale.set(textures.DEFAULTS[value].isHD ? 0.5 * 0.8 : 0.8);

                if (prevSprite) {
                    const overlapValue =
                        skinType === "ARGON"
                            ? Skinning.HIT_CIRCLE_OVERLAP_ARGON
                            : skinType === "LEGACY"
                            ? Skinning.HIT_CIRCLE_OVERLAP
                            : Skinning.SKIN_LIST[Skinning.SKIN_IDX].ini.HIT_CIRCLE_OVERLAP;
                    sprite.x = prevSprite.x + prevSprite.width / 2 + sprite.width / 2 - overlapValue * 0.8;
                }

                prevSprite = sprite;
            });

        this.obj.alpha = 1;
        this.obj.x = -prevSprite.x / 2;

        if (timestamp > this.hitObject.hitTime + 1 && Game.SLIDER_APPEARANCE.hitAnim) {
            this.obj.alpha = 0;
        }
    }
}
