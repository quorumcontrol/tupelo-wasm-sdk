import 'mocha'
import {expect} from 'chai'
import { AddBlockRequest } from 'tupelo-messages/services/services_pb'
import { Transaction } from 'tupelo-messages'
import {Aggregator} from './wasm'
import { Community } from '../community/community'
import CID from 'cids'
import { ChainTree, setDataTransaction } from '../chaintree'
import { EcdsaKey } from '../crypto'
import { Signature, PublicKey, Ownership } from 'tupelo-messages/signatures/signatures_pb'
const HASH_ALGORITHM = 'sha2-256'

const dagCBOR = require('ipld-dag-cbor')
const secp256k1 = require('secp256k1')
const sha = require('multihashing-async/src/sha')
const isTypedArray = require('is-typedarray').strict

interface Block {
    height: number
    previousTip?: CID
    transactions: Object[] // list of Transaction with .toObject called
}

type SignatureMap = {[key:string]:Object}

interface StandardHeaders {
    signatures: SignatureMap, // Object here is protobuf Signature toObject
}

interface BlockWithHeaders extends Block{
    previousBlock?: CID
    headers: StandardHeaders
}

function typedArrayTobuffer (arr:any) {
    if (isTypedArray(arr)) {
      // To avoid a copy, use the typed array's underlying ArrayBuffer to back new Buffer
      var buf = Buffer.from(arr.buffer)
      if (arr.byteLength !== arr.buffer.byteLength) {
        // Respect the "view", i.e. byteOffset and byteLength, without doing a copy
        buf = buf.slice(arr.byteOffset, arr.byteOffset + arr.byteLength)
      }
      return buf
    } else {
      // Pass through all other types to `Buffer.from`
      return Buffer.from(arr)
    }
  }

describe('Aggregator Wasm', ()=> {
    before(async ()=> {
        const c = await Community.getDefault()
        await Aggregator.setupValidator(c.group)
    })

    it('validates', async ()=> {
        const c = await Community.getDefault()

        let abr = new AddBlockRequest()
        const key = await EcdsaKey.generate()
        const addr = await key.address()
        let tree = await ChainTree.newEmptyTree(c.blockservice, key)

        abr.setPreviousTip(tree.tip.buffer)

        let tx = setDataTransaction("hi", "hi").toObject()
        tx.setDataPayload!.value = Buffer.from(tx.setDataPayload!.value as string, 'base64')

        let block:Block = {
            height: 0,
            transactions: [tx],
        }
        console.log("transactions: ", tx)
    
        const bits = dagCBOR.util.serialize(block)

        const digest = await sha.digest(bits, HASH_ALGORITHM)

        const sig = secp256k1.ecdsaSign(digest, key.privateKey)
        const sigBuf = typedArrayTobuffer(secp256k1.signatureExport(sig.signature))

        // sig := signatures.Signature{
        //     Ownership: &signatures.Ownership{
        //         PublicKey: &signatures.PublicKey{
        //             Type: signatures.PublicKey_KeyTypeSecp256k1,
        //         },
        //     },
        //     Signature: sigBytes,
        // }

        const pubKey = new PublicKey()
        pubKey.setType(PublicKey.Type['KEYTYPESECP256K1'])
        const ownership = new Ownership()
        ownership.setPublicKey(pubKey)
        const sigProto = new Signature()
        sigProto.setOwnership(ownership)
        sigProto.setSignature(sigBuf)

        let sigMap:SignatureMap = {}

        let sigProtoObj = sigProto.toObject()
        delete sigProtoObj.signersList

        sigProtoObj.signature = Buffer.from(sigProtoObj.signature as string, 'base64')

        sigProtoObj.ownership?.publicKey!.publicKey! = Buffer.from('')

        sigMap[addr] = sigProtoObj

        console.log("sig: ", sigProtoObj)

        let blockWithHeaders:BlockWithHeaders = Object.assign(block, {
            headers: {
                signatures: sigMap,
            }
        })

        console.log("deserialize: ", dagCBOR.util.deserialize(dagCBOR.util.serialize(blockWithHeaders)))

        abr.setPayload(Buffer.from(dagCBOR.util.serialize(blockWithHeaders)))
        abr.setObjectId(Buffer.from((await tree.id())!))
        abr.setHeight(0)

        await c.playTransactions(tree, [setDataTransaction("hi", "hi")])
        let resp = await tree.resolve("chain/end")
        console.log("resp: ", resp, " transactions: ", resp.value.transactions, " sigs", resp.value.headers.signatures)
        console.log("sigs: ", Object.keys(resp.value.headers.signatures).map((key)=> {
            return resp.value.headers.signatures[key].ownership.publicKey
        }))
    
        console.log("resp: ", await Aggregator.validate(abr))


    })
})