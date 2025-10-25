import splatCache from './splatCache.js';

let cameras = [
    {
        id: 0,
        img_name: "00001",
        width: 1959,
        height: 1090,
        position: [
            -3.0089893469241797, -0.11086489695181866, -3.7527640949141428,
        ],
        rotation: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ],
        fy: 1164.6601287484507,
        fx: 1159.5880733038064,
    },
];

let camera = cameras[0];

function getProjectionMatrix(fx, fy, width, height) {
    const znear = 0.2;
    const zfar = 200;
    return [
        [(2 * fx) / width, 0, 0, 0],
        [0, -(2 * fy) / height, 0, 0],
        [0, 0, zfar / (zfar - znear), 1],
        [0, 0, -(zfar * znear) / (zfar - znear), 0],
    ].flat();
}

function getViewMatrix(camera) {
    const R = camera.rotation.flat();
    const t = camera.position;
    const camToWorld = [
        [R[0], R[1], R[2], 0],
        [R[3], R[4], R[5], 0],
        [R[6], R[7], R[8], 0],
        [
            -t[0] * R[0] - t[1] * R[3] - t[2] * R[6],
            -t[0] * R[1] - t[1] * R[4] - t[2] * R[7],
            -t[0] * R[2] - t[1] * R[5] - t[2] * R[8],
            1,
        ],
    ].flat();
    return camToWorld;
}
// function translate4(a, x, y, z) {
//     return [
//         ...a.slice(0, 12),
//         a[0] * x + a[4] * y + a[8] * z + a[12],
//         a[1] * x + a[5] * y + a[9] * z + a[13],
//         a[2] * x + a[6] * y + a[10] * z + a[14],
//         a[3] * x + a[7] * y + a[11] * z + a[15],
//     ];
// }

function multiply4(a, b) {
    return [
        b[0] * a[0] + b[1] * a[4] + b[2] * a[8] + b[3] * a[12],
        b[0] * a[1] + b[1] * a[5] + b[2] * a[9] + b[3] * a[13],
        b[0] * a[2] + b[1] * a[6] + b[2] * a[10] + b[3] * a[14],
        b[0] * a[3] + b[1] * a[7] + b[2] * a[11] + b[3] * a[15],
        b[4] * a[0] + b[5] * a[4] + b[6] * a[8] + b[7] * a[12],
        b[4] * a[1] + b[5] * a[5] + b[6] * a[9] + b[7] * a[13],
        b[4] * a[2] + b[5] * a[6] + b[6] * a[10] + b[7] * a[14],
        b[4] * a[3] + b[5] * a[7] + b[6] * a[11] + b[7] * a[15],
        b[8] * a[0] + b[9] * a[4] + b[10] * a[8] + b[11] * a[12],
        b[8] * a[1] + b[9] * a[5] + b[10] * a[9] + b[11] * a[13],
        b[8] * a[2] + b[9] * a[6] + b[10] * a[10] + b[11] * a[14],
        b[8] * a[3] + b[9] * a[7] + b[10] * a[11] + b[11] * a[15],
        b[12] * a[0] + b[13] * a[4] + b[14] * a[8] + b[15] * a[12],
        b[12] * a[1] + b[13] * a[5] + b[14] * a[9] + b[15] * a[13],
        b[12] * a[2] + b[13] * a[6] + b[14] * a[10] + b[15] * a[14],
        b[12] * a[3] + b[13] * a[7] + b[14] * a[11] + b[15] * a[15],
    ];
}

function invert4(a) {
    let b00 = a[0] * a[5] - a[1] * a[4];
    let b01 = a[0] * a[6] - a[2] * a[4];
    let b02 = a[0] * a[7] - a[3] * a[4];
    let b03 = a[1] * a[6] - a[2] * a[5];
    let b04 = a[1] * a[7] - a[3] * a[5];
    let b05 = a[2] * a[7] - a[3] * a[6];
    let b06 = a[8] * a[13] - a[9] * a[12];
    let b07 = a[8] * a[14] - a[10] * a[12];
    let b08 = a[8] * a[15] - a[11] * a[12];
    let b09 = a[9] * a[14] - a[10] * a[13];
    let b10 = a[9] * a[15] - a[11] * a[13];
    let b11 = a[10] * a[15] - a[11] * a[14];
    let det =
        b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) return null;
    return [
        (a[5] * b11 - a[6] * b10 + a[7] * b09) / det,
        (a[2] * b10 - a[1] * b11 - a[3] * b09) / det,
        (a[13] * b05 - a[14] * b04 + a[15] * b03) / det,
        (a[10] * b04 - a[9] * b05 - a[11] * b03) / det,
        (a[6] * b08 - a[4] * b11 - a[7] * b07) / det,
        (a[0] * b11 - a[2] * b08 + a[3] * b07) / det,
        (a[14] * b02 - a[12] * b05 - a[15] * b01) / det,
        (a[8] * b05 - a[10] * b02 + a[11] * b01) / det,
        (a[4] * b10 - a[5] * b08 + a[7] * b06) / det,
        (a[1] * b08 - a[0] * b10 - a[3] * b06) / det,
        (a[12] * b04 - a[13] * b02 + a[15] * b00) / det,
        (a[9] * b02 - a[8] * b04 - a[11] * b00) / det,
        (a[5] * b07 - a[4] * b09 - a[6] * b06) / det,
        (a[0] * b09 - a[1] * b07 + a[2] * b06) / det,
        (a[13] * b01 - a[12] * b03 - a[14] * b00) / det,
        (a[8] * b03 - a[9] * b01 + a[10] * b00) / det,
    ];
}

