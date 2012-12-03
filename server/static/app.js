function Portal(name, latE6, lngE6, watched, $http) {
  this.name = name;
  this.latE6 = latE6;
  this.lngE6 = lngE6;
  this.watched = watched;

  this.getWatchUrl = function() {
    return '/portals/' + this.latE6 + ',' + this.lngE6 + '-' + this.name +
           '/watch';
  };
  
  this.handleWatchChange = function() {
    this.watched ? this.watch() : this.unwatch();
  };
  
  this.watch = function() {
    $http.put(this.getWatchUrl());
  };
  
  this.unwatch = function() {
    $http.delete(this.getWatchUrl());
  };
}


function PortalsCtrl($scope, $http) {
  $scope.loaded = false;
  $scope.portals = [];
  $http.get('/portals').success(function(data, status, headers, config) {
      var l = data.length;
      angular.forEach(data, function(portal) {
        $scope.portals.push(new Portal(
          portal.name,
          portal.latE6,
          portal.lngE6,
          portal.watched,
          $http
        ));
      });
      $scope.loaded = true;    
  });
 
  $scope.addPortal = function() {
    var portal = new Portal(
        $scope.portalName,
        $scope.portalLatE6,
        $scope.portalLngE6,
        true,
        $http);
    $scope.portals.push(portal);
    portal.watch();
    $scope.portalName = '';
    $scope.portalLatE6 = '';
    $scope.portalLngE6 = '';
  };
  
  $scope.setAllWatched = function(watched) {
    angular.forEach($scope.portals, function(portal) {
      portal.watched = watched;
    });
  };
}

