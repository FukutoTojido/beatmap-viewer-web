class ObjectsList {
    hitCirclesList;
    slidersList;
    objectsList;
    drawTime;
    coloursList;
    currentColor;
    coloursObject;

    compare(a, b) {
        if (a.time < b.time) {
            return -1;
        }
        if (a.time > b.time) {
            return 1;
        }
        return 0;
    }

    createHitCircleColour(colour) {
        hitCircleColor.style.backgroundColor = colour;
        const base64 = window.btoa(new XMLSerializer().serializeToString(sampleHitCircle));
        const hitCircleImgData = `data:image/svg+xml;base64,${base64}`;
        const hitCircleImg = new Image();
        hitCircleImg.src = hitCircleImgData;

        approachCircleColor.style.backgroundColor = colour;
        const base64_2 = window.btoa(new XMLSerializer().serializeToString(sampleApproachCircle));
        const approachCircleImgData = `data:image/svg+xml;base64,${base64_2}`;
        const approachCircleImg = new Image();
        approachCircleImg.src = approachCircleImgData;

        return {
            hitCircle: hitCircleImg,
            approachCircle: approachCircleImg,
        };
    }

    constructor(hitCirclesList, slidersList, coloursList) {
        this.hitCirclesList = hitCirclesList;
        this.slidersList = slidersList;
        this.objectsList = hitCirclesList.concat(slidersList).sort(this.compare);
        this.coloursList = coloursList.length !== 0 ? coloursList : ["#eb4034", "#ebc034", "#34eb65", "#347deb"];
        this.currentColor = 1 % this.coloursList.length;

        this.objectsList = this.objectsList.map((object, idx) => {
            if (object.obj.isNewCombo && idx !== 0) this.currentColor = (this.currentColor + 1) % this.coloursList.length;
            return {
                ...object,
                colour: this.coloursList[this.currentColor],
                colourObject: this.createHitCircleColour(this.coloursList[this.currentColor]),
            };
        });
    }

    draw(timestamp) {
        // console.log(timestamp);
        if (parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) !== canvas.width)
            canvas.width = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width);

        if (parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) !== canvas.height)
            canvas.height = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);

        const currentScaleFactor = Math.min(
            parseInt(getComputedStyle(document.querySelector("#playerContainer")).height) / 480,
            parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) / 640
        );

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.objectsList
            .filter((object) => object.obj.startTime < timestamp && object.obj.endTime > timestamp)
            .reverse()
            .forEach((object) => {
                if (timestamp >= object.obj.startTime) {
                    const opacity =
                        timestamp < object.obj.startTime + preempt
                            ? (timestamp - object.obj.startTime) / fadeIn
                            : (timestamp - (object.obj.endTime - 240)) / 240 - 1;

                    object.obj.draw(
                        opacity,
                        (timestamp - (object.obj.startTime + preempt)) / (object.obj.endTime - 240 - (object.obj.startTime + preempt)),
                        1 - (timestamp - (object.obj.startTime + preempt)) / 240,
                        (timestamp - object.obj.startTime) / preempt,
                        object.colour,
                        object.colourObject,
                        currentScaleFactor
                    );
                }
            });

        if (isPlaying && playingFlag)
            window.requestAnimationFrame((currentTime) => {
                const currentAudioTime = document.querySelector("audio").currentTime * 1000;
                const timestampNext = currentAudioTime * playbackRate;
                return this.draw(timestampNext);
            });
    }

    render() {
        this.drawTime = new Date().getTime() - originalTime;
        window.requestAnimationFrame((currentTime) => {
            const currentAudioTime = document.querySelector("audio").currentTime * 1000;
            const timestamp = currentAudioTime * playbackRate;
            return this.draw(timestamp);
        });
    }
}
