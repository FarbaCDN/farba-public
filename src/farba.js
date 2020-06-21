import sha1 from 'js-sha1';
import Worker from 'worker-loader!./farba-worker.js';

const FARBACDN_URL = "https://farba.io:8080";


function farbacdnErrorURL(src){
    return FARBACDN_URL + "/error?" + src;
}
function farbacdnUserRedirectURL(src){
    return FARBACDN_URL + "/u?" + src;
}
function farbacdnUserDetailsURL(src){
    //return FARBACDN_URL + "/v?" + src;
    const u = new URL(src);
    const uu = new URL(u.pathname+".v__", u.href);
    return uu.href;
}

const worker=new Worker();

function processFarbaClassElements(predicate){
    var elements = document.getElementsByClassName("farba");
    for(const element of elements) {
        const loadFromOrigin = predicate && !predicate(element.dataset.src);

        processFarbaElement(element, 
            {
                passthough: loadFromOrigin,
                verify: true
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
            var xhr=new XMLHttpRequest();
            xhr.onerror = (e) => { 
                console.error("Failed to fetch resource details from FarbaCDN for "+url+": "+e);
                cdnHandleError(element);
            };
            xhr.onreadystatechange = () => {
                if(xhr.readyState != XMLHttpRequest.DONE || xhr.status!=200){
                    return;
                }
                const v=xhr.responseText;
                const jdetails=JSON.parse(v);
                var xhr1=new XMLHttpRequest();
                xhr1.responseType = "arraybuffer";
                xhr1.onreadystatechange = () => {
                    if(xhr1.readyState != XMLHttpRequest.DONE || xhr1.status!=200){
                        return;
                    }
                    const a=new Uint8Array(xhr1.response);
                    const b=new Blob([a]);
                    const dgst=sha1(a);
                    if(jdetails.digest == dgst){
                        console.log("Digest matched for "+url+": "+dgst);
                        element.src=URL.createObjectURL(b);
                    }
                    else{
                        cdnHandleError(element);
                    }
                };
                xhr1.onerror = (e) => { 
                    console.error("Failed to fetch resource details from FarbaCDN for "+url+": "+e);
                    cdnHandleError(element);
                };
                xhr1.open("GET", jdetails.url);
                xhr1.send();
            };
            xhr.open("GET", farbacdnUserDetailsURL(url.href), true);
            xhr.send();
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
    console.log("in MAIN");
    worker.postMessage("foobar");

    processFarbaClassElements();
}

document.addEventListener("DOMContentLoaded", main);
