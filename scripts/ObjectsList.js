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

    draw(timestamp, staticDraw) {
        // console.log(timestamp);
        const currentMiliseconds = Math.floor(timestamp);
        const msDigits = [currentMiliseconds % 10, Math.floor((currentMiliseconds % 100) / 10), Math.floor((currentMiliseconds % 1000) / 100)];

        msDigits.forEach((val, idx) => {
            document.querySelector(`#millisecond${idx + 1}digit`).innerText = val;
            animation[`ms${idx + 1}digit`].update(document.querySelector(`#millisecond${idx + 1}digit`).innerText);
        });

        const currentSeconds = Math.floor((timestamp / 1000) % 60);
        const sDigits = [currentSeconds % 10, Math.floor((currentSeconds % 100) / 10)];

        sDigits.forEach((val, idx) => {
            document.querySelector(`#second${idx + 1}digit`).innerText = val;
            animation[`s${idx + 1}digit`].update(document.querySelector(`#second${idx + 1}digit`).innerText);
        });
        
        const currentMinute = Math.floor((timestamp / 1000) / 60);
        const mDigits = [currentMinute % 10, Math.floor((currentMinute % 100) / 10)];

        mDigits.forEach((val, idx) => {
            document.querySelector(`#minute${idx + 1}digit`).innerText = val;
            animation[`m${idx + 1}digit`].update(document.querySelector(`#minute${idx + 1}digit`).innerText);
        });

        if (parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) !== canvas.width)
            canvas.width = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width);

        if (parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) !== canvas.height)
            canvas.height = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);

        const currentScaleFactor = Math.min(
            parseInt(getComputedStyle(document.querySelector("#playerContainer")).height) / 480,
            parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) / 640
        );

        let currentAR = !mods.EZ ? approachRate : approachRate / 2;
        currentAR = !mods.HR ? currentAR : Math.min((currentAR * 4) / 3, 10);
        const currentPreempt = currentAR < 5 ? 1200 + (600 * (5 - currentAR)) / 5 : currentAR > 5 ? 1200 - (750 * (currentAR - 5)) / 5 : 1200;
        const currentFadeIn = currentAR < 5 ? 800 + (400 * (5 - currentAR)) / 5 : currentAR > 5 ? 800 - (500 * (currentAR - 5)) / 5 : 800;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.objectsList
            .filter((object) => object.time - currentPreempt < timestamp && object.obj.endTime > timestamp)
            .reverse()
            .forEach((object) => {
                const objStartTime = object.time - currentPreempt;
                if (timestamp >= objStartTime) {
                    const opacity =
                        timestamp < object.time ? (timestamp - objStartTime) / currentFadeIn : (timestamp - (object.obj.endTime - 240)) / 240 - 1;

                    // console.log(object.time, timestamp, timestamp < object.time);

                    object.obj.draw(
                        opacity,
                        (timestamp - object.time) / (object.obj.endTime - 240 - object.time),
                        1 - (timestamp - object.time) / 240,
                        (timestamp - objStartTime) / currentPreempt,
                        object.colour,
                        object.colourObject,
                        currentScaleFactor
                    );
                }
            });

        if (isPlaying && playingFlag && !staticDraw)
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
