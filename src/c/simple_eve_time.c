#include "simple_eve_time.h"

static TextLayer *s_time_layer;

static void update_time(struct tm *tick_time) {
  static char s_buffer[6];
  strftime(s_buffer, sizeof(s_buffer), clock_is_24h_style() ?
                                       "%H:%M" : "%I:%M", tick_time);
    
  text_layer_set_text(s_time_layer, s_buffer); 
}

void eve_time_update(struct tm *tick_time) {
  update_time(tick_time);
}

void eve_time_initialise(TextLayer *time) {
  s_time_layer = time;
}
