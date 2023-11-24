class TimelineDragWindow {
    isDragging = false;
    obj;
    dragWindow;

    constructor() {
        this.obj = new PIXI.Graphics().beginFill(0xffffff, 0.01).drawRect(0, 0, Timeline.WIDTH, Timeline.HEIGHT);
        this.obj.interactive = true;

        this.dragWindow = new PIXI.Graphics().drawRect(0, 0, 0, 0);
        this.obj.addChild(this.dragWindow);

        this.obj.on("click", (e) => {
            selectedHitObject = [];
        });
    }

    resize() {
        this.obj.clear().beginFill(0xffffff, 0.01).drawRect(0, 0, Timeline.WIDTH, Timeline.HEIGHT)
    }

    draw() {

    }
}