import sha1 from 'js-sha1';
import Worker from 'worker-loader?inline=true!./farba-worker.js';

const FARBACDN_URL = "https://farba.io:8080";

import { version } from '../package.json';

function farbacdnErrorURL(src){
    return FARBACDN_URL + "/error?" + src;
}
function farbacdnUserRedirectURL(src){
    return FARBACDN_URL + "/u?" + src;
}
function farbacdnUserDetailsURL(src){
    return FARBACDN_URL + "/v?" + src;
    //const u = new URL(src);
    //const uu = new URL(u.pathname+".v__", u.href);
    //return uu.href;
}

const worker=new Worker();

function processAllElements(predicate){
    var elements = document.getElementsByClassName("farba");
    for(const element of elements) {
        const loadFromOrigin = predicate && !predicate(element.dataset.src);

        processElement(element, 
            {
                passthough: loadFromOrigin,
                verify: true,
                asynchronously: true
            });
    };
}

function processElement(element, how){
    var passthough = false;
    if(how){
        passthough = how.passthough;
    }
    else{
        how = { verify: true, asynchronously: true };
    }
    if(passthough){
        element.src = element.dataset.src;
    }
    else{
        element.addEventListener("error", cdnError);
        const url = new URL(element.dataset.src, window.location.href);
        if(how.verify) {
            var xhrDetails=new XMLHttpRequest();
            xhrDetails.onerror = (e) => { 
                console.warn("Failed to fetch resource details from FarbaCDN for "+url+": "+e);
                cdnHandleError(element);
            };
            xhrDetails.onreadystatechange = () => {
                if(xhrDetails.readyState != XMLHttpRequest.DONE){
                    return;
                } 
                if(xhrDetails.status!=200){
                    console.warn("Failed to fetch resource details from FarbaCDN for "+url+": status code was "+xhrDetails.status);
                    cdnHandleError(element);
                    return;
                }
                const jdetails=JSON.parse(xhrDetails.responseText);
                if(!jdetails.digest){
                    // digest wasn't received, therefore it cannot be verified.
                    // load the image from specified location (which is probably the origin).
                    element.src = jdetails.location;
                    return;
                }
                var xhrBody=new XMLHttpRequest();
                xhrBody.responseType = "arraybuffer";
                xhrBody.onreadystatechange = () => {
                    if(xhrBody.readyState != XMLHttpRequest.DONE){
                        return;
                    } 
                    if(xhrBody.status!=200){
                        console.warn("Failed to fetch resource details from FarbaCDN for "+url+": status code was "+xhrDetails.status);
                        cdnHandleError(element);
                        return;
                    }
                    const a=new Uint8Array(xhrBody.response);
                    if(how.asynchronously){
                        element.dataset.farbaWorkerRequestSequenceNumber=++farbaWorkerRequestSequenceNumber;
                        worker.postMessage({
                            data: a, 
                            requestSequenceNumber: farbaWorkerRequestSequenceNumber, 
                            received: jdetails
                        });
                    }
                    else{
                        const dgst=sha1(a);
                        if(jdetails.digest == dgst){
                            console.debug("Digest matched for " + url + ": " + dgst + " == " + jdetails.digest);
                            const b=new Blob([a]);
                            element.src=URL.createObjectURL(b);
                        }
                        else{
                            cdnHandleError(element);
                        }
                    }
                };
                xhrBody.onerror = (e) => { 
                    console.warn("Failed to fetch resource details from FarbaCDN for "+url+": "+e);
                    cdnHandleError(element);
                };
                xhrBody.open("GET", jdetails.location);
                xhrBody.send();
            };
            xhrDetails.open("GET", farbacdnUserDetailsURL(url.href), true);
            xhrDetails.send();
        }
        else { // redirect
            element.src = farbacdnUserRedirectURL(url.href);
        }
    }
}

function cdnHandleError(element, dontReport){
    if(!dontReport){
        const url = new URL(element.dataset.src, window.location.href);
        const cdnurl = farbacdnErrorURL(url.href);
        var xhr = new XMLHttpRequest();

        xhr.open("GET", cdnurl, true);
        xhr.send();
    }
  
    element.src = element.dataset.src;
}

function cdnError() {
    this.removeEventListener("error", cdnError);
    cdnHandleError(this);
}
  

function main() {
    console.debug("This is FarbaCDN client-side script v."+version);
    processAllElements();
}

export default { processElement, processAllElements };

var farbaWorkerRequestSequenceNumber=0;

worker.addEventListener("message", (x) => {
    const e=x.data;
    console.debug("Received message in MAIN THREAD: ", e.requestSequenceNumber);

    var elements = document.getElementsByClassName("farba");
    for(const element of elements) {
        if(element.dataset.farbaWorkerRequestSequenceNumber==e.requestSequenceNumber){
            if(e.computed.size == e.received.size && e.computed.digest == e.received.digest){
                console.debug("Digest matched for "+e.received.location+": "+e.computed.digest+ " == "+e.received.digest);
                const b=new Blob([e.data]);
                element.src=URL.createObjectURL(b);
            }
            else{
                let doReport = e.received && e.received.digest;
                if(doReport){
                    e.data="(array of size "+e.data.length+")";
                    console.warn("Digest or size mismatched: ", e);
                }
                cdnHandleError(element, !doReport);
            }
            break;
        }
    }
});

document.addEventListener("DOMContentLoaded", main);
