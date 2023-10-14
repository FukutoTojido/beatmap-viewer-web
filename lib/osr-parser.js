class Replay {
    gamemode;
    version;
    md5map;
    playerName;
    md5replay;
    accuraciesCount = {
        count300: 0,
        count300k: 0,
        count100: 0,
        count100k: 0,
        count500: 0,
        count0: 0,
    };
    score;
    maxCombo;
    perfect;
    mods;
    healthbar = [];
    timestamp;
    replayData;
    scoreID;

    buffer;
    offset;

    constructor(content) {
        this.buffer = content;
    }

    checkOffset() {
        if (this.offset >= this.buffer.byteLength) throw new Error("Replay data ended unexpectedly");
    }

    parseIntLE(bytes) {
        let res = 0;
        for (let i = bytes.length - 1; i >= 0; i--) {
            res *= 256;
            res += bytes[i];
        }

        return res;
    }

    readByte() {
        this.checkOffset();
        let result = this.parseIntLE(this.buffer.slice(this.offset, this.offset + 1));
        this.offset += 1;
        return result;
    }

    readInt16() {
        this.checkOffset();
        let result = this.parseIntLE(this.buffer.slice(this.offset, this.offset + 2));
        this.offset += 2;
        return result;
    }

    readInt32() {
        this.checkOffset();
        let result = this.parseIntLE(this.buffer.slice(this.offset, this.offset + 4));
        this.offset += 4;
        return result;
    }

    readInt64() {
        this.checkOffset();
        let result = this.parseIntLE(this.buffer.slice(this.offset, this.offset + 8));
        this.offset += 8;
        return result;
    }

    readString() {
        this.checkOffset();
        const present = this.buffer[this.offset] === 0x0b;
        this.offset++;
        if (!present) return "";
        else {
            const len = UnsignedLEB128.getLength(this.buffer, this.offset);
            const num = UnsignedLEB128.decode(this.buffer, this.offset);
            this.offset += len + 1;
            const out = this.buffer.slice(this.offset, this.offset + num).toString();
            this.offset += num;
            return out;
        }
    }

    readBinary(length) {
        this.checkOffset();
        const binary = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return binary;
    }

    parseHealthbar(s) {
        let a = s
            .split(",")
            .filter((a) => a)
            .map((a) => a.trim());
        return a.map((s) => {
            const [timestamp, percentage] = s.split("|").map((a) => +a);
            return { timestamp, percentage };
        });
    }

    async deserialize(deserializeReplayData = true) {
        // (re-)init
        this.offset = 0;
        this.gamemode = this.version = this.score = this.maxCombo = this.perfect = this.scoreID = null;
        this.accuracies = {
            count300k: 0,
            count300: 0,
            count100k: 0,
            count100: 0,
            count50: 0,
            countMiss: 0,
        };

        this.gamemode = this.readByte();
        this.version = this.readInt32();
        this.md5map = this.readString();
        this.player = this.readString();
        this.md5replay = this.readString();
        this.accuracies = {
            count300: this.readInt16(),
            count100: this.readInt16(),
            count50: this.readInt16(),
            count300k: this.readInt16(),
            count100k: this.readInt16(),
            countMiss: this.readInt16(),
        };
        this.score = this.readInt32();
        this.maxCombo = this.readInt16();
        this.perfect = this.readByte();
        this.mods = this.readInt32();
        this.healthbar = this.parseHealthbar(this.readString());
        let a = (BigInt(this.readInt64()) - EPOCH) / 10000n;
        this.timestamp = new Date(Number(a));

        if (deserializeReplayData) {
            let replayLength = this.readInt32();
            let replayBinary = this.readBinary(replayLength);
            let decompressed = LZMA.decompress(replayBinary);
            if (decompressed instanceof Uint8Array) {
                this.replayData = new TextDecoder().decode(decompressed);
            } else {
                this.replayData = decompressed;
            }
        }
        return this;
    }
}

const EPOCH = 621355968000000000n
