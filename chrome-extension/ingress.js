function PortalsCtrl($scope, $http) {
  $scope.portals = null;
  $http.get('https://ingress-notify.appspot.com/portals?watched=true').success(
      function(data) { $scope.portals = data; });

  $scope.unwatch = function(portal) {
    $scope.portals.splice($scope.portals.indexOf(portal), 1);
    portal.watched = false;
    var url = 'https://ingress-notify.appspot.com/portals/' + portal.latE6 + ',' + portal.lngE6;
    $http.put(url, portal).error(function() {
        portal.watched = true;
        $scope.portals.push(portal);
    });
  };
}

