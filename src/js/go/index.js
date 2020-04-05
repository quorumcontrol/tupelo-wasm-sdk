// Copyright 2018 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

const log = require('debug')('gowasm');
const isNodeJS = require('detect-node');

require("./wasm_exec"); // require here for the side effect of establishing global.Go

if (typeof global !== "undefined") {
    // global already exists
} else if (typeof window !== "undefined") {
    window.global = window;
} else if (typeof self !== "undefined") {
    self.global = self;
} else {
    throw new Error("cannot export Go (neither global, window nor self is defined)");
}

global.Go.wasmPath = isNodeJS ? require("path").join(__dirname, "tupelo.wasm") : "/tupelo.wasm"

global.Go.setWasmPath = (path) => {
    global.Go.wasmPath = path;
}

global.Go.readyPromise = new Promise((resolve) => {
    global.Go.readyResolver = resolve;
});

const runner = {
    run: async () => {
        log('outer go.run')
        const isNodeJS = global.process && global.process.title.indexOf("node") !== -1;

        const go = new Go();
        go.env = Object.assign({ TMPDIR: require("os").tmpdir() }, process.env);

        let result

        if (isNodeJS) {
            const wasmBits = global.fs.readFileSync(Go.wasmPath)
            result = await WebAssembly.instantiate(wasmBits, go.importObject)

            process.on("exit", (code) => { // Node.js exits if no event handler is pending
                Go.exit();
                if (code === 0 && !go.exited) {
                    // deadlock, make Go print error and stack traces
                    go._pendingEvent = { id: 0 };
                    go._resume();
                }
            });
        } else {
            log("is not nodejs")
            if (typeof WebAssembly.instantiateStreaming == 'function') {
                console.log("wasm path: ", Go.wasmPath)
                result = await WebAssembly.instantiateStreaming(fetch(Go.wasmPath), go.importObject)
            } else {
                log('fetching wasm')
                const wasmResp = await fetch(Go.wasmPath)
                log('turning it into an array buffer')
                const wasm = await wasmResp.arrayBuffer()
                log('instantiating')
                result = await WebAssembly.instantiate(wasm, go.importObject)
            }

        }
        log('inner go.run')
        return go.run(result.instance);
    },
    ready: async (path) => {
        return global.Go.readyPromise;
    },
    populate: (obj, reqs) => {
        return global.populateLibrary(obj, reqs);
    }
}

module.exports = runner;
