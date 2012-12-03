var oauth = chrome.extension.getBackgroundPage().oauth;

function PortalsCtrl($scope, $http) {
  $scope.portals = null;
  //$http.get('https://ingress-notify.appspot.com/portals').success(function(data) {
  //  $scope.portals = data;
  //});
  // TODO: Send OAuth token on requests with $http.
  oauth.sendSignedRequest('https://ingress-notify.appspot.com/portals', function(resp, xhr) {
    $scope.portals = JSON.parse(resp.substr(6))
    $scope.$digest();
  }, {'method': 'GET'});

  $scope.unwatch = function(portal) {
    $scope.portals.splice($scope.portals.indexOf(portal), 1);
    $http.delete('https://ingress-notify.appspot.com/portals/' + portal.latE6 + ',' + portal.lngE6 + '-' + portal.name + '/watch');
  };
}
