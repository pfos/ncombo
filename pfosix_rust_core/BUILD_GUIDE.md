# PFOSIX Rust Core - Build Guide (NixOS & WASM)

This guide provides instructions for setting up a reproducible build environment on NixOS using Nix Flakes to compile the `pfosix_rust_core` crate into a WebAssembly (WASM) binary, targeting `wasm32-wasi`.

## Prerequisites

*   **Nix with Flakes Enabled:** Ensure Nix is installed on your NixOS system and that Flakes are enabled.
*   **Project Structure:** This guide assumes `pfosix_rust_core` is a directory within your larger `hOMePod` project, or it's the root of your current work. A `flake.nix` file should be present at the root of the scope you intend to manage with Nix.

## 1. Nix Flake Configuration (`flake.nix`)

Create or update your `flake.nix` file (e.g., in the `hOMePod` project root, or directly in `pfosix_rust_core` if it's managed as a standalone flake). This example focuses on providing a development shell with the necessary tools.

```nix
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
      supportedSystems = ["x86_64-linux", "aarch64-linux", "x86_64-darwin", "aarch64-darwin"];

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
              targets = ["wasm32-wasi"];
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
            echo "  cd pfosix_rust_core"
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
```

**Key points in this `flake.nix`:**
*   It uses `oxalica/rust-overlay` for a more robust Rust toolchain that explicitly includes the `wasm32-wasi` target. This avoids needing `rustup target add` inside the shell.
*   `wasm-pack` is included in `packages`.
*   The `shellHook` provides useful information when the environment is activated.

**To activate this environment:**
Run `nix develop` from the directory containing this `flake.nix`.

## 2. Build Commands

Once your Nix development shell is active (after `nix develop`), navigate to the `pfosix_rust_core` directory (if your flake is at a higher level).

Choose one of the following build methods:

### Using `wasm-pack` (Recommended for Interoperability)

`wasm-pack` bundles your WASM with JavaScript wrappers and a `package.json`.

*   **For Node.js or WASI-compliant environments:**
    ```bash
    wasm-pack build --target nodejs
    ```
    Output: `pfosix_rust_core/pkg/` directory containing the `.wasm` file, JS bindings, `package.json`, etc.

*   **For web browser environments (ES6 modules):**
    ```bash
    wasm-pack build --target web
    ```
    Output: `pfosix_rust_core/pkg/` directory, similar to `nodejs` target but JS tailored for web.

### Using `cargo build` (For a Raw WASM File)

This produces only the `.wasm` file.

*   **Debug build:**
    ```bash
    cargo build --target wasm32-wasi
    ```
    Output: `pfosix_rust_core/target/wasm32-wasi/debug/pfosix_rust_core.wasm`

*   **Release build (optimized):**
    ```bash
    cargo build --target wasm32-wasi --release
    ```
    Output: `pfosix_rust_core/target/wasm32-wasi/release/pfosix_rust_core.wasm`

## 3. Understanding Build Outputs

*   **`wasm-pack` output (in `pkg/` directory):**
    *   `pfosix_rust_core_bg.wasm`: The compiled WASM binary.
    *   `pfosix_rust_core.js`: JavaScript bindings.
    *   `pfosix_rust_core.d.ts`: TypeScript type definitions.
    *   `package.json`: Makes the `pkg` directory a usable npm package.

*   **`cargo build` output (in `target/wasm32-wasi/...` directory):**
    *   `pfosix_rust_core.wasm`: The raw compiled WASM binary.

## 4. Next Steps

With your compiled WASM module:
*   **Integrate with `Wanix` or `SpacetimeDB`**: Follow their specific mechanisms for loading and interacting with WASM modules. The `wasm-pack` output is generally easier for JavaScript/TypeScript-based environments.
*   **Use in other WASI Runtimes**: Tools like `wasmtime` or `wasmer` can run the `.wasm` file directly if it's structured as an executable (which our current library is not, it needs a host).
*   **Develop a Host Application**: Create a simple application (e.g., in Node.js, Deno, or a browser environment) to load and test your WASM module's functions. See the Node.js example in the previous plan step's output.

This build pipeline setup ensures that your `pfosix_rust_core` components can be reliably compiled into WASM, ready for integration into the `LocalFirst Compute on Data (COD)` vision of the PFOSIX Uzerverse.
