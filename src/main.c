#include <pebble.h>

#include "main_view.h"
#include "main_ui.h"
#include "simple_time.h"
#include "simple_eve_time.h"
#include "crest.h"

static Window *s_main_window;

static void tap_handler(AccelAxisType axis, int32_t direction) {
  switch (axis) {
  case ACCEL_AXIS_X:
    if (direction > 0) {
      APP_LOG(APP_LOG_LEVEL_INFO, "X axis positive.");
    } else {
      APP_LOG(APP_LOG_LEVEL_INFO, "X axis negative.");
    }
    break;
  case ACCEL_AXIS_Y:
    if (direction > 0) {
      APP_LOG(APP_LOG_LEVEL_INFO, "Y axis positive.");
      crest_update();
    } else {
      APP_LOG(APP_LOG_LEVEL_INFO, "Y axis negative.");
       crest_update();
    }
    break;
  case ACCEL_AXIS_Z:
    if (direction > 0) {
      APP_LOG(APP_LOG_LEVEL_INFO, "Z axis positive.");
      crest_last_seen();
    } else {
      APP_LOG(APP_LOG_LEVEL_INFO, "Z axis negative.");
      crest_last_seen();
    }
    break;
  }
}

static void tick_handler(struct tm *tick_time, TimeUnits units_changed) {
  time_update(tick_time);
  time_t temp = time(NULL);
  struct tm *utc_time = gmtime(&temp);
  eve_time_update(utc_time);
  crest_timed_update(utc_time);
}


static void init() {    
  MainView *data = malloc(sizeof(MainView));
  memset(data, 0, sizeof(MainView));
  
  s_main_window = window_create();
  window_set_user_data(s_main_window, data);
  window_set_window_handlers(s_main_window, (WindowHandlers) {
    .load = main_window_load,
    .unload = main_window_unload,
  });
  
  window_stack_push(s_main_window, true);
  
  eve_time_initialise(data->eve_time_layer);
  time_initialise(data->time_layer);
  crest_initialise(data);
  
  time_t temp = time(NULL);
  struct tm *tick_time = localtime(&temp);
  tick_handler(tick_time, MINUTE_UNIT);
  
  tick_timer_service_subscribe(MINUTE_UNIT, tick_handler); 
  
  accel_tap_service_subscribe(tap_handler);
}

static void deinit() {
  window_destroy(s_main_window);
  crest_terminate();
  tick_timer_service_unsubscribe(); 
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}