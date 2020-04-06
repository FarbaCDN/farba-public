document.addEventListener("DOMContentLoaded", change_url);

function change_url() {
  var images = document.getElementsByClassName("farba");

  for(var i = 0; i < images.length; i++) {
    images[i].addEventListener("error", cdn_error);
    images[i].src = "http://farba.io/u?" + images[i].dataset.src;
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
