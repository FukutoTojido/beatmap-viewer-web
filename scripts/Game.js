PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL2;

class Game {
    static APP;
    static CONTAINER;
    static GRID;
    static DRAG_WINDOW;
    static FPS;

    static WIDTH;
    static HEIGHT;
    static SLIDER_ACCURACY = 1 / 1000;
    static OFFSET_X;
    static OFFSET_Y;

    // Add certain objects from container
    static addToContainer(objectsList) {
        objectsList.forEach((o) => {
            Game.CONTAINER.addChild(o.obj);
        });
    }

    // Remove certain objects from container
    static removeFromContainer(objectsList) {
        objectsList.forEach((o) => {
            Game.CONTAINER.removeChild(o.obj);
        });
    }

    static FPSInit() {
        const fpsSprite = new PIXI.Text(`0fps\nInfinite ms`, {
            fontFamily: "Torus",
            fontSize: 15,
            fontWeight: 500,
            fill: 0xffffff,
            align: "right",
        });

        fpsSprite.anchor.set(1, 1);
        fpsSprite.x = Game.APP.view.width - 10;
        fpsSprite.y = Game.APP.view.height - 10;

        return fpsSprite
    }

    static dragWindowInit() {
        // Drag window initialize
        const dragWindow = new PIXI.Graphics().lineStyle({
            width: 2,
            color: 0xffffff,
            alpha: 1,
            alignment: 0,
        });

        // Set drag window initial position
        dragWindow.x = Game.OFFSET_X;
        dragWindow.y = Game.OFFSET_Y;
        dragWindow.alpha = 0;

        return dragWindow;
    }

    static gridInit() {
        // Grid initialize
        const graphics = new PIXI.Graphics()
            .lineStyle({
                width: 1,
                color: 0xffffff,
                alpha: 0.1,
                alignment: 0.5,
            })
            .drawRect(0, 0, Game.WIDTH, Game.HEIGHT);

        // Draw grid
        const gridWidth = Game.WIDTH / 16;
        const gridHeight = Game.HEIGHT / 12;
        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 12; j++) {
                graphics.drawRect(i * gridWidth, j * gridHeight, gridWidth, gridHeight);
            }
        }

        // Create grid texture and sprite
        const texture = Game.APP.renderer.generateTexture(graphics);

        const grid = new PIXI.Sprite(texture);
        grid.width = Game.WIDTH;
        grid.height = Game.HEIGHT;
        grid.x = Game.OFFSET_X;
        grid.y = Game.OFFSET_Y;
        grid.alpha = 1;

        return grid;
    }

    static containerInit() {
        // Container initialize
        const container = new PIXI.Container();

        // Set container offset
        container.x = Game.OFFSET_X;
        container.y = Game.OFFSET_Y;

        return container;
    }

    static appResize() {
        // Resize Game Field
        Game.appSizeSetup();

        // Reinitialize grid
        Game.APP.stage.removeChild(Game.GRID);
        Game.GRID = Game.gridInit();
        Game.APP.stage.addChildAt(Game.GRID, 0);

        // Reposition container
        Game.CONTAINER.x = Game.OFFSET_X;
        Game.CONTAINER.y = Game.OFFSET_Y;

        // Reposition drag window
        Game.DRAG_WINDOW.x = Game.OFFSET_X;
        Game.DRAG_WINDOW.y = Game.OFFSET_Y;

        // Reposition FPS
        Game.FPS.x = Game.APP.view.width - 10;
        Game.FPS.y = Game.APP.view.height - 10;
    }

    static appSizeSetup() {
        // Set renderer size to container size
        Game.WIDTH = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) * window.devicePixelRatio;
        Game.HEIGHT = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height) * window.devicePixelRatio;
        Game.APP.renderer.resize(Game.WIDTH, Game.HEIGHT);

        // Change game width and height to match 4:3 aspect ratio
        if (Game.WIDTH / 512 > Game.HEIGHT / 384) {
            Game.WIDTH = (Game.HEIGHT / 384) * 512;
        } else {
            Game.HEIGHT = (Game.WIDTH / 512) * 384;
        }

        // Re-scale game size by 80% to make space for padding
        Game.WIDTH *= 0.8;
        Game.HEIGHT *= 0.8;

        // Calculate offset
        Game.OFFSET_X = (Game.APP.view.width - Game.WIDTH) / 2;
        Game.OFFSET_Y = (Game.APP.view.height - Game.HEIGHT) / 2;

        // Re-scale Game Canvas on Retina / Mobile devices
        Game.APP.view.style.transform = `scale(${1 / window.devicePixelRatio})`;
    }

    static appInit() {
        // App initialize
        Game.APP = new PIXI.Application({
            width: parseInt(getComputedStyle(document.querySelector("#playerContainer")).width),
            height: parseInt(getComputedStyle(document.querySelector("#playerContainer")).height),
            antialias: true,
            autoDensity: true,
            backgroundAlpha: 0,
        });

        Game.appSizeSetup();
    }

    constructor() {
        Game.appInit();
        Game.CONTAINER = Game.containerInit();
        Game.GRID = Game.gridInit();
        Game.DRAG_WINDOW = Game.dragWindowInit();
        Game.FPS = Game.FPSInit();

        Game.APP.stage.addChild(Game.GRID);
        Game.APP.stage.addChild(Game.DRAG_WINDOW);
        Game.APP.stage.addChild(Game.CONTAINER);
        Game.APP.stage.addChild(Game.FPS);

        // Add Game Canvas to DOM
        document.querySelector("#playerContainer").appendChild(Game.APP.view);
    }
}
