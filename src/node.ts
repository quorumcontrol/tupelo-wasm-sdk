const libp2p = require('./js/p2p')

export interface IP2PNode {
    pubsub:any;
    state:any;
    start(cb:Function):null;
    isStarted():boolean;
    stop():null;
    on(evt:string, cb:Function):null;
    once(evt:string, cb:Function):null;
    emit(evt:string):null;
}

export interface IPubSubMessage {
    from:string
    data:Uint8Array
    seqno:Uint8Array
    topicIDs:string[]
}

interface INodeOptions {
    bootstrapAddresses?:string[]
}

export namespace p2p {
    export async function createNode(opts:INodeOptions):Promise<IP2PNode> {
        return libp2p.CreateNode({
            config: {
                peerDiscovery: {
                    bootstrap: {
                        list: opts.bootstrapAddresses
                    }
                }
            }
        });
    }
}