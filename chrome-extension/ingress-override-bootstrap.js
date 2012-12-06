var script = document.createElement('script');
script.setAttribute("type", "text/javascript");
script.setAttribute("async", true);
script.setAttribute("src", chrome.extension.getURL("override-ingress.js"));
var head = document.head || document.getElementsByTagName( "head" )[0] || document.documentElement;
head.insertBefore(script, head.firstChild);


/**
 * Sets up a "message" event handler to communicate with the extension process to send XHRs
 * requested by the embedded script.
 */
function setupMessageHandler($http) {
  var port = chrome.extension.connect();
  window.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != window || event.data.type != 'WATCH_REQUEST')
      return;
    port.postMessage(event.data);
  }, false);
  
  port.onMessage.addListener(function(msg) {
    // Pass the response from the extension background script on to the override script.
    window.postMessage(msg, '*');
  });
}

angular.injector(['ng', 'ingress']).invoke(setupMessageHandler);
