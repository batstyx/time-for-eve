#pragma once

#include <pebble.h>

#include "main_view.h"

#define CREST_KEY_EVE_USER_COUNT 0
#define CREST_KEY_EVE_SERVICE_STATUS 1

void crest_update(struct tm *tick_time);

void crest_initialise(MainView *data);
  
void crest_terminate();