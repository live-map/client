import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  // Backend OpenAPI spec URL (server must be running)
  input: "http://localhost:8000/openapi.json",

  // Generated files output directory
  output: "generated/openapi-client",

  plugins: [
    {
      // Next.js optimized HTTP client
      name: "@hey-api/client-next",
      // Runtime config file path (relative to output)
      runtimeConfigPath: "../../config/openapi-runtime",
    },
    {
      // SDK generation plugin
      name: "@hey-api/sdk",
      // false: functional API (getPostList, etc.)
      // true: class-based API (Posts.list, etc.) - deprecated
      asClass: false,
    },
  ],
});
