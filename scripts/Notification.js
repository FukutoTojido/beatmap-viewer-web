export class Notification {
    timeout;   
    dialog;
    button;

    constructor(message) {
        const dialog = document.createElement("dialog");
        dialog.classList.add("noti");

        const img = document.createElement("img");
        img.src = "https://img.icons8.com/material-rounded/24/ffffff/info.png";
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

        this.timeout = setTimeout(close, 2000);

        this.button.addEventListener("click", () => {
            clearTimeout(timeout);
            close();
        });
    }
}
