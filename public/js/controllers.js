'use strict';

angular.module('mqttDemo.controllers',[])
.controller('ConnectionCtrl', ['$scope',function($scope) {

  $scope.message = 'Hello!';

}])
.controller('TestCtrl', ['$scope','mqttClient',function($scope,mqttClient) {

  var onConnectionLost = function(responseObject) {
	console.log(responseObject);
  }

  var onMessageReceived = function(message) {
	console.log(message);
  }

  var onConnect = function() {
    console.log('connected!');  
  }

  mqttClient.init('development-jp-mqtt-8bfa32197598.internal.kii.com', 12470, 'hoc0CCowjuzV3wMSaLL6Lz8', '596cd936-x2gKbLiEnDx5EUCP76UzKnh','gjoFusjbpeCEFEVEowBnNekehieHiBlnqzVTUqJITBGjlhQNgaECKUToOvWtrZZT',onMessageReceived,onConnectionLost,onConnect);
  $scope.message = 'Hello!';


}]);
