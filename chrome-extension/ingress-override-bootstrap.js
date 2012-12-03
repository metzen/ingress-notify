var script = document.createElement('script');
script.setAttribute("type", "text/javascript");
script.setAttribute("async", true);
script.setAttribute("src", chrome.extension.getURL("override-ingress.js"));
var head = document.head || document.getElementsByTagName( "head" )[0] || document.documentElement;
head.insertBefore(script, head.firstChild)

//var port = chrome.extension.connect();

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;
  //port.postMessage(event.data);
  var portal = event.data;
  $.ajax({
    url: 'https://ingress-notify.appspot.com/portals/' + portal.latE6 + ',' + portal.lngE6 + '-' + portal.title + '/watch',
    type: portal.watched ? 'PUT' : 'DELETE'
  }).done(function() {
    var msg = portal.watched ? 'Subscribed to ' : 'Unsubscribed from ';
    alert(msg + portal.title);
  });
}, false);