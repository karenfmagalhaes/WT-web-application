/**
 * This is an auto created file with eslint to find errors in javascript (Martin recommendation)
 */

import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    extends: ["eslint:recommended", "plugin:react/recommended"],
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
    },
  },
]);
