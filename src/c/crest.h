#pragma once

#include <pebble.h>

#include "main_view.h"

void crest_timed_update(struct tm *tick_time);

void crest_update();

void crest_last_seen();

void crest_initialise(MainView *data);
  
void crest_terminate();