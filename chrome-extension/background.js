var OAUTH_BASE_URL = 'https://ingress-notify.appspot.com/_ah/OAuth';

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
