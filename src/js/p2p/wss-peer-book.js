const PeerBook = require('peer-book')

const WSS_PROTO_CODE = 478

class WssPeerBook extends PeerBook {
  // Filters out non WSS addrs
  put (peerInfo, replace) {
    let wssOnly = []

    peerInfo.multiaddrs.forEach((ma) => {
      if (ma.protoCodes().includes(WSS_PROTO_CODE)) {
        wssOnly.push(ma)
      }
    })

    peerInfo.multiaddrs.replace(peerInfo.multiaddrs.toArray(), wssOnly)

    return super.put(peerInfo, replace)
  }
}

module.exports = WssPeerBook