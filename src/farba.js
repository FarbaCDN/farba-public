import sha1 from 'js-sha1';
import Worker from 'worker-loader?inline=true!./farba-worker.js';

const FARBACDN_URL = "https://farba.io:8080";


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

function processFarbaClassElements(predicate){
    var elements = document.getElementsByClassName("farba");
    for(const element of elements) {
        const loadFromOrigin = predicate && !predicate(element.dataset.src);

        processFarbaElement(element, 
            {
                passthough: loadFromOrigin,
                verify: true,
                asynchronously: true
            });
    };
}

function processFarbaElement(element, how){
    var passthough = false;
    if(how){
        passthough = how.passthough;
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
                if(xhrDetails.readyState != XMLHttpRequest.DONE || xhrDetails.status!=200){
                    return;
                }
                const jdetails=JSON.parse(xhrDetails.responseText);
                var xhrBody=new XMLHttpRequest();
                xhrBody.responseType = "arraybuffer";
                xhrBody.onreadystatechange = () => {
                    if(xhrBody.readyState != XMLHttpRequest.DONE || xhrBody.status!=200){
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

function cdnHandleError(element){
    const cdnurl = farbacdnErrorURL(element.dataset.src);
    var xhr = new XMLHttpRequest();

    xhr.open("GET", cdnurl, true);
    xhr.send();
  
    element.src = element.dataset.src;

}

function cdnError() {
    this.removeEventListener("error", cdnError);
    cdnHandleError(this);
}
  

export default function main() {
    console.debug("This is FarbaCDN client-side script");
    processFarbaClassElements();
}

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
                e.data="(array of size "+e.data.length+")";
                console.warn("Digest or size mismatched: ", e);
                cdnHandleError(element);
            }
            break;
        }
    }
});

document.addEventListener("DOMContentLoaded", main);
