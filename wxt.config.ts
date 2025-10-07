import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    permissions: ["contextMenus", "activeTab"],
    /**
     * Keyboard Commands
     *
     * Define keyboard shortcuts for the extension.
     * Chrome will show these in chrome://extensions/shortcuts
     *
     * "capture-url": The command name (used in background.ts)
     * suggested_key: Default keyboard shortcut
     *   - default: Works on Windows/Linux (Ctrl+Shift+U)
     *   - mac: Works on Mac (Command+Shift+U)
     * description: Shown to users in the shortcuts settings
     */
    commands: {
      "capture-url": {
        suggested_key: {
          default: "Ctrl+Shift+U",
          mac: "Command+Shift+U",
        },
        description: "Capture current page URL in PocketLM",
      },
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }),
});
