import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: ["node_modules/"],
  },
  // Node.js files: main process, preload, test
  {
    files: ["src/main/main.js", "src/preload/preload.js", "test.js"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        require: "readonly",
        module: "readonly",
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        exports: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
    },
  },
  // Renderer (browser environment)
  {
    files: ["src/renderer/renderer.js"],
    languageOptions: {
      globals: {
        document: "readonly",
        window: "readonly",
        alert: "readonly",
        prompt: "readonly",
        confirm: "readonly",
        console: "readonly",
        importBtn: "readonly",
        kbAPI: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
    },
  },
];

