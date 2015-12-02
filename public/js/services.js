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

  var onboardThing = function(appID, vendorThingID, thingPassword, userID, token){

  	// fill onboarding message
  	var onboardingMessage = 'POST\n';
  	onboardingMessage += 'Content-type:application/vnd.kii.OnboardingWithVendorThingIDByOwner+json\n';
  	onboardingMessage += 'Authorization:Bearer '+token+'\n';
  	// TODO: generate ID to check it back
  	onboardingMessage += 'X-Kii-RequestID:asdf1234\n';
  	// mandatory blank line
  	onboardingMessage += '\n';
  	// payload
  	var payload ={
  		vendorThingID: vendorThingID,
  		thingPassword: thingPassword,
  		owner: 'USER:'+userID
  	}
  	onboardingMessage += JSON.stringify(payload);
  	var topic = 'p/' + pahoClient.clientID + '/thing-if/apps/' + appID + '/onboardings';
  	pahoClient.sendMessage(topic,message);
  	
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
      if(xhr.status == 200 || xhr.status == 201) {
        console.log("onComplete");
        callbacks.onComplete(xhr.responseText);
      } else {
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

