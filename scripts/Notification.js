function hideNotification(button) {
    const ele = document.querySelector(".noti");

    if (!ele.open) return;

    ele.close();

    ele.classList.remove("animationIn");
    ele.classList.add("animationOut");

    button?.blur();
}

function showNotification(message) {
    const ele = document.querySelector(".noti");
    ele.querySelector(".notiContent").textContent = message;
    ele.classList.remove("animationOut");
    ele.classList.add("animationIn");

    ele.show();
    document.querySelector(".notiDismiss").blur();
    setTimeout(() => hideNotification(), 3000)
}