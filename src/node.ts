const libp2p = require('./js/p2p')

/**
 * A instance of a js-libp2p node
 * @public
 */
export interface IP2PNode {
    pubsub:any;
    state:any;
    start(cb:Function):null;
    isStarted():boolean;
    stop():null;
    on(evt:string, cb:Function):null;
    off(evt:string, cb:Function):null;
    once(evt:string, cb:Function):null;
    emit(evt:string):null;
}

/**
 * Defines the interface used by libp2p for delivering pubsub messages
 * @public
 */
export interface IPubSubMessage {
    from:string
    data:Uint8Array
    seqno:Uint8Array
    topicIDs:string[]
}

/**
 * Defines the options to create a p2p node
 * @public
 */
export interface INodeOptions {
    namespace?:string
    bootstrapAddresses?:string[]
}

/**
 * @public
 */
export namespace p2p {
    /**
     * 
     * @param opts - {@link INodeOptions}
     * @public
     */
    export async function createNode(opts:INodeOptions):Promise<IP2PNode> {
        return libp2p.CreateNode({
            namespace: opts.namespace,
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