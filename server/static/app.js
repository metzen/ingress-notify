function Portal(title, latE6, lngE6, address, watched, $http) {
  this.title = title;
  this.latE6 = latE6;
  this.lngE6 = lngE6;
  this.address = address;
  this.watched = watched;

  this.getUrl = function() {
    return '/portals/' + this.latE6 + ',' + this.lngE6;
  };

  this.getIntelUrl = function() {
    return ('http://www.ingress.com/intel?latE6=' + this.latE6 + '&lngE6=' +
            this.lngE6 + '&z=16');
  };

  this.save = function() {
    $http.put(this.getUrl(), this);
  };

  this.handleWatchChange = function() {
    this.watched ? this.watch() : this.unwatch();
  };

  this.watch = function() {
    this.watched = true;
    this.save();
  };

  this.unwatch = function() {
    this.watched = false;
    this.save();
  };
}


function PortalsCtrl($scope, $http) {
  $scope.loaded = false;
  $scope.portals = [];
  $http.get('/portals').success(function(data, status, headers, config) {
      var l = data.length;
      angular.forEach(data, function(portal) {
        $scope.portals.push(new Portal(
          portal.title,
          portal.latE6,
          portal.lngE6,
          portal.address,
          portal.watched,
          $http
        ));
      });
      $scope.loaded = true;
  });

  $scope.addPortal = function() {
    var portal = new Portal(
        $scope.portalTitle,
        $scope.portalLatE6,
        $scope.portalLngE6,
        $scope.portalAddress,
        true,
        $http);
    $scope.portals.push(portal);
    portal.save();
    $scope.portalTitle = '';
    $scope.portalLatE6 = '';
    $scope.portalLngE6 = '';
  };

  $scope.setAllWatched = function(watched) {
    angular.forEach($scope.portals, function(portal) {
      portal.watched = watched;
    });
  };
}

