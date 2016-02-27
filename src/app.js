var xhrRequest = function (url, type, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    callback(this);
  };
  xhr.open(type, url);
  xhr.send();
};

function callCREST() {
  var url = "https://crest-tq.eveonline.com/";
  
  xhrRequest(url, 'GET',
    function(req) {
      console.log("url: " + url);
      console.log("readyState: " + req.readyState);
      console.log("status: " + req.status);
      
      var userCounts = 0;
      var serviceStatus = "offline";
            
      if (req.readyState == 4 && req.status == 200) {
        console.log(req.responseText);
      
        var json = JSON.parse(req.responseText);
      
        userCounts = json.userCounts.eve;
        console.log("User Counts is " + userCounts);
      
        serviceStatus = json.serviceStatus.eve;
        console.log("Service Status is " + serviceStatus);
      }
    
      var dictionary = {
        "CREST_KEY_EVE_USER_COUNT": userCounts,
        "CREST_KEY_EVE_SERVICE_STATUS": serviceStatus
      };
      
      Pebble.sendAppMessage(dictionary,
        function(e) {
          console.log("Success!");
          console.log("transactionId: " + e.data.transactionId);
        },
        function(e) {
          console.log("Error!");
          console.log("transactionId: " + e.data.transactionId);
          console.log("error: " + e.error.message);
        });
    });
}

Pebble.addEventListener('ready',
  function(e) {
    console.log("PebbleKit JS ready!");

    callCREST();
  }
);

// Listen for when an AppMessage is received
Pebble.addEventListener('appmessage',
  function(e) {
    console.log("AppMessage received!");
    
    callCREST();
  }                     
);
