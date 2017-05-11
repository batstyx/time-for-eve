#pragma once

#include <pebble.h>

typedef struct {
  TextLayer *eve_time_layer;
  TextLayer *time_layer;
  TextLayer *user_count_layer;
  TextLayer *service_status_layer;
  TextLayer *market_item_desc_layer;
  TextLayer *market_item_value1_layer;
  TextLayer *market_item_value2_layer;
  TextLayer *market_item_value3_layer;  
} MainView;