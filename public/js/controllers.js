'use strict';

angular.module('mqttDemo.controllers',[])
.controller('ConnectionCtrl', ['$scope',function($scope) {

  $scope.message = 'Hello!';

}])
.controller('TestCtrl', ['$scope','mqttClient',function($scope,mqttClient) {

  $scope.connected = false;

  $scope.receivedMessages = "";

  $scope.mqttClientConfig = {
  	host: "development-jp-mqtt-540df7a171962834.internal.kii.com",
  	port: 12470
  }

  $scope.connect = function(mqttClientConfig){
  	mqttClient.init(mqttClientConfig,onMessageReceived,onConnectionLost)
  	  .then(function(){
  	  	$scope.connected = true;
  	  },
  	  function(err){
  	  	alert('Error connecting: ' + JSON.stringify(err));
  	  });
  }

  $scope.disconnect = function(){
  	mqttClient.disconnect();
  	$scope.connected = false;
  }

  $scope.subscribe = function(topic){
  	mqttClient.subscribe(topic);
  }

  var onConnectionLost = function(responseObject) {
	$scope.connected = false;
  }

  var onMessageReceived = function(message) {
  	$scope.$apply(function () {
        $scope.receivedMessages +=  message.payloadString + '\n';
    });
  }

}]);
