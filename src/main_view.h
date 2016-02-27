#pragma once

#include <pebble.h>

typedef struct {
  TextLayer *eve_time_layer;
  TextLayer *time_layer;
  TextLayer *user_count_layer;
  TextLayer *service_status_layer;
} MainView;