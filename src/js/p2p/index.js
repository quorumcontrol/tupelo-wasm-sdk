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

const RoutingDiscovery = require('./discovery')

const isNodeJS = global.process && global.process.title.indexOf("node") !== -1;

class TupeloP2P extends libp2p {
  constructor (_options) {
    const routingDiscoverer = new RoutingDiscovery({namespace: 'tupelo-transaction-gossipers'});

    const defaults = {
      switch: {
        blacklistTTL: 2 * 60 * 1e3, // 2 minute base
        blackListAttempts: 5, // back off 5 times
        maxParallelDials: 100,
        maxColdCalls: 25,
        dialTimeout: 20e3
      },
      modules: {
        transport: [
          WS,
          // TCP,
        ],
        streamMuxer: [
          Multiplex
        ],
        connEncryption: [
          SECIO
        ],
        peerDiscovery: [
          Bootstrap,
          routingDiscoverer.stub()
        ],
        dht: KadDHT
      },
      config: {
        peerDiscovery: {
          autoDial: true,
          bootstrap: {
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
        EXPERIMENTAL: {
          pubsub: true
        }
      }
    }

    super(mergeOptions(defaults, _options))
    routingDiscoverer.node = this;
    this.once('peer:connect', () => {
      routingDiscoverer.start(() => {
        log("discovery started");
      })
    })
    this.once('stop', ()=> {
      routingDiscoverer.stop(()=> {
        log("routing stopped");
      })
    })
   
    this._routingDiscoverer = routingDiscoverer
  }
}

module.exports.TupeloP2P = TupeloP2P

module.exports.CreateNode = async function(options) {
  if (!options) {
    options = {};
  }
  let resolve, reject;
  const p = new Promise((res,rej) => {
      resolve = res;
      reject = rej;
  });
  crypto.generateKeyPair('secp256k1', async (err, key) => {
    if (err) {
      console.error("error generating key pair ", err);
      reject(err);
    }

    const peerID = await util.promisify(PeerId.createFromPrivKey)(key.bytes)
    const peerInfo = new PeerInfo(peerID);
    if (isNodeJS) {
      // nodejs requires that you listen to the address to be able
      // to dial it, the browser *can't* listen to an address.
      peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0/ws')
      peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0/wss')
    }
    options.peerInfo = peerInfo;
    const node = new TupeloP2P(options);
    log("peerIdStr ", peerID.toB58String());
    resolve(node);
  })
  return p;
}
