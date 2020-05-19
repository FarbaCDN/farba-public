document.addEventListener("DOMContentLoaded", change_url);

function change_url() {
  var images = document.getElementsByClassName("farba");

  for(var i = 0; i < images.length; i++) {
    postfix = images[i].dataset.src.replace(/^\.{1,2}\//, "/");    //strip . and ..

    if (postfix.startsWith("/gallery/image.php") ||            //random image
        postfix.startsWith("/download/file.php?avatar=") ||    //avatar
        postfix.startsWith("/images/avatars")) {               //avatar

      images[i].addEventListener("error", cdn_error);
      images[i].src = "https://farba.io:8080/u?" + window.location.origin + postfix;
    } else {
      images[i].src = images[i].dataset.src;
    }
  }
}

function cdn_error() {
  this.removeEventListener("error", cdn_error);

  var cdnurl = "https://farba.io/error?" + this.dataset.src;
  var xhr = new XMLHttpRequest();

  xhr.open("GET", cdnurl, true);
  xhr.send();

  this.src = this.dataset.src;
}
