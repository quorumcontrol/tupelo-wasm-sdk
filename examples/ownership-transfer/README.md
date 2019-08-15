# Ownership Transfer Example
This is an example of using the SDK to transfer ownership of a Tupelo ChainTree from one
owner to another. We are here imagining that two people, Alice and Bob, wish to 
exchange a trading card, as represented by a ChainTree. 

The example program will use the public Tupelo testnet, so you will need to be connected to the
Internet.

## How to Use
### 1. Download Example & Install Dependencies
Clone the repository:

```
git clone https://github.com/quorumcontrol/tupelo-wasm-sdk
```

Install dependencies:

```
$ cd tupelo-wasm-sdk/examples/ownership-transfer
$ npm install
```

### 2. Run the Example
Assuming you're still in the example's directory, i.e. tupelo-wasm-sdk/examples/ownership-transfer/,
execute it as follows:

```
$ node .
```

If everything works, you should see output along the lines of the following:

```
* Transferring ownership of trading card from Alice to Bob...
* Transfer successfully made!
```
