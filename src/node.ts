const libp2p = require('./js/p2p')

interface IP2PNode {
    pubsub:any;
    start(cb:Function):null;
    stop():null;
    on(evt:string, cb:Function):null;
    once(evt:string, cb:Function):null;
    emit(evt:string):null;
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