class NumberSprite {
    obj;

    hitObject;

    constructor(hitObject) {
        this.hitObject = hitObject;
        this.obj = new PIXI.Container();
    }

    draw(timestamp) {
        const removedChildren = this.obj.removeChildren();
        removedChildren.forEach((element) => element.destroy());

        let prevSprite = null;
        this.hitObject.comboIdx
            .toString()
            .split("")
            .forEach((value, idx) => {
                const skinType = Skinning.SKIN_ENUM[skinning.type];
                const textures = skinType !== "CUSTOM" ? Texture[skinType] : Texture.CUSTOM[Skinning.SKIN_IDX];

                const sprite = new PIXI.Sprite(textures.DEFAULTS[value].texture);
                sprite.scale.set(textures.DEFAULTS[value].isHD ? 0.5 * 0.8 : 0.8);
                sprite.anchor.set(0.5);

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
                this.obj.addChild(sprite);
            });

        this.obj.alpha = 1;
        this.obj.x = -prevSprite.x / 2;

        if (timestamp > this.hitObject.hitTime + 1 && sliderAppearance.hitAnim) {
            this.obj.alpha = 0;
        }
    }
}
