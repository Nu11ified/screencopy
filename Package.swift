// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "Screencopy",
    platforms: [.macOS(.v14)],
    targets: [
        .systemLibrary(
            name: "CScreencopy",
            path: "Sources/CScreencopy",
            pkgConfig: nil,
            providers: nil
        ),
        .executableTarget(
            name: "Screencopy",
            dependencies: ["CScreencopy"],
            path: "Sources/Screencopy",
            swiftSettings: [
                .swiftLanguageMode(.v5),
            ],
            linkerSettings: [
                .linkedLibrary("screencopy"),
                .unsafeFlags(["-L", "\(Context.packageDirectory)/src/zig/zig-out/lib"]),
                .linkedFramework("Carbon"),
            ]
        ),
    ]
)
