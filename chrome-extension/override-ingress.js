function NOTIFY_watch(title, latE6, lngE6, watched) {
  window.postMessage({'title': title, 'latE6': latE6, 'lngE6': lngE6, 'watched': watched}, '*');
}


var ORIG_xd = xd;
xd = function(a, b) {
  var res = ORIG_xd(a, b);
  var parser = new DOMParser();
  var node = document.createElement('div');
  node.innerHTML = res;
  
  // TODO: Do this cleaner.
  var elements = node.getElementsByTagName('div');
  for (var i = 0, div; div = elements[i]; i++) {
    if (div.id == 'portal_metadata') {
      var watchDiv = document.createElement('div');
      var watchLink = document.createElement('a');
      watchLink.href = "javascript:NOTIFY_watch('" + [a.j.title, a.j.Gb * 1E6, a.j.Hb * 1E6].join("','") + "', true);";
      watchLink.textContent = 'Subscribe';
      watchLink.style.color = '#11ECF7';
      watchDiv.appendChild(watchLink);
      
      var space = document.createElement('span')
      space.textContent = ' | ';
      watchDiv.appendChild(space);
      
      var unwatchLink = document.createElement('a');
      unwatchLink.href = "javascript:NOTIFY_watch('" + [a.j.title, a.j.Gb * 1E6, a.j.Hb * 1E6].join("','") + "', false);";
      unwatchLink.textContent = 'Unsubscribe';
      unwatchLink.style.color = '#11ECF7';
      watchDiv.appendChild(unwatchLink);
      div.appendChild(watchDiv);    
      break;
    }
  }
  return node.innerHTML;
};
