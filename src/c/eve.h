#pragma once

#include <pebble.h>

#include "main_view.h"

void eve_timed_update(struct tm *tick_time);

void eve_update();

void eve_update_char();

void eve_initialise(MainView *data);
  
void eve_terminate();