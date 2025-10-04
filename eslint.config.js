/**
 * @file ESLint configuration for the Discolors project.
 * @description This file sets up global, recommended, and custom ESLint rules
 * specifically for TypeScript files in the project. It also integrates Prettier
 * to enforce consistent formatting.
 */

// --- Imports ---
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

// --- ESLint Configuration Export ---
export default [
  /**
   * 1. Global Configuration
   * @description Ignore build folders and other global settings.
   */
  {
    ignores: ['build/'],
  },

  /**
   * 2. Recommended TypeScript-ESLint Configurations
   * @description Spread the recommended configs directly into the main array.
   */
  ...tseslint.configs.recommended,

  /**
   * 3. Custom Configuration for Project TypeScript Files
   * @description Applies custom rules and parser settings for src/**/ /*.ts and src/**/ /*.tsx
   */
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Disable rule requiring explicit return types on functions.
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },

  /**
   * 4. Prettier Configuration
   * @description Always applied last to overwrite other conflicting rules.
   */
  eslintConfigPrettier,
];
