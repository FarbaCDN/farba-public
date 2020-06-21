import sha1 from 'js-sha1';

self.addEventListener('message', (x) => {
    const e=x.data;
    if(!e.requestSequenceNumber){
        return;
    }
    console.debug("Message received in WORKER: "+e.requestSequenceNumber);
    var r = e;
    r.computed={
        size: e.data.length, 
        digest: sha1(e.data)
    };
    postMessage(r);
});
