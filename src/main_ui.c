#include "main_ui.h"
#include "config.h"
#include "main_view.h"

static BitmapLayer *s_background_layer;
static GBitmap *s_background_bitmap;

static void configure_background(Layer *window_layer, GRect bounds) {
  s_background_bitmap = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_BACKGROUND);
  
  s_background_layer = bitmap_layer_create(bounds);
  
  bitmap_layer_set_bitmap(s_background_layer, s_background_bitmap);
  
  layer_add_child(window_layer, bitmap_layer_get_layer(s_background_layer));  
}

static void init_text_layer(Layer *window_layer, TextLayer **text_layer, int16_t left, int16_t top, int16_t width, int16_t height, char *font_key, GTextAlignment alignment) {
  *text_layer =  text_layer_create(GRect(left, top, width, height));
  
  text_layer_set_font(*text_layer, fonts_get_system_font(font_key));
  text_layer_set_text_alignment(*text_layer, alignment);
  text_layer_set_background_color(*text_layer, GColorClear);
  
  layer_add_child(window_layer, text_layer_get_layer(*text_layer));  
}

void main_window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);
  MainView *data = window_get_user_data(window);
  
  window_set_background_color(window, GColorBlack);
  
  configure_background(window_layer, layer_get_bounds(window_layer));
  
  init_text_layer(window_layer, &data->eve_time_layer, 
                  EVE_TIME_LEFT, EVE_TIME_TOP, EVE_TIME_WIDTH, EVE_TIME_HEIGHT, 
                  EVE_TIME_FONT, EVE_TIME_ALIGN);  
  init_text_layer(window_layer, &data->time_layer, 
                  TIME_LEFT, TIME_TOP, TIME_WIDTH, TIME_HEIGHT, 
                  TIME_FONT, TIME_ALIGN);
  text_layer_set_text_color(data->time_layer, GColorWhite);
  init_text_layer(window_layer, &data->user_count_layer,
                  USER_COUNT_LEFT, USER_COUNT_TOP, USER_COUNT_WIDTH, USER_COUNT_HEIGHT, 
                  USER_COUNT_FONT, USER_COUNT_ALIGN);
  init_text_layer(window_layer, &data->service_status_layer, 
                  SERVICE_STATUS_LEFT, SERVICE_STATUS_TOP, SERVICE_STATUS_WIDTH, SERVICE_STATUS_HEIGHT, 
                  SERVICE_STATUS_FONT, SERVICE_STATUS_ALIGN);
  init_text_layer(window_layer, &data->market_item_desc_layer, 
                  MARKET_ITEM_DESC_LEFT, MARKET_ITEM_DESC_TOP, MARKET_ITEM_DESC_WIDTH, MARKET_ITEM_DESC_HEIGHT, 
                  MARKET_ITEM_DESC_FONT, MARKET_ITEM_DESC_ALIGN);
  text_layer_set_text_color(data->market_item_desc_layer, GColorWhite);
  init_text_layer(window_layer, &data->market_item_value1_layer, 
                  MARKET_ITEM_VALUE1_LEFT, MARKET_ITEM_VALUE1_TOP, MARKET_ITEM_VALUE1_WIDTH, MARKET_ITEM_VALUE1_HEIGHT, 
                  MARKET_ITEM_VALUE1_FONT, MARKET_ITEM_VALUE1_ALIGN);
  text_layer_set_text_color(data->market_item_value1_layer, GColorWhite);
  init_text_layer(window_layer, &data->market_item_value2_layer, 
                  MARKET_ITEM_VALUE2_LEFT, MARKET_ITEM_VALUE2_TOP, MARKET_ITEM_VALUE2_WIDTH, MARKET_ITEM_VALUE2_HEIGHT, 
                  MARKET_ITEM_VALUE2_FONT, MARKET_ITEM_VALUE2_ALIGN);
  text_layer_set_text_color(data->market_item_value2_layer, GColorWhite);
  init_text_layer(window_layer, &data->market_item_value3_layer, 
                  MARKET_ITEM_VALUE3_LEFT, MARKET_ITEM_VALUE3_TOP, MARKET_ITEM_VALUE3_WIDTH, MARKET_ITEM_VALUE3_HEIGHT, 
                  MARKET_ITEM_VALUE3_FONT, MARKET_ITEM_VALUE3_ALIGN);
  text_layer_set_text_color(data->market_item_value3_layer, GColorWhite);  
}

void main_window_unload(Window *window) {
  MainView *data = window_get_user_data(window);
  
  gbitmap_destroy(s_background_bitmap);
  bitmap_layer_destroy(s_background_layer);
  
  text_layer_destroy(data->eve_time_layer);
  text_layer_destroy(data->time_layer);
  text_layer_destroy(data->user_count_layer);
  text_layer_destroy(data->service_status_layer);    
  text_layer_destroy(data->market_item_desc_layer);
  text_layer_destroy(data->market_item_value1_layer);
  text_layer_destroy(data->market_item_value2_layer);
  text_layer_destroy(data->market_item_value3_layer);
}