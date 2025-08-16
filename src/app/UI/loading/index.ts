export default class Loading {
    private _ele: HTMLDivElement;
    private _eleText: HTMLDivElement;

    constructor() {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        this._ele = document.querySelector<HTMLDivElement>("#loading")!;
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        this._eleText = document.querySelector<HTMLDivElement>("#loadingText")!;
    }

    _state: "ON" | "OFF" = "ON";
    on() {
        if (this._state === "ON") return;

        this._state = "ON";
        this._ele.style.display = "flex";
    }

    off() {
        if (this._state === "OFF") return;

        this._state = "OFF";
        this._ele.style.display = "none";
    }

    setText(text: string) {
         this._eleText.innerText = text;
    }
}