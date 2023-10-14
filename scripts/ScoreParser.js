class ScoreParser {
    static BLOB;
    static REPLAY_DATA;
    static CURSOR_DATA;
    static MODS;

    static INPUT_LIST = ["SMOKE", "K2", "K1", "M2", "M1"];
    static MOD_LIST = [
        "NoFail",
        "Easy",
        "TouchDevice",
        "Hidden",
        "HardRock",
        "SuddenDeath",
        "DoubleTime",
        "Relax",
        "HalfTime",
        "Nightcore",
        "Flashlight",
        "Autoplay",
        "SpunOut",
        "Autopilot",
        "Perfect",
        "Key4",
        "Key5",
        "Key6",
        "Key7",
        "Key8",
        "FadeIn",
        "Random",
        "Cinema",
        "Target",
        "Key9",
        "KeyCoop",
        "Key1",
        "Key3",
        "Key2",
        "ScoreV2",
        "Mirror",
    ];

    async getMapData(md5) {
        return (await axios.get(`https://tryz.vercel.app/api/h/${md5}`)).data;
    }

    async getReplayData() {
        // Convert Blob to ArrayBuffer to Buffer
        document.querySelector(".loading").style.display = "";
        document.querySelector(".loading").style.opacity = 1;
        document.querySelector("#loadingText").innerText = `Parsing Score`;

        const arr_buf = await new Response(ScoreParser.BLOB).arrayBuffer();
        const buf = buffer.Buffer.from(arr_buf);

        // Get Replay Data
        const replay = new Replay(buf);
        const replayData = await replay.deserialize();
        ScoreParser.REPLAY_DATA = replayData;

        // Get Cursor Data
        let timestamp = 0;
        ScoreParser.CURSOR_DATA = replayData.replayData
            .split(",")
            .filter((data) => data !== "")
            .map((data, idx) => {
                const nodes = data.split("|");

                if (nodes[0] === "-12345")
                    return {
                        time: 0,
                        x: 0,
                        y: 0,
                        inputArray: [],
                        idx,
                    };

                timestamp += parseFloat(nodes[0]);
                return {
                    time: timestamp,
                    x: parseFloat(nodes[1]),
                    y: parseFloat(nodes[2]),
                    inputArray: parseInt(nodes[3])
                        .toString(2)
                        .padStart(5, "0")
                        .split("")
                        .reduce((prev, curr, idx) => (curr === "1" && idx !== 0 ? prev.concat([ScoreParser.INPUT_LIST[idx]]) : prev), []),
                    idx,
                };
            });

        const mapData = await this.getMapData(ScoreParser.REPLAY_DATA.md5map);
        submitMap(false, mapData.beatmap_id);

        ScoreParser.MODS = ScoreParser.REPLAY_DATA.mods
            .toString(2)
            .padStart(31, "0")
            .split("")
            .reduce((accumulated, current, idx) => {
                if (current === "1") accumulated.push(ScoreParser.MOD_LIST[ScoreParser.MOD_LIST.length - 1 - idx]);
                return accumulated;
            }, []);

        console.log(ScoreParser.REPLAY_DATA, ScoreParser.CURSOR_DATA, ScoreParser.MODS);
    }

    constructor(blob) {
        ScoreParser.BLOB = blob;
        ScoreParser.REPLAY_DATA = null;
        ScoreParser.CURSOR_DATA = null;
    }
}
