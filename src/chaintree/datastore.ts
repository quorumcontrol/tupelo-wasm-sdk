export interface IKey {
    toString():String
}
/*
IDataStore describes the interface implemented by IPFS
Note that we are currently on 0.6.0 of the datastore which uses a callback
style insted of promises
*/
export interface IDataStore {
    has(key:IKey, cb:Function):void
    put(key:IKey, val:Uint8Array, cb:Function):void
    get(key:IKey, cb:Function):void
    delete(key:IKey, cb:Function):void
}