import { NotaryGroup, PublicKeySet } from 'tupelo-messages/config/config_pb';
import fs from 'fs';
import TOML from 'toml'

interface IPublicKeyCreator {
  verKeyHex: string
  destKeyHex: string
}

interface INotaryGroupCreator {
  id: string
  bootstrapAddresses: string[]
  signers: IPublicKeyCreator[]
}

function hexToBuffer(hex: string): Buffer {
  // the hex that we export in go is always prefaced with "0x", so strip that off
  return Buffer.from(hex.substr(2), "hex")
}

// stack overflow ftw
function toCamel(o: any) {
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

function configToNotaryGroup(obj: INotaryGroupCreator): NotaryGroup {
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