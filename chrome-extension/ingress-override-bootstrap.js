var script = document.createElement('script');
script.setAttribute("type", "text/javascript");
script.setAttribute("async", true);
script.setAttribute("src", chrome.extension.getURL("override-ingress.js"));
var head = document.head || document.getElementsByTagName( "head" )[0] || document.documentElement;
head.insertBefore(script, head.firstChild)


window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window || event.data.type != 'WATCH_REQUEST')
    return;
  var portal = event.data.portal;
  // TODO: Send with OAuth token.
  $.ajax({
    url: 'https://ingress-notify.appspot.com/portals/' + portal.latE6 + ',' + portal.lngE6,
    type: 'PUT',
    data: JSON.stringify(portal)
  }).done(function() {
    var msg = portal.watched ? 'Watching portal ' : 'Unwatched portal '
    window.postMessage({
        'type': 'WATCH_RESPONSE',
        'message': msg + JSON.stringify(portal.title)
    }, '*');
  });
}, false);
