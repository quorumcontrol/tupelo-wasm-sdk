const WS = require('libp2p-websockets')
const Multiplex = require('pull-mplex')
require('libp2p-crypto-secp256k1') // no need to do anything with this, just require it.
const SECIO = require('libp2p-secio')
const Bootstrap = require('libp2p-bootstrap')
const KadDHT = require('libp2p-kad-dht')
const libp2p = require('libp2p')
const mergeOptions = require('merge-options')
const PeerInfo = require('peer-info')
const crypto = require('libp2p-crypto').keys
const PeerId = require('peer-id')
const TCP = require('libp2p-tcp')
const util = require('util')

const log = require('debug')("p2p")

const discovery = require('./discovery')
  
const isNodeJS = global.process && global.process.title.indexOf("node") !== -1;

class TupeloP2P extends libp2p {
  constructor (_options) {
    let discoverer;

    if (_options.namespace !== undefined) {
      discoverer = new discovery.RoutingDiscovery({namespace: _options.namespace});
    } else {
      discoverer = new discovery.NullDiscovery();
    }
    delete _options.namespace

    const defaults = {
      switch: {
        blacklistTTL: 2 * 60 * 1e3, // 2 minute base
        blackListAttempts: 5, // back off 5 times
        maxParallelDials: 100,
        maxColdCalls: 25,
        dialTimeout: 2000,
      },
      modules: {
        transport: [
          WS,
          TCP,
        ],
        streamMuxer: [
          Multiplex
        ],
        connEncryption: [
          SECIO
        ],
        peerDiscovery: [
          Bootstrap,
          discoverer.stub()
        ],
        dht: KadDHT,
        pubsub: require('libp2p-floodsub')
      },
      config: {
        peerDiscovery: {
          autoDial: true,
          bootstrap: {
            interval: 5000,
            enabled: true,
          }
        },
        dht: {
          kBucketSize: 20, // taken from https://github.com/ipfs/js-ipfs/blob/master/src/core/runtime/libp2p-nodejs.js
          enabled: true,
          randomWalk: {
            enabled: false,
          },
        },
        pubsub: {
          enabled: true,
          emitSelf: true,
          signMessages: true,
          strictSigning: false,
        }
      }
    }

    super(mergeOptions(defaults, _options))
    discoverer.node = this;
    this.on('error', (err) => {
      log("node error: ", err)
    })
    this.on('peer:discovery', (peer) => {
      log("discovered addresses: ", peer.multiaddrs.toArray().map((ma)=> {return ma.toOptions()}))
    })
    this.once('peer:connect', () => {
      log("first peer:connect")
      discoverer.start(() => {
        log("discovery started");
      })
    })
    this.once('stop', ()=> {
      discoverer.stop(()=> {
        log("routing stopped: ", this.peerID);
      })
    })
   
    this._discoverer = discoverer
  }
}

module.exports.TupeloP2P = TupeloP2P

module.exports.CreateNode = async function(options) {
  log("CreateNode: ", options)
  if (!options) {
    options = {};
  }
  return new Promise(async (resolve,reject) => {
    try {
      const key = await crypto.generateKeyPair('secp256k1')
      const peerID = await util.promisify(PeerId.createFromPrivKey)(key.bytes)
      const peerInfo = new PeerInfo(peerID);
      if (isNodeJS) {
        // nodejs requires that you listen to the address to be able
        // to dial it, the browser *can't* listen to an address.
        peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0/ws')
        peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0/wss')
        peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0')
      }
      options.peerInfo = peerInfo;
      const node = new TupeloP2P(options);
      log("peerIdStr ", peerID.toB58String());
      resolve(node);
    } catch(err) {
      console.error("error generating key pair ", err);
      reject(err);
    }
  });
}
