function PortalsCtrl($scope, $http) {
  $scope.portals = null;

  chrome.runtime.getBackgroundPage(function(backgroundPage) {
    $http.defaults.headers.common['Authorization'] = (
        backgroundPage.oauth.getAuthorizationHeader());

    $http.get('https://ingress-notify.appspot.com/portals').success(
        function(data) { $scope.portals = data; });
  });

  $scope.unwatch = function(portal) {
    $scope.portals.splice($scope.portals.indexOf(portal), 1);
    portal.watched = false;
    $http.put(
        'https://ingress-notify.appspot.com/portals/' + portal.latE6 + ',' + portal.lngE6,
        portal);
  };
}