function rotate4(a, rad, x, y, z) {
    let len = Math.hypot(x, y, z);
    x /= len;
    y /= len;
    z /= len;
    let s = Math.sin(rad);
    let c = Math.cos(rad);
    let t = 1 - c;
    let b00 = x * x * t + c;
    let b01 = y * x * t + z * s;
    let b02 = z * x * t - y * s;
    let b10 = x * y * t - z * s;
    let b11 = y * y * t + c;
    let b12 = z * y * t + x * s;
    let b20 = x * z * t + y * s;
    let b21 = y * z * t - x * s;
    let b22 = z * z * t + c;
    return [
        a[0] * b00 + a[4] * b01 + a[8] * b02,
        a[1] * b00 + a[5] * b01 + a[9] * b02,
        a[2] * b00 + a[6] * b01 + a[10] * b02,
        a[3] * b00 + a[7] * b01 + a[11] * b02,
        a[0] * b10 + a[4] * b11 + a[8] * b12,
        a[1] * b10 + a[5] * b11 + a[9] * b12,
        a[2] * b10 + a[6] * b11 + a[10] * b12,
        a[3] * b10 + a[7] * b11 + a[11] * b12,
        a[0] * b20 + a[4] * b21 + a[8] * b22,
        a[1] * b20 + a[5] * b21 + a[9] * b22,
        a[2] * b20 + a[6] * b21 + a[10] * b22,
        a[3] * b20 + a[7] * b21 + a[11] * b22,
        ...a.slice(12, 16),
    ];
}

function translate4(a, x, y, z) {
    return [
        ...a.slice(0, 12),
        a[0] * x + a[4] * y + a[8] * z + a[12],
        a[1] * x + a[5] * y + a[9] * z + a[13],
        a[2] * x + a[6] * y + a[10] * z + a[14],
        a[3] * x + a[7] * y + a[11] * z + a[15],
    ];
}

