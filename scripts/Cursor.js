class Cursor {
    aggregateReplayData = [];
    delay;

    constructor() {
        replayData.slice(2, -2).forEach((cursorPosition) => {
            const splittedData = cursorPosition.split("|");
            const cursorData = {
                timeSinceLastNote: splittedData[0],
                x: splittedData[1],
                y: splittedData[2],
            };

            if (cursorData.timeSinceLastNote < 0) this.delay = Math.abs(cursorData.timeSinceLastNote);

            this.aggregateReplayData.push({
                timeSinceLastNote:
                    cursorData.timeSinceLastNote < 0
                        ? 0
                        : parseInt(this.aggregateReplayData.at(-1).timeSinceLastNote) + parseInt(cursorData.timeSinceLastNote),
                x: splittedData[1] * scaleFactor,
                y: splittedData[2] * scaleFactor,
            });
        });
    }

    render() {
        this.aggregateReplayData.forEach((cursorData) => {
            setTimeout(() => {
                document.querySelector("#cursor").style.transform = `translateX(${cursorData.x}px) translateY(${cursorData.y}px)`;
            }, cursorData.timeSinceLastNote);
        });
    }
}
