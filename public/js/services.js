'use strict';

angular.module('mqttDemo.services',[])
.service('mqttClient', ['$q',function mqttClientFactory($q) {

  var client;

  var subscribe = function(topic) {
    client.subscribe(topic);
  }

  var init = function(config, messageHandler, disconnectHandler) { 
    var deferred = $q.defer();
    try {
      client = new Paho.MQTT.Client(config.host, config.port, config.clientID);
      // connect the client
	  client.connect({onSuccess:function(){deferred.resolve()},
	  	onFailure:function(err){deferred.reject(err)}, 
	  	userName: config.username, 
	  	password:config.password});
	  client.onConnectionLost = disconnectHandler;
      client.onMessageArrived = messageHandler;
      
    } catch(err) {
      deferred.reject(err);
    }
    return deferred.promise;
  }

   var disconnect = function(){
     client.disconnect();
   }

  return {
    init: init,
    subscribe: subscribe,
    disconnect, disconnect
  }
}]);
