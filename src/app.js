function sendToPebble(dictionary) {
  console.log("Sending to Pebble...");
  Pebble.sendAppMessage(dictionary,
        function(e) {
          console.log("transactionId: " + e.data.transactionId);
          console.log("Sent!");          
        },
        function(e) {
          console.log("transactionId: " + e.data.transactionId);
          console.log("Error!");
          console.log("error: " + e.error.message);
        });
}

var xhrRequest = function (url, type, success, failure) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    console.log("url: " + url);
    console.log("readyState: " + this.readyState);
    console.log("status: " + this.status);
    if (this.readyState == 4 && this.status == 200) {
      console.log("responseText: " + this.responseText);
      var json = JSON.parse(this.responseText);
      success(json);
    } else {
      failure(this);
    }
  };
  xhr.onerror = function () {
    failure(this);
  };
  xhr.open(type, url);
  xhr.send();
};

function sendEVEServerInfo(serviceStatus, userCount) {
  console.log("Service Status is " + serviceStatus);
  console.log("User Count is " + userCount);
  sendToPebble({
    "CREST_KEY_EVE_USER_COUNT": userCount,
    "CREST_KEY_EVE_SERVICE_STATUS": serviceStatus
  });
}

function getServerInfo() {
  xhrRequest('https://crest-tq.eveonline.com/', 'GET',
             function(json) { sendEVEServerInfo(json.serviceStatus.eve, json.userCounts.eve_str); },
             function(req) { sendEVEServerInfo("offline", "0"); }
            );
}

function format_number(value) {
  if (value > 999) {
    if (value > 9999) {
      var foursf = value.toPrecision(4);
      var digits = foursf.substring(0,5).replace(".", "");
      var size = parseInt(foursf.split("+")[1], 10);
      var decimalpt = parseInt(foursf.split("+")[1], 10)%3 + 1;
      var final = digits.substring(0, decimalpt) + "." + digits.substring(decimalpt);
      if (size > 8) {
        return final + ' B';
      } else if (size > 5) {
        return final + ' M';
      } else {
        return final + ' K';
      }
    } else {
      return (value*10).toPrecision(4).substring(0, 5) + ' K';
    }
  }
  return value.toString();
}

function sendMarketItemInfo(item, itemDesc) {
  sendToPebble({
    "CREST_KEY_MARKET_ITEM_DESC": itemDesc,
    "CREST_KEY_MARKET_ITEM_VALUE1": format_number(item.volume),
    "CREST_KEY_MARKET_ITEM_VALUE2": format_number(item.highPrice),
    "CREST_KEY_MARKET_ITEM_VALUE3": format_number(item.lowPrice),
  }); 
}

function getMarketItemInfo(regionId, typeId, typeDesc) {
  var stored_json = localStorage.getItem(typeId);
  if (stored_json) {
    console.log("Stored item available");    
    var stored = JSON.parse(stored_json);
    if(new Date(stored.date) < new Date(new Date() - 172800000)) {
      console.log("Stored item expired");    
      localStorage.removeItem(typeId);
    } else {
      console.log("Stored item valid");    
      sendMarketItemInfo(stored, typeDesc);
    }
  }
  if (!localStorage.getItem(typeId)) {
    xhrRequest("https://public-crest.eveonline.com/market/" + regionId + "/types/" + typeId + "/history/", 'GET',
              function(json) {
                var newest = json.items[json.totalCount - 1];
                var item_json = JSON.stringify(newest);
                console.log("Store item: " + item_json);    
                localStorage.setItem(typeId, item_json);
                sendMarketItemInfo(newest, typeDesc);
              },
              function(req) {}
             );
  } 
}


var minerals = JSON.parse('{ "group": "mine", "items": [{"typeId": 34, "desc": "Tritanium"},{"typeId": 35, "desc": "Pyerite"},{"typeId": 36, "desc": "Mexallon"},{"typeId": 37, "desc": "Isogen"},{"typeId": 38, "desc": "Nocxium"},{"typeId": 39, "desc": "Zydrine"},{"typeId": 40, "desc": "Megacyte"}]}');

var character = JSON.parse('{ "group": "char", "items": [{"typeId": 29668,"desc" : "PLEX"},{"typeId": 40519, "desc": "Skill Ext."},{"typeId": 40520, "desc": "Skill Inj."}]}');

var marketList = character;

var TheForgeRegionId = 10000002;

