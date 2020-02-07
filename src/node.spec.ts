import { expect } from 'chai';
import 'mocha';

import { p2p } from './node';

describe('p2p', ()=> {
    it('creates a node with namespace', async ()=> {
        let resolve:Function,reject:Function
        const p = new Promise((res,rej)=> { resolve = res, reject = rej})

        var node = await p2p.createNode({
            namespace: "testing",
            bootstrapAddresses:["/ip4/172.16.246.10/tcp/34001/ipfs/16Uiu2HAm3TGSEKEjagcCojSJeaT5rypaeJMKejijvYSnAjviWwV5"]
        })

        expect(node).to.exist;
        node.start(()=> {
            node.stop();
            resolve()
        });
        return p
    })

    it('creates a node without namespace', async ()=> {
        let resolve:Function,reject:Function
        const p = new Promise((res,rej)=> { resolve = res, reject = rej})

        var node = await p2p.createNode({
            bootstrapAddresses:["/ip4/172.16.246.10/tcp/34001/ipfs/16Uiu2HAm3TGSEKEjagcCojSJeaT5rypaeJMKejijvYSnAjviWwV5"]
        })

        expect(node).to.exist;
        node.start(()=> {
            node.stop();
            resolve()
        });
        return p
    })

})