function createWorker(self) {
    let buffer;
    let vertexCount = 0;
    let viewProj;
    // 6*4 + 4 + 4 = 8*4
    // XYZ - Position (Float32)
    // XYZ - Scale (Float32)
    // RGBA - colors (uint8)
    // IJKL - quaternion/rot (uint8)
    const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
    let lastProj = [];
    let depthIndex = new Uint32Array();
    let lastVertexCount = 0;

    var _floatView = new Float32Array(1);
    var _int32View = new Int32Array(_floatView.buffer);

    function floatToHalf(float) {
        _floatView[0] = float;
        var f = _int32View[0];

        var sign = (f >> 31) & 0x0001;
        var exp = (f >> 23) & 0x00ff;
        var frac = f & 0x007fffff;

        var newExp;
        if (exp == 0) {
            newExp = 0;
        } else if (exp < 113) {
            newExp = 0;
            frac |= 0x00800000;
            frac = frac >> (113 - exp);
            if (frac & 0x01000000) {
                newExp = 1;
                frac = 0;
            }
        } else if (exp < 142) {
            newExp = exp - 112;
        } else {
            newExp = 31;
            frac = 0;
        }

        return (sign << 15) | (newExp << 10) | (frac >> 13);
    }

function packHalf2x16(x, y) {
    return (floatToHalf(x) | (floatToHalf(y) << 16)) >>> 0;
}

    function safePostMessageToWorker(worker, msg) {
        console.log('🔄 Worker attempting to send message with keys:', Object.keys(msg));
        for (const key in msg) {
            if (msg[key] instanceof ArrayBuffer && msg[key].byteLength % 4 !== 0) {
                console.error('❌ Not sending misaligned buffer property:', key, msg[key].byteLength);
                return;
            }
        }
        console.log('✅ Worker sending message successfully');
        worker.postMessage(msg);
    }

    function generateTexture() {
        if (!buffer) return;
        const f_buffer = new Float32Array(buffer);
        const u_buffer = new Uint8Array(buffer);

        var texwidth = 1024 * 2; // Set to your desired width
        var texheight = Math.ceil((2 * vertexCount) / texwidth); // Set to your desired height
        var texdata = new Uint32Array(texwidth * texheight * 4); // 4 components per pixel (RGBA)
        var texdata_c = new Uint8Array(texdata.buffer);
        var texdata_f = new Float32Array(texdata.buffer);

        // Here we convert from a .splat file buffer into a texture
        // With a little bit more foresight perhaps this texture file
        // should have been the native format as it'd be very easy to
        // load it into webgl.
        for (let i = 0; i < vertexCount; i++) {
            // x, y, z
            texdata_f[8 * i + 0] = f_buffer[8 * i + 0];
            texdata_f[8 * i + 1] = f_buffer[8 * i + 1];
            texdata_f[8 * i + 2] = f_buffer[8 * i + 2];

            // r, g, b, a
            texdata_c[4 * (8 * i + 7) + 0] = u_buffer[32 * i + 24 + 0];
            texdata_c[4 * (8 * i + 7) + 1] = u_buffer[32 * i + 24 + 1];
            texdata_c[4 * (8 * i + 7) + 2] = u_buffer[32 * i + 24 + 2];
            texdata_c[4 * (8 * i + 7) + 3] = u_buffer[32 * i + 24 + 3];

            // quaternions
            let scale = [
                f_buffer[8 * i + 3 + 0],
                f_buffer[8 * i + 3 + 1],
                f_buffer[8 * i + 3 + 2],
            ];
            let rot = [
                (u_buffer[32 * i + 28 + 0] - 128) / 128,
                (u_buffer[32 * i + 28 + 1] - 128) / 128,
                (u_buffer[32 * i + 28 + 2] - 128) / 128,
                (u_buffer[32 * i + 28 + 3] - 128) / 128,
            ];

            // Compute the matrix product of S and R (M = S * R)
            const M = [
                1.0 - 2.0 * (rot[2] * rot[2] + rot[3] * rot[3]),
                2.0 * (rot[1] * rot[2] + rot[0] * rot[3]),
                2.0 * (rot[1] * rot[3] - rot[0] * rot[2]),

                2.0 * (rot[1] * rot[2] - rot[0] * rot[3]),
                1.0 - 2.0 * (rot[1] * rot[1] + rot[3] * rot[3]),
                2.0 * (rot[2] * rot[3] + rot[0] * rot[1]),

                2.0 * (rot[1] * rot[3] + rot[0] * rot[2]),
                2.0 * (rot[2] * rot[3] - rot[0] * rot[1]),
                1.0 - 2.0 * (rot[1] * rot[1] + rot[2] * rot[2]),
            ].map((k, i) => k * scale[Math.floor(i / 3)]);

            const sigma = [
                M[0] * M[0] + M[3] * M[3] + M[6] * M[6],
                M[0] * M[1] + M[3] * M[4] + M[6] * M[7],
                M[0] * M[2] + M[3] * M[5] + M[6] * M[8],
                M[1] * M[1] + M[4] * M[4] + M[7] * M[7],
                M[1] * M[2] + M[4] * M[5] + M[7] * M[8],
                M[2] * M[2] + M[5] * M[5] + M[8] * M[8],
            ];

            texdata[8 * i + 4] = packHalf2x16(4 * sigma[0], 4 * sigma[1]);
            texdata[8 * i + 5] = packHalf2x16(4 * sigma[2], 4 * sigma[3]);
            texdata[8 * i + 6] = packHalf2x16(4 * sigma[4], 4 * sigma[5]);
        }

        self.postMessage({ texdata, texwidth, texheight }, [texdata.buffer]);
    }

    function runSort(viewProj) {
        if (!buffer) return;
        const f_buffer = new Float32Array(buffer);
        if (lastVertexCount == vertexCount) {
            let dot =
                lastProj[2] * viewProj[2] +
                lastProj[6] * viewProj[6] +
                lastProj[10] * viewProj[10];
            if (Math.abs(dot - 1) < 0.01) {
                return;
            }
        } else {
            generateTexture();
            lastVertexCount = vertexCount;
        }

        console.time("sort");
        let maxDepth = -Infinity;
        let minDepth = Infinity;
        let sizeList = new Int32Array(vertexCount);
        for (let i = 0; i < vertexCount; i++) {
            let depth =
                ((viewProj[2] * f_buffer[8 * i + 0] +
                    viewProj[6] * f_buffer[8 * i + 1] +
                    viewProj[10] * f_buffer[8 * i + 2]) *
                    4096) |
                0;
            sizeList[i] = depth;
            if (depth > maxDepth) maxDepth = depth;
            if (depth < minDepth) minDepth = depth;
        }

        // This is a 16 bit single-pass counting sort
        let depthInv = (256 * 256 - 1) / (maxDepth - minDepth);
        let counts0 = new Uint32Array(256 * 256);
        for (let i = 0; i < vertexCount; i++) {
            sizeList[i] = ((sizeList[i] - minDepth) * depthInv) | 0;
            counts0[sizeList[i]]++;
        }
        let starts0 = new Uint32Array(256 * 256);
        for (let i = 1; i < 256 * 256; i++)
            starts0[i] = starts0[i - 1] + counts0[i - 1];
        depthIndex = new Uint32Array(vertexCount);
        for (let i = 0; i < vertexCount; i++)
            depthIndex[starts0[sizeList[i]]++] = i;

        console.timeEnd("sort");

        lastProj = viewProj;
        self.postMessage({ depthIndex, viewProj, vertexCount }, [
            depthIndex.buffer,
        ]);
    }

    function processPlyBuffer(inputBuffer) {
        const ubuf = new Uint8Array(inputBuffer);
        // 10KB ought to be enough for a header...
        const header = new TextDecoder().decode(ubuf.slice(0, 1024 * 10));
        const header_end = "end_header\n";
        const header_end_index = header.indexOf(header_end);
        if (header_end_index < 0)
            throw new Error("Unable to read .ply file header");
        const vertexCount = parseInt(/element vertex (\d+)\n/.exec(header)[1]);
        console.log("🔢 Original vertex count:", vertexCount);
        
        let row_offset = 0,
            offsets = {},
            types = {};
        const TYPE_MAP = {
            double: "getFloat64",
            int: "getInt32",
            uint: "getUint32",
            float: "getFloat32",
            short: "getInt16",
            ushort: "getUint16",
            uchar: "getUint8",
        };
        for (let prop of header
            .slice(0, header_end_index)
            .split("\n")
            .filter((k) => k.startsWith("property "))) {
            const [p, type, name] = prop.split(" ");
            const arrayType = TYPE_MAP[type] || "getInt8";
            types[name] = arrayType;
            offsets[name] = row_offset;
            row_offset += parseInt(arrayType.replace(/[^\d]/g, "")) / 8;
        }
        console.log("📊 Bytes per row:", row_offset, "properties:", Object.keys(types));

        let dataView = new DataView(
            inputBuffer,
            header_end_index + header_end.length,
        );
        let row = 0;
        const attrs = new Proxy(
            {},
            {
                get(target, prop) {
                    if (!types[prop]) throw new Error(prop + " not found");
                    return dataView[types[prop]](
                        row * row_offset + offsets[prop],
                        true,
                    );
                },
            },
        );

        // First pass: Calculate importance for all vertices
        console.time("calculate importance");
        let sizeList = new Float32Array(vertexCount);
        let sizeIndex = new Uint32Array(vertexCount);
        
        // Track bounds for debugging
        let bounds = {
            minX: Infinity, maxX: -Infinity,
            minY: Infinity, maxY: -Infinity,
            minZ: Infinity, maxZ: -Infinity
        };
        
        for (row = 0; row < vertexCount; row++) {
            const x = attrs.x;
            const y = attrs.y;
            const z = attrs.z;
            
            // Update bounds tracking
            bounds.minX = Math.min(bounds.minX, x);
            bounds.maxX = Math.max(bounds.maxX, x);
            bounds.minY = Math.min(bounds.minY, y);
            bounds.maxY = Math.max(bounds.maxY, y);
            bounds.minZ = Math.min(bounds.minZ, z);
            bounds.maxZ = Math.max(bounds.maxZ, z);
            
            // Calculate importance for vertex
            if (types["scale_0"]) {
                const size =
                    Math.exp(attrs.scale_0) *
                    Math.exp(attrs.scale_1) *
                    Math.exp(attrs.scale_2);
                const opacity = 1 / (1 + Math.exp(-attrs.opacity));
                sizeList[row] = size * opacity;
            } else {
                sizeList[row] = 1.0; // Default importance
            }
            
            sizeIndex[row] = row; // Store original row index
        }
        console.timeEnd("calculate importance");
        
        console.log("📊 Processing results:");
        console.log("- Vertex count:", vertexCount);
        console.log("- Data bounds:", bounds);

        if (vertexCount === 0) {
            console.warn("⚠️ No vertices found!");
            return new ArrayBuffer(0);
        }

        // Sort all vertices by importance
        console.time("sort vertices");
        const sortedSizeIndex = new Uint32Array(vertexCount);
        for (let i = 0; i < vertexCount; i++) {
            sortedSizeIndex[i] = i;
        }
        sortedSizeIndex.sort((b, a) => sizeList[a] - sizeList[b]);
        console.timeEnd("sort vertices");

        // Build output buffer with all vertices
        const rowLength = 3 * 4 + 3 * 4 + 4 + 4; // Position + Scale + RGBA + Rotation
        const buffer = new ArrayBuffer(rowLength * vertexCount);

        console.time("build buffer");
        for (let j = 0; j < vertexCount; j++) {
            const sortedIndex = sortedSizeIndex[j];
            row = sizeIndex[sortedIndex]; // Get original row index

            const position = new Float32Array(buffer, j * rowLength, 3);
            const scales = new Float32Array(buffer, j * rowLength + 4 * 3, 3);
            const rgba = new Uint8ClampedArray(
                buffer,
                j * rowLength + 4 * 3 + 4 * 3,
                4,
            );
            const rot = new Uint8ClampedArray(
                buffer,
                j * rowLength + 4 * 3 + 4 * 3 + 4,
                4,
            );

            // Scales and rotation
            if (types["scale_0"]) {
                const qlen = Math.sqrt(
                    attrs.rot_0 ** 2 +
                        attrs.rot_1 ** 2 +
                        attrs.rot_2 ** 2 +
                        attrs.rot_3 ** 2,
                );

                rot[0] = (attrs.rot_0 / qlen) * 128 + 128;
                rot[1] = (attrs.rot_1 / qlen) * 128 + 128;
                rot[2] = (attrs.rot_2 / qlen) * 128 + 128;
                rot[3] = (attrs.rot_3 / qlen) * 128 + 128;

                scales[0] = Math.exp(attrs.scale_0);
                scales[1] = Math.exp(attrs.scale_1);
                scales[2] = Math.exp(attrs.scale_2);
            } else {
                scales[0] = 0.01;
                scales[1] = 0.01;
                scales[2] = 0.01;

                rot[0] = 255;
                rot[1] = 0;
                rot[2] = 0;
                rot[3] = 0;
            }

            // Position (preserve original coordinates)
            position[0] = attrs.x;
            position[1] = attrs.y;
            position[2] = attrs.z;

            // Colors
            if (types["f_dc_0"]) {
                const SH_C0 = 0.28209479177387814;
                rgba[0] = (0.5 + SH_C0 * attrs.f_dc_0) * 255;
                rgba[1] = (0.5 + SH_C0 * attrs.f_dc_1) * 255;
                rgba[2] = (0.5 + SH_C0 * attrs.f_dc_2) * 255;
            } else {
                rgba[0] = attrs.red;
                rgba[1] = attrs.green;
                rgba[2] = attrs.blue;
            }
            if (types["opacity"]) {
                rgba[3] = (1 / (1 + Math.exp(-attrs.opacity))) * 255;
            } else {
                rgba[3] = 255;
            }
            
            // Debug first few vertices
            if (j < 3) {
                console.log(`📍 Vertex ${j}: pos=[${position[0].toFixed(2)}, ${position[1].toFixed(2)}, ${position[2].toFixed(2)}], scale=[${scales[0].toFixed(3)}, ${scales[1].toFixed(3)}, ${scales[2].toFixed(3)}]`);
            }
        }
        console.timeEnd("build buffer");
        
        console.log("✅ PLY processing complete:");
        console.log("- Final vertex count:", vertexCount);
        console.log("- Buffer size:", buffer.byteLength, "bytes");
        
        return buffer;
    }

    const throttledSort = () => {
        if (!sortRunning) {
            sortRunning = true;
            let lastView = viewProj;
            runSort(lastView);
            setTimeout(() => {
                sortRunning = false;
                if (lastView !== viewProj) {
                    throttledSort();
                }
            }, 0);
        }
    };

    let sortRunning;
    self.onmessage = (e) => {
        // console.log('📨 Worker received message with keys:', Object.keys(e.data));
        
        if (e.data.ply) {
            console.log('🔄 Worker processing PLY request');
            console.log('- PLY buffer size:', e.data.ply.byteLength, 'bytes');
            console.log('- Save flag:', !!e.data.save);
            
            vertexCount = 0;
            if (viewProj) runSort(viewProj);
            buffer = processPlyBuffer(e.data.ply);
            vertexCount = Math.floor(buffer.byteLength / rowLength);
            
            console.log('📤 Sending processed buffer back to main thread:');
            console.log('- Final buffer size:', buffer.byteLength, 'bytes');
            console.log('- Final vertex count:', vertexCount);
            
            // FIX: Include vertexCount in the message
            safePostMessageToWorker(self, { 
                buffer: buffer, 
                vertexCount: vertexCount,  // Add this line!
                save: !!e.data.save 
            });
        } else if (e.data.buffer) {
            if (e.data.buffer.byteLength % 4 !== 0) {
                console.error('❌ Worker received misaligned buffer:', e.data.buffer.byteLength);
                self.postMessage({ debug: 'onmessage: received buffer not multiple of 4: ' + e.data.buffer.byteLength });
                return;
            }
            console.log('📥 Worker received splat buffer:', e.data.buffer.byteLength, 'bytes, vertex count:', e.data.vertexCount);
            buffer = e.data.buffer;
            vertexCount = e.data.vertexCount;
        } else if (e.data.vertexCount) {
            console.log('📥 Worker received vertex count update:', e.data.vertexCount);
            vertexCount = e.data.vertexCount;
        } else if (e.data.view) {
            // Don't log view updates as they're frequent
            viewProj = e.data.view;
            throttledSort();
        }
    };
}

