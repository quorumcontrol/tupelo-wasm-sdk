import { Repo, Community, EcdsaKey, ChainTree, establishTokenTransaction, mintTokenTransaction, sendTokenTransaction, receiveTokenTransactionFromPayload } from 'tupelo-wasm-sdk';
import { MemoryDatastore } from 'interface-datastore';
import uuidv4 from 'uuid/v4'

// Using an in-memory repo here to avoid having a directory written to the filesystem.
// getDefault() in the community package will build a default repo for you (on the FS) if you 
// don't specify a repo
const testRepo = async () => {
  const repo = new Repo('test', {
    lock: 'memory',
    storageBackends: {
      root: MemoryDatastore,
      blocks: MemoryDatastore,
      keys: MemoryDatastore,
      datastore: MemoryDatastore
    }
  })
  await repo.init({})
  await repo.open()
  return repo
}

async function executeAsync() {
  const repo = await testRepo()
  // connect to the Tupelo testnet (you must be on the internet), but use
  // a in-memory only IPFS repo.
  const community = await Community.getDefault(repo)

  // Generate keys for alice and bob
  console.log("creating keys for alice and bob")
  const aliceKey = await EcdsaKey.generate()
  const bobKey = await EcdsaKey.generate()

  // Create empty ChainTrees for alice and bob
  console.log("creating chaintrees for alice and bob")
  const aliceTree = await ChainTree.newEmptyTree(community.blockservice, aliceKey)
  const bobTree = await ChainTree.newEmptyTree(community.blockservice, bobKey)

  const tokenName = "aliceToken"
  const canonicalName = (await aliceTree.id()) + ":" + tokenName

  console.log("playing the establish token transaction: ", await aliceTree.id())
  await community.playTransactions(aliceTree, [establishTokenTransaction(tokenName, 0)]) // 0 means unlimited supply
  console.log("playing the mint token transaction")
  await community.playTransactions(aliceTree, [mintTokenTransaction(tokenName, 1)])

  console.log("sending bob a token")
  const sendId = uuidv4()
  const payload = await community.sendTokenAndGetPayload(aliceTree, sendTokenTransaction(sendId, canonicalName, 1, (await bobTree.id()) as string))

  console.log("receiving a token on bobs tree")
  // payload would be sent out-of-band here in a real app
  await community.playTransactions(bobTree, [receiveTokenTransactionFromPayload(payload)])
  // YAY! Bob now has one token!

  console.log("success!")
  community.node.stop()
  return
}

executeAsync().then(() => {
  process.exit(0)
}, (err) => {
  console.error(err)
  process.exit(1)
})