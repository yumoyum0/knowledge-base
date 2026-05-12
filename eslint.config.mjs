import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: ["node_modules/"],
  },
  // Node.js files: main process, preload, test
  {
    files: ["main.js", "preload.js", "test.js"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        require: "readonly",
        module: "readonly",
        process: "readonly",
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
    files: ["renderer.js"],
    languageOptions: {
      globals: {
        document: "readonly",
        window: "readonly",
        alert: "readonly",
        prompt: "readonly",
        confirm: "readonly",
        console: "readonly",
        kbAPI: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
    },
  },
];
