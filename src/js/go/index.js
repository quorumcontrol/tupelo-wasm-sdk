// Copyright 2018 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

const log = require('debug')('gowasm');
const isNodeJS = require('detect-node');
const buffer = require('buffer');

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

if (!global.Buffer) {
    global.Buffer = buffer.Buffer;
}

if (!global.process.title) {
    global.process.title = window.navigator.userAgent
}

global._goWasm = {}

const runner = {
    run: async(path) => {
        if (!path) {
            path = Go.wasmPath
        }
        log('outer go.run: ', path)

        const go = new Go();
        global._goWasm[path] = go

        go.argv = ["js", path]

        go.readyPromise = new Promise((resolve) => {
            go.readyResolver = resolve;
        });

        console.log("setting ready")
        go.ready = function() {
            return go.readyPromise
        }

        go.env = Object.assign({ TMPDIR: require("os").tmpdir() }, process.env);

        let result

        if (isNodeJS) {
            const wasmBits = global.fs.readFileSync(path)
            result = await WebAssembly.instantiate(wasmBits, go.importObject)

            process.on("exit", (code) => { // Node.js exits if no event handler is pending
                go.terminate();
                if (code === 0 && !go.exited) {
                    // deadlock, make Go print error and stack traces
                    go._pendingEvent = { id: 0 };
                    go._resume();
                }
            });
        } else {
            log("is not nodejs")
            if (typeof WebAssembly.instantiateStreaming == 'function') {
                console.log("wasm path: ", path)
                result = await WebAssembly.instantiateStreaming(fetch(path), go.importObject)
            } else {
                log('fetching wasm')
                const wasmResp = await fetch(path)
                log('turning it into an array buffer')
                const wasm = await wasmResp.arrayBuffer()
                log('instantiating')
                result = await WebAssembly.instantiate(wasm, go.importObject)
            }

        }
        log('inner go.run ', go)
        go.exitPromise = go.run(result.instance)
        return go;
    },
}

module.exports = runner;