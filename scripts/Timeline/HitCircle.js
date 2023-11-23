class TimelineHitCircle {
    obj;
    hitCircle;
    hitCircleOverlay;
    NumberSprite;
    hitObject;

    constructor(hitObject) {
        this.obj = new PIXI.Container();
        this.hitObject = hitObject;

        const hitCircle = new PIXI.Sprite(Texture.LEGACY.HIT_CIRCLE.texture);
        const hitCircleOverlay = new PIXI.Sprite(Texture.LEGACY.HIT_CIRCLE_OVERLAY.texture);
        const numberSprite = new TintedNumberSprite(hitObject);

        hitCircle.anchor.set(0.5, 0.5);
        hitCircleOverlay.anchor.set(0.5, 0.5);

        this.hitCircle = hitCircle;
        this.hitCircle.tint = 0xffffff;

        this.hitCircleOverlay = hitCircleOverlay;

        this.numberSprite = numberSprite;

        this.obj.addChild(hitCircle);
        this.obj.addChild(hitCircleOverlay);
        this.obj.addChild(numberSprite.obj);

        this.obj.scale.set(Timeline.HEIGHT / this.hitCircle.height);
        this.obj.x = 0;
        this.obj.y = Timeline.HEIGHT / 2;
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

        const colors = sliderAppearance.ignoreSkin ? Skinning.DEFAULT_COLORS : Beatmap.COLORS;
        const idx = sliderAppearance.ignoreSkin ? this.hitObject.colourIdx : this.hitObject.colourHaxedIdx;

        const skinType = Skinning.SKIN_ENUM[skinning.type];
        const textures = skinType !== "CUSTOM" ? Texture.LEGACY : Texture.CUSTOM[Skinning.SKIN_IDX];

        this.hitCircle.tint = colors[idx % colors.length];

        this.hitCircle.texture = textures.HIT_CIRCLE.texture;
        this.hitCircle.scale.set(textures.HIT_CIRCLE.isHD ? 0.5 : 1);

        this.hitCircleOverlay.texture = textures.HIT_CIRCLE_OVERLAY.texture;
        this.hitCircleOverlay.scale.set(textures.HIT_CIRCLE_OVERLAY.isHD ? 0.5 : 1);

        this.obj.scale.set(Timeline.HEIGHT / this.hitCircle.height);
        this.obj.y = Timeline.HEIGHT / 2;

        if (isSliderTail) return;

        this.numberSprite.draw(timestamp, this.hitObject.comboIdx);
    }
}
