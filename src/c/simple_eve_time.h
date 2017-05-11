#pragma once

#include <pebble.h>

void eve_time_initialise(TextLayer *time);

void eve_time_update(struct tm *tick_time);