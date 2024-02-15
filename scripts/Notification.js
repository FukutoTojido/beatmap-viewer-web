const typeEnum = {
    "message": "/static/info.svg",
    "warning": "/static/alert-triangle.svg",
    "error": "/static/badge-alert.svg",
}

export class Notification {
    timeout;   
    dialog;
    button;
    autoTimeout = true;

    constructor({ message, autoTimeout = true, type = "message"}) {
        const dialog = document.createElement("dialog");
        dialog.classList.add("noti", type);

        const img = document.createElement("img");
        img.src = typeEnum[type];
        img.width = 24;
        img.height = 24;

        const div = document.createElement("div");
        div.classList.add("notiContent");
        div.textContent = message;

        const button = document.createElement("button");
        button.classList.add("notiDismiss");

        const img2 = document.createElement("img");
        img2.src = "/static/close.png";
        img2.width = 24;
        img2.height = 24;

        button.append(img2);

        dialog.append(img, div, button);
        
        this.dialog = dialog;
        this.button = button;

        if (autoTimeout === undefined) return;
        this.autoTimeout = autoTimeout;
    }

    notify() {
        document.querySelector(".notiContainer").append(this.dialog);
        this.button.blur();

        this.dialog.classList.remove("animationOut");
        this.dialog.classList.add("animationIn");
        this.dialog.show();

        const close = () => {
            this.dialog.close();

            this.dialog.classList.remove("animationIn");
            this.dialog.classList.add("animationOut");

            this.dialog.onanimationend = () => {
                document.querySelector(".notiContainer").removeChild(this.dialog);
            };
        };

        this.timeout = setTimeout(this.autoTimeout ? close : () => {}, 2000);

        this.button.addEventListener("click", () => {
            clearTimeout(this.timeout);
            close();
        });
    }
}