function getCurrentMarketItem() {  
  var priceIterator = localStorage.getItem("priceIterator") || 0;
  var marketItemGroup = localStorage.getItem("marketItemGroup") || character.group;
  if (marketList.group !== marketItemGroup) {
    console.log('marketItemGroup changed!');
    if (marketItemGroup === character.group) {
      marketList = character;
    } else if (marketItemGroup === minerals.group) {
      marketList = minerals;
    }
    priceIterator = 0;
  }
  getMarketItemInfo(TheForgeRegionId, marketList.items[priceIterator].typeId, marketList.items[priceIterator].desc);
  localStorage.setItem("priceIterator", (parseInt(priceIterator) + 1) % marketList.items.length);
}

var crest_client_id = "129412347492410586014ae3a137a8c1";
var crest_redirect_url = "https://login.eveonline.com/oauth/authorize";
var crest_scope = "publicData+characterLocationRead";
var app_config_url = "https://batstyx.github.io/time-for-eve/config/";
var app_redirect_url = "https://batstyx.github.io/time-for-eve/config/redirect.html";

function resolve_tokens(code, callback) {
  console.log("resolve_tokens");
  console.log("resolve_tokens code: " + code);
  var req = new XMLHttpRequest();
  req.open("POST", "https://login.eveonline.com/oauth/token", true);
  req.setRequestHeader("Authorization", "Basic MTI5NDEyMzQ3NDkyNDEwNTg2MDE0YWUzYTEzN2E4YzE6SnBQMDRJMXMzMjF2TVhHelBkNWg3d1czZUFSaEVDZ3pUT1FqMGFsVg==");
  req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  req.setRequestHeader("Host", "login.eveonline.com");
  req.onload = function(e) {
    console.log("resolve_tokens readyState: "+ req.readyState);
    console.log("resolve_tokens status: "+ req.status);
    console.log("resolve_tokens responseText: " + req.responseText);
    if (req.readyState == 4 && req.status == 200) {
      var result = JSON.parse(req.responseText);

      if (result.refresh_token && result.access_token) {
        console.log("resolve_tokens refresh_token: " + result.refresh_token);
        localStorage.setItem("refresh_token", result.refresh_token);
        console.log("resolve_tokens access_token: " + result.access_token);
        localStorage.setItem("access_token", result.access_token);

        callback();
        
        return;
      }
    }

    localStorage.removeItem("code");
    localStorage.setItem("code_error", "Unable to verify your EVE authentication.");
  };
  
  req.send("grant_type=authorization_code&code="+ code);
}

function use_access_token(callback) {
  console.log("use_access_token");
  var refresh_token = localStorage.getItem("refresh_token");
  console.log("use_access_token refresh_token: " + refresh_token);
  var access_token = localStorage.getItem("access_token");
  console.log("use_access_token access_token: " + access_token);

  if (!refresh_token) return;

  valid_token(access_token, callback, function() {
    refresh_access_token(refresh_token, callback);
  });
}

function valid_token(access_token, success, failure) {
  console.log("valid_token");
  var req = new XMLHttpRequest();
  req.open("GET", "https://login.eveonline.com/oauth/verify", true);
  req.setRequestHeader("Authorization", "Bearer " + access_token);
  req.setRequestHeader("Host", "login.eveonline.com");
  req.onload = function(e) {
    console.log("valid_token readyState: "+ req.readyState);
    console.log("valid_token status: "+ req.status);
    console.log("valid_token responseText: " + req.responseText);
    if (req.readyState == 4 && req.status == 200) {
      var result = JSON.parse(req.responseText);
      
      if (result.TokenType == "Character") {
        console.log("valid_token Character");
        localStorage.setItem("characterId", result.CharacterID);
        localStorage.setItem("characterName", result.CharacterName);
        console.log("valid_token success");
        success(access_token);
        return;
      }      
      if (result.ExceptionType) {
        console.log("valid_token Exception");
        localStorage.removeItem("code");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.setItem("code_error", result.exceptionType + ":" + result.message);
        console.log("valid_token code_error: " + localStorage.getItem("code_error"));
      }
    }
    console.log("valid_token failure");
    failure();
  };
  req.send();
}

