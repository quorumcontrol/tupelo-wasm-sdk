# Ownership Setting and Getting Data Example
This is an example of using the SDK to set data in a Tupelo ChainTree and reading it back out.
We are here imagining that Alice wishes to register her trading card as a ChainTree.

In order to set data, properties of a trading card in this example, we play 
[`setDataTransaction`](https://quorumcontrol.github.io/tupelo-wasm-sdk/docs/tupelo-wasm-sdk.setdatatransaction.html)s
against the corresponding ChainTree. As you can see from the following code snippet,
we play a sequence of such transactions and then wait for them to be applied by calling
`community.nextUpdate()`:

```
await community.playTransactions(tradingCard, [
  setDataTransaction('series', 'Topps UCL Living Set Card'),
  setDataTransaction('item', '#48 - Frank Lampard'),
  setDataTransaction('condition', 'Mint condition'),
]);
await community.nextUpdate();
```

In order to read those properties back, after the transactions
are successfully applied, we use the 
[`ChainTree.resolve`](https://quorumcontrol.github.io/tupelo-wasm-sdk/docs/tupelo-wasm-sdk.dag.resolve.html)
method:

```
const { value: { series, item, condition, }, } = await tradingCard.resolve(['tree', 'data',]);
```

The `ChainTree.resolve` method, as used above, actually returns an object with two properties,
`remainderPath` and `value`. If the path resolves successfully, `remainderPath` will be
an empty array and `value` will be the value stored at the path. Otherwise, if nothing is 
stored at the path, `resolve` will return the `value` stored at the deepest node of the path
and the remaining, unresolved, path in `remainderPath`. This behaviour is according to the
[IPLD specifications](https://github.com/ipld/interface-ipld-format#resolverresolvebinaryblob-path),
which our `resolve` method implements. 

The example program will use the public Tupelo testnet, so you will need to be connected to the
Internet.

## How to Use
### 1. Download Example & Install Dependencies
Clone the repository:

```
git clone https://github.com/quorumcontrol/tupelo-wasm-sdk
```

### 2. Follow the instructions in the main README.md to build the WASM SDK

### 3. Install dependencies:

```
$ cd tupelo-wasm-sdk/examples/set-and-get-data
$ npm install
```

### 4. Run the Example
Assuming you're still in the example's directory, i.e. tupelo-wasm-sdk/examples/set-and-get-data/,
execute it as follows:

```
$ npm start
```

If everything works, you should see output along the lines of the following:

```
* Setting properties of Alice's trading card...
* Card successfully registered!
```
