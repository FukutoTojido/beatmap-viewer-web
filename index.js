document.querySelector(".loading").style.opacity = 1;
document.querySelector("#loadingText").innerText = `Initializing`;

(async () => {
    await loadLocalStorage();
    document.querySelector(".loading").style.opacity = 0;
    document.querySelector(".loading").style.display = "none";

    // Init
    const mainGame = new Game();
    Texture.generateDefaultTextures();
    Timeline.init();

    if (urlParams.get("b") && /[0-9]+/g.test(urlParams.get("b"))) {
        beatmapFile = new BeatmapFile(urlParams.get("b"));
        document.querySelector("#mapInput").value = urlParams.get("b");
    }

    window.onresize = debounce(() => {
        setTimeout(() => {
            // Game.appResize();
            Timeline.resize();
        }, 200);
    });

    screen.orientation.onchange = debounce(() => {
        // console.log("Orientation Changed");
        setTimeout(() => {
            // Game.appResize();
            Timeline.resize();
        }, 200);
    });

    // document.querySelector(".sidePanel").addEventListener("transitionend", () => {
    //     console.log("a");
    //     Game.appResize();
    // });

    // document.querySelector(".sidePanel").addEventListener("transitioncancel", () => {
    //     console.log("b");
    //     Game.appResize();
    // });

    // new ResizeObserver(
    //     debounce(() => {
    //         setTimeout(() => {
    //             Game.appResize();
    //         }, 200);
    //     })
    // ).observe(document.querySelector("#playerWrapper"));
})();
