/**
 * @preserve
 * JS Implementation of incremental MurmurHash3 (r136) (as of May 20, 2011)
 *
 * @author <a href="mailto:jensyt@gmail.com">Jens Taylor</a>
 * @see http://github.com/homebrewing/brauhaus-diff
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 */
(function(){
    var cache;

    // Call this function without `new` to use the cached object (good for
    // single-threaded environments), or with `new` to create a new object.
    //
    // @param {string} key A UTF-16 or ASCII string
    // @param {number} seed An optional positive integer
    // @return {object} A MurmurHash3 object for incremental hashing
    function MurmurHash3(key, seed) {
        var m;
        if (this instanceof MurmurHash3) {
            m = this;
        } else {
            m = cache;
        }

        m.reset(seed)
        if (typeof key === 'string' && key.length > 0) {
            m.hash(key);
        }

        if (m !== this) {
            return m
        }
    };

    // Incrementally add a string to this hash
    //
    // @param {string} key A UTF-16 or ASCII string
    // @return {object} this
    MurmurHash3.prototype.hash = function(key) {
        var remainder, bytes, h1, k1, i, top, len, l;

        len = key.length;
        this.length += len;

        k1 = this.k1;
        i = 0;
        l = 0;
        switch (this.remainder) {
            case 0: k1 ^= len > l++ ? (key.charCodeAt(i++) & 0xffff) : 0;
            case 1: k1 ^= len > l++ ? (key.charCodeAt(i++) & 0xffff) << 8 : 0;
            case 2: k1 ^= len > l++ ? (key.charCodeAt(i++) & 0xffff) << 16 : 0;
            case 3:
                k1 ^= len > l ? (key.charCodeAt(i) & 0xff) << 24 : 0;
                k1 ^= len > l ? (key.charCodeAt(i++) & 0xff00) >> 8 : 0;
        }

        remainder = (len + this.remainder) & 3; // & 3 is same as % 4
        bytes = len - remainder;
        this.remainder = remainder;
        if (bytes <= 0) {
            this.k1 = k1;
            return;
        }

        h1 = this.h1;
        do {
            k1 = (k1 * 0x2d51 + (k1 & 0xffff) * 0xcc9e0000) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (k1 * 0x3593 + (k1 & 0xffff) * 0x1b870000) & 0xffffffff;

            h1 ^= k1;
            h1 = (h1 << 13) | (h1 >>> 19);
            h1 = (h1 * 5 + 0xe6546b64) & 0xffffffff;

            if (i >= bytes) {
                break
            }

            top = key.charCodeAt(i + 3)
            k1 =
              ((key.charCodeAt(i++) & 0xffff)) ^
              ((key.charCodeAt(i++) & 0xffff) << 8) ^
              ((key.charCodeAt(i++) & 0xffff) << 16) ^
              ((top & 0xff) << 24) ^
              ((top & 0xff00) >> 8);
            i++;
        } while (true)

        k1 = 0;
        switch (remainder) {
            case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
            case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
            case 1: k1 ^= (key.charCodeAt(i) & 0xff);
        }

        this.h1 = h1;
        this.k1 = k1;

        return this;
    };

    // Get the result of this hash
    //
    // @return {number} The 32-bit hash
    MurmurHash3.prototype.result = function() {
        var k1, h1;
        
        k1 = this.k1;
        h1 = this.h1;

        if (k1 > 0) {
            k1 = (k1 * 0x2d51 + (k1 & 0xffff) * 0xcc9e0000) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (k1 * 0x3593 + (k1 & 0xffff) * 0x1b870000) & 0xffffffff;
            h1 ^= k1;
        }

        h1 ^= this.length;

        h1 ^= h1 >>> 16;
        h1 = (h1 * 0xca6b + (h1 & 0xffff) * 0x85eb0000) & 0xffffffff;
        h1 ^= h1 >>> 13;
        h1 = (h1 * 0xae35 + (h1 & 0xffff) * 0xc2b20000) & 0xffffffff;
        h1 ^= h1 >>> 16;

        return h1 >>> 0;
    };

    // Reset the hash object for reuse
    //
    // @param {number} seed An optional positive integer
    MurmurHash3.prototype.reset = function(seed) {
        this.h1 = typeof seed === 'number' ? seed : 0;
        this.remainder = this.k1 = this.length = 0;
        return this;
    };

    // A cached object to use. This can be safely used if you're in a single-
    // threaded environment, otherwise you need to create new hashes to use.
    cache = new MurmurHash3();

    if (typeof(module) != 'undefined') {
        module.exports = MurmurHash3;
    } else {
        this.MurmurHash3 = MurmurHash3;
    }
}());
