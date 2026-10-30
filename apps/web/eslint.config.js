import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist", "coverage"] },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: { window: "readonly", document: "readonly", console: "readonly", process: "readonly" },
    },
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules, "no-undef": "off" },
  },
  {
    files: ["public/sw.js"],
    languageOptions: {
      globals: {
        self: "readonly", caches: "readonly", URL: "readonly", fetch: "readonly",
        Request: "readonly", Response: "readonly", clients: "readonly",
      },
    },
  },
];
