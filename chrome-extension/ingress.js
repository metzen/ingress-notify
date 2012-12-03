function PortalsCtrl($scope, $http) {
  $scope.portals = [];
  $http.get('https://ingress-notify.appspot.com/portals').success(function(data) {
    $scope.portals = data;
  });
  
  $scope.unwatch = function(portal) {
    $scope.portals.splice($scope.portals.indexOf(portal), 1);
    $http.delete('https://ingress-notify.appspot.com/portals/' + portal.latE6 + ',' + portal.lngE6 + '-' + portal.name + '/watch');
  };
}