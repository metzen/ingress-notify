angular.module('ingress', [], function($filterProvider) {
  $filterProvider.register('values', function() {
    return function(obj) {
      if (!obj) return obj;
      var values = [];
      for (key in obj) {
        values.push(obj[key]);
      }
      return values;
    };
  });
});


function Portal(title, latE6, lngE6, address, watched, $http) {
  var self = this;
  this.title = title;
  this.latE6 = latE6;
  this.lngE6 = lngE6;
  this.address = address;
  this.watched = watched;
  this.saving = false;

  this.getUrl = function() {
    return '/portals/' + this.latE6 + ',' + this.lngE6;
  };

  this.getIntelUrl = function() {
    return ('http://www.ingress.com/intel?latE6=' + this.latE6 + '&lngE6=' +
            this.lngE6 + '&z=16');
  };

  this.save = function(callback) {
    self.saving = true;
    $http.put(this.getUrl(), this).success(function() {
      self.saving = false;
      if (angular.isDefined(callback)) callback();
    }).error(function() {
      self.saving = false;
    });
  };

  this.handleWatchChange = function() {
    this.watched ? this.watch() : this.unwatch();
  };

  this.watch = function(callback) {
    this.watched = true;
    this.save(callback);
  };

  this.unwatch = function(callback) {
    this.watched = false;
    this.save(callback);
  };

  this.toString = function() {
    return this.latE6.toString() + ',' + this.lngE6.toString();
  };
}


function PortalsCtrl($scope, $http) {
  $scope.watchedPortals = null;
  $scope.suggestedPortals = [];
  var unwatchedPortals = null;

  $http.get('/portals?watched=true').success(function(data, status, headers, config) {
    $scope.watchedPortals = {};
    angular.forEach(data, function(portal) {
      portal = new Portal(
          portal.title, portal.latE6, portal.lngE6, portal.address,
          true, $http);
      $scope.watchedPortals[portal] = portal;
    });

    $http.get('/portals').success(function(data, status, headers, config) {
      unwatchedPortals = {};
      angular.forEach(data, function(portal) {
        portal = new Portal(
            portal.title, portal.latE6, portal.lngE6, portal.address, false,
            $http);
        if (!$scope.watchedPortals.hasOwnProperty(portal)) {
          unwatchedPortals[portal] = portal;
        }
      });
    });
  });

  $scope.watchPortal = function() {
    var portal = new Portal(
        $scope.portalTitle, $scope.portalLatE6, $scope.portalLngE6,
        $scope.portalAddress, true, $http);
    portal.save();
    $scope.watchedPortals[portal] = portal;
    delete unwatchedPortals[portal];
    $scope.portalTitle = '';
    $scope.portalLatE6 = '';
    $scope.portalLngE6 = '';
    $scope.portalAddress = '';
  };

  $scope.unwatchPortal = function(portal) {
    portal.unwatch(function() {
      delete $scope.watchedPortals[portal];
      unwatchedPortals[portal] = portal;
    });
  };

  $scope.populateFromSuggestion = function(portal) {
    $scope.portalTitle = portal.title;
    $scope.portalLatE6 = portal.latE6;
    $scope.portalLngE6 = portal.lngE6;
    $scope.portalAddress = portal.address;
    $scope.suggestedPortals = [];
  };

  $scope.suggestPortals = function() {
    $scope.suggestedPortals = [];
    angular.forEach(unwatchedPortals, function(portal) {
      if ($scope.portalTitle && portal.title.toLowerCase().indexOf(
              $scope.portalTitle.toLowerCase()) != -1) {
        $scope.suggestedPortals.push(portal);
      }
    });
  };

  $scope.portalOrderBy = function(portal) {
    if (!angular.isDefined(portal)) return;
    return portal.title;
  };
}
