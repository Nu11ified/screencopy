const std = @import("std");
const objc = @import("objc_bridge.zig");
const c = objc.c;

/// Perform OCR on a CGImage using Apple's Vision framework.
/// Returns number of bytes written to text_buf, or negative error code.
pub fn recognizeText(image: c.CGImageRef, text_buf: [*]u8, buf_len: u32) i32 {
    const pool = objc.msg(@ptrCast(@alignCast(objc.getClass("NSAutoreleasePool").?)), objc.sel("new"));
    const result = performOCR(@ptrCast(image), text_buf, buf_len);
    objc.msgVoid(pool, objc.sel("drain"));
    return result;
}

fn performOCR(image_ptr: ?*anyopaque, text_buf: [*]u8, buf_len: u32) i32 {
    const handler_alloc = objc.msg(@ptrCast(@alignCast(objc.getClass("VNImageRequestHandler").?)), objc.sel("alloc"));
    const handler = objc.msgPtrPtr(handler_alloc, objc.sel("initWithCGImage:options:"), image_ptr, null);

    const request = objc.allocInit("VNRecognizeTextRequest");
    objc.msgVoidInt(request, objc.sel("setRecognitionLevel:"), 1);
    objc.msgVoidBool(request, objc.sel("setUsesLanguageCorrection:"), objc.YES);

    const requests_array = objc.msgId(
        @ptrCast(@alignCast(objc.getClass("NSArray").?)),
        objc.sel("arrayWithObject:"),
        request,
    );

    var error_ptr: ?objc.id = null;
    const success = objc.msgBoolIdPtr(handler, objc.sel("performRequests:error:"), requests_array, &error_ptr);
    if (!success) return -12;

    const results = objc.msg(request, objc.sel("results"));
    const count = objc.msgCount(results, objc.sel("count"));
    if (count == 0) return 0;

    return extractText(results, count, text_buf, buf_len);
}

fn extractText(results: objc.id, count: objc.NSUInteger, text_buf: [*]u8, buf_len: u32) i32 {
    var offset: u32 = 0;
    var i: objc.NSUInteger = 0;
    while (i < count) : (i += 1) {
        const observation = objc.msgUInt(results, objc.sel("objectAtIndex:"), i);
        const candidates = objc.msgUInt(observation, objc.sel("topCandidates:"), 1);
        if (objc.msgCount(candidates, objc.sel("count")) == 0) continue;

        const candidate = objc.msgUInt(candidates, objc.sel("objectAtIndex:"), 0);
        const ns_string = objc.msg(candidate, objc.sel("string"));
        const c_str = objc.cString(ns_string) orelse continue;

        const len: u32 = @intCast(std.mem.len(c_str));
        if (offset + len + 1 >= buf_len) break;

        if (offset > 0) {
            text_buf[offset] = '\n';
            offset += 1;
        }

        @memcpy(text_buf[offset .. offset + len], c_str[0..len]);
        offset += len;
    }

    return @intCast(offset);
}

/// Perform OCR on an image file at the given path.
pub fn ocrFromFile(image_path: [*:0]const u8, text_buf: [*]u8, buf_len: u32) i32 {
    const pool = objc.msg(@ptrCast(@alignCast(objc.getClass("NSAutoreleasePool").?)), objc.sel("new"));
    const result = ocrFromFileInner(image_path, text_buf, buf_len);
    objc.msgVoid(pool, objc.sel("drain"));
    return result;
}

fn ocrFromFileInner(image_path: [*:0]const u8, text_buf: [*]u8, buf_len: u32) i32 {
    const path_str = objc.nsString(image_path);
    const file_url = objc.msgId(
        @ptrCast(@alignCast(objc.getClass("NSURL").?)),
        objc.sel("fileURLWithPath:"),
        path_str,
    );

    const handler_alloc = objc.msg(@ptrCast(@alignCast(objc.getClass("VNImageRequestHandler").?)), objc.sel("alloc"));
    const handler = objc.msgPtrPtr(handler_alloc, objc.sel("initWithURL:options:"), @ptrCast(file_url), null);

    const request = objc.allocInit("VNRecognizeTextRequest");
    objc.msgVoidInt(request, objc.sel("setRecognitionLevel:"), 1);
    objc.msgVoidBool(request, objc.sel("setUsesLanguageCorrection:"), objc.YES);

    const requests_array = objc.msgId(
        @ptrCast(@alignCast(objc.getClass("NSArray").?)),
        objc.sel("arrayWithObject:"),
        request,
    );

    var error_ptr: ?objc.id = null;
    const success = objc.msgBoolIdPtr(handler, objc.sel("performRequests:error:"), requests_array, &error_ptr);
    if (!success) return -12;

    const results = objc.msg(request, objc.sel("results"));
    const count = objc.msgCount(results, objc.sel("count"));
    if (count == 0) return 0;

    return extractText(results, count, text_buf, buf_len);
}
