angular.module('ingress', [], function($provide) {
  $provide.decorator('$httpBackend', function($delegate) {
    return function(method, url, post, callback, headers, timeout, withCredentials, responseType) {
      chrome.runtime.getBackgroundPage(function(backgroundPage) {
        headers['Authorization'] = backgroundPage.oauth.getAuthorizationHeader(url, method);
        $delegate(method, url, post, callback, headers, timeout, withCredentials, responseType);
      });
    };
  });
});