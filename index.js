document.querySelector(".loading").style.display = "none";
(async () => {
    await loadLocalStorage();

    // Init
    const mainGame = new Game();
    Texture.generateDefaultTextures();

    if (urlParams.get("b") && /[0-9]+/g.test(urlParams.get("b"))) {
        beatmapFile = new BeatmapFile(urlParams.get("b"));
        document.querySelector("#mapInput").value = urlParams.get("b");
    }

    window.onresize = debounce(() => {
        setTimeout(() => {
            Game.appResize();
        }, 200);
    });

    screen.orientation.onchange = debounce(() => {
        // console.log("Orientation Changed");
        setTimeout(() => {
            Game.appResize();
        }, 200);
    });
})();
