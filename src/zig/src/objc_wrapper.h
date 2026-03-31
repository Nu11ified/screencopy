#pragma once
#include <stdint.h>
#include <stdbool.h>
#include <objc/runtime.h>
#include <objc/message.h>
#include <CoreGraphics/CoreGraphics.h>
#include <ImageIO/ImageIO.h>

// Foundation types (can't import Foundation.h in C mode for Zig's @cImport)
typedef long NSInteger;
typedef unsigned long NSUInteger;
// BOOL already defined by objc/runtime.h

// Typed wrappers around objc_msgSend

static inline id sc_msg(id self, SEL op) {
    return ((id (*)(id, SEL))objc_msgSend)(self, op);
}

static inline id sc_msg_id(id self, SEL op, id arg) {
    return ((id (*)(id, SEL, id))objc_msgSend)(self, op, arg);
}

static inline id sc_msg_id_id(id self, SEL op, id arg1, id arg2) {
    return ((id (*)(id, SEL, id, id))objc_msgSend)(self, op, arg1, arg2);
}

static inline id sc_msg_ptr_ptr(id self, SEL op, void* arg1, void* arg2) {
    return ((id (*)(id, SEL, void*, void*))objc_msgSend)(self, op, arg1, arg2);
}

static inline id sc_msg_str(id self, SEL op, const char* str) {
    return ((id (*)(id, SEL, const char*))objc_msgSend)(self, op, str);
}

static inline id sc_msg_uint(id self, SEL op, NSUInteger val) {
    return ((id (*)(id, SEL, NSUInteger))objc_msgSend)(self, op, val);
}

static inline void sc_msg_void_int(id self, SEL op, NSInteger val) {
    ((void (*)(id, SEL, NSInteger))objc_msgSend)(self, op, val);
}

static inline void sc_msg_void_bool(id self, SEL op, BOOL val) {
    ((void (*)(id, SEL, BOOL))objc_msgSend)(self, op, val);
}

static inline void sc_msg_void(id self, SEL op) {
    ((void (*)(id, SEL))objc_msgSend)(self, op);
}

static inline BOOL sc_msg_bool_id_ptr(id self, SEL op, id arg1, id* arg2) {
    return ((BOOL (*)(id, SEL, id, id*))objc_msgSend)(self, op, arg1, arg2);
}

static inline NSUInteger sc_msg_count(id self, SEL op) {
    return ((NSUInteger (*)(id, SEL))objc_msgSend)(self, op);
}

static inline const char* sc_msg_utf8(id self, SEL op) {
    return ((const char* (*)(id, SEL))objc_msgSend)(self, op);
}
