function NOTIFY_watch(title, latE6, lngE6, watched) {
  document.getElementById('map_spinner').style.display = 'inherit';
  window.postMessage({
      'type': 'WATCH_REQUEST', 'portal': {
          'title': title, 'latE6': latE6, 'lngE6': lngE6, 'watched': watched},
      }, '*');
}


var ORIG_xd = xd;
xd = function(a, b) {
  var node = document.createElement('div');
  node.innerHTML = ORIG_xd(a, b);

  // TODO: Do this cleaner.
  var elements = node.getElementsByTagName('div');
  for (var i = 0, div; div = elements[i]; i++) {
    if (div.id == 'portal_metadata') {
      var watchDiv = document.createElement('div');
      var watchLink = document.createElement('a');
      watchLink.href = 'javascript:NOTIFY_watch(' +
          [JSON.stringify(a.j.title),
           Math.round(a.j.Hb * 1E6),
           Math.round(a.j.Ib * 1E6),
           true].join(', ') + ');';
      watchLink.textContent = 'Watch';
      watchLink.style.color = '#11ECF7';
      watchDiv.appendChild(watchLink);

      var space = document.createElement('span');
      space.textContent = ' | ';
      watchDiv.appendChild(space);

      var unwatchLink = document.createElement('a');
      unwatchLink.href = 'javascript:NOTIFY_watch(' +
          [JSON.stringify(a.j.title),
           Math.round(a.j.Hb * 1E6),
           Math.round(a.j.Ib * 1E6),
           false].join(', ') + ');';
      unwatchLink.textContent = 'Unwatch';
      unwatchLink.style.color = '#11ECF7';
      watchDiv.appendChild(unwatchLink);
      div.appendChild(watchDiv);
      break;
    }
  }
  return node.innerHTML;
};

var butterHideTimeout;
window.addEventListener("message", function(event) {
  if (event.source != window || event.data.type != 'WATCH_RESPONSE')
    return;
  document.getElementById('map_spinner').style.display = 'none';

  clearTimeout(butterHideTimeout);
  var butterbar = document.getElementById('butterbar');
  butterbar.textContent = event.data.message;
  butterbar.style.display = 'inherit';
  butterHideTimeout = setTimeout(function() {
    butterbar.style.display = 'none';
  }, 10000);
});
