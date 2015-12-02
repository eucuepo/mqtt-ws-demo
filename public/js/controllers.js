'use strict';

var KiiEnv = Kii;

angular.module('mqttDemo.controllers',[])
.controller('ConnectionCtrl', ['$scope','mqttClient', 'kiiMqttClient', 'sendHttpRequest', function($scope,mqttClient,kiiMqttClient,sendHttpRequest) {

  var Constant_X_Kii_RequestID = "asdf1234";

  $scope.init = function() {
    console.log("init()");

    $scope.KiiInfo = {
      appID: "0ce64137",
      appKey: "e61d8b23b67a89a944414197452d7663",
      site: "dev-jp"
    };

    $scope.userInfo = {
      userName:"someusername",
      password:"somepassword",
      userObject:{}
    };

    $scope.thingInfo = {
      vendorThingID:"",
      password:"",
      thingID:"",
      accessToken:""
    }

    // userMessage.actions => thingMessage.receivedActions
    // userMessage.receivedActionResults <= thingMessage.state
    // userMessage.receivedActionResults <= thingMessage.actionResults
    $scope.userMessage = {
      actions: "",
      receivedActionResults: ""
    };

    $scope.thingMessage = {
      receivedActions: "",
      state: "",
      actionResults: ""
    };

    $scope.commandIDs = [];

    $scope.userMqttClient = {};

    $scope.thingMqttClient = {};

    $scope.sdkInitialized = false;

    // the first message received will be treated as thing boarding response
    // then change this field as true
    $scope.isMQTTConnectedForThing = false;

    $scope.isMQTTConnectedForUser = false;

  }

  $scope.onClickSetEnvironment = function() {
    var site;
    if($scope.KiiInfo.site == "dev-jp") {
      site = KiiSite["dev-jp"];
    } else {
      alert("please select the region");
      return;
    }

    KiiEnv.initializeWithSite($scope.KiiInfo.appID, $scope.KiiInfo.appKey, site);
    $scope.sdkInitialized = true;
    console.log('Kii sdk initialized');

  }

  $scope.resetEnvironment = function() {
    $scope.sdkInitialized = false;
  }

  $scope.onClickRegisterUser = function(userInfo) {
    console.log(userInfo.userName, userInfo.password);

    // Create the KiiUser object
    var user = KiiUser.userWithUsername(userInfo.userName, userInfo.password);

    // Register the user, defining callbacks for when the process completes
    user.register({
      // Called on successful registration
      success: function(theUser) {
        // Print some info to the log
        console.log("User registered!");
        console.log(theUser);
        console.log("user id: " + theUser._uuid);

        $scope.userInfo.userObject = theUser;

        installMQTTForUser(theUser);
      },
      // Called on a failed registration
      failure: function(theUser, errorString) {
        // Print some info to the log
        console.log("Error registering: " + errorString);
      }
    });
  }

  // install the MQTT for user
  function installMQTTForUser(theUser) {

    var url = KiiSite[$scope.KiiInfo.site] + "/apps/" + $scope.KiiInfo.appID + "/installations";

    var headers = {
      "content-type": "application/vnd.kii.InstallationCreationRequest+json",
      "Authorization": "bearer " + theUser._accessToken,
      "x-kii-appid": $scope.KiiInfo.appID,
      "x-kii-appkey": $scope.KiiInfo.appKey
    };

    var data = {
      "deviceType": "MQTT",
      "development":true
    };

    var onComplete = function(response) { 
      retrieveMQTTEndpointForUser(theUser, JSON.parse(response).installationID, 5);
    };

    var onFailure = function(readyState, status, response) {
    };

    sendHttpRequest("POST", url, headers, JSON.stringify(data), onComplete, onFailure);
  }

  function retrieveMQTTEndpointForUser(theUser, installationID, retryCount) {
    var url = KiiSite[$scope.KiiInfo.site] + "/apps/" + $scope.KiiInfo.appID + "/installations/" + installationID + "/mqtt-endpoint" ;

    var headers = {
      "Authorization": "bearer " + theUser._accessToken,
      "x-kii-appid": $scope.KiiInfo.appID,
      "x-kii-appkey": $scope.KiiInfo.appKey
    };

    var onComplete = function(response) {

      var mqttEndpointInfo = JSON.parse(response);

      connectMQTTEndpointForUser(mqttEndpointInfo);
    };

    var onFailure = function(readyState, status, response) {
      console.log("retry", retryCount);
      if(retryCount > 0) {
        setTimeout(function() {
          retrieveMQTTEndpointForUser(theUser, installationID, retryCount-1);
        }, 5000);
      }
    };

    sendHttpRequest("GET", url, headers, null, onComplete, onFailure);
  }

  function connectMQTTEndpointForUser(mqttEndpointInfo){

    var mqttClientConfig = {
      host: mqttEndpointInfo.host,
      port: mqttEndpointInfo.portWS,
      username: mqttEndpointInfo.username,
      password: mqttEndpointInfo.password,
      clientID: mqttEndpointInfo.mqttTopic
    };

    var onConnectionLost = function(responseObject) {
      $scope.connected = false;
      alert("Conneciton Lost");
    };

    var onMessageReceived = function(message) {
      $scope.$apply(function () {
          $scope.userMessage.receivedActionResults +=  message.payloadString + '\n';
          alert("Message Received", message);

          var parsed = kiiMqttClient.parseResponse(message.payloadString);

          // check whether onboarding response
          if(!$scope.isMQTTConnectedForThing) {
            
            $scope.thingInfo.thingID = parsed.payload.thingID;
            $scope.thingInfo.accessToken = parsed.payload.accessToken;
            connectMQTTEndpointForThing(parsed.payload.mqttEndpoint);
          } else {
            $scope.commandIDs.push(parsed.payload.commandID);
            console.log("commandID", parsed.payload.commandID);
          }
      });
    };

    $scope.userMqttClient = mqttClient.getInstance(mqttClientConfig,onMessageReceived,onConnectionLost);
    $scope.userMqttClient.connect()
      .then(function(){
        $scope.connected = true;
        console.log("User MQTT Connected");
        $scope.isMQTTConnectedForUser = true;
      },
      function(err){
        alert('Error connecting: ' + JSON.stringify(err));
        console.log('Error connecting: ' + JSON.stringify(err));
      });

  }

  function connectMQTTEndpointForThing(mqttEndpointInfo) {

    var mqttClientConfig = {
      host: mqttEndpointInfo.host,
      port: mqttEndpointInfo.portWS,
      username: mqttEndpointInfo.username,
      password: mqttEndpointInfo.password,
      clientID: mqttEndpointInfo.mqttTopic
    };

    var onMessageReceived = function(message) {
      $scope.$apply(function() {
        $scope.thingMessage.receivedActions += message.payloadString + '\n';
        console.log("message", message);
      });
    };

    var onConnectionLost = function(responseObject) {
      alert("Conneciton Lost");
    };

    $scope.thingMqttClient = mqttClient.getInstance(mqttClientConfig,onMessageReceived,onConnectionLost);
    $scope.thingMqttClient.connect()
      .then(function(){
        console.log("Thing MQTT Connected");
        $scope.isMQTTConnectedForThing = true;
      },
      function(err){
        alert('Error connecting: ' + JSON.stringify(err));
        console.log('Error connecting: ' + JSON.stringify(err));
      });
  }

  $scope.onClickRegisterThing = function(thingInfo) {

    kiiMqttClient.init($scope.userMqttClient);

    kiiMqttClient.onboardThing($scope.KiiInfo.appID, thingInfo.vendorThingID, thingInfo.password, $scope.userInfo.userObject._uuid, $scope.userInfo.userObject._accessToken);

  }

  $scope.onClickSendCommand = function() {

    var userObject = $scope.userInfo.userObject;

    // fill message
    var commandMessage = 'POST\n';
    commandMessage += 'Content-type:application/json\n';
    commandMessage += 'Authorization:Bearer ' + userObject._accessToken + '\n';
    // mandatory blank line
    commandMessage += '\n';
    // payload
    var payload ={
      actions: JSON.parse($scope.userMessage.actions),
      issuer: 'USER:' + userObject._uuid,
      schema: 'SmartLight',
      schemaVersion: 1
    };
    commandMessage += JSON.stringify(payload);

    // fill topic
    var topic = 'p/' + $scope.userMqttClient.config.clientID + '/thing-if/apps/' + $scope.KiiInfo.appID + '/targets/THING:'+$scope.thingInfo.thingID+'/commands' ;
    
    // send out the message to topic
    $scope.userMqttClient.sendMessage(topic,commandMessage);

    console.log("send to thing", topic, commandMessage);
  }

  $scope.onClickUpdateState = function() {

    // fill message
    var commandMessage = 'PUT\n';
    commandMessage += 'Content-type:application/json\n';
    commandMessage += 'Authorization:Bearer ' + $scope.thingInfo.accessToken + '\n';
    // mandatory blank line
    commandMessage += '\n';
    // state
    commandMessage += $scope.thingMessage.state;

    // fill topic
    var topic = 'p/' + $scope.thingMqttClient.config.clientID + '/thing-if/apps/' + $scope.KiiInfo.appID + '/targets/THING:'+$scope.thingInfo.thingID+'/states' ;
    
    // send out the message to topic
    $scope.thingMqttClient.sendMessage(topic,commandMessage);

    console.log("send to user", topic, commandMessage);

  }

  $scope.onClickSendActionResults = function() {

    // fill message
    var commandMessage = 'PUT\n';
    commandMessage += 'Content-type:application/json\n';
    commandMessage += 'Authorization:Bearer ' + $scope.thingInfo.accessToken + '\n';
    // mandatory blank line
    commandMessage += '\n';
    // payload
    var payload ={
      actionResults: JSON.parse($scope.thingMessage.actionResults)
    };
    commandMessage += JSON.stringify(payload);

    // fill topic
    var topic = 'p/' + $scope.thingMqttClient.config.clientID + '/thing-if/apps/' + $scope.KiiInfo.appID + '/targets/THING:'+$scope.thingInfo.thingID+'/commands/' + $scope.commandIDs.pop() + '/action-results' ;
    
    // send out the message to topic
    $scope.thingMqttClient.sendMessage(topic,commandMessage);

    console.log("send to user", topic, commandMessage);
  }

}])
.controller('TestCtrl', ['$scope','mqttClient','kiiMqttClient',function($scope, mqttClient, kiiMqttClient) {

  $scope.connected = false;

  $scope.receivedMessages = "";

  $scope.mqttClientConfig = {
  	host: "development-jp-mqtt-540df7a171962834.internal.kii.com",
  	port: 12470
  }

  var userMqttClient;

  $scope.connect = function(mqttClientConfig){
  	userMqttClient = mqttClient.getInstance(mqttClientConfig,onMessageReceived,onConnectionLost);
  	userMqttClient.connect()
  	  .then(function(){
  	  	$scope.connected = true;
  	  },
  	  function(err){
  	  	alert('Error connecting: ' + JSON.stringify(err));
  	  });
  }

  $scope.disconnect = function(){
  	userMqttClient.disconnect();
  	$scope.connected = false;
  }

  $scope.subscribe = function(topic){
  	userMqttClient.subscribe(topic);
  }

  $scope.testOnboard = function(){
  	kiiMqttClient.init(userMqttClient);
  	kiiMqttClient.onboardThing('596cd936', 'testvendor', 'testpass', '53ae324be5a0-d438-5e11-1c89-0c737777', 'NTgqj2qDXBHg6dix8RANtXS05zyIuRDhyd3PSbawig8');
  }

  var onConnectionLost = function(responseObject) {
	$scope.connected = false;
  }

  var onMessageReceived = function(message) {
  	$scope.$apply(function () {
        //$scope.receivedMessages +=  message.payloadString + '\n';
        $scope.receivedMessages += kiiMqttClient.parseResponse(message.payloadString) + '\n';
    });
  }

}]);


