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
    disconnect: disconnect
  }
}])
.factory('sendHttpRequest', function() {
  return function(method, url, headers, data, callbacks) {
    var xhr = new XMLHttpRequest();

    xhr.open(method, url, true);
    xhr.onreadystatechange = function() {
      if(xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 201)) {
        console.log("onComplete");
        callbacks.onComplete(xhr.responseText);
      } else {
        console.log("onError");
        console.log("readyState", xhr.readyState);
        console.log("status", xhr.status);
        console.log("responseText", xhr.responseText);
        callbacks.onError(xhr.readystate, xhr.status, xhr.responseText);
      }
    };

    for (var key in headers) {
      var value = headers[key];
      console.log(key, value);
      xhr.setRequestHeader(key, value);
    }

    if(method !== "GET" && method !== "DELETE") {
      xhr.send(data);
    } else {
      xhr.send();
    }
  };
});
