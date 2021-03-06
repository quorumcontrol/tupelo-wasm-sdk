const EventEmitter = require('events').EventEmitter
const debug = require('debug');
const mafmt = require('mafmt')
const CID = require('cids')
const multihashing = require('multihashing-async')


const log = debug('p2p:discovery');
log.error = debug('p2p:discoveryp:error');


function isIPFS(addr) {
    try {
        return mafmt.IPFS.matches(addr)
    } catch (e) {
        return false
    }
}


// Go function is:
// func nsToCid(ns string) (cid.Cid, error) {
// 	h, err := mh.Sum([]byte(ns), mh.SHA2_256, -1)
// 	if err != nil {
// 		return cid.Undef, err
// 	}

// 	return cid.NewCidV1(cid.Raw, h), nil
// }

async function nsToCid(ns) {
    const hash = await multihashing(Buffer.from(ns), 'sha2-256')
    return new CID(1, 'raw', hash)
}

class RoutingStub extends EventEmitter {
    constructor(options) {
        super()
        this.parent = options.parent
    }

    start(callback) {
        // don't call the parent for start
        // because we'll need new information
        callback()
    }

    stop(callback){
        this.parent.stop(callback);
    }
}


class NullDiscovery extends EventEmitter {
    constructor() {
        super()
    }

    start(callback) {
        callback()
    }

    stop(callback) {
        callback()
    }

    stub() {
        return this;
    }
}

class RoutingDiscovery extends EventEmitter {
    constructor(options) {
        super()
        if (!options.namespace) {
            throw new Error("you must provide a namespace to the RoutingDiscovery")
        }
        this._stub = new RoutingStub({parent: this})

        this._namespace = options.namespace
        this._interval = options.interval || 2000
        this._timer = null
    }

    // stub is used so that there is something for the node to listen to for the 'peer' event
    // but we can't actually spin up this routing discovery until we have a node
    stub() {
        return this._stub;
    }

    start(callback) {
        if (!this.node) {
            throw new Error("you must set node on this discoverer before starting");
        }

        if (!this.node.isStarted()) {
            throw new Error("you must start the node before discovering")
        }

        if (this._timer) {
            return process.nextTick(() => callback())
        }

        this._timer = setInterval(() => this._discoverContentPeers(), this._interval)

        process.nextTick(() => {
            callback()
            this._discoverContentPeers()
        })
    }

    async _discoverContentPeers() {
        if (!this._nsCid) {
            this._nsCid = await nsToCid(this._namespace);
        }
        this.node.contentRouting.findProviders(this._nsCid, 1800, (err, providers) => {
            if (err) {
                if (!this.node.isStarted()) {
                    this.stop(()=> {
                        log.error("self-stopping the discoverer, because the node is stopped")
                    })
                    return
                }
                if (err.message === "no providers found") {
                    return // we don't want to throw an error when we just haven't found the providers yet
                }
                if (err.message === 'Callback function "anonymous" timed out.') {
                    log.error("timeout on findProviders")
                    return // do nothing here either, don't want to blow up due to a timeout
                }
                log.error("throwing an error: ", err.message)
                throw err 
            }
        
            for (const peerInfo of providers) {
                this.stub().emit('peer', peerInfo)
            }
        })
    }

    stop(callback) {
        process.nextTick(callback)

        if (this._timer) {
            clearInterval(this._timer)
            this._timer = null
        }
    }
}

module.exports.RoutingDiscovery = RoutingDiscovery
module.exports.NullDiscovery = NullDiscovery

exports = module.exports
exports.tag = 'routing'