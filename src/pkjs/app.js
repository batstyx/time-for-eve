var DEBUG = false;
var INFO = true;
var ERR = true;
var log =  {
  debug: DEBUG ? function (message) { console.log("DBG " + message); } : function (){},
  info: INFO ? function (message) { console.log("INF " + message); } : function (){},
  error: ERR ? function (message) { console.log("ERR " + message); } : function (){},
};

function sendToPebble(dictionary) {
  log.debug("sendToPebble");
  Pebble.sendAppMessage(dictionary,
        function(e) {
          log.info("sendToPebble Sent [#" + e.data.transactionId + "]");          
        },
        function(e) {
          log.error("sendToPebble Error [#" + e.data.transactionId + "]");
          log.error("sendToPebble error: " + e.error.message);
        });
}

var xhrRequest = function (url, type, success, failure) {
  log.debug("xhrRequest url: " + url);
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    log.debug("xhrRequest onload url: " + url);
    log.debug("xhrRequest readyState: " + this.readyState);
    log.debug("xhrRequest status: " + this.status);
    if (this.readyState == 4 && this.status == 200) {
      log.debug("xhrRequest responseText: " + this.responseText);
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
  log.info("sendEVEServerInfo");
  log.debug("sendEVEServerInfo serviceStatus: " + serviceStatus);
  log.debug("sendEVEServerInfo userCount: " + userCount);
  sendToPebble({
    EVE_USER_COUNT: userCount,
    EVE_SERVICE_STATUS: serviceStatus
  });
}

var esiUrl = "https://esi.tech.ccp.is/latest";

function getServerInfo() {  
  log.info("getServerInfo");
  xhrRequest(esiUrl + '/status/', 'GET',
             function(json) { sendEVEServerInfo(json.vip ? "vip": "online", json.players.toString()); },
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
  log.info("sendMarketItemInfo");
  sendToPebble({
    MARKET_ITEM_DESC: itemDesc,
    MARKET_ITEM_VALUE1: format_number(item.volume),
    MARKET_ITEM_VALUE2: format_number(item.highest),
    MARKET_ITEM_VALUE3: format_number(item.lowest),
  }); 
}

function hasMarketItemInfoExpired(marketItem) {
  log.debug("hasMarketItemInfoExpired");
  var expiryDate = new Date(new Date() - 172800000);
  log.debug("hasMarketItemInfoExpired expiryDate: " + expiryDate);    
  var marketItemDate = new Date(marketItem.date);
  log.debug("hasMarketItemInfoExpired marketItemDate: " + marketItemDate);
  if(marketItemDate < expiryDate) {
    var retrievedExpiryDate = new Date(new Date() - 10800000);
    log.debug("hasMarketItemInfoExpired retrievedExpiryDate: " + retrievedExpiryDate);
    var marketItemRetrievedDate = marketItem.retrieved ? new Date(marketItem.retrieved) : retrievedExpiryDate;
    log.debug("hasMarketItemInfoExpired marketItemRetrievedDate: " + marketItemRetrievedDate);
    if(marketItemRetrievedDate <= retrievedExpiryDate) { 
      log.debug("hasMarketItemInfoExpired true");  
      return true;
    }
  }
  log.debug("hasMarketItemInfoExpired false");  
  return false;    
}

function getMarketItemEndpoint(regionId, typeId) {
  return esiUrl + "/markets/" + regionId + "/history/?type_id=" + typeId;
}
  
function refreshMarketItemInfo(regionId, typeId, typeDesc) {
  log.debug("refreshMarketItemInfo");
  log.debug("refreshMarketItemInfo typeId: " + typeId);
  log.debug("refreshMarketItemInfo typeDesc: " + typeDesc);
  xhrRequest(getMarketItemEndpoint(regionId, typeId), 'GET',
             function(json) {
               var newest = json[json.length - 1];
               newest.retrieved = new Date();
               var item_json = JSON.stringify(newest);
               log.debug("refreshMarketItemInfo item_json: " + item_json);    
               localStorage.setItem(typeId, item_json);
               sendMarketItemInfo(newest, typeDesc);
             },
             function(req) {}
            );
}

function getMarketItemInfo(regionId, typeId, typeDesc) {
  log.debug("getMarketItemInfo");
  log.debug("getMarketItemInfo typeId: " + typeId);
  log.debug("getMarketItemInfo typeDesc: " + typeDesc);
  var refreshItem = false;
  var stored_json = localStorage.getItem(typeId);  
  if (stored_json) {
    log.debug("getMarketItemInfo stored_json: " + stored_json);
    log.info("getMarketItemInfo " + typeDesc + " cached");
    var stored = JSON.parse(stored_json);
    refreshItem = hasMarketItemInfoExpired(stored);
    if (refreshItem) {
      log.info("getMarketItemInfo " + typeDesc + " expired");
    } else {
      log.info("getMarketItemInfo " + typeDesc + " valid");
      sendMarketItemInfo(stored, typeDesc);  
    }
  } else { 
    log.info("getMarketItemInfo " + typeDesc + " uncached");
    refreshItem = true;
  }
  if (refreshItem) {
   refreshMarketItemInfo(regionId, typeId, typeDesc);
  }
}

var minerals = [{"typeId": 34, "desc": "Tritanium"},{"typeId": 35, "desc": "Pyerite"},{"typeId": 36, "desc": "Mexallon"},{"typeId": 37, "desc": "Isogen"},{"typeId": 38, "desc": "Nocxium"},{"typeId": 39, "desc": "Zydrine"},{"typeId": 40, "desc": "Megacyte"}];

var character = [{"typeId": 44992,"desc" : "PLEX"},{"typeId": 40519, "desc": "Skill Ext."},{"typeId": 40520, "desc": "Large Inj."},{"typeId": 45635, "desc": "Small Inj."}];

var isotopes = [{"typeId": 16274,"desc": "Helium"},{"typeId": 17887,"desc": "Oxygen"},{"typeId": 17888,"desc": "Nitrogen"},{"typeId": 17889,"desc": "Hydrogen"}];

var planetary = [{"typeId": 2393,"desc": "Bacteria"},{"typeId": 2396,"desc": "Biofuels"},{"typeId": 3779,"desc": "Biomass"},{"typeId": 2390,"desc": "Electrolytes"},{"typeId": 2397,"desc": "Ind.Fibers"},{"typeId": 2392,"desc": "Ox.Compound"},{"typeId": 3683,"desc": "Oxygen"},{"typeId": 2389,"desc": "Plasmoids"},{"typeId": 2399,"desc": "Prc.Metals"},{"typeId": 2395,"desc": "Proteins"},{"typeId": 2398,"desc": "Rct.Metals"},{"typeId": 3645,"desc": "Water"}];

var tech = [{"typeId": 17893,"desc": "Data Chip"},{"typeId": 17895,"desc": "Mfr.Tools"},{"typeId": 17894,"desc": "Scanner"},{"typeId": 41533,"desc": "'Ligature'"},{"typeId": 41534,"desc": "'Zeugma'"}];

// {"typeId": ,"desc": ""}

function createMarket() {  
  log.debug("createMarket");
  var market = {};
  market.char = character;
  market.mine = minerals;
  market.iso = isotopes;
  market.plan = planetary;
  market.tech = tech;
  return market;
}

var market = createMarket();

var TheForgeRegionId = 10000002;

function getMarketItemGroup()
{
  var marketItemGroup = localStorage.getItem("marketItemGroup") || "char";
  log.debug("getMarketItemGroup marketItemGroup: " + marketItemGroup);  
  return marketItemGroup;
}

function getCurrentMarketItem() {  
  log.info("getCurrentMarketItem");
  var priceIterator = localStorage.getItem("priceIterator") || 0;
  log.debug("getCurrentMarketItem priceIterator: " + priceIterator);
  var marketItemGroup = getMarketItemGroup();
  getMarketItemInfo(TheForgeRegionId, market[marketItemGroup][priceIterator].typeId, market[marketItemGroup][priceIterator].desc);
  localStorage.setItem("priceIterator", (parseInt(priceIterator) + 1) % market[marketItemGroup].length);
}

var auth_client_id = "129412347492410586014ae3a137a8c1";
var auth_redirect_url = "https://login.eveonline.com/oauth/authorize";
var auth_scope = "esi-location.read_location.v1";
var app_config_url = "https://batstyx.github.io/time-for-eve/config/";
var app_redirect_url = "https://batstyx.github.io/time-for-eve/config/redirect.html";

function resolve_tokens(code, callback) {
  log.debug("resolve_tokens");
  log.debug("resolve_tokens code: " + code);
  var req = new XMLHttpRequest();
  req.open("POST", "https://login.eveonline.com/oauth/token", true);
  req.setRequestHeader("Authorization", "Basic MTI5NDEyMzQ3NDkyNDEwNTg2MDE0YWUzYTEzN2E4YzE6SnBQMDRJMXMzMjF2TVhHelBkNWg3d1czZUFSaEVDZ3pUT1FqMGFsVg==");
  req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  req.setRequestHeader("Host", "login.eveonline.com");
  req.onload = function(e) {
    log.debug("resolve_tokens readyState: "+ req.readyState);
    log.debug("resolve_tokens status: "+ req.status);
    log.debug("resolve_tokens responseText: " + req.responseText);
    if (req.readyState == 4 && req.status == 200) {
      var result = JSON.parse(req.responseText);

      if (result.refresh_token && result.access_token) {
        log.info("resolve_tokens refresh_token: " + result.refresh_token);
        localStorage.setItem("refresh_token", result.refresh_token);
        log.info("resolve_tokens access_token: " + result.access_token);
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
  log.debug("use_access_token");
  var refresh_token = localStorage.getItem("refresh_token");
  log.debug("use_access_token refresh_token: " + refresh_token);
  var access_token = localStorage.getItem("access_token");
  log.debug("use_access_token access_token: " + access_token);

  if (!refresh_token) return;

  valid_token(access_token, callback, function() {
    refresh_access_token(refresh_token, callback);
  });
}

function valid_token(access_token, success, failure) {
  log.debug("valid_token");
  var req = new XMLHttpRequest();
  req.open("GET", "https://login.eveonline.com/oauth/verify", true);
  req.setRequestHeader("Authorization", "Bearer " + access_token);
  req.setRequestHeader("Host", "login.eveonline.com");
  req.onload = function(e) {
    log.debug("valid_token readyState: "+ req.readyState);
    log.debug("valid_token status: "+ req.status);
    log.debug("valid_token responseText: " + req.responseText);
    if (req.readyState == 4 && req.status == 200) {
      var result = JSON.parse(req.responseText);
      
      if (result.TokenType == "Character") {
        log.debug("valid_token Character");
        log.debug("valid_token CharacterID: " + result.CharacterID);
        localStorage.setItem("characterId", result.CharacterID);
        log.debug("valid_token CharacterName: " + result.CharacterName);        
        localStorage.setItem("characterName", result.CharacterName);
        log.info("valid_token success");
        success(access_token);
        return;
      }      
      if (result.ExceptionType) {
        log.error("valid_token Exception");
        localStorage.removeItem("code");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.setItem("code_error", result.exceptionType + ":" + result.message);
        log.error("valid_token code_error: " + localStorage.getItem("code_error"));
      }
    }
    log.error("valid_token failure");
    failure();
  };
  req.send();
}

function refresh_access_token(refresh_token, callback) {
  log.debug("refresh_access_token");
  var req = new XMLHttpRequest();
  req.open("POST", "https://login.eveonline.com/oauth/token", true);
  req.setRequestHeader("Authorization", "Basic MTI5NDEyMzQ3NDkyNDEwNTg2MDE0YWUzYTEzN2E4YzE6SnBQMDRJMXMzMjF2TVhHelBkNWg3d1czZUFSaEVDZ3pUT1FqMGFsVg==");
  req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  req.setRequestHeader("Host", "login.eveonline.com");
  req.onload = function(e) {
    log.debug("refresh_access_token readyState: "+ req.readyState);
    log.debug("refresh_access_token status: "+ req.status);
    log.debug("refresh_access_token responseText: " + req.responseText);
    if (req.readyState == 4 && req.status == 200) {          
      var result = JSON.parse(req.responseText);

      if (result.access_token) {
        log.info("refresh_access_token access_token: " + result.access_token);
        localStorage.setItem("access_token", result.access_token);
        callback(result.access_token);
      }
    }
  };
  req.send("grant_type=refresh_token&refresh_token="+encodeURIComponent(refresh_token));
}

function sendCharacterInfo(charName, charLocation) {
  log.info("sendCharacterInfo");
  log.debug("sendCharacterInfo charName: " + charName);
  log.debug("sendCharacterInfo charLocation: " + charLocation);
  sendToPebble({
    CHAR_NAME: charName,
    CHAR_LOCATION: charLocation
  });
}

function getCharacterLocation() {
  log.info("getCharacterLocation");
  use_access_token(function(access_token) {
    var characterId = localStorage.getItem("characterId");
    log.debug("getCharacterLocation characterId: " + characterId);    
    var url = esiUrl + "/characters/" + characterId + "/location/";
    log.debug("getCharacterLocation url: " + url);
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.setRequestHeader("Authorization", "Bearer " + access_token);
    req.onload = function(e) {
      log.debug("getCharacterInfo readyState: " + req.readyState);
      log.debug("getCharacterInfo status: " + req.status);
      log.debug("getCharacterInfo responseText: " + req.responseText);
      if (req.readyState == 4 && req.status == 200) {          
        var result = JSON.parse(req.responseText);
        if (result) {
          if (result.solar_system_id) {
             xhrRequest(esiUrl + "/universe/systems/" + result.solar_system_id, 'GET',
             function(json) { sendCharacterInfo(localStorage.getItem("characterName"), json.name); },
             function(req) { }
            );
          }
        }
      }
    };
    req.send();
  });
}

Pebble.addEventListener('ready',
  function(e) {
    log.info("Pebble Event: ready");
    log.debug("Pebble Message: " + JSON.stringify(e));
    
    getServerInfo();
    getCurrentMarketItem();
  }
);

var SERVER_INFO = 1;
var MARKET_INFO = 2;
var CHAR_INFO = 4;

// Listen for when an AppMessage is received
Pebble.addEventListener('appmessage',
  function(e) {
    log.info("Pebble Event: appmessage");
    log.debug("Pebble Message: " + JSON.stringify(e));
    var dict = e.payload;
    var mask = parseInt(dict.EVE_INFO);
    if ((mask & SERVER_INFO) == SERVER_INFO) getServerInfo();
    if ((mask & MARKET_INFO) == MARKET_INFO) getCurrentMarketItem();
    if ((mask & CHAR_INFO) == CHAR_INFO) getCharacterLocation();
  }                     
);

// When you click on Settings in Pebble's phone app. Go to the configuration.html page.
function show_configuration() {
  log.debug("show_configuration");
  var marketItemGroup = getMarketItemGroup();
  var code = localStorage.getItem("code");
  log.debug("show_configuration code: " + code);
  var code_error = localStorage.getItem("code_error");
  log.debug("show_configuration code_error: " + code_error);
  localStorage.removeItem("code_error");

  var json = JSON.stringify({
    "source": "pebble",
    "marketItemGroup": marketItemGroup,
    "code": code,
    "redirect": auth_redirect_url + "?response_type=code&client_id=" + auth_client_id + "&redirect_uri=" + app_redirect_url + "&scope=" + auth_scope,
  });
  
  log.debug("show_configuration json: " + json);  
  
  log.debug("show_configuration app_config_url: " + app_config_url);  
  Pebble.openURL(app_config_url + "#" + json);
}

// When you click Save on the configuration.html page, receive the configuration response here.
function webview_closed(e) {
    log.debug("webview_closed");
    var config = JSON.parse(decodeURIComponent(e.response));
    log.debug("config: " + JSON.stringify(config));
    var marketItemGroup = config.marketItemGroup;
    if (marketItemGroup) {
      log.info("config marketItemGroup: " + marketItemGroup);
      localStorage.setItem("marketItemGroup", marketItemGroup);
      log.info("config priceIterator: " + 0);
      localStorage.setItem("priceIterator", 0);
      getCurrentMarketItem();
    }

    var eveAuthorizationCode = config.eveAuthorizationCode;
    log.debug("eveAuthorizationCode: " + eveAuthorizationCode);
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
