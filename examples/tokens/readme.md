# Token Transfer Example

This is an example of using the SDK to mint, and send tokens from one ChainTree to another.

The example program will use the public Tupelo testnet, so you will need to be connected to the
Internet.

There's a video walkthrough of token transfer here:
[![Play video](http://img.youtube.com/vi/kjysUm0eTKc/1.jpg)](https://youtu.be/kjysUm0eTKc "Wallet Walkthrough")

Unlike other systems, Tupelo models individual objects *first* (as ChainTrees) and then layers tokens on top of those individual objects.

ChainTrees may mint their own tokens and send and receive tokens from other ChainTrees. Within a ChainTree a token can have an arbitrary name, the canonical name of the token is the DID of the ChainTree prepended on that arbitrary name. For example if ChainTree `did:tupelo:xyz` minted a `stockToken` the canonical token name would be `did:tupelo:xyz:stockToken`

The basic flow of creating and sending/receiving tokens is as follows:

1. Establish Token
1. Mint Token
1. Send Token
1. Receive Token

## Establish Token

Establish token lets a ChainTree mint tokens. This transaction allows you to set a `monetaryPolicy` which currently only supports a `maximum`. 
Setting maximum to 0 allows unlimited mints. Once a monetaryPolicy is established, it may not be changed.

```
await community.playTransactions(aliceTree, [establishTokenTransaction('stockToken', 100) // only 100 stock tokens will ever be allowed
```

## Mint Token

This transaction mints an amount of already extablished Tokens. Only the establishing ChainTree may mint tokens.

```
await community.playTransactions(aliceTree, [mintTokenTransaction('stockToken', 10) // mints 10 tokens
```

## Send Token

Send a token to a destination. A send transaction requires a unique sendID (unique to the *receiving* ChainTree). 

```
const uuid = uuidv4()    
// the output (payload) of sendTokenAndGetPayload is a protobuf of TokenPayload that needs to be sent to the receiver of the tokens (out of band of tupelo)
const payload = await community.sendTokenAndGetPayload(tree, sendTokenTransaction(uuid, 'stockToken', 10, 'did:tupelo:xyz')) // sends 10 stockToken to 'did:tupelo:xyz'
```

## Receive Token

Receiving tokens is straight forward, but requires the output of a sendToken transaction (sent out-of-band of Tupelo). 

```
await community.playTransactions(tree, [receiveTokenTransactionFromPayload(payload)])
```

## How to Use
### 1. Download Example & Install Dependencies
Clone the repository:

```
git clone https://github.com/quorumcontrol/tupelo-wasm-sdk
```

Install dependencies:

```
$ cd tupelo-wasm-sdk/examples/tokens
$ npm install
```

### 2. Run the Example
Assuming you're still in the example directory, i.e. tupelo-wasm-sdk/examples/tokens/,
execute it as follows:

```
$ npm start
```

If everything works, you should see output along the lines of the following:

```
creating keys for alice and bob
creating chaintrees for alice and bob
playing the establish token transaction
playing the mint token transaction
sending bob a token
receiving a token on bobs tree
success!
```