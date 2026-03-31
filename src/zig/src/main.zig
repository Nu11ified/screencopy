const capture = @import("capture.zig");
const ocr = @import("ocr.zig");

const VERSION: [*:0]const u8 = "0.1.0";

export fn sc_init() callconv(.c) i32 {
    return 0;
}

export fn sc_deinit() callconv(.c) void {}

export fn sc_capture_fullscreen(display_id: u32, out_path: [*:0]const u8) callconv(.c) i32 {
    return capture.captureFullscreen(display_id, out_path);
}

export fn sc_capture_region(x: i32, y: i32, w: i32, h: i32, out_path: [*:0]const u8) callconv(.c) i32 {
    return capture.captureRegion(x, y, w, h, out_path);
}

export fn sc_ocr_from_file(image_path: [*:0]const u8, result_buf: [*]u8, buf_len: u32) callconv(.c) i32 {
    return ocr.ocrFromFile(image_path, result_buf, buf_len);
}

export fn sc_capture_and_ocr(
    display_id: u32,
    x: i32,
    y: i32,
    w: i32,
    h: i32,
    image_out_path: [*:0]const u8,
    text_buf: [*]u8,
    text_buf_len: u32,
) callconv(.c) i32 {
    // Save screenshot
    if (w != 0 and h != 0) {
        const r = capture.captureRegion(x, y, w, h, image_out_path);
        if (r < 0) return r;
    } else {
        const r = capture.captureFullscreen(display_id, image_out_path);
        if (r < 0) return r;
    }

    // Capture for OCR
    const cg_image = capture.captureForOCR(display_id, x, y, w, h) orelse return -1;
    defer capture.releaseImage(cg_image);

    return ocr.recognizeText(cg_image, text_buf, text_buf_len);
}

export fn sc_version() callconv(.c) [*:0]const u8 {
    return VERSION;
}
