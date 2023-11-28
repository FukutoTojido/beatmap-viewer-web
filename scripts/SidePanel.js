const toggleTimingPanel = (forceOpen) => {
    if (forceOpen === true) {
        document.querySelector(".metadataPanel").classList.remove("show");
        document.querySelector(".timingPanel").classList.add("show");
        return;
    }

    if (document.querySelector(".metadataPanel").classList.contains("show")) {
        document.querySelector(".metadataPanel").classList.remove("show");
    }

    document.querySelector(".timingPanel").classList.toggle("show");
};

const toggleMetadataPanel = (forceOpen) => {
    if (forceOpen) {
        document.querySelector(".timingPanel").classList.remove("show");
        document.querySelector(".metadataPanel").classList.add("show");
        return;
    }

    if (document.querySelector(".timingPanel").classList.contains("show")) {
        document.querySelector(".timingPanel").classList.remove("show");
    }

    document.querySelector(".metadataPanel").classList.toggle("show");
};

const openSidePanel = () => {
    document.querySelector(".sidePanel").classList.remove("slideInAnim");
    document.querySelector(".sidePanel").classList.add("slideOutAnim");
};

const closeSidePanel = () => {
    document.querySelector(".sidePanel").classList.remove("slideOutAnim");
    document.querySelector(".sidePanel").classList.add("slideInAnim");
    document.querySelector(".timingPanel").classList.remove("show");
    document.querySelector(".metadataPanel").classList.remove("show");
};

const toggleSidePanel = () => {
    if (document.querySelector(".sidePanel").classList.contains("slideOutAnim")) {
        closeSidePanel();
        return;
    }

    openSidePanel();
    toggleTimingPanel(true);
};
