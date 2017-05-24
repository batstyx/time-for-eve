#include "eve.h"

static MainView *view;

static char s_user_count[9], s_service_status[9], s_char_name[25], s_char_location[25];
static char s_market_item_desc[20], s_market_item_value1[9], s_market_item_value2[9], s_market_item_value3[9];

static int s_retry_time = 30;

static void update_string_text_layer(Tuple *tuple, char *buffer, int buffer_size, TextLayer *layer) {
  if(tuple) {
    snprintf(buffer, buffer_size, "%s", tuple->value->cstring);   

    text_layer_set_text(layer, buffer);
  }
}

static void inbox_received_callback(DictionaryIterator *iterator, void *context) {
  APP_LOG(APP_LOG_LEVEL_INFO, "Receiving eve dictionary");
  
  Tuple *user_count_tuple = dict_find(iterator, MESSAGE_KEY_EVE_USER_COUNT);
  update_string_text_layer(user_count_tuple, s_user_count, sizeof(s_user_count), view->user_count_layer);
  
  Tuple *service_status_tuple = dict_find(iterator, MESSAGE_KEY_EVE_SERVICE_STATUS);
  update_string_text_layer(service_status_tuple,s_service_status, sizeof(s_service_status), view->service_status_layer);
  
  if(user_count_tuple && service_status_tuple) {
    if (strcmp(service_status_tuple->value->cstring, "online") != 0
        || user_count_tuple->value->int32 == 0) {
        APP_LOG(APP_LOG_LEVEL_INFO, "Retry every 5 minutes");
        s_retry_time = 5;
    } else {
      APP_LOG(APP_LOG_LEVEL_INFO, "Retry every 30 minutes");
      s_retry_time = 30;
    }
  }
   
  Tuple *market_item_desc_tuple = dict_find(iterator, MESSAGE_KEY_MARKET_ITEM_DESC);
  Tuple *market_item_value1_tuple = dict_find(iterator, MESSAGE_KEY_MARKET_ITEM_VALUE1);
  Tuple *market_item_value2_tuple = dict_find(iterator, MESSAGE_KEY_MARKET_ITEM_VALUE2);
  Tuple *market_item_value3_tuple = dict_find(iterator, MESSAGE_KEY_MARKET_ITEM_VALUE3);
  if(market_item_desc_tuple && market_item_value1_tuple && market_item_value2_tuple && market_item_value3_tuple) {   
    update_string_text_layer(market_item_desc_tuple, s_market_item_desc, sizeof(s_market_item_desc), view->market_item_desc_layer);    
    update_string_text_layer(market_item_value1_tuple, s_market_item_value1, sizeof(s_market_item_value1), view->market_item_value1_layer);    
    update_string_text_layer(market_item_value2_tuple, s_market_item_value2, sizeof(s_market_item_value2), view->market_item_value2_layer);    
    update_string_text_layer(market_item_value3_tuple, s_market_item_value3, sizeof(s_market_item_value3), view->market_item_value3_layer);    
  }
  
  Tuple *char_name_tuple = dict_find(iterator, MESSAGE_KEY_CHAR_NAME);
  Tuple *char_location_tuple = dict_find(iterator, MESSAGE_KEY_CHAR_LOCATION);
  if(char_name_tuple && char_location_tuple) {
    update_string_text_layer(char_name_tuple, s_char_name, sizeof(s_char_name), view->service_status_layer);
    update_string_text_layer(char_location_tuple, s_char_location, sizeof(s_char_location), view->user_count_layer);     
  }
}

static void update() {
    DictionaryIterator *iter;
    app_message_outbox_begin(&iter);

    dict_write_uint8(iter, 0, 0);

    app_message_outbox_send();
}

static void inbox_dropped_callback(AppMessageResult reason, void *context) {
  APP_LOG(APP_LOG_LEVEL_ERROR, "Message dropped!");
}

static void outbox_failed_callback(DictionaryIterator *iterator, AppMessageResult reason, void *context) {
  APP_LOG(APP_LOG_LEVEL_ERROR, "Outbox send failed!");
}

static void outbox_sent_callback(DictionaryIterator *iterator, void *context) {
  APP_LOG(APP_LOG_LEVEL_INFO, "Outbox send success!");
}

void eve_timed_update(struct tm *tick_time) {
  if(tick_time->tm_min % s_retry_time == 2) {  
    update();
  }
}

void eve_update() {
  update();
}

void eve_last_seen() {
  if (strlen(s_char_name) > 0 && strlen(s_char_location) > 0) {
    text_layer_set_text(view->service_status_layer, s_char_name);  
    text_layer_set_text(view->user_count_layer, s_char_location);  
  }
}

static void init_string(const uint32_t key, char *buffer, int buffer_size, char *default_value) {  
  if (persist_exists(key)) {
    persist_read_string(key, buffer, buffer_size);
  } else {
    snprintf(buffer, buffer_size, "%s", default_value);
  }
}

void eve_initialise(MainView *data) {
  init_string(MESSAGE_KEY_EVE_USER_COUNT, s_user_count, sizeof(s_user_count), "?");
  init_string(MESSAGE_KEY_EVE_SERVICE_STATUS, s_service_status, sizeof(s_service_status), "unknown");
  init_string(MESSAGE_KEY_MARKET_ITEM_DESC, s_market_item_desc, sizeof(s_market_item_desc), "");
  init_string(MESSAGE_KEY_MARKET_ITEM_VALUE1, s_market_item_value1, sizeof(s_market_item_value1), "");
  init_string(MESSAGE_KEY_MARKET_ITEM_VALUE2, s_market_item_value2, sizeof(s_market_item_value2), "");
  init_string(MESSAGE_KEY_MARKET_ITEM_VALUE3, s_market_item_value3, sizeof(s_market_item_value3), "");
  init_string(MESSAGE_KEY_CHAR_NAME, s_char_name, sizeof(s_char_name), "");
  init_string(MESSAGE_KEY_CHAR_LOCATION, s_char_location, sizeof(s_char_location), "");
   
  view = data;
  
  text_layer_set_text(view->user_count_layer, s_user_count);
  text_layer_set_text(view->service_status_layer, s_service_status);  
  text_layer_set_text(view->market_item_desc_layer, s_market_item_desc);
  text_layer_set_text(view->market_item_value1_layer, s_market_item_value1);
  text_layer_set_text(view->market_item_value2_layer, s_market_item_value2);
  text_layer_set_text(view->market_item_value3_layer, s_market_item_value3);
  
  app_message_register_inbox_received(inbox_received_callback);
  app_message_register_inbox_dropped(inbox_dropped_callback);
  app_message_register_outbox_failed(outbox_failed_callback);
  app_message_register_outbox_sent(outbox_sent_callback);

  app_message_open(APP_MESSAGE_INBOX_SIZE_MINIMUM, APP_MESSAGE_OUTBOX_SIZE_MINIMUM);
}
  
void eve_terminate() {
  persist_write_string(MESSAGE_KEY_EVE_USER_COUNT, s_user_count);
  persist_write_string(MESSAGE_KEY_EVE_SERVICE_STATUS, s_service_status);
  persist_write_string(MESSAGE_KEY_MARKET_ITEM_DESC, s_market_item_desc);
  persist_write_string(MESSAGE_KEY_MARKET_ITEM_VALUE1, s_market_item_value1);
  persist_write_string(MESSAGE_KEY_MARKET_ITEM_VALUE2, s_market_item_value2);
  persist_write_string(MESSAGE_KEY_MARKET_ITEM_VALUE3, s_market_item_value3);
  persist_write_string(MESSAGE_KEY_CHAR_NAME, s_char_name);
  persist_write_string(MESSAGE_KEY_CHAR_LOCATION, s_char_location);
}

