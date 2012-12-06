var OAUTH_BASE_URL = 'https://ingress-notify.appspot.com/_ah/OAuth';

/**
 * Sets up a listener to handle watch requests sent by the content_script running on the Ingress
 * Intel page.
 */
chrome.extension.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg) {
    var portal = msg.portal;
    var message;
    angular.injector(['ng', 'ingress']).invoke(function($http) {
      $http.put('https://ingress-notify.appspot.com/portals/' + portal.latE6 + ',' + portal.lngE6,
                portal).
        success(function() {
          message = (portal.watched ? 'Watching portal ' : 'Unwatched portal ') +
                    portal.title;
          port.postMessage({'type': 'WATCH_RESPONSE', 'message': message});
        }).
        error(function() {
          message = 'Action failed!';
          port.postMessage({'type': 'WATCH_RESPONSE', 'message': message});
        });
      });
  });
});


var oauth = ChromeExOAuth.initBackgroundPage({
  'request_url': OAUTH_BASE_URL + 'GetRequestToken',
  'authorize_url': OAUTH_BASE_URL + 'AuthorizeToken',
  'access_url': OAUTH_BASE_URL + 'GetAccessToken',
  'consumer_key': 'anonymous',
  'consumer_secret': 'anonymous',
  'scope': 'unused',
  'app_name': 'Ingress Notifier'
});


oauth.authorize(function() {});
