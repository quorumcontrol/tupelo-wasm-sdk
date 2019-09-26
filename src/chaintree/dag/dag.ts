import CID from 'cids';

const Ipld: any = require('ipld');

/** 
 * An IPFS Block
 * @public
 */
export interface IBlock {
  data: Buffer
  cid: CID
}

/**
 * An IPFS Bitswap instance.
 * @public
 */
export interface IBitSwap {
  get(cid: CID, callback:Function): void
  put(block: IBlock, callback:Function): void
  start(callback:Function): void
  stop(callback:Function): void
}

// copy/pasta from https://ipfs.github.io/js-ipfs-block-service
// it has the following methods, I've only added the methods necessary
// for this SDK into the interface
// setExchange
// unsetExchange
// hasExchange
// put
// putMany
// get
// getMany
// delete

/**
 * The interface to a js-ipfs block-service. See: {@link https://ipfs.github.io/js-ipfs-block-service}
 * @public
 */
export interface IBlockService {
  put(block:IBlock):Promise<any>
  get(cid:CID):Promise<IBlock>
  delete(cid:CID):Promise<any>
  setExchange(bitswap:IBitSwap):void
  unsetExchange():void
  hasExchange():boolean
}

interface IDagStoreResolveResponse {
  remainderPath: string
  value: any
}

interface IExtendedDagStoreIterator {
  first():Promise<IDagStoreResolveResponse>
  last():Promise<IDagStoreResolveResponse>
  all():Promise<IDagStoreResolveResponse[]>
}

/**
 * An IPFS DagStore instance
 * @public
 */
export interface IDagStore {
  get(cid: CID): Promise<Object>
  resolve(cid: CID, path: string): IExtendedDagStoreIterator
}

/**
 * This defines the resolve response when doing queries against the DAG from IPFS
 * @public
 */
export interface IResolveResponse {
  remainderPath: string[]
  value: any
}

/**
 * Underlies a ChainTree, it represents a DAG of IPLD nodes and supports resolving accross
 * multiple nodes.
 * @public
 */
export class Dag {
  tip: CID
  dagStore: IDagStore

  constructor(tip: CID, store: IBlockService) {
    this.tip = tip;
    this.dagStore = new Ipld({blockService: store});
  }

  /**
   * Gets a node from the dag
   * @param cid - The CID of the node to get from the DAG
   * @public
   */
  async get(cid: CID) {
    return this.dagStore.get(cid)
  }

  /**
   * 
   * @param path - a path to the desired node/key in the DAG (eg /path/to/data). Array form (eg ['path', 'to', 'data']) is deprecated
   * @public
   */
  async resolve(path: Array<string>|string):Promise<IResolveResponse> {
    return this.resolveAt(this.tip, path)
  }

  /**
   * Similar to resolve, but allows you to start at a specific tip of a dag rather than the current tip.
   * @param tip - The tip of the dag to start at
   * @param path - the path to find the value. Array form is deprecated, use string form (eg /path/to/data) instead
   * @public
   */
  async resolveAt(tip: CID, path: Array<string>|string):Promise<IResolveResponse> {
    let strPath:string
    if (isArray(path)) {
      console.warn('passing in arrays to resolve is deprecated, use the string form (eg /path/to/data) instead')
      strPath  = path.join("/")
    } else {
      strPath = path
    }
    const resolved = this.dagStore.resolve(tip, strPath)
    let lastVal
    try {
      lastVal = await resolved.last()
    } catch (err) {
      const e:Error = err;
    
      if (!e.message.startsWith("Object has no property")) {
        throw err
      }
    }
    // nothing was resolvable, return full path as the remainder
    if (typeof lastVal === 'undefined') {
      console.log("nothing was resolvable")

      return {remainderPath: strPath.split('/'), value: null}
    }
  
    // if remainderPath is not empty, then the value was not found and an
    // error was thrown on the second iteration above - use the remainderPath
    // from the first iteration, but return nil for the error
    if (lastVal.remainderPath != '') {
      return { remainderPath: lastVal.remainderPath.split('/'), value: null }
    }

    return { remainderPath: [], value: lastVal.value }
  }
}


function isArray(path: Array<string>|string): path is Array<string> {
  return (path as Array<string>).join !== undefined;
}