// Utility for container-relative DOM selection
function getViewerElement(container, selector) {
    return container ? container.querySelector(selector) : null;
}

const vertexShaderSource = `
#version 300 es
precision highp float;
precision highp int;

uniform highp usampler2D u_texture;
uniform mat4 projection, view;
uniform vec2 focal;
uniform vec2 viewport;

in vec2 position;
in int index;

out vec4 vColor;
out vec2 vPosition;

void main () {
    uvec4 cen = texelFetch(u_texture, ivec2((uint(index) & 0x3ffu) << 1, uint(index) >> 10), 0);
    vec4 cam = view * vec4(uintBitsToFloat(cen.xyz), 1);
    vec4 pos2d = projection * cam;

    float clip = 1.2 * pos2d.w;
    if (pos2d.z < -clip || pos2d.x < -clip || pos2d.x > clip || pos2d.y < -clip || pos2d.y > clip) {
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
        return;
    }

    uvec4 cov = texelFetch(u_texture, ivec2(((uint(index) & 0x3ffu) << 1) | 1u, uint(index) >> 10), 0);
    vec2 u1 = unpackHalf2x16(cov.x), u2 = unpackHalf2x16(cov.y), u3 = unpackHalf2x16(cov.z);
    mat3 Vrk = mat3(u1.x, u1.y, u2.x, u1.y, u2.y, u3.x, u2.x, u3.x, u3.y);

    mat3 J = mat3(
        focal.x / cam.z, 0., -(focal.x * cam.x) / (cam.z * cam.z),
        0., -focal.y / cam.z, (focal.y * cam.y) / (cam.z * cam.z),
        0., 0., 0.
    );

    mat3 T = transpose(mat3(view)) * J;
    mat3 cov2d = transpose(T) * Vrk * T;

    float mid = (cov2d[0][0] + cov2d[1][1]) / 2.0;
    float radius = length(vec2((cov2d[0][0] - cov2d[1][1]) / 2.0, cov2d[0][1]));
    float lambda1 = mid + radius, lambda2 = mid - radius;

    if(lambda2 < 0.0) return;
    vec2 diagonalVector = normalize(vec2(cov2d[0][1], lambda1 - cov2d[0][0]));
    vec2 majorAxis = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
    vec2 minorAxis = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);

    vColor = clamp(pos2d.z/pos2d.w+1.0, 0.0, 1.0) * vec4((cov.w) & 0xffu, (cov.w >> 8) & 0xffu, (cov.w >> 16) & 0xffu, (cov.w >> 24) & 0xffu) / 255.0;
    vPosition = position;

    vec2 vCenter = vec2(pos2d) / pos2d.w;
    gl_Position = vec4(
        vCenter
        + position.x * majorAxis / viewport
        + position.y * minorAxis / viewport, 0.0, 1.0);
}
`.trim();

    const fragmentShaderSource = `
    #version 300 es
    precision highp float;

    in vec4 vColor;
    in vec2 vPosition;

    out vec4 fragColor;

    void main () {
        float A = -dot(vPosition, vPosition);
        if (A < -4.0) discard;
        float B = exp(A) * vColor.a;
        fragColor = vec4(B * vColor.rgb, B);
    }

    `.trim();

