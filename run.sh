#!/bin/bash
set -e

echo "Building Zig backend..."
cd src/zig && zig build -Doptimize=ReleaseFast && cd ../..

echo "Building Swift app..."
swift build

BIN_PATH=$(swift build --show-bin-path)
cp src/zig/zig-out/lib/libscreencopy.dylib "$BIN_PATH/"

echo "Launching Screencopy..."
"$BIN_PATH/Screencopy"
