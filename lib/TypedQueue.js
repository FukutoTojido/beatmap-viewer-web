/* FIFO Queue
 * Copyright (c) 2015 Vivek Panyam
 *
 * Based on fifo.h from SoX (copyright 2007 robs@users.sourceforge.net)
 *
 * This library is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or (at
 * your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser
 * General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */
// Queue using typed arrays
var TypedQueue = /** @class */ (function () {
    function TypedQueue(c) {
        this.begin = 0; // index of first item in mem
        this.end = 0; // 1 + index of last item in mem
        this.typedArrayConstructor = c;
        this.buffer = new c(16384);
    }
    TypedQueue.prototype.clear = function () {
        this.begin = this.end = 0;
    };
    TypedQueue.prototype.reserve = function (n) {
        if (this.begin == this.end) {
            this.clear();
        }
        while (1) {
            // If we can fit the additional data, do it
            if (this.end + n < this.buffer.length) {
                var idx = this.end;
                this.end += n;
                return idx;
            }
            // Shift to beginning of array
            if (this.begin > 16384) {
                this.buffer.set(this.buffer.subarray(this.begin, this.end));
                this.end -= this.begin;
                this.begin = 0;
                continue;
            }
            // Resize array if nothing else works
            var newbuf = new this.typedArrayConstructor(this.buffer.length + n);
            newbuf.set(this.buffer);
            this.buffer = newbuf;
        }
    };
    TypedQueue.prototype.write = function (data, n) {
        var offset = this.reserve(n);
        this.buffer.set(data.subarray(0, n), offset);
    };
    TypedQueue.prototype.write_ptr = function (n) {
        var offset = this.reserve(n);
        return this.buffer.subarray(offset, offset + n);
    };
    TypedQueue.prototype.read = function (data, n) {
        if (n + this.begin > this.end) {
            console.error("Read out of bounds", n, this.end, this.begin);
        }
        if (data != null) {
            data.set(this.buffer.subarray(this.begin, this.begin + n));
        }
        this.begin += n;
    };
    TypedQueue.prototype.read_ptr = function (start, end) {
        if (end === void 0) { end = -1; }
        if (end > this.occupancy()) {
            console.error("Read Pointer out of bounds", end);
        }
        if (end < 0) {
            end = this.occupancy();
        }
        return this.buffer.subarray(this.begin + start, this.begin + end);
    };
    TypedQueue.prototype.occupancy = function () {
        return this.end - this.begin;
    };
    return TypedQueue;
}());
export default TypedQueue;
