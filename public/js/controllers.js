'use strict';

var KiiEnv = Kii;

angular.module('mqttDemo.controllers',[])
.controller('ConnectionCtrl', ['$scope',function($scope) {

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

    // $scope.isUserRegistered = false;
    // $scope.isThingRegistered = false;

    $scope.message = 'Hello!';

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
    console.log('Kii sdk initialized')

  }

  $scope.onClickRegisterUser = function() {
    console.log($scope.userInfo.userName, $scope.userInfo.password);

    // Create the KiiUser object
    var user = KiiUser.userWithUsername($scope.userInfo.userName, $scope.userInfo.password);

    // Register the user, defining callbacks for when the process completes
    user.register({
      // Called on successful registration
      success: function(theUser) {
        // Print some info to the log
        console.log("User registered!");
        console.log(theUser);
        console.log("user id: " + theUser._uuid);

        $scope.userInfo.userObject = theUser;

      },
      // Called on a failed registration
      failure: function(theUser, errorString) {
        // Print some info to the log
        console.log("Error registering: " + errorString);
      }
    });
  }


  function sendHttpRequest(method, url, headers, data, callbacks) {

    var request = new XMLHttpRequest();

    request.open(method, url, true);
    request.onreadystatechange = function() {
      if(request.readystate == 4 && request.status == 200) {
        console.log("onComplete");
        callbacks.onComplete(request.responseText);
      } else {
        console.log("onError");
        callbacks.onError();
      }
    };

    for (key in headers) {
      value = headers[key];
      request.setRequestHeader(key, value);
    }

    if(method !== "GET" && method !== "DELETE") {
      request.send(data);
    } else {
      request.send();
    }
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
