document.addEventListener("DOMContentLoaded", change_url);

function change_url() {
  var images = document.getElementsByClassName("farba");

  for(var i = 0; i < images.length; i++) {
    if (images[i].dataset.src.startsWith("./gallery/image.php") ||            //random image
        images[i].dataset.src.startsWith("./download/file.php?avatar=") ||    //avatar
        images[i].dataset.src.startsWith("./images/avatars")) {               //avatar

      images[i].addEventListener("error", cdn_error);
      images[i].src = "http://farba.io/u?" + window.location.origin + images[i].dataset.src.slice(1, ); //strip dot
    } else {
      images[i].src = images[i].dataset.src;
    }
  }
}

function cdn_error() {
  this.removeEventListener("error", cdn_error);

  var cdnurl = "http://farba.io/error?" + this.dataset.src;
  var xhr = new XMLHttpRequest();

  xhr.open("GET", cdnurl, true);
  xhr.send();

  this.src = this.dataset.src;
}
