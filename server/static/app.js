angular.module('ingress', ['ui'], function($filterProvider) {
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


function PortalsCtrl($scope, $http, $filter) {
  $scope.watchedPortals = null;
  $scope.suggestedPortals = [];
  $scope.selectedIndex = -1;
  var unwatchedPortals = null;
  var markers = [];

  $http.get('/portals?watched=true').success(function(data, status, headers, config) {
    $scope.watchedPortals = {};
    angular.forEach(data, function(portal) {
      portal = new Portal(
          portal.title, portal.latE6, portal.lngE6, portal.address,
          true, $http);
      markers[portal] = new google.maps.Marker({
          animation: google.maps.Animation.DROP,
          position: new google.maps.LatLng(
              portal.latE6 / 1E6,
              portal.lngE6 / 1E6),
          map: map,
          title: portal.title
      });
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
    $scope.suggestedPortals = [];
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
    $scope.clearSuggestedPortals();
  };

  $scope.suggestPortals = function() {
    $scope.clearSuggestedPortals();
    var count = 0;
    angular.forEach(unwatchedPortals, function(portal) {
      if (count >= 10) return;
      var suggest = false;
      if ($scope.portalTitle) {
        if (portal.title && portal.title.toLowerCase().indexOf(
                $scope.portalTitle.toLowerCase()) != -1) {
          suggest = true;
        } else {
          return;
        }
      }
      if ($scope.portalAddress) {
        if (portal.address && portal.address.toLowerCase().indexOf(
                $scope.portalAddress.toLowerCase()) != -1) {
          suggest = true;
        } else {
          return;
        }
      }
      if (suggest) {
        $scope.suggestedPortals.push(portal);
        count++;
      }
    });
    $scope.suggestedPortals = $filter('orderBy')($scope.suggestedPortals, 'title');
  };

  $scope.portalOrderBy = function(portal) {
    if (!angular.isDefined(portal)) return;
    return portal.title;
  };

  $scope.clearSuggestedPortals = function() {
    $scope.suggestedPortals = [];
    $scope.selectedIndex = -1;
  };

  $scope.down = function(event) {
    if ($scope.selectedIndex < $scope.suggestedPortals.length - 1) {
      $scope.selectedIndex++;
    }
  };

  $scope.up = function(event) {
    if ($scope.selectedIndex > 0) {
      $scope.selectedIndex--;
    }
  };

  $scope.enter = function(event) {
    if ($scope.selectedIndex == -1) return;
    $scope.populateFromSuggestion($scope.suggestedPortals[$scope.selectedIndex]);
    event.preventDefault();
  };

  $scope.handleMouseover = function(event, portal) {
    if (event.target.nodeName != 'LI') return;
    markers[portal].setAnimation(google.maps.Animation.BOUNCE);
  };

  $scope.handleMouseout = function(event, portal) {
    // TODO: Do this cleaner.
    if (event.target.nodeName != 'LI') return;
    var nodes = event.target.getElementsByTagName('*')
    for (var i = 0, node; node = nodes[i]; i++) {
      if (event.relatedTarget == node) return;
    }
    markers[portal].setAnimation(null);
  };
}
