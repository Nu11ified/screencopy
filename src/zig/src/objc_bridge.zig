pub const c = @cImport({
    @cInclude("objc_wrapper.h");
});

// Re-export commonly used types
pub const id = c.id;
pub const SEL = c.SEL;
pub const Class = c.Class;
pub const BOOL = c.BOOL;
pub const NSUInteger = c.NSUInteger;
pub const NSInteger = c.NSInteger;

pub const CGRect = c.CGRect;
pub const CGPoint = c.CGPoint;
pub const CGSize = c.CGSize;
pub const CGFloat = c.CGFloat;
pub const CGImageRef = c.CGImageRef;
pub const CGDirectDisplayID = c.CGDirectDisplayID;

pub const YES: BOOL = true;
pub const NO: BOOL = false;

// Convenience wrappers

pub fn getClass(name: [*:0]const u8) ?Class {
    return c.objc_getClass(name);
}

pub fn sel(name: [*:0]const u8) SEL {
    return c.sel_registerName(name);
}

pub fn msg(target: id, selector: SEL) id {
    return c.sc_msg(target, selector);
}

pub fn msgId(target: id, selector: SEL, arg: id) id {
    return c.sc_msg_id(target, selector, arg);
}

pub fn msgIdId(target: id, selector: SEL, arg1: id, arg2: id) id {
    return c.sc_msg_id_id(target, selector, arg1, arg2);
}

pub fn msgPtrPtr(target: id, selector: SEL, arg1: ?*anyopaque, arg2: ?*anyopaque) id {
    return c.sc_msg_ptr_ptr(target, selector, arg1, arg2);
}

pub fn msgStr(target: id, selector: SEL, str: [*:0]const u8) id {
    return c.sc_msg_str(target, selector, str);
}

pub fn msgUInt(target: id, selector: SEL, val: NSUInteger) id {
    return c.sc_msg_uint(target, selector, val);
}

pub fn msgVoidInt(target: id, selector: SEL, val: NSInteger) void {
    c.sc_msg_void_int(target, selector, val);
}

pub fn msgVoidBool(target: id, selector: SEL, val: BOOL) void {
    c.sc_msg_void_bool(target, selector, val);
}

pub fn msgVoid(target: id, selector: SEL) void {
    c.sc_msg_void(target, selector);
}

pub fn msgBoolIdPtr(target: id, selector: SEL, arg1: id, arg2: *?id) bool {
    return c.sc_msg_bool_id_ptr(target, selector, arg1, @ptrCast(arg2));
}

pub fn msgCount(target: id, selector: SEL) NSUInteger {
    return c.sc_msg_count(target, selector);
}

pub fn msgUtf8(target: id, selector: SEL) ?[*:0]const u8 {
    return c.sc_msg_utf8(target, selector);
}

// NSString helpers
pub fn nsString(str: [*:0]const u8) id {
    const NSString = getClass("NSString").?;
    return msgStr(@ptrCast(@alignCast(NSString)), sel("stringWithUTF8String:"), str);
}

pub fn cString(ns_str: id) ?[*:0]const u8 {
    return msgUtf8(ns_str, sel("UTF8String"));
}

// Alloc + init shortcut
pub fn allocInit(class_name: [*:0]const u8) id {
    const cls = getClass(class_name).?;
    const alloc = msg(@ptrCast(@alignCast(cls)), sel("alloc"));
    return msg(alloc, sel("init"));
}
