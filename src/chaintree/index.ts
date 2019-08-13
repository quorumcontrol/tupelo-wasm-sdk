export * from './chaintree'
export * from './dag/dag'

import OldCID from 'cids'

/**
 * This is a helper class so that CID descriptions can be used in other repos.
 * @public
 */
export class CID extends OldCID {
    constructor(version: string|number|Buffer|CID, codec?: string, multihash?: Buffer, multibaseName?: string) {
        super(version, codec, multihash, multibaseName)
    }
}