function refresh_access_token(refresh_token, callback) {
  console.log("refresh_access_token");
  var req = new XMLHttpRequest();
  req.open("POST", "https://login.eveonline.com/oauth/token", true);
  req.setRequestHeader("Authorization", "Basic MTI5NDEyMzQ3NDkyNDEwNTg2MDE0YWUzYTEzN2E4YzE6SnBQMDRJMXMzMjF2TVhHelBkNWg3d1czZUFSaEVDZ3pUT1FqMGFsVg==");
  req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  req.setRequestHeader("Host", "login.eveonline.com");
  req.onload = function(e) {
    console.log("refresh_access_token readyState: "+ req.readyState);
    console.log("refresh_access_token status: "+ req.status);
    console.log("refresh_access_token responseText: " + req.responseText);
    if (req.readyState == 4 && req.status == 200) {          
      var result = JSON.parse(req.responseText);

      if (result.access_token) {
        console.log("refresh_access_token access_token: " + result.access_token);
        localStorage.setItem("access_token", result.access_token);
        callback(result.access_token);
      }
    }
  };
  req.send("grant_type=refresh_token&refresh_token="+encodeURIComponent(refresh_token));
}

function sendCharacterInfo(charName, charLocation) {
  console.log("Character Name is " + charName);
  console.log("Character Location is " + charLocation);
  sendToPebble({
    "CREST_KEY_CHAR_NAME": charName,
    "CREST_KEY_CHAR_LOCATION": charLocation
  });
}

function getCharacterLocation() {
  console.log("getCharacterLocation");
  use_access_token(function(access_token) {
    var characterId = localStorage.getItem("characterId");
    console.log("getCharacterLocation characterId: " + characterId);    
    var url = "https://crest-tq.eveonline.com/characters/" + characterId + "/location/";
    console.log("getCharacterLocation url: " + url);
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.setRequestHeader("Authorization", "Bearer " + access_token);
    req.onload = function(e) {
      console.log("getCharacterInfo readyState: " + req.readyState);
      console.log("getCharacterInfo status: " + req.status);
      console.log("getCharacterInfo responseText: " + req.responseText);
      if (req.readyState == 4 && req.status == 200) {          
        var result = JSON.parse(req.responseText);
        if (result) {
          if (result.solarSystem) {
            sendCharacterInfo(localStorage.getItem("characterName"), result.solarSystem.name);
          }
        }
      }
    };
    req.send();
  });
}

Pebble.addEventListener('ready',
  function(e) {
    console.log("PebbleKit JS ready!");
    console.log(JSON.stringify(e));
    
    getServerInfo();
    getCurrentMarketItem();
    getCharacterLocation();
  }
);

// Listen for when an AppMessage is received
Pebble.addEventListener('appmessage',
  function(e) {
    console.log("AppMessage received!");
    console.log(JSON.stringify(e));
    
    getServerInfo();
    getCurrentMarketItem();
    getCharacterLocation();
  }                     
);

// When you click on Settings in Pebble's phone app. Go to the configuration.html page.
function show_configuration() {
    console.log("show_configuration");
    var code = localStorage.getItem("code");
    console.log("code: " + code);
    var code_error = localStorage.getItem("code_error");
    console.log("code_error: " + code_error);
    localStorage.removeItem("code_error");

    var json = JSON.stringify({
      "source": "pebble",
      "redirect": crest_redirect_url + "?response_type=code&client_id=" + crest_client_id + "&redirect_uri=" + app_redirect_url + "&scope=" + crest_scope,
    });

  Pebble.openURL(app_config_url + "#" + json);
}

// When you click Save on the configuration.html page, receive the configuration response here.
function webview_closed(e) {
    console.log("webview_closed");
    var config = JSON.parse(decodeURIComponent(e.response));
    console.log("config: " + JSON.stringify(config));
    var marketItemGroup = config.marketItemGroup;
    if (marketItemGroup) {
      console.log("marketItemGroup: " + marketItemGroup);
      localStorage.setItem("marketItemGroup", marketItemGroup);
      getCurrentMarketItem();
    }

    var eveAuthorizationCode = config.eveAuthorizationCode;
    console.log("eveAuthorizationCode: " + eveAuthorizationCode);
    var old_code = localStorage.getItem("code");
    if (old_code != eveAuthorizationCode) {
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("access_token");
        if (eveAuthorizationCode) {
          localStorage.setItem("code", eveAuthorizationCode);
          resolve_tokens(eveAuthorizationCode, getCharacterLocation);
        }
    } 
}

// Setup the configuration events
Pebble.addEventListener("showConfiguration", show_configuration);
Pebble.addEventListener("webviewclosed", webview_closed);