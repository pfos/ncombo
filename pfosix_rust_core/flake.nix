# flake.nix
{
  description = "Development environment for PFOSIX Rust/WASM components";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable"; # Or a specific stable Nixpkgs commit/tag

    # Recommended: oxalica/rust-overlay for robust Rust toolchain management in Nix
    rust-overlay.url = "github:oxalica/rust-overlay";
    rust-overlay.inputs.nixpkgs.follows = "nixpkgs"; # Ensures rust-overlay uses the same nixpkgs
  };

  outputs = { self, nixpkgs, rust-overlay, ... }@inputs:
    let
      # Specify your target system(s)
      supportedSystems = ["x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin"];

      # Helper to generate outputs for each supported system
      forEachSupportedSystem = f: nixpkgs.lib.genAttrs supportedSystems (system: f {
        pkgs = import nixpkgs { inherit system; overlays = [ rust-overlay.overlays.default ]; };
      });

    in
    {
      # Development shell available via `nix develop`
      devShells = forEachSupportedSystem ({ pkgs }: {
        default = pkgs.mkShell {
          packages = [
            # Rust toolchain from rust-overlay, configured with wasm32-wasi target
            (pkgs.rust-bin.stable."1.76.0".default.override { # Check rust-overlay for latest stable version
              targets = ["wasm32-wasi" "wasm32-unknown-unknown"];
              extensions = ["rust-src"]; # For rust-analyzer
            })

            # wasm-pack: For building and packaging Rust WASM crates
            pkgs.wasm-pack

            # Other useful development tools (optional)
            pkgs.pkg-config # Often needed for building system libraries
            # Add any other system dependencies your Rust project might have
          ];

          # Environment variables to set in the shell (optional)
          # RUST_SRC_PATH is often set automatically by rust-overlay's toolchain.
          # RUST_BACKTRACE = "1"; # For more detailed Rust panic messages

          shellHook = ''
            echo "---------------------------------------------------------------------"
            echo " PFOSIX Rust/WASM Development Environment (Nix Flake)"
            echo "---------------------------------------------------------------------"
            echo "Available tools: Rust (with wasm32-wasi target), wasm-pack"
            echo "To build pfosix_rust_core:"
            echo "  wasm-pack build --target nodejs  # For Node.js/WASI environments"
            echo "  OR"
            echo "  wasm-pack build --target web     # For browser environments"
            echo "  OR"
            echo "  cargo build --target wasm32-wasi # For a raw WASM file"
            echo "---------------------------------------------------------------------"
          '';
        };
      });
    };
}
