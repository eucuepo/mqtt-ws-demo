'use strict';

angular.module('mqttDemo', [
  'ngRoute',
  'mqttDemo.controllers',
  'mqttDemo.services',
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/demo', {
    templateUrl: 'templates/mqtt-test.html',
    controller: 'ConnectionCtrl'
  })
  .otherwise({redirectTo: '/demo'});
}]);
