/* ──────────────────────────────────────────────────────────────────────────
 * Minimal pure-JS ZIP writer (STORE mode – no compression).
 * Exposes window.zipWriter.create(files) → Blob.
 *
 * `files` is an array of { name, data } where `data` may be:
 *   - a string                     (treated as UTF-8 text)
 *   - a Uint8Array / ArrayBuffer   (raw binary)
 *   - a data: URL                  ("data:...;base64,xxx" – decoded)
 *
 * Adequate for small classroom archives; not optimised for huge files.
 * ──────────────────────────────────────────────────────────────────────── */
(function (root) {
    'use strict';

    /* ── CRC32 (table-driven) ── */
    var crcTable = (function () {
        var t = new Uint32Array(256);
        for (var n = 0; n < 256; n++) {
            var c = n;
            for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            t[n] = c >>> 0;
        }
        return t;
    })();

    function crc32(bytes) {
        var c = 0xFFFFFFFF;
        for (var i = 0; i < bytes.length; i++) c = (c >>> 8) ^ crcTable[(c ^ bytes[i]) & 0xFF];
        return (c ^ 0xFFFFFFFF) >>> 0;
    }

    /* ── encoders ── */
    var textEncoder = (typeof TextEncoder !== 'undefined') ? new TextEncoder() : null;
    function utf8(str) {
        if (textEncoder) return textEncoder.encode(str);
        /* fallback for very old browsers */
        var out = [], i, c;
        for (i = 0; i < str.length; i++) {
            c = str.charCodeAt(i);
            if (c < 0x80) out.push(c);
            else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
            else out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
        }
        return new Uint8Array(out);
    }

    function base64ToBytes(b64) {
        var bin = atob(b64);
        var u = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        return u;
    }

    function toBytes(data) {
        if (data == null) return new Uint8Array(0);
        if (data instanceof Uint8Array) return data;
        if (data instanceof ArrayBuffer) return new Uint8Array(data);
        if (typeof data === 'string') {
            var m = /^data:[^;,]*(?:;[^,]*)?(;base64)?,(.*)$/i.exec(data);
            if (m) {
                return m[1]
                    ? base64ToBytes(m[2])
                    : utf8(decodeURIComponent(m[2]));
            }
            return utf8(data);
        }
        return utf8(String(data));
    }

    /* ── DOS date/time ── */
    function dosDateTime(d) {
        d = d || new Date();
        var time = ((d.getHours() & 0x1F) << 11)
                 | ((d.getMinutes() & 0x3F) << 5)
                 | ((d.getSeconds() / 2) & 0x1F);
        var date = (((d.getFullYear() - 1980) & 0x7F) << 9)
                 | (((d.getMonth() + 1) & 0x0F) << 5)
                 | (d.getDate() & 0x1F);
        return { time: time, date: date };
    }

    /* ── DataView writers ── */
    function w16(view, offset, val) { view.setUint16(offset, val, true); }
    function w32(view, offset, val) { view.setUint32(offset, val >>> 0, true); }

    function create(files) {
        var dt = dosDateTime();
        var localChunks = [];
        var centralChunks = [];
        var offset = 0;
        var totalCentralSize = 0;

        files.forEach(function (file) {
            var nameBytes = utf8(file.name.replace(/\\/g, '/'));
            var dataBytes = toBytes(file.data);
            var crc       = crc32(dataBytes);
            var size      = dataBytes.length;

            /* local file header (30 bytes) + filename + data */
            var localHeader = new ArrayBuffer(30);
            var lv = new DataView(localHeader);
            w32(lv, 0, 0x04034B50);            /* signature */
            w16(lv, 4, 20);                    /* version needed */
            w16(lv, 6, 0x0800);                /* general-purpose bit flag (UTF-8) */
            w16(lv, 8, 0);                     /* compression: STORE */
            w16(lv, 10, dt.time);
            w16(lv, 12, dt.date);
            w32(lv, 14, crc);
            w32(lv, 18, size);                 /* compressed size  = size  */
            w32(lv, 22, size);                 /* uncompressed size = size */
            w16(lv, 26, nameBytes.length);
            w16(lv, 28, 0);                    /* extra field length */
            localChunks.push(new Uint8Array(localHeader), nameBytes, dataBytes);

            /* central directory entry (46 bytes) + filename */
            var centralHeader = new ArrayBuffer(46);
            var cv = new DataView(centralHeader);
            w32(cv, 0, 0x02014B50);            /* signature */
            w16(cv, 4, 20);                    /* version made by */
            w16(cv, 6, 20);                    /* version needed */
            w16(cv, 8, 0x0800);                /* general-purpose bit flag (UTF-8) */
            w16(cv, 10, 0);                    /* compression: STORE */
            w16(cv, 12, dt.time);
            w16(cv, 14, dt.date);
            w32(cv, 16, crc);
            w32(cv, 20, size);
            w32(cv, 24, size);
            w16(cv, 28, nameBytes.length);
            w16(cv, 30, 0);                    /* extra field length */
            w16(cv, 32, 0);                    /* comment length */
            w16(cv, 34, 0);                    /* disk # start */
            w16(cv, 36, 0);                    /* internal attrs */
            w32(cv, 38, 0);                    /* external attrs */
            w32(cv, 42, offset);               /* local header offset */
            centralChunks.push(new Uint8Array(centralHeader), nameBytes);

            offset           += 30 + nameBytes.length + size;
            totalCentralSize += 46 + nameBytes.length;
        });

        /* end of central directory record (22 bytes) */
        var eocd = new ArrayBuffer(22);
        var ev = new DataView(eocd);
        w32(ev, 0, 0x06054B50);                /* signature */
        w16(ev, 4, 0);                         /* this disk */
        w16(ev, 6, 0);                         /* central dir start disk */
        w16(ev, 8, files.length);              /* entries on this disk */
        w16(ev, 10, files.length);             /* total entries */
        w32(ev, 12, totalCentralSize);         /* central dir size */
        w32(ev, 16, offset);                   /* central dir offset */
        w16(ev, 20, 0);                        /* comment length */

        return new Blob(
            localChunks.concat(centralChunks, [new Uint8Array(eocd)]),
            { type: 'application/zip' }
        );
    }

    /* ── helper: trigger a browser download from a Blob ── */
    function download(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a   = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    root.zipWriter = { create: create, download: download };
})(window);
