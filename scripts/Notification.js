let notiTimeout = null;

function hideNotification(button) {
    const ele = document.querySelector(".noti");

    if (!ele.open) return;

    ele.close();

    ele.classList.remove("animationIn");
    ele.classList.add("animationOut");

    button?.blur();
    notiTimeout = null;
}

function showNotification(message) {
    if (notiTimeout) clearTimeout(notiTimeout);

    const ele = document.querySelector(".noti");
    ele.querySelector(".notiContent").textContent = message;
    ele.classList.remove("animationOut");
    ele.classList.add("animationIn");

    ele.show();
    document.querySelector(".notiDismiss").blur();
    notiTimeout = setTimeout(() => hideNotification(), 3000)
}