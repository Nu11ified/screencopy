const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const mod = b.createModule(.{
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
        .link_libc = true,
    });

    // Add src/ directory for C header includes
    mod.addIncludePath(b.path("src"));

    // Link macOS frameworks
    mod.linkFramework("CoreGraphics", .{});
    mod.linkFramework("Vision", .{});
    mod.linkFramework("Foundation", .{});
    mod.linkFramework("AppKit", .{});
    mod.linkFramework("ImageIO", .{});
    mod.linkFramework("CoreImage", .{});
    mod.linkSystemLibrary("objc", .{});

    const lib = b.addLibrary(.{
        .linkage = .dynamic,
        .name = "screencopy",
        .root_module = mod,
    });

    b.installArtifact(lib);
}
