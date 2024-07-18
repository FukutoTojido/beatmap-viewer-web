import { NumberSprite } from "../HitObjects/NumberSprite.js";
import { Texture } from "../Texture.js";
import { Skinning } from "../Skinning.js";
import { Game } from "../Game.js";
import { Beatmap } from "../Beatmap.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as PIXI from "pixi.js";

export class TintedNumberSprite extends NumberSprite {
    number = 0;
    sprites = [];

    cache = {
        number: null,
    };

    constructor(hitObject) {
        super(hitObject);
    }

    draw(timestamp, comboIdx = "") {
        if (this.number !== comboIdx) {
            const removedChildren = this.obj.removeChildren();
            removedChildren.forEach((element) => element.destroy());
            this.sprites.length = 0;

            this.number = comboIdx ?? 0;
            this.number
                .toString()
                .split("")
                .forEach((value, idx) => {
                    const sprite = new PIXI.Sprite();
                    sprite.anchor.set(0.5);

                    this.sprites.push(sprite);
                    this.obj.addChild(sprite);
                });
        }

        let prevSprite = null;
        this.number
            .toString()
            .split("")
            .forEach((value, idx) => {
                const skinType = Skinning.SKIN_ENUM[Game.SKINNING.type];
                const textures = skinType !== "CUSTOM" ? (skinType === "ARGON" ? Texture.ARGON : Texture.LEGACY) : Texture.CUSTOM[Skinning.SKIN_IDX];

                const sprite = this.sprites[idx];
                sprite.texture = textures.DEFAULTS[value].texture;
                sprite.scale.set((textures.DEFAULTS[value].isHD ? 0.5 * 0.8 : 0.8));

                if (skinType === "ARGON") {
                    const colors = Game.SLIDER_APPEARANCE.ignoreSkin ? Skinning.DEFAULT_COLORS : Beatmap.COLORS;
                    const idx = Game.SLIDER_APPEARANCE.ignoreSkin ? this.hitObject.colourIdx : this.hitObject.colourHaxedIdx;
                    const [R, G, B] =
                        idx === -1
                            ? [1.0, 1.0, 1.0, 1.0]
                            : [
                                  ...Object.values(d3.rgb(`#${colors[idx % colors.length].toString(16).padStart(6, "0")}`)).map((val) => val / 255),
                                  1.0,
                              ];

                    const lumi = 0.299 * R + 0.587 * G + 0.114 * B;
                    if (lumi > 0.5) {
                        sprite.tint = 0x333333;
                    } else {
                        sprite.tint = 0xe5e5e5;
                    }
                } else sprite.tint = 0xffffff;

                if (prevSprite) {
                    const overlapValue =
                        skinType === "LEGACY"
                            ? Skinning.HIT_CIRCLE_OVERLAP
                            : skinType === "ARGON"
                            ? Skinning.HIT_CIRCLE_OVERLAP_ARGON
                            : Skinning.SKIN_LIST[Skinning.SKIN_IDX].ini.HIT_CIRCLE_OVERLAP;
                    sprite.x = prevSprite.x + prevSprite.width / 2 + sprite.width / 2 - overlapValue * 0.8;
                }

                prevSprite = sprite;
            });

        this.obj.alpha = 1;
        this.obj.x = -prevSprite.x / 2;
    }
}
