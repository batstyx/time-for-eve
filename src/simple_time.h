#pragma once

#include <pebble.h>

void time_initialise(TextLayer *time);

void time_update(struct tm *tick_time);