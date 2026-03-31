#pragma once
#include <stdint.h>

int32_t sc_init(void);
void sc_deinit(void);
int32_t sc_capture_fullscreen(uint32_t display_id, const char* out_path);
int32_t sc_capture_region(int32_t x, int32_t y, int32_t w, int32_t h, const char* out_path);
int32_t sc_ocr_from_file(const char* image_path, uint8_t* result_buf, uint32_t buf_len);
int32_t sc_capture_and_ocr(uint32_t display_id, int32_t x, int32_t y, int32_t w, int32_t h,
                           const char* image_out_path, uint8_t* text_buf, uint32_t text_buf_len);
const char* sc_version(void);
