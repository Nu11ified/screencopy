const objc = @import("objc_bridge.zig");
const c = objc.c;

/// Capture the entire screen and save as PNG
pub fn captureFullscreen(display_id: u32, out_path: [*:0]const u8) i32 {
    const display: c.CGDirectDisplayID = if (display_id == 0) c.CGMainDisplayID() else display_id;
    const image = c.CGDisplayCreateImage(display) orelse return -1;
    defer c.CGImageRelease(image);
    return savePNG(image, out_path);
}

/// Capture a region of the screen and save as PNG
pub fn captureRegion(x: i32, y: i32, w: i32, h: i32, out_path: [*:0]const u8) i32 {
    const display = c.CGMainDisplayID();
    const rect = c.CGRect{
        .origin = .{ .x = @floatFromInt(x), .y = @floatFromInt(y) },
        .size = .{ .width = @floatFromInt(w), .height = @floatFromInt(h) },
    };
    const image = c.CGDisplayCreateImageForRect(display, rect) orelse return -1;
    defer c.CGImageRelease(image);
    return savePNG(image, out_path);
}

fn savePNG(image: c.CGImageRef, path: [*:0]const u8) i32 {
    const path_str = objc.nsString(path);
    const file_url = objc.msgId(
        @ptrCast(@alignCast(objc.getClass("NSURL").?)),
        objc.sel("fileURLWithPath:"),
        path_str,
    );
    const png_type = objc.nsString("public.png");

    const dest = c.CGImageDestinationCreateWithURL(
        @ptrCast(file_url),
        @ptrCast(png_type),
        1,
        null,
    ) orelse return -2;
    defer c.CFRelease(@ptrCast(dest));

    c.CGImageDestinationAddImage(dest, image, null);
    if (!c.CGImageDestinationFinalize(dest)) return -3;
    return 0;
}

/// Get a CGImage for OCR processing (caller must release)
pub fn captureForOCR(display_id: u32, x: i32, y: i32, w: i32, h: i32) ?c.CGImageRef {
    const display: c.CGDirectDisplayID = if (display_id == 0) c.CGMainDisplayID() else display_id;
    if (w == 0 and h == 0) {
        return c.CGDisplayCreateImage(display);
    }
    const rect = c.CGRect{
        .origin = .{ .x = @floatFromInt(x), .y = @floatFromInt(y) },
        .size = .{ .width = @floatFromInt(w), .height = @floatFromInt(h) },
    };
    return c.CGDisplayCreateImageForRect(display, rect);
}

pub fn releaseImage(image: c.CGImageRef) void {
    c.CGImageRelease(image);
}
