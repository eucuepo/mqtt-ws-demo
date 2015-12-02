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

  var sendMessage = function(topic,message) {
  	var message = new Paho.MQTT.Message(message);
  	message.destinationName = topic;
    client.send(message);
  }

  return {
    init: init,
    subscribe: subscribe,
    sendMessage: sendMessage,
    disconnect, disconnect
  }
}])
.service('kiiMqttClient', ['$q',function kiiMqttClientFactory($q) {

  var pahoClient;

  var init = function(client) {
  	pahoClient = client;
  }

  var onboardThing = function(vendorThingID, thingPassword, userID, token){
  	// send this 
    /*
    POST
	Content-type:application/vnd.kii.OnboardingWithVendorThingIDByOwner+json
	Authorization:Bearer zxcwuctmfowefzx-czxveewf
	X-Kii-RequestID:asdf1234

	{
	    “vendorThingID”:“th.53ae324be5a0-2fbb-4e11-1434-038bc695”,
	    “thingPassword”:“asdfzxcv890”,
	    "owner":
	}
	*/

	// to
	// p/<clientID>/thing-if/apps/<appID>/targets/THING:<thingID>/states
  }

  return {
    init: init,
    onboardThing: onboardThing,
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
        console.log("readyState", xhr.readyState);
        console.log("status", xhr.status);
        console.log("responseText", xhr.responseText);

        callbacks.onComplete(xhr.responseText);
      } else if (xhr.status != 200 && xhr.status != 201){

        console.log("onError");
        console.log("readyState", xhr.readyState);
        console.log("status", xhr.status);
        console.log("responseText", xhr.responseText);
        callbacks.onFailure(xhr.readystate, xhr.status, xhr.responseText);
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

