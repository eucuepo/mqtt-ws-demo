'use strict';

angular.module('mqttDemo.services',[])
.service('mqttClient', [function mqttClientFactory() {

  var client;

  var subscribe = function(topic) {
    client.subscribe(topic);
  }

  var init = function(host, port, clientID, username, password, messageHandler,disconnectHandler,onConnect) { 
      client = new Paho.MQTT.Client(host, port, clientID);
      // connect the client
	  client.connect({onSuccess:onConnect, userName: username, password:password});
	  client.onConnectionLost = messageHandler;
      client.onMessageArrived = disconnectHandler;
   }

  return {
    init: init,
    subscribe: subscribe,
  }
}]);
