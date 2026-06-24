// vite.config.js
import { defineConfig } from "file:///var/www/html/node_modules/vite/dist/node/index.js";
import laravel from "file:///var/www/html/node_modules/laravel-vite-plugin/dist/index.js";
import react from "file:///var/www/html/node_modules/@vitejs/plugin-react/dist/index.js";
import { resolve } from "node:path";
import { glob } from "file:///var/www/html/node_modules/glob/dist/esm/index.js";
var __vite_injected_original_dirname = "/var/www/html";
var workdoPackages = glob.sync("packages/workdo/*/src/Resources/js/app.tsx");
var vite_config_default = defineConfig({
  base: "./",
  plugins: [
    laravel({
      input: [
        "resources/css/app.css",
        "resources/js/app.tsx",
        ...workdoPackages
      ],
      refresh: true
    }),
    react()
  ],
  server: {
    // In Docker the dev server must bind 0.0.0.0; locally it stays on
    // localhost. The browser still connects to VITE_HMR_HOST (localhost).
    host: process.env.VITE_DEV_SERVER_HOST || "localhost",
    hmr: {
      host: process.env.VITE_HMR_HOST || "localhost"
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "*"
    },
    watch: {
      ignored: ["**/vendor/**", "**/node_modules/**"]
    },
    fs: {
      allow: ["..", "packages"]
    }
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react"
  },
  resolve: {
    alias: {
      "ziggy-js": resolve(__vite_injected_original_dirname, "vendor/tightenco/ziggy")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          utils: ["date-fns", "clsx"]
        }
      }
    },
    assetsDir: "assets"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvdmFyL3d3dy9odG1sXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvdmFyL3d3dy9odG1sL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy92YXIvd3d3L2h0bWwvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBsYXJhdmVsIGZyb20gJ2xhcmF2ZWwtdml0ZS1wbHVnaW4nO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgZ2xvYiB9IGZyb20gJ2dsb2InO1xuXG5jb25zdCB3b3JrZG9QYWNrYWdlcyA9IGdsb2Iuc3luYygncGFja2FnZXMvd29ya2RvLyovc3JjL1Jlc291cmNlcy9qcy9hcHAudHN4Jyk7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gICAgYmFzZTogJy4vJyxcbiAgICBwbHVnaW5zOiBbXG4gICAgICAgIGxhcmF2ZWwoe1xuICAgICAgICAgICAgaW5wdXQ6XG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgJ3Jlc291cmNlcy9jc3MvYXBwLmNzcycsXG4gICAgICAgICAgICAgICAgJ3Jlc291cmNlcy9qcy9hcHAudHN4JyxcbiAgICAgICAgICAgICAgICAuLi53b3JrZG9QYWNrYWdlc1xuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlZnJlc2g6IHRydWUsXG4gICAgICAgIH0pLFxuICAgICAgICByZWFjdCgpLFxuICAgIF0sXG4gICAgc2VydmVyOiB7XG4gICAgICAgIC8vIEluIERvY2tlciB0aGUgZGV2IHNlcnZlciBtdXN0IGJpbmQgMC4wLjAuMDsgbG9jYWxseSBpdCBzdGF5cyBvblxuICAgICAgICAvLyBsb2NhbGhvc3QuIFRoZSBicm93c2VyIHN0aWxsIGNvbm5lY3RzIHRvIFZJVEVfSE1SX0hPU1QgKGxvY2FsaG9zdCkuXG4gICAgICAgIGhvc3Q6IHByb2Nlc3MuZW52LlZJVEVfREVWX1NFUlZFUl9IT1NUIHx8ICdsb2NhbGhvc3QnLFxuICAgICAgICBobXI6IHtcbiAgICAgICAgICAgIGhvc3Q6IHByb2Nlc3MuZW52LlZJVEVfSE1SX0hPU1QgfHwgJ2xvY2FsaG9zdCcsXG4gICAgICAgIH0sXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6ICdHRVQsUE9TVCxQVVQsREVMRVRFLE9QVElPTlMnLFxuICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiAnKicsXG4gICAgICAgIH0sXG4gICAgICAgIHdhdGNoOiB7XG4gICAgICAgICAgICBpZ25vcmVkOiBbJyoqL3ZlbmRvci8qKicsICcqKi9ub2RlX21vZHVsZXMvKionXVxuICAgICAgICB9LFxuICAgICAgICBmczoge1xuICAgICAgICAgICAgYWxsb3c6IFsnLi4nLCAncGFja2FnZXMnXVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGVzYnVpbGQ6IHtcbiAgICAgICAganN4OiAnYXV0b21hdGljJyxcbiAgICAgICAganN4SW1wb3J0U291cmNlOiAncmVhY3QnLFxuICAgIH0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgICBhbGlhczoge1xuICAgICAgICAgICAgJ3ppZ2d5LWpzJzogcmVzb2x2ZShfX2Rpcm5hbWUsICd2ZW5kb3IvdGlnaHRlbmNvL3ppZ2d5JyksXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAgICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxuICAgICAgICAgICAgICAgICAgICB1aTogWydAcmFkaXgtdWkvcmVhY3QtZGlhbG9nJywgJ0ByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51J10sXG4gICAgICAgICAgICAgICAgICAgIHV0aWxzOiBbJ2RhdGUtZm5zJywgJ2Nsc3gnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFzc2V0c0RpcjogJ2Fzc2V0cycsXG4gICAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sYUFBYTtBQUNwQixPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsWUFBWTtBQUpyQixJQUFNLG1DQUFtQztBQU16QyxJQUFNLGlCQUFpQixLQUFLLEtBQUssNENBQTRDO0FBRTdFLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQ3hCLE1BQU07QUFBQSxFQUNOLFNBQVM7QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNKLE9BQ0E7QUFBQSxRQUNJO0FBQUEsUUFDQTtBQUFBLFFBQ0EsR0FBRztBQUFBLE1BQ1A7QUFBQSxNQUNBLFNBQVM7QUFBQSxJQUNiLENBQUM7QUFBQSxJQUNELE1BQU07QUFBQSxFQUNWO0FBQUEsRUFDQSxRQUFRO0FBQUE7QUFBQTtBQUFBLElBR0osTUFBTSxRQUFRLElBQUksd0JBQXdCO0FBQUEsSUFDMUMsS0FBSztBQUFBLE1BQ0QsTUFBTSxRQUFRLElBQUksaUJBQWlCO0FBQUEsSUFDdkM7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNMLCtCQUErQjtBQUFBLE1BQy9CLGdDQUFnQztBQUFBLE1BQ2hDLGdDQUFnQztBQUFBLElBQ3BDO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDSCxTQUFTLENBQUMsZ0JBQWdCLG9CQUFvQjtBQUFBLElBQ2xEO0FBQUEsSUFDQSxJQUFJO0FBQUEsTUFDQSxPQUFPLENBQUMsTUFBTSxVQUFVO0FBQUEsSUFDNUI7QUFBQSxFQUNKO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDTCxLQUFLO0FBQUEsSUFDTCxpQkFBaUI7QUFBQSxFQUNyQjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ0wsT0FBTztBQUFBLE1BQ0gsWUFBWSxRQUFRLGtDQUFXLHdCQUF3QjtBQUFBLElBQzNEO0FBQUEsRUFDSjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0gsZUFBZTtBQUFBLE1BQ1gsUUFBUTtBQUFBLFFBQ0osY0FBYztBQUFBLFVBQ1YsUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLFVBQzdCLElBQUksQ0FBQywwQkFBMEIsK0JBQStCO0FBQUEsVUFDOUQsT0FBTyxDQUFDLFlBQVksTUFBTTtBQUFBLFFBQzlCO0FBQUEsTUFDSjtBQUFBLElBQ0o7QUFBQSxJQUNBLFdBQVc7QUFBQSxFQUNmO0FBQ0osQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
