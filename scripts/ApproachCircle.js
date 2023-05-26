class ApproachCircle {
    obj;
    positionX;
    positionY;

    draw(opacity, expandRate, color) {
        this.obj.alpha = opacity
        this.obj.scale.set(expandRate)
        this.obj.tint = color
    }

    constructor(positionX, positionY) {
        this.positionX = positionX
        this.positionY = positionY

        const approachCircle = new Sprite(approachCircleTemplate);
        approachCircle.x = (positionX * w) / 512;
        approachCircle.y = (positionY * w) / 512;
        approachCircle.anchor.set(0.5);
        this.obj = approachCircle;
    }
}
