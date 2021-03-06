# Tupelo Wasm SDK

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)

V2 of the tupelo-js-sdk is a standalone SDK that works with wasm to talk directly to the Tupelo network and does not require a rpc server.

Note: in the words of IPFS: this project is still in Alpha, lots of development is happening, API might change, beware of the Dragons 🐉.

See https://docs.quorumcontrol.com/ for an overview of Tupelo, the whitepaper, other SDKs, etc. For a high-level walkthrough see this video: https://youtu.be/4Oz03l9IQPc which uses the [Tupelo ChainTree Explorer](https://github.com/quorumcontrol/wasm-explorer) described below.

## Examples
We have a comprehensive collection of examples in the *examples/* directory, which should
help you get up to speed quickly on various aspects of the SDK.

## Tupelo ChainTree Explorer
We have made a main demo app based on the SDK, the 
[Tupelo ChainTree Explorer](https://github.com/quorumcontrol/wasm-explorer). This lets you explore
ChainTrees in the Tupelo testnet, and should be a great reference for learning how to use
the Tupelo Wasm SDK in depth!

## API
See: [https://quorumcontrol.github.io/tupelo-wasm-sdk/docs/tupelo-wasm-sdk.html](https://quorumcontrol.github.io/tupelo-wasm-sdk/docs/tupelo-wasm-sdk.html)

## Getting Started

The following snippet of code is all you need to send a transaction to our Testnet

```js
const sdk = require('tupelo-wasm-sdk')

// setup a connection to the default community and Tupelo TestNet
const community = await sdk.Community.getDefault() 

// Generate a new public/private keypair
const key = await sdk.EcdsaKey.generate() 

// Create a new empty tree with the new keypair
const tree = await sdk.ChainTree.newEmptyTree(community.blockservice, key) 

// Play a transaction on the TestNet
let resp = await community.playTransactions(tree, [sdk.setDataTransaction("path", true)])

// Congrats on making a DLT transaction
```

You can also find ChainTrees by their DID and resolve data on them, easily:

```js
const sdk = require('tupelo-wasm-sdk')

// setup a connection to the default community and Tupelo TestNet
const community = await sdk.Community.getDefault() 

const tip = await community.getTip("did:tupelo:0x5bD5b0Ad2d9e73a07E410f32F5C865B231cce62F")

const tree = new sdk.ChainTree({
   store: community.blockservice,
   tip: tip,
})

const {remaining,value} = await tree.resolve("tree/data/path")

// remaining = []
// value = true
```

## Path to Wasm

By default the wasm is loaded from the tupelo.wasm included in the npm package of this repo (src/js/go/tupelo.wasm) for node and from `/tupelo.wasm` (from the root of the server) in the browser.
This is customizable by calling `Go.setWasmPath()` with wherever is better for your app.

## Building
In order to build this project, you first of all need to get the Git submodules:

```
$ git submodule update --init --recursive
```

Then install the dependencies and use the NPM 'build' script:

```
$ npm install
$ npm run build
```

## Running the tests
To run the full test suite, simlpy run `npm run test-suite`.

In development, you may want to run a long lived tupelo network and run tests adhoc.

To do this, first run:
`docker-compose run -d tupelo`

Tests can now be run many times against that same network with:
`docker-compose run tester`

Once finished, make sure to cleanup your local tupelo network:
`docker-compose down --remove-orphans -v`