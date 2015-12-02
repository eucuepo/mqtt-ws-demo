'use strict';

var KiiEnv = Kii;

angular.module('mqttDemo.controllers',[])
.controller('ConnectionCtrl', ['$scope','mqttClient','sendHttpRequest', function($scope,mqttClient,sendHttpRequest) {

  $scope.init = function() {
    console.log("init()");

    $scope.KiiInfo = {
      appID: "0ce64137",
      appKey: "e61d8b23b67a89a944414197452d7663",
      site: "dev-jp"
    };

    $scope.userInfo = {
      userName:"someusername",
      password:"somepassword"
    };


    // $scope.isUserRegistered = false;
    // $scope.isThingRegistered = false;

    $scope.sdkInitialized = false;

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

        installMQTTForUser(theUser);
      },
      // Called on a failed registration
      failure: function(theUser, errorString) {
        // Print some info to the log
        console.log("Error registering: " + errorString);
      }
    });
  }

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

    var callbacks = {
      onComplete: function(response) {
        
        retrieveMQTTEndpointForUser(theUser, JSON.parse(response).installationID, 5);
      },
      onError: function(readyState, status, response) {

      }
    };

    sendHttpRequest("POST", url, headers, JSON.stringify(data), callbacks);
  }

  function retrieveMQTTEndpointForUser(theUser, installationID, retryCount) {
    var url = KiiSite[$scope.KiiInfo.site] + "/apps/" + $scope.KiiInfo.appID + "/installations/" + installationID + "/mqtt-endpoint" ;

    var headers = {
      "Authorization": "bearer " + theUser._accessToken,
      "x-kii-appid": $scope.KiiInfo.appID,
      "x-kii-appkey": $scope.KiiInfo.appKey
    };

    var callbacks = {
      onComplete: function(response) {

        var mqttEndpointInfo = JSON.parse(response);

        var mqttClientConfig = {
          host: mqttEndpointInfo.host,
          port: mqttEndpointInfo.portWS,
          username: mqttEndpointInfo.username,
          password: mqttEndpointInfo.password,
          clientID: mqttEndpointInfo.installationID
        };

        // TODO to add source code for MQTT connect
        // connectMQTTEndpoint(mqttClientConfig);
      },
      onError: function(readyState, status, response) {
        console.log("retry", retryCount);
        if(retryCount > 0) {
          setTimeout(function() {
            retrieveMQTTEndpointForUser(theUser, installationID, retryCount-1);
          }, 5000);
        }
      }
    };

    sendHttpRequest("GET", url, headers, null, callbacks);
  }

  var connectMQTTEndpoint = function(mqttClientConfig){
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


