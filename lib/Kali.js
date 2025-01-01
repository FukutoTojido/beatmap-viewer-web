/* Time stretching and pitch shifting in javascript
 * Copyright (c) 2015 Vivek Panyam
 *
 * Based on tempo.c from SoX (copyright 2007 robs@users.sourceforge.net)
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
import TypedQueue from "./TypedQueue";
// The c code used implicit conversion between floats and ints.
// Since JS stores everything as floats, we need to manually truncate when we
// set a float to an int. A good way to find all these spots is to use the 
// `-Wconversion` flag when compiling the c code.
function handleInt(i) {
    return Math.floor(i);
}
var tempo_t = /** @class */ (function () {
    function tempo_t() {
        this.is_initialized = false;
        this.sample_rate = 44100;
        this.channels = 0;
        this.quick_search = false;
        this.factor = 0;
        this.search = 0;
        this.segment = 0;
        this.overlap = 0;
        this.process_size = 0;
        /* Counters */
        this.samples_in = 0;
        this.samples_out = 0;
        this.segments_total = 0;
        this.skip_total = 0;
    }
    return tempo_t;
}());
var Kali = /** @class */ (function () {
    function Kali(channels) {
        var t = new tempo_t();
        t.channels = channels;
        t.input_fifo = new TypedQueue(Float32Array);
        t.output_fifo = new TypedQueue(Float32Array);
        this.t = t;
    }
    /* Waveform Similarity by least squares; works across multi-channels */
    // TODO: Optimize by caching?
    Kali.prototype.difference = function (a, b, length) {
        var diff = 0;
        var i = 0;
        for (var i = 0; i < length; i++) {
            diff += Math.pow(a[i] - b[i], 2);
        }
        return diff;
    };
    /* Find where the two segments are most alike over the overlap period. */
    Kali.prototype.tempo_best_overlap_position = function (t, new_win) {
        var f = t.overlap_buf;
        var j;
        var best_pos;
        // NOTE: changed to zero-fill shift
        var prev_best_pos = (t.search + 1) >>> 1;
        var step = 64;
        var i = best_pos = t.quick_search ? prev_best_pos : 0;
        var diff;
        var least_diff = this.difference(new_win.subarray(t.channels * i), f, t.channels * t.overlap);
        var k = 0;
        // TODO: implement new quickseek algorithm from SoundTouch
        if (t.quick_search) {
            do { // hierarchial search
                for (k = -1; k <= 1; k += 2) {
                    for (j = 1; j < 4 || step == 64; j++) {
                        i = prev_best_pos + k * j * step;
                        if (i < 0 || i >= t.search) {
                            break;
                        }
                        diff = this.difference(new_win.subarray(t.channels * i), f, t.channels * t.overlap);
                        if (diff < least_diff) {
                            least_diff = diff;
                            best_pos = i;
                        }
                    }
                }
                prev_best_pos = best_pos;
            } while (step >>>= 2); // NOTE: changed to zero-fill shift
        }
        else {
            for (i = 1; i < t.search; i++) { // linear search
                diff = this.difference(new_win.subarray(t.channels * i), f, t.channels * t.overlap);
                if (diff < least_diff) {
                    least_diff = diff;
                    best_pos = i;
                }
            }
        }
        return best_pos;
    };
    Kali.prototype.tempo_overlap = function (t, in1, in2, output) {
        var i = 0;
        var j = 0;
        var k = 0;
        var fade_step = 1.0 / t.overlap;
        for (i = 0; i < t.overlap; i++) {
            var fade_in = fade_step * i;
            var fade_out = 1.0 - fade_in;
            for (j = 0; j < t.channels; j++, k++) {
                output[k] = in1[k] * fade_out + in2[k] * fade_in;
            }
        }
    };
    Kali.prototype.process = function () {
        var t = this.t;
        while (t.input_fifo.occupancy() >= t.process_size) {
            var skip;
            var offset;
            /* Copy or overlap the first bit to the output */
            if (!t.segments_total) {
                offset = t.search / 2;
                t.output_fifo.write(t.input_fifo.read_ptr(t.channels * offset, t.overlap), t.overlap);
            }
            else {
                offset = this.tempo_best_overlap_position(t, t.input_fifo.read_ptr(0));
                this.tempo_overlap(t, t.overlap_buf, t.input_fifo.read_ptr(t.channels * offset), t.output_fifo.write_ptr(t.overlap));
            }
            /* Copy the middle bit to the output */
            t.output_fifo.write(t.input_fifo.read_ptr(t.channels * (offset + t.overlap)), t.segment - 2 * t.overlap);
            /* Copy the end bit to overlap_buf ready to be mixed with
             * the beginning of the next segment. */
            var numToCopy = t.channels * t.overlap;
            t.overlap_buf.set(t.input_fifo.read_ptr(t.channels * (offset + t.segment - t.overlap)).subarray(0, numToCopy));
            /* Advance through the input stream */
            t.segments_total++;
            skip = handleInt(t.factor * (t.segment - t.overlap) + 0.5);
            t.input_fifo.read(null, skip);
        }
    };
    Kali.prototype.input = function (samples, n, offset) {
        if (n === void 0) { n = null; }
        if (offset === void 0) { offset = 0; }
        if (n == null) {
            n = samples.length;
        }
        var t = this.t;
        t.samples_in += n;
        t.input_fifo.write(samples, n);
    };
    Kali.prototype.output = function (samples) {
        var t = this.t;
        var n = Math.min(samples.length, t.output_fifo.occupancy());
        t.samples_out += n;
        t.output_fifo.read(samples, n);
        return n;
    };
    Kali.prototype.flush = function () {
        var t = this.t;
        var samples_out = handleInt(t.samples_in / t.factor + 0.5);
        var remaining = samples_out > t.samples_out ? (samples_out - t.samples_out) : 0;
        var buff = new Float32Array(128 * t.channels);
        if (remaining > 0) {
            while (t.output_fifo.occupancy() < remaining) {
                this.input(buff, 128);
                this.process();
            }
            // TODO: trim buffer here
            // Otherwise potential bug if we reuse after a flush
            t.samples_in = 0;
        }
    };
    Kali.prototype.setup = function (sample_rate, factor, // Factor to change tempo by
    quick_search, segment_ms, search_ms, overlap_ms) {
        if (quick_search === void 0) { quick_search = false; }
        if (segment_ms === void 0) { segment_ms = null; }
        if (search_ms === void 0) { search_ms = null; }
        if (overlap_ms === void 0) { overlap_ms = null; }
        var profile = 1;
        var t = this.t;
        t.sample_rate = sample_rate;
        if (segment_ms == null) {
            segment_ms = Math.max(10, Kali.segments_ms[profile] / Math.max(Math.pow(factor, Kali.segments_pow[profile]), 1));
        }
        if (search_ms == null) {
            search_ms = segment_ms / Kali.searches_div[profile];
        }
        if (overlap_ms == null) {
            overlap_ms = segment_ms / Kali.overlaps_div[profile];
        }
        var max_skip;
        t.quick_search = quick_search;
        t.factor = factor;
        t.segment = handleInt(sample_rate * segment_ms / 1000 + .5);
        t.search = handleInt(sample_rate * search_ms / 1000 + .5);
        t.overlap = Math.max(handleInt(sample_rate * overlap_ms / 1000 + 4.5), 16);
        if (t.overlap * 2 > t.segment) {
            t.overlap -= 8;
        }
        if (!t.is_initialized) {
            t.overlap_buf = new Float32Array(t.overlap * t.channels);
        }
        else {
            var new_overlap = new Float32Array(t.overlap * t.channels);
            var start = 0;
            if (t.overlap * t.channels < t.overlap_buf.length) {
                start = t.overlap_buf.length - (t.overlap * t.channels);
            }
            new_overlap.set(t.overlap_buf.subarray(start, t.overlap_buf.length));
            t.overlap_buf = new_overlap;
        }
        max_skip = handleInt(Math.ceil(factor * (t.segment - t.overlap)));
        t.process_size = Math.max(max_skip + t.overlap, t.segment) + t.search;
        if (!t.is_initialized) {
            t.input_fifo.reserve(handleInt(t.search / 2));
        }
        t.is_initialized = true;
    };
    Kali.prototype.setTempo = function (factor) {
        var t = this.t;
        this.setup(t.sample_rate, factor, t.quick_search);
    };
    Kali.segments_ms = [82, 82, 35, 20];
    Kali.segments_pow = [0, 1, .33, 1];
    Kali.overlaps_div = [6.833, 7, 2.5, 2];
    Kali.searches_div = [5.587, 6, 2.14, 2];
    return Kali;
}());
// if (window) {
//     window['Kali'] = Kali;
// }
export default Kali;
