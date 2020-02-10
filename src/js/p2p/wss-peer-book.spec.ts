import { expect } from 'chai'
import 'mocha';

const WssPeerBook = require('./wss-peer-book')
const PeerInfo = require('peer-info')
const PeerId = require('peer-id')

describe('WssPeerBook', ()=> {
  it('filters out non wss addrs from peers on .put', async ()=> {
    const peerBook = new WssPeerBook()
    const peerId = PeerId.createFromB58String("16Uiu2HAmJs2thyy5nDBiMZaR9DMmqpzfYZygoBdpxpkGxV6XGVYc")
    const peerInfo = new PeerInfo(peerId)

    peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0/ws')
    peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0/wss')
    peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0')
    peerInfo.multiaddrs.add('/ip4/127.0.0.1/tcp/0/ws')
    peerInfo.multiaddrs.add('/ip4/127.0.0.1/tcp/0/wss')
    peerInfo.multiaddrs.add('/ip4/127.0.0.1/tcp/0')

    expect(peerInfo.multiaddrs.size).to.eql(6)
    peerBook.put(peerInfo)

    const storedPeerInfo = peerBook.get(peerId)
    const filteredAddrs = storedPeerInfo.multiaddrs.toArray()

    expect(filteredAddrs.length).to.eql(2)

    expect(filteredAddrs[0].toString()).to.eq('/ip4/0.0.0.0/tcp/0/wss')
    expect(filteredAddrs[1].toString()).to.eq('/ip4/127.0.0.1/tcp/0/wss')
  })
})