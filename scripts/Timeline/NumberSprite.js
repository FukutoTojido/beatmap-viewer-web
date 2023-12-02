import { NumberSprite } from "../HitObjects/NumberSprite.js";
import { Texture } from "../Texture.js";
import { Skinning } from "../Skinning.js";
import { Game } from "../Game.js";
import * as PIXI from "pixi.js";

export class TintedNumberSprite extends NumberSprite {
    constructor(hitObject) {
        super(hitObject);
    }

    draw(timestamp, comboIdx = "") {
        const removedChildren = this.obj.removeChildren();
        removedChildren.forEach((element) => element.destroy());

        let prevSprite = null;
        comboIdx
            .toString()
            .split("")
            .forEach((value, idx) => {
                const skinType = Skinning.SKIN_ENUM[Game.SKINNING.type];
                const textures = skinType !== "CUSTOM" ? Texture.LEGACY : Texture.CUSTOM[Skinning.SKIN_IDX];

                const sprite = new PIXI.Sprite(textures.DEFAULTS[value].texture);
                sprite.scale.set(textures.DEFAULTS[value].isHD ? 0.5 * 0.8 : 0.8);
                sprite.anchor.set(0.5);

                if (prevSprite) {
                    const overlapValue =
                        skinType === "LEGACY" || skinType === "ARGON" ? Skinning.HIT_CIRCLE_OVERLAP : Skinning.SKIN_LIST[Skinning.SKIN_IDX].ini.HIT_CIRCLE_OVERLAP;
                    sprite.x = prevSprite.x + prevSprite.width / 2 + sprite.width / 2 - overlapValue * 0.8;
                }

                prevSprite = sprite;
                this.obj.addChild(sprite);
            });

        this.obj.alpha = 1;
        this.obj.x = -prevSprite.x / 2;
    }
}