let defaultViewMatrix = [
    0.47, 0.04, 0.88, 0, -0.11, 0.99, 0.02, 0, -0.88, -0.11, 0.47, 0, 0.07,
    0.03, 6.55, 1,
];

let viewMatrix = defaultViewMatrix;

export async function initSplatViewer(containerId, splatFile) {
    console.log('🚀 MAIN THREAD: Initializing splat viewer');
    console.log('- Container ID:', containerId);
    console.log('- Splat file:', splatFile);
    
    const container = document.getElementById(containerId);
    if (!container) {
        throw new Error(`Container with id '${containerId}' not found`);
    }

    // Create canvas element with proper sizing
    const canvas = document.createElement('canvas');
    canvas.id = 'viewer-canvas';
    canvas.style.cssText = 'width: 100%; height: 100%; display: block; position: absolute; top: 0; left: 0;';
    
    // Clear container and add canvas
    const existingControls = container.querySelector('#viewer-controls, #crop-controls');
    container.innerHTML = '';
    
    // Add canvas first
    container.appendChild(canvas);
    
    // Re-add controls if they existed
    if (existingControls) {
        container.appendChild(existingControls);
    }
    
    // Add UI elements
    const uiElements = `
        <div class="scene" id="spinner" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1002;">
            <div class="cube-wrapper">
                <div class="cube">
                    <div class="cube-faces">
                        <div class="cube-face bottom"></div>
                        <div class="cube-face top"></div>
                        <div class="cube-face left"></div>
                        <div class="cube-face right"></div>
                        <div class="cube-face back"></div>
                        <div class="cube-face front"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', uiElements);
    
    // Wait for canvas to be in DOM
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // Now get WebGL context
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        throw new Error('WebGL2 not supported');
    }
    
    let carousel = false; // Start with orbital camera, disable carousel
    let buffer;
    let vertexCount = 0;
    
    const spinner = getViewerElement(container, '#spinner');
    const message = getViewerElement(container, '#message');

    try {
        viewMatrix = JSON.parse(decodeURIComponent(location.hash.slice(1)));
        carousel = false;
    } catch (err) {}

    // Initialize cache if not already done
    if (!splatCache.isAvailable()) {
        try {
            await splatCache.init();
        } catch (error) {
            console.warn('⚠️ Cache initialization failed, continuing without cache:', error);
        }
    }

    // Common WebGL setup
    const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
    let downsample = 1 / devicePixelRatio;

    const worker = new Worker(
        URL.createObjectURL(
            new Blob(["(", createWorker.toString(), ")(self)"], {
                type: "application/javascript",
            }),
        ),
    );

    let projectionMatrix;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(vertexShader));

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(fragmentShader));

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        console.error(gl.getProgramInfoLog(program));

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
        gl.ONE_MINUS_DST_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_DST_ALPHA,
        gl.ONE,
    );
    gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);

    const u_projection = gl.getUniformLocation(program, "projection");
    const u_viewport = gl.getUniformLocation(program, "viewport");
    const u_focal = gl.getUniformLocation(program, "focal");
    const u_view = gl.getUniformLocation(program, "view");

    const triangleVertices = new Float32Array([-2, -2, 2, -2, 2, 2, -2, 2]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    const a_position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    var u_textureLocation = gl.getUniformLocation(program, "u_texture");
    gl.uniform1i(u_textureLocation, 0);

    const indexBuffer = gl.createBuffer();

    // Check cache first
    console.log('� Checking cache for:', splatFile);
    const cachedData = await splatCache.get(splatFile);
    
    if (cachedData) {
        console.log('🚀 Loading from cache - skipping download!');
        
        // Update spinner to show cache loading
        if (message) {
            message.textContent = 'Loading from cache...';
        }
        
        // Use cached data directly
        buffer = cachedData.buffer;
        vertexCount = cachedData.vertexCount;
        downsample = vertexCount > 500000 ? 1 : 1 / devicePixelRatio;
        
        console.log('📦 Using cached buffer:', buffer.byteLength, 'bytes, vertices:', vertexCount);
        
        // Process cached data immediately
        worker.postMessage({
            buffer: buffer,
            vertexCount: vertexCount,
            view: viewMatrix,
            proj: projectionMatrix,
            downsample: downsample,
        });
        
    } else {
        console.log('💾 No cache found, downloading from source...');
        if (message) {
            message.textContent = 'Downloading splat data...';
        }
        
        // Continue with normal download process
        console.log('🌐 Fetching splat file from:', splatFile);
        
        const req = await fetch(splatFile, {
            mode: "cors",
            headers: {
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'max-age=3600', // Cache for 1 hour
            },
            credentials: "omit",
        });
        
        if (req.status != 200) {
            throw new Error(req.status + " Unable to load " + req.url);
        }

        const reader = req.body.getReader();
        
        // Get the actual content length from headers
        const contentLength = req.headers.get("content-length");
        console.log('📊 File info from headers:');
        console.log('- Content-Length header:', contentLength, 'bytes');
        console.log('- Expected size:', contentLength ? (parseInt(contentLength) / 1024 / 1024).toFixed(2) + ' MB' : 'unknown');
        
        // Initialize with proper size or fallback
        let splatData;
        if (contentLength) {
            splatData = new Uint8Array(parseInt(contentLength));
            console.log('📦 Allocated buffer size:', splatData.length, 'bytes');
        } else {
            // Fallback for servers that don't provide content-length
            console.log('⚠️ No content-length header, using dynamic allocation');
            splatData = new Uint8Array(0);
        }

        downsample = splatData.length / rowLength > 500000 ? 1 : 1 / devicePixelRatio;

    const worker = new Worker(
        URL.createObjectURL(
            new Blob(["(", createWorker.toString(), ")(self)"], {
                type: "application/javascript",
            }),
        ),
    );

    let projectionMatrix;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(vertexShader));

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(fragmentShader));

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        console.error(gl.getProgramInfoLog(program));

    gl.disable(gl.DEPTH_TEST); // Disable depth testing

    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
        gl.ONE_MINUS_DST_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_DST_ALPHA,
        gl.ONE,
    );
    gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);

    const u_projection = gl.getUniformLocation(program, "projection");
    const u_viewport = gl.getUniformLocation(program, "viewport");
    const u_focal = gl.getUniformLocation(program, "focal");
    const u_view = gl.getUniformLocation(program, "view");

    // positions
    const triangleVertices = new Float32Array([-2, -2, 2, -2, 2, 2, -2, 2]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    const a_position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    var u_textureLocation = gl.getUniformLocation(program, "u_texture");
    gl.uniform1i(u_textureLocation, 0);

    const indexBuffer = gl.createBuffer();
    const a_index = gl.getAttribLocation(program, "index");
    gl.enableVertexAttribArray(a_index);
    gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
    gl.vertexAttribIPointer(a_index, 1, gl.INT, false, 0, 0);
    gl.vertexAttribDivisor(a_index, 1);

    const resize = () => {
        gl.uniform2fv(u_focal, new Float32Array([camera.fx, camera.fy]));

        projectionMatrix = getProjectionMatrix(
            camera.fx,
            camera.fy,
            innerWidth,
            innerHeight,
        );

        gl.uniform2fv(u_viewport, new Float32Array([innerWidth, innerHeight]));

        gl.canvas.width = Math.round(innerWidth / downsample);
        gl.canvas.height = Math.round(innerHeight / downsample);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.uniformMatrix4fv(u_projection, false, projectionMatrix);
    };

    window.addEventListener("resize", resize);
    resize();

    worker.onmessage = (e) => {
    console.log('📨 Main thread received worker message with keys:', Object.keys(e.data));
    
    if (e.data.buffer) {
        if (e.data.buffer.byteLength % 4 !== 0) {
            console.error('❌ Main thread received misaligned buffer:', e.data.buffer.byteLength);
            return;
        }
        console.log('✅ Main thread updating buffer:', e.data.buffer.byteLength, 'bytes, vertices:', e.data.vertexCount);
        buffer = e.data.buffer;
        vertexCount = e.data.vertexCount || Math.floor(e.data.buffer.byteLength / rowLength);
        
        // Cache the processed data for future use (only if this is from a fresh download, not from cache)
        if (!cachedData && buffer && vertexCount > 0) {
            console.log('💾 Storing processed data in cache...');
            splatCache.set(splatFile, buffer, vertexCount, {
                timestamp: Date.now(),
                fileSize: buffer.byteLength,
                originalUrl: splatFile
            }).then(success => {
                if (success) {
                    console.log('✅ Successfully cached splat data');
                } else {
                    console.warn('⚠️ Failed to cache splat data');
                }
            }).catch(error => {
                console.error('❌ Error caching splat data:', error);
            });
        }
        
        // console.log('✅ Uploaded splat vertex data to GPU:', buffer.byteLength, 'bytes');
        
        // Stop carousel when data loads, but keep orbital camera
        if (vertexCount > 0) {
            carousel = false; // Stop carousel to show the data
            // Note: Orbital camera system will handle positioning
        }
        
        // Force an immediate sort after receiving buffer
        if (projectionMatrix && viewMatrix) {
            const viewProj = multiply4(projectionMatrix, viewMatrix);
            worker.postMessage({ view: viewProj });
        }
    } else if (e.data.texdata) {
        const { texdata, texwidth, texheight } = e.data;
        console.log('📊 Received texture data:', texwidth, 'x', texheight, 'size:', texdata.byteLength);
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA32UI,
            texwidth,
            texheight,
            0,
            gl.RGBA_INTEGER,
            gl.UNSIGNED_INT,
            texdata,
        );
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // console.log('✅ Texture uploaded to GPU');
    } else if (e.data.depthIndex) {
        const { depthIndex, viewProj } = e.data;
        // console.log('📊 Received depth index:', depthIndex.length, 'indices for', e.data.vertexCount, 'vertices');
        
        gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, depthIndex, gl.DYNAMIC_DRAW);
        if (e.data.vertexCount) {
            vertexCount = e.data.vertexCount;
            // console.log('📊 Updated vertex count from depth index:', vertexCount);
        }
        // console.log('✅ Depth index uploaded to GPU');
    } else if (e.data.debug) {
        // console.log('🐛 Worker debug:', e.data.debug);
    }
};

    let currentCameraIndex = 0;

    // Orbital camera state
    let cameraRadius = 8.0;  // Distance from origin
    let cameraTheta = 0.0;   // Horizontal angle (azimuth)
    let cameraPhi = Math.PI / 3; // Vertical angle (elevation) - start slightly above

    // Helper function to create orbital camera matrix
    function createLookAtMatrix(radius, theta, phi) {
        // Start with identity matrix for camera-to-world transform
        let matrix = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
        
        // Apply transformations in correct order for orbital camera:
        // 1. Move camera back by radius
        matrix = translate4(matrix, 0, 0, radius);
        
        // 2. Apply vertical rotation (phi)
        matrix = rotate4(matrix, phi - Math.PI/4, 1, 0, 0);
        
        // 3. Apply horizontal rotation (theta)
        matrix = rotate4(matrix, theta, 0, 1, 0);
        
        return matrix;
    }

    // Initialize orbital camera
    viewMatrix = createLookAtMatrix(cameraRadius, cameraTheta, cameraPhi);

    window.addEventListener(
        "wheel",
        (e) => {
            carousel = false;
            e.preventDefault();
            
            // Scale the zoom speed
            const zoomSpeed = 0.1;
            const delta = e.deltaY * zoomSpeed;
            
            // Adjust camera radius (zoom in/out from origin)
            cameraRadius += delta;
            
            // Clamp radius to reasonable bounds - don't let camera get too close to origin
            cameraRadius = Math.max(2.0, Math.min(50, cameraRadius));
            
            // Update view matrix
            viewMatrix = createLookAtMatrix(cameraRadius, cameraTheta, cameraPhi);
        },
        { passive: false },
    );

    let startX, startY, down;
    canvas.addEventListener("mousedown", (e) => {
        carousel = false;
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        down = 1; // Simplified - only one type of mouse interaction
    });
    canvas.addEventListener("contextmenu", (e) => {
        carousel = false;
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        down = 1;
    });

    canvas.addEventListener("mousemove", (e) => {
        e.preventDefault();
        if (down) {
            // Calculate mouse delta
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            // Orbital rotation sensitivity
            const rotationSpeed = 0.005;
            
            // Update spherical coordinates
            cameraTheta -= deltaX * rotationSpeed; // Horizontal rotation
            cameraPhi += deltaY * rotationSpeed;   // Vertical rotation
            
            // Clamp phi to prevent camera flipping
            const epsilon = 0.01;
            cameraPhi = Math.max(epsilon, Math.min(Math.PI - epsilon, cameraPhi));
            
            // Update view matrix
            viewMatrix = createLookAtMatrix(cameraRadius, cameraTheta, cameraPhi);
            
            startX = e.clientX;
            startY = e.clientY;
        }
    });
    canvas.addEventListener("mouseup", (e) => {
        e.preventDefault();
        down = false;
        startX = 0;
        startY = 0;
    });

    let altX = 0,
        altY = 0;
    canvas.addEventListener(
        "touchstart",
        (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                carousel = false;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                down = 1;
            } else if (e.touches.length === 2) {
                carousel = false;
                startX = e.touches[0].clientX;
                altX = e.touches[1].clientX;
                startY = e.touches[0].clientY;
                altY = e.touches[1].clientY;
                down = 2; // Two finger gesture
            }
        },
        { passive: false },
    );
    canvas.addEventListener(
        "touchmove",
        (e) => {
            e.preventDefault();
            if (e.touches.length === 1 && down === 1) {
                // Single finger - orbit around origin
                const deltaX = e.touches[0].clientX - startX;
                const deltaY = e.touches[0].clientY - startY;
                
                const rotationSpeed = 0.01;
                
                cameraTheta -= deltaX * rotationSpeed;
                cameraPhi += deltaY * rotationSpeed;
                
                // Clamp phi
                const epsilon = 0.01;
                cameraPhi = Math.max(epsilon, Math.min(Math.PI - epsilon, cameraPhi));
                
                viewMatrix = createLookAtMatrix(cameraRadius, cameraTheta, cameraPhi);
                
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            } else if (e.touches.length === 2 && down === 2) {
                // Two finger - pinch to zoom
                const currentDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const startDistance = Math.hypot(startX - altX, startY - altY);
                
                const zoomFactor = startDistance / currentDistance;
                const zoomSpeed = 0.1;
                
                cameraRadius *= (1 + (zoomFactor - 1) * zoomSpeed);
                cameraRadius = Math.max(2.0, Math.min(50, cameraRadius));
                
                viewMatrix = createLookAtMatrix(cameraRadius, cameraTheta, cameraPhi);
                
                startX = e.touches[0].clientX;
                altX = e.touches[1].clientX;
                startY = e.touches[0].clientY;
                altY = e.touches[1].clientY;
            }
        },
        { passive: false },
    );
    canvas.addEventListener(
        "touchend",
        (e) => {
            e.preventDefault();
            down = false;
            startX = 0;
            startY = 0;
        },
        { passive: false },
    );

    let jumpDelta = 0;

    let lastFrame = 0;
    let avgFps = 0;
    let start = 0;

    window.addEventListener("gamepadconnected", (e) => {
        const gp = navigator.getGamepads()[e.gamepad.index];
        console.log(
            `Gamepad connected at index ${gp.index}: ${gp.id}. It has ${gp.buttons.length} buttons and ${gp.axes.length} axes.`,
        );
    });
    window.addEventListener("gamepaddisconnected", (e) => {
        console.log("Gamepad disconnected");
    });

    let leftGamepadTrigger, rightGamepadTrigger;

    const frame = (now) => {
        // Note: Orbital camera system handles viewMatrix
        // Only apply jumping effects as overlay

        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        let isJumping = false;
        for (let gamepad of gamepads) {
            if (!gamepad) continue;

            // Only keep jump control, remove all camera controls
            if (gamepad.buttons[0].pressed) {
                isJumping = true;
                carousel = false;
            }
            if (gamepad.buttons[3].pressed) {
                carousel = true;
            }
        }

        if (isJumping) {
            jumpDelta = Math.min(1, jumpDelta + 0.05);
        } else {
            jumpDelta = Math.max(0, jumpDelta - 0.05);
        }

        // Use orbital camera as base, only apply jump effects as overlay
        let inv2 = invert4(viewMatrix);
        inv2 = translate4(inv2, 0, -jumpDelta, 0);
        inv2 = rotate4(inv2, -0.1 * jumpDelta, 1, 0, 0);
        let actualViewMatrix = invert4(inv2);

        const viewProj = multiply4(projectionMatrix, actualViewMatrix);
        worker.postMessage({ view: viewProj });

        const currentFps = 1000 / (now - lastFrame) || 0;
        avgFps = avgFps * 0.9 + currentFps * 0.1;

        if (vertexCount > 0) {
            document.getElementById("spinner").style.display = "none";
            
            // Render main splats
            gl.useProgram(program);
            gl.uniformMatrix4fv(u_view, false, actualViewMatrix);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, 4, vertexCount);
            gl.enableVertexAttribArray(a_position);
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
            gl.disable(gl.PROGRAM_POINT_SIZE);
            
        } else {
            gl.clear(gl.COLOR_BUFFER_BIT);
            document.getElementById("spinner").style.display = "";
            start = Date.now() + 2000;
        }
        const progress = (100 * vertexCount) / (splatData.length / rowLength);
        lastFrame = now;
        requestAnimationFrame(frame);
    };

    frame();

    const isPly = (splatData) =>
        splatData[0] == 112 &&
        splatData[1] == 108 &&
        splatData[2] == 121 &&
        splatData[3] == 10;

    const selectFile = (file) => {
        const fr = new FileReader();
        if (/\.json$/i.test(file.name)) {
            fr.onload = () => {
                cameras = JSON.parse(fr.result);
                viewMatrix = getViewMatrix(cameras[0]);
                projectionMatrix = getProjectionMatrix(
                    camera.fx / downsample,
                    camera.fy / downsample,
                    canvas.width,
                    canvas.height,
                );
                gl.uniformMatrix4fv(u_projection, false, projectionMatrix);

                console.log("Loaded Cameras");
            };
            fr.readAsText(file);
        } else {
            stopLoading = true;
            fr.onload = () => {
                splatData = new Uint8Array(fr.result);
                console.log("Loaded", Math.floor(splatData.length / rowLength));

                if (isPly(splatData)) {
                    // ply file magic header means it should be handled differently
                    worker.postMessage({ ply: splatData.buffer, save: true });
                } else {
                    worker.postMessage({
                        buffer: splatData.buffer,
                        vertexCount: Math.floor(splatData.length / rowLength),
                    });
                }
            };
            fr.readAsArrayBuffer(file);
        }
    };

    window.addEventListener("hashchange", (e) => {
        try {
            viewMatrix = JSON.parse(decodeURIComponent(location.hash.slice(1)));
            carousel = false;
        } catch (err) {}
    });

    const preventDefault = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };
    document.addEventListener("dragenter", preventDefault);
    document.addEventListener("dragover", preventDefault);
    document.addEventListener("dragleave", preventDefault);
    document.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectFile(e.dataTransfer.files[0]);
    });

    let bytesRead = 0;
    let lastVertexCount = -1;
    let stopLoading = false;

    while (true) {
        const { done, value } = await reader.read();
        if (done || stopLoading) break;

        splatData.set(value, bytesRead);
        bytesRead += value.length;

        if (vertexCount > lastVertexCount) {
            if (!isPly(splatData)) {
                worker.postMessage({
                    buffer: splatData.buffer,
                    vertexCount: Math.floor(bytesRead / rowLength),
                });
            }
            lastVertexCount = vertexCount;
        }
    }
    if (!stopLoading) {
            worker.postMessage({ ply: splatData.buffer.slice(0, bytesRead), save: false });
        } else {
            // Final send for non-PLY files with proper alignment
            const finalVertexCount = Math.floor(bytesRead / rowLength);
            const finalBufferSize = finalVertexCount * rowLength;
            
            // Ensure 4-byte alignment
            const alignedBufferSize = Math.floor(finalBufferSize / 4) * 4;
            const alignedVertexCount = Math.floor(alignedBufferSize / rowLength);
            
            if (alignedBufferSize > 0) {
                worker.postMessage({
                    buffer: splatData.buffer.slice(0, alignedBufferSize),
                    vertexCount: alignedVertexCount,
                });
            }
        }
    } // End of cache check else block   
}