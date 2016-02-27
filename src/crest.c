#include "crest.h"

static TextLayer *s_user_count_layer, *s_service_status_layer;

static char s_user_count[9], s_service_status[9];

static void inbox_received_callback(DictionaryIterator *iterator, void *context) {
  APP_LOG(APP_LOG_LEVEL_INFO, "Receiving crest dictionary");
  
  Tuple *user_count_tuple = dict_find(iterator, CREST_KEY_EVE_USER_COUNT);
  if(user_count_tuple) {
    snprintf(s_user_count, sizeof(s_user_count), "%d", (int)user_count_tuple->value->int32);   

    text_layer_set_text(s_user_count_layer, s_user_count);
  }
  
  Tuple *service_status_tuple = dict_find(iterator, CREST_KEY_EVE_SERVICE_STATUS);
  if(service_status_tuple) {
    snprintf(s_service_status, sizeof(s_service_status), "%s", service_status_tuple->value->cstring);   

    text_layer_set_text(s_service_status_layer, s_service_status);
  }
}

static void update_crest(struct tm *tick_time) {
  if((tick_time->tm_hour == 11 && tick_time->tm_min < 30 && tick_time->tm_min % 5 == 0) 
     || tick_time->tm_min % 30 == 0) {   
    DictionaryIterator *iter;
    app_message_outbox_begin(&iter);

    dict_write_uint8(iter, 0, 0);

    app_message_outbox_send();
  }
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


void crest_update(struct tm *tick_time) {
  update_crest(tick_time);
}

static void init_string(const uint32_t key, char *buffer, int buffer_size, char *default_value) {  
  if (persist_exists(key)) {
    persist_read_string(key, buffer, buffer_size);
  } else {
    snprintf(buffer, buffer_size, "%s", default_value);
  }
}

void crest_initialise(MainView *data) {
  init_string(CREST_KEY_EVE_USER_COUNT, s_user_count, sizeof(s_user_count), "?");
  init_string(CREST_KEY_EVE_SERVICE_STATUS, s_service_status, sizeof(s_service_status), "unknown");
  
  s_user_count_layer = data->user_count_layer;
  s_service_status_layer = data->service_status_layer;
  
  text_layer_set_text(s_user_count_layer, s_user_count);
  text_layer_set_text(s_service_status_layer, s_service_status);
  
  app_message_register_inbox_received(inbox_received_callback);
  app_message_register_inbox_dropped(inbox_dropped_callback);
  app_message_register_outbox_failed(outbox_failed_callback);
  app_message_register_outbox_sent(outbox_sent_callback);

  app_message_open(app_message_inbox_size_maximum(), app_message_outbox_size_maximum());
}
  
void crest_terminate() {
   persist_write_string(CREST_KEY_EVE_USER_COUNT, s_user_count);
  persist_write_string(CREST_KEY_EVE_SERVICE_STATUS, s_service_status);
}

