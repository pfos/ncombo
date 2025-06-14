WASM assets will be placed here.

**Important Build Step:**

The `pfosix_rust_core.js` in this directory is a simulated version of the JavaScript glue code that `wasm-pack` generates. The `pfosix_rust_core_bg.wasm` file is a placeholder.

To make the host application functional:
1. Navigate to the `pfosix_rust_core` directory.
2. Run the command: `wasm-pack build --target web`
   (Ensure you have `wasm-pack` and the `wasm32-wasi` Rust target installed, as per the `BUILD_GUIDE.md` in `pfosix_rust_core`).
3. This will create a `pkg/` directory inside `pfosix_rust_core`.
4. Copy the generated `pfosix_rust_core_bg.wasm` and `pfosix_rust_core.js` files from `pfosix_rust_core/pkg/` into this `uix_host_poc/wasm/` directory, replacing the placeholder files.
