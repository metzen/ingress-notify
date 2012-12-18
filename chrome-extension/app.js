angular.module('ingress', [], function($provide) {
  $provide.decorator('$httpBackend', function($delegate) {
    return function(method, url, post, callback, headers, timeout, withCredentials, responseType) {
      var urlParts = url.split('?');
      chrome.runtime.getBackgroundPage(function(backgroundPage) {
        headers['Authorization'] = backgroundPage.oauth.getAuthorizationHeader(
            urlParts[0], method, urlParts[1]);
        $delegate(method, url, post, callback, headers, timeout, withCredentials, responseType);
      });
    };
  });
});
