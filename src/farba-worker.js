import sha1 from 'js-sha1';


// self.addEventListener('message', (e) => {
//     console.log(sha1);
//     console.log("Message received: ", e.data);
//     console.log(ssss(e.data.value));
//     //postMessage(self.sha1(e.data.value));
// });


onmessage= function(e){
    console.log("Message received: ", e.data);
    console.log(sha1(''));

}