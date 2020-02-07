import { NotaryGroup, PublicKeySet } from 'tupelo-messages/config/config_pb';
import TOML from 'toml'

const PeerId:any = require('peer-id')
const cryptoKeys = require('libp2p-crypto/src/keys')
const Secp256k1PublicKey = cryptoKeys.supportedKeys.secp256k1.Secp256k1PublicKey


interface IPublicKeyCreator {
  verKeyHex: string
  destKeyHex: string
}

interface INotaryGroupCreator {
  id: string
  bootstrapAddresses: string[]
  signers: IPublicKeyCreator[]
}

export interface IPeerId {
  toB58String():string
  isEqual(other:IPeerId):boolean
}

/**
 * publicKeySetToPeerId returns the libp2p peerID from the signer dstKey config
 * @param set - the PublicKeySet (this is a signer in the NotaryGroup)
 */
export function publicKeySetToPeerId(set:PublicKeySet):Promise<IPeerId> {
  return new Promise((resolve,reject)=> {
    const key = new Secp256k1PublicKey(Buffer.from(set.getDestKey_asU8()))
       
    PeerId.createFromPubKey(key.bytes, (err:Error, resp:IPeerId)=> {
      if (err) {
        reject(err)
        return
      }
      resolve(resp)
    })
  })
}

export function notaryGroupToSignerPeerIds(ng:NotaryGroup) {
  let _idPromises = ng.getSignersList().map((signer)=> {
    return publicKeySetToPeerId(signer)
  })
  return Promise.all(_idPromises)
}

function hexToBuffer(hex: string): Buffer {
  // the hex that we export in go is always prefaced with "0x", so strip that off
  return Buffer.from(hex.substr(2), "hex")
}

// stack overflow ftw
export function toCamel(o: any) {
  let newO: any, origKey: string, newKey: string, value: any
  if (o instanceof Array) {
    return o.map(function (value) {
      if (typeof value === "object") {
        value = toCamel(value)
      }
      return value
    })
  } else {
    newO = {}
    for (origKey in o) {
      if (Object.prototype.hasOwnProperty.call(o, origKey)) {
        newKey = (origKey.charAt(0).toLowerCase() + origKey.slice(1) || origKey).toString()
        value = o[origKey]
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = toCamel(value)
        }
        newO[newKey] = value
      }
    }
  }
  return newO
}

/**
 * takes a toml config and returns a NotaryGroup object.
 * @param tomlString - a notary group HumanConfig in toml format
 * @public
 */
export function tomlToNotaryGroup(tomlString: string): NotaryGroup {
  const config = TOML.parse(tomlString)
  return configToNotaryGroup(toCamel(config))
}

export function configToNotaryGroup(obj: INotaryGroupCreator): NotaryGroup {
  const ng = new NotaryGroup()
  ng.setId(obj.id)
  ng.setBootstrapAddressesList(obj.bootstrapAddresses)
  let signers: PublicKeySet[] = []
  for (var s of obj.signers) {
    let publicKeySet = new PublicKeySet()
    publicKeySet.setVerKey(hexToBuffer(s.verKeyHex))
    publicKeySet.setDestKey(hexToBuffer(s.destKeyHex))
    signers = signers.concat(publicKeySet)
  }
  ng.setSignersList(signers)
  return ng
}


export default tomlToNotaryGroup