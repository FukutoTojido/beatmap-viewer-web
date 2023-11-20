class HitSound {
    static HIT_SAMPLES = ["", "normal", "soft", "drum"];
    static HIT_SOUNDS = ["hitwhistle", "hitfinish", "hitclap"];
    static PARSE_ENUM = {
        Normal: 1,
        Soft: 2,
        Drum: 3,
    };

    static GetHitSound(hitSoundParam) {
        return parseInt(hitSoundParam)
            .toString(2)
            .padStart(4, "0")
            .split("")
            .reverse()
            .slice(1)
            .reduce(
                (accm, flag, idx) => {
                    if (flag === "1") accm.push(HitSound.HIT_SOUNDS[idx]);
                    return accm;
                },
                ["hitnormal"]
            );
    }

    static GetHitSample(hitSampleParam, timingPoint) {
        if (!/^\d:\d.*/g.test(hitSampleParam)) hitSampleParam = "0:0";

        const defaultIndex = timingPoint.sampleSet !== 0 ? timingPoint.sampleSet : HitSound.PARSE_ENUM[Beatmap.SAMPLE_SET];
        const [normalIndex, additionIndex] = hitSampleParam.split(":");

        const normalSet = HitSound.HIT_SAMPLES[parseInt(normalIndex) === 0 ? defaultIndex : normalIndex];
        const additionSet = parseInt(additionIndex) === 0 ? normalSet : HitSound.HIT_SAMPLES[additionIndex];

        return {
            normalSet,
            additionSet,
        };
    }

    static GetName(hitSampleParam, hitSoundParam, timingPoint) {
        const hitSound = HitSound.GetHitSound(hitSoundParam);
        const { normalSet, additionSet } = HitSound.GetHitSample(hitSampleParam, timingPoint);
        const idx = timingPoint.sampleIdx;

        return hitSound.map((hs) => {
            if (hs === "hitnormal") return `${normalSet}-${hs}${idx}`;
            return `${additionSet}-${hs}${idx}`;
        });
    }
}
