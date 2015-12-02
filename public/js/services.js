'use strict';

angular.module('mqttDemo.services',[])
.service('mqttClient', ['$q',function mqttClientFactory($q) {

  var MqttClient = function (config, messageHandler, disconnectHandler) {
  	this.config = config;
  	this.messageHandler = messageHandler;
  	this.disconnectHandler = disconnectHandler;
  };

  // subscribes to the topic
  MqttClient.prototype.subscribe = function(topic) {
    this.client.subscribe(topic);
  }

  // connects to broker and subscribes to clientID topic
  MqttClient.prototype.connect = function() {
    var deferred = $q.defer();
    try {
      this.client = new Paho.MQTT.Client(this.config.host, this.config.port, this.config.clientID);
      // connect the client
	  this.client.connect({
	  	onSuccess:function(){
	  		// auto subscribe to the topic
	  		//this.client.subscribe(this.config.clientID);
	  		deferred.resolve();
	  	},
	  	onFailure:function(err){deferred.reject(err)}, 
	  	userName: this.config.username, 
	  	password: this.config.password});
	  this.client.onConnectionLost = this.disconnectHandler;
      this.client.onMessageArrived = this.messageHandler;
      
    } catch(err) {
      deferred.reject(err);
    }
    return deferred.promise;
  }

  // disconnects
  MqttClient.prototype.disconnect = function(){
    this.client.disconnect();
  }

  // send message to topic
  MqttClient.prototype.sendMessage = function(topic,message) {
  	var message = new Paho.MQTT.Message(message);
  	message.destinationName = topic;
    this.client.send(message);
  }

  return {
    getInstance: function (config, messageHandler, disconnectHandler) {
      return new MqttClient(config, messageHandler, disconnectHandler);
    }
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
  	onboardingMessage += 'Authorization:Bearer ' + token + '\n';
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
  	var topic = 'p/' + pahoClient.config.clientID + '/thing-if/apps/' + appID + '/onboardings';
  	pahoClient.sendMessage(topic,onboardingMessage);
  	
  }

  var sendCommand = function(appID, actions, thingID, userID, token){

  	// fill onboarding message
  	var commandMessage = 'POST\n';
  	commandMessage += 'Content-type:application/json\n';
  	commandMessage += 'Authorization:Bearer ' + token + '\n';
  	// TODO: generate ID to check it back
  	commandMessage += 'X-Kii-RequestID:asdf1234\n';
  	// mandatory blank line
  	commandMessage += '\n';
  	// payload
  	var payload ={
  		actions: actions,
  		owner: 'USER:'+userID
  	}
  	commandMessage += JSON.stringify(payload);
  	var topic = 'p/' + pahoClient.config.clientID + '/thing-if/apps/' + appID + '/targets' + '/THING:'+thingID+'/commands' ;
  	pahoClient.sendMessage(topic,commandMessage);
  	
  }

  var parseResponse = function(message) {
  	console.log(message);
  	var parsed = {
  		code:'',
  		headers:[],
  		payload:{}
  	}
  	var lines = message.split('\n');
  	console.log(lines);
  	parsed.code = lines[0];
  	
  	for (var i=1; i<lines.length; i++){
  	  console.log(lines[i]);
  	  if(lines[i] != ''){
  	  	parsed.headers.push(lines[i]);
  	  } else {
  	  	var payload = '';
  	  	for(var j = i;j<lines.length;j++){
	  		payload += lines[j];
	  	}
	  	console.log(payload);
	  	parsed.payload = JSON.parse(payload);
	  	return parsed;
  	  }
  	}
  }

  return {
    init:init,
    onboardThing: onboardThing,
    parseResponse: parseResponse
  }
}])
.factory('sendHttpRequest', function() {
  return function(method, url, headers, data, completeHandler, failureHandler) {
    var xhr = new XMLHttpRequest();

    xhr.open(method, url, true);
    xhr.onreadystatechange = function() {
      if(xhr.readyState == 4) {
        if (xhr.status == 200 || xhr.status == 201) {
          console.log("onComplete");
          console.log("readyState", xhr.readyState);
          console.log("status", xhr.status);
          console.log("responseText", xhr.responseText);

          completeHandler(xhr.responseText);
        } else {

          console.log("onFailure");
          console.log("readyState", xhr.readyState);
          console.log("status", xhr.status);
          console.log("responseText", xhr.responseText);

          failureHandler(xhr.readyState, xhr.status, xhr.responseText);
        }
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

