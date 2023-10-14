const Mask = {
    LOWER_7: 0b01111111,
    UPPER_1: 0b10000000,
};

const int = (a) => Number.isSafeInteger(a);

class UnsignedLEB128 {
    static decode(buf, offset = 0) {
        const mp = this.$scanForNullBytes(buf, offset);
        let result = 0,
            shift = 0;
        for (let d = 0; d <= mp - offset; d++) {
            const a = buf[offset + d] & Mask.LOWER_7; /* masking, we only care about lower 7 bits */
            result |= a << shift; /* shift this value left and add it */
            shift += 8 - 1;
        }
        return result;
    }

    static encode(number) {
        this.check(number);
        if (number < 0) throw new Error(`An unsigned number must NOT be negative, ${number} is!`);

        let out = [],
            a = number;
        do {
            let byte = a & Mask.LOWER_7;
            // we only care about lower 7 bits
            a >>= 8 - 1;
            // shift
            if (a) byte = byte | Mask.UPPER_1; /* if remaining is truthy (!= 0), set highest bit */
            out.push(byte);
        } while (a);
        return Uint8Array.from(out);
    }

    static check(n) {
        if (!int(n)) throw new Error(`${n} is not a safe integer!`);
    }

    static $scanForNullBytes(buf, offset = 0) {
        let count = offset,
            tmp = 0;
        do {
            if (count >= buf.byteLength) throw new Error("This is not a LEB128-encoded Uint8Array, no ending found!");

            tmp = buf.slice(count, count + 1)[0];
            count++;
        } while (tmp & Mask.UPPER_1);
        return count - 1;
    }

    static getLength(buf, offset = 0) {
        return this.$scanForNullBytes(buf, offset) - offset;
    }
}

class SignedLEB128 {
    static $ceil7mul(n) {
        let a = n;
        while (a % 7) a++;
        return a;
    }

    static check(n) {
        if (!int(n)) throw new Error(`${n} is not a safe integer!`);
    }

    static encode(number) {
        this.check(number);
        if (number >= 0) throw new Error(`A signed number must be negative, ${number} isn't!`);

        const bitCount = Math.ceil(Math.log2(-number));
        return UnsignedLEB128.encode((1 << this.$ceil7mul(bitCount)) + number);
    }

    static decode(buf, offset = 0) {
        const r = UnsignedLEB128.decode(buf, offset);
        const bitCount = Math.ceil(Math.log2(r));
        const mask = 1 << bitCount;
        return -(mask - r);
    }
}

class LEB128 {
    static encode = (n) => (n >= 0 ? UnsignedLEB128 : SignedLEB128).encode(n);
    static decode = (buf, offset = 0, s = false) => (s ? SignedLEB128 : UnsignedLEB128).decode(buf, offset);
}
