(function() {
  'use strict';

  angular
    .module('neatClient')
    .controller('MapController', MapController);

  /** @ngInject */
  function MapController(
    byId,
    MapData,
    MapDialog,
    mapIcons,
    MapInit,
    $log,
    $mdDialog,
    $mdSidenav,
    $rootScope,
    $scope,
    $window
  ) {
    var vm = this;
    var markers = [];
    var Gmap;
    var neatMap;
    var mapEl;
    var clearing = false; // for filterSeverity watch
    var navigator = $window.navigator;

    vm.toggleSideMenu = toggleSideMenu;
    vm.filterUpdate = filterUpdate;
    vm.filterClearAll = filterClearAll;
    vm.getLocalMap = getLocalMap;

    activate();

    function activate() {
      mapEl = byId('map');
      MapInit.initialized
      .then(setupMap)
      .then(setupControls);
    }

    /////////////////////////////////
    // Google Map Setup
    // /////////////////////////////
    function getLocalMap() {
      vm.locating = true;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
          vm.locating = false;
          $rootScope.mapView = {
            center: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            },
            zoom: 15
          }
          setupMap();
        });
      } else {
        $log.error('Browser does not support goelocation');
      }
    }

    function setupMap() {
      Gmap = $window.google.maps;
      neatMap = new Gmap.Map(mapEl, $rootScope.mapView);

      neatMap.addListener('idle', function() {
        $rootScope.mapView = {
          center: neatMap.getCenter(),
          zoom: neatMap.getZoom()
        }
      });

      clickMapToAddListener();

      return getTypes()
        .then(getRecords)
        .then(assignRecordsToMarkers);
    }

    function clickMapToAddListener() {
      neatMap.addListener('click', onClickAddMarker);

      function onClickAddMarker(ev) {
        MapInit.geocoder(Gmap, ev.latLng, addPlaceholder);
      }
    } // clickMapToAddListener

    /*
     * Map helpers
     */
    function addPlaceholder(result) {
      var resetTime = 180000; // 3 min
      var geo = result.geometry.location;
      var lat = geo.lat();
      var lng = geo.lng();
      var record = {
        Location: {
          address: result.formatted_address,
          latitude: lat,
          longitude: lng
        },
        severity: 3
      };
      var marker = magicMarker(lat, lng, record, true, true);
      setTimeout(function clearMarkerIfTooLong() {
        MapDialog.confirmDelete(0, marker, markers);
      }, resetTime);
    }

    function assignRecordsToMarkers(records) {
      records.forEach(function(record) {
        var local  = record.Location;
        magicMarker(local.latitude, local.longitude, record);
      });
      return records;
    }

    function magicMarker(lat, lng, record, animate, tbd) {
      var type = tbd ? 'placeholder' : vm.types[record.TypeId];
      var options = {
        position: { lat: lat, lng: lng },
        icon: mapIcons(type, record.severity, Gmap),
        map: neatMap,
        myRecord: record,
        infowindow: null
      };

      if (animate) {
        options.animation = Gmap.Animation.DROP;
      }

      var marker = new Gmap.Marker(options);
      attachMarkerEvent(marker);
      markers.push(marker);

      return marker;
    }

    function clearMarkers() {
      markers.forEach(function loopMarkers(marker) {
        marker.setMap(null);
      });

      markers = [];
    }

    function attachMarkerEvent(marker) {
      marker.addListener('click', function() {
        var self = this;

        if (self.infowindow) {
          var infowindow = self.infowindow;
          self.infowindow = null;
          return infowindow.close();
        }

        // on click create a new info window with record content
        self.infowindow = new Gmap.InfoWindow({
          content: MapDialog.createInfoContent(self.myRecord)
        });

        // add click listener to info window buttons
        self.infowindow.addListener('domready', function() {
          var editBtn = byId('edit-record-btn');
          var delBtn = byId('del-record-btn');

          editBtn.addEventListener('click', function(ev) {
            vm.showDialog(ev, self, self.infowindow, markers);
          });

          delBtn.addEventListener('click', function(ev) {
            MapDialog.confirmDelete(ev, self, markers);
          });
        });

        return self.infowindow.open(neatMap, self);
      });
    }

    /////////////////////////////////
    // GET
    // /////////////////////////////
    function getTypes() {
      return MapData.getTypes()
      .then(function(data) {
        vm.types = data.reduce(typeArrayToMap, {});
        vm.filterTypes = data.map(typeArrayToFilterModel);
        return vm.types;
      });

      function typeArrayToMap(prev, curr) {
        prev[curr.id] = curr.name;
        return prev;
      }

      function typeArrayToFilterModel(type) {
        type.checked = false;
        return type;
      }
    }

    function getRecords() {
      return MapData.getRecords()
        .then(function(data) {
          return data;
        });
    }

    /////////////////////////////////
    // Dialog setup
    // /////////////////////////////
    function setupControls() {
      vm.showDialog = MapDialog.initMarkerDialog(
        vm.types,
        Gmap,
        neatMap,
        magicMarker
      );

      $scope.$watch('mp.filterSeverity', function(now) {
        if (now && !clearing) {
          vm.applySeverity = true;
        }
        clearing = false;
      });
    }

    /////////////////////////////////
    // Filter Menu
    // /////////////////////////////
    function toggleSideMenu() {
      return $mdSidenav('left').toggle();
    }

    function filterUpdate() {
      var chosenTypes = vm.filterTypes.reduce(toTypeIdArray, []);
      // reset markers before update
      clearMarkers();
      // if nothing is chosen, do nothing
      if (chosenTypes.length === 0 && !vm.applySeverity) {
        return getRecords()
          .then(assignRecordsToMarkers);
      }
      // selecting all types is the same as selecting none: return all
      if (chosenTypes.length === vm.filterTypes.length) {
        chosenTypes = [];
      }
      // severity 0 to prevent applying severity filter for MapData service
      var fSeverity = vm.applySeverity ? vm.filterSeverity : 0;

      return MapData.getFilteredRecords(chosenTypes, fSeverity)
        .then(assignRecordsToMarkers);

      function toTypeIdArray(types, curr) {
        if (curr.checked) {
          types.push(curr.id);
        }
        return types;
      }
    }

    function filterClearAll() {
      clearing = true;
      vm.filterTypes.forEach(clearAllTypes);
      vm.filterSeverity = 1;
      vm.applySeverity = false;

      function clearAllTypes(type) {
        type.checked = false;
      }
      return;
    }

  }
})();
