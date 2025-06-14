let wasm;

const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } });

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } });

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
    }
    : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    });

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}
/**
*/
class LifeAxiom0 {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(LifeAxiom0.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lifeaxiom0_free(ptr);
    }
    /**
    */
    constructor() {
        const ret = wasm.lifeaxiom0_new();
        return LifeAxiom0.__wrap(ret);
    }
    /**
    * @returns {string}
    */
    get description() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbg_get_lifeaxiom0_description(this.__wbg_ptr);
            const ptr0 = getInt32Memory0()[retptr / 4 + 0];
            const len0 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = ptr0;
            deferred1_1 = len0;
            return getStringFromWasm0(ptr0, len0);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

/**
*/
class LifePulse {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(LifePulse.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lifepulse_free(ptr);
    }
    /**
    * @param {string} initial_user_data
    */
    constructor(initial_user_data) {
        const ptr0 = passStringToWasm0(initial_user_data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.lifepulse_new(ptr0, len0);
        return LifePulse.__wrap(ret);
    }
    /**
    * @returns {string}
    */
    get axiomDescription() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.lifepulse_get_axiom_description(this.__wbg_ptr);
            const ptr0 = getInt32Memory0()[retptr / 4 + 0];
            const len0 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = ptr0;
            deferred1_1 = len0;
            return getStringFromWasm0(ptr0, len0);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * @returns {string}
    */
    get userData() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.lifepulse_get_user_data(this.__wbg_ptr);
            const ptr0 = getInt32Memory0()[retptr / 4 + 0];
            const len0 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = ptr0;
            deferred1_1 = len0;
            return getStringFromWasm0(ptr0, len0);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * @param {string} new_data
    */
    set userData(new_data) {
        const ptr0 = passStringToWasm0(new_data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.lifepulse_set_user_data(this.__wbg_ptr, ptr0, len0);
    }
    /**
    */
    increment_activation_count() {
        wasm.lifepulse_increment_activation_count(this.__wbg_ptr);
    }
    /**
    * @returns {number}
    */
    get activationCount() {
        const ret = wasm.lifepulse_get_activation_count(this.__wbg_ptr);
        return ret >>> 0;
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init_memory(imports, wasm.memory);
    cachedInt32Memory0 = null;
    cachedUint8Memory0 = null;


    return wasm;
}

async function init(input) {
    if (wasm !== undefined) return wasm;

    const imports = __wbg_get_imports();

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    const { instance, module } = await __wbg_load(await input, imports);

    return __wbg_finalize_init(instance, module);
}

export default init;
export { LifeAxiom0, LifePulse };
