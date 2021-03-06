(function() {
  'use strict';

  angular
    .module('neatClient')
    .config(routerConfig);

  /** @ngInject */
  function routerConfig(
    $stateProvider,
    $locationProvider,
    $urlRouterProvider
  ) {
    var navView = {
      templateUrl: 'app/layout/nav.html',
      controller: 'NavController',
      controllerAs: 'nv'
    };

    $stateProvider
      .state('map', {
        url: '/',
        views: {
          nav: navView,
          content: {
            templateUrl: 'app/map/map.html',
            controller: 'MapController',
            controllerAs: 'mp'
          }
        }
      })
      .state('users', {
        url: '/users',
        views: {
          nav: navView,
          content: {
            templateUrl: 'app/users/users.html',
            controller: 'UsersController',
            controllerAs: 'us'
          }
        }
      })
      .state('join', {
        url: '/join',
        views: {
          content: {
            templateUrl: 'app/login/join.html',
            controller: 'AuthController',
            controllerAs: 'au'
          }
        }
      })
      .state('login', {
        url: '/login',
        views: {
          content: {
            templateUrl: 'app/login/login.html',
            controller: 'AuthController',
            controllerAs: 'au'
          }
        }
      });

    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(true);
  }

})();
