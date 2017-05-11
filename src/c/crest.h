#pragma once

#include <pebble.h>

#include "main_view.h"

#define CREST_KEY_EVE_USER_COUNT 0
#define CREST_KEY_EVE_SERVICE_STATUS 1
#define CREST_KEY_MARKET_ITEM_DESC 2
#define CREST_KEY_MARKET_ITEM_VALUE1 3
#define CREST_KEY_MARKET_ITEM_VALUE2 4
#define CREST_KEY_MARKET_ITEM_VALUE3 5
#define CREST_KEY_CHAR_NAME 6
#define CREST_KEY_CHAR_LOCATION 7

void crest_timed_update(struct tm *tick_time);

void crest_update();

void crest_last_seen();

void crest_initialise(MainView *data);
  
void crest_terminate();