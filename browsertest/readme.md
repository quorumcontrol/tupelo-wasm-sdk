# Testing WASM in the browser

Important: this uses *compiled* code and so you need to run an `npm run build` between tupelo-wasm-sdk changes (in the parent directory) before running the browser tests.

Run: `npm run dev` (from the browsertest directory) and then visit http://localhost:1234/index.html and you'll have a mocha test running of the `tests/browser.ts` in this directory.

You need to have a local tupelo running... `docker-compose up tupelo` will do that for you from the main directory (`../` from this directory).

The tests use Parcel to compile and serve the HTML and the mocha browser runner/css to display results.

## Logging / Debugging

Run `npm run dev` with ` DEBUG=` environment variable set to the names of the various debug namespaces in this project. Additionally, using `DEBUG=go` will turn on all the wasm / tupelo-go-sdk logs. The following is a reasonably verbose output:

`DEBUG=community,tupelo,go npm run dev`