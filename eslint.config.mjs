import js from '@eslint/js';
import unocss from '@unocss/eslint-config/flat';
import astro from 'eslint-plugin-astro';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['dist/', '.astro/', '.wrangler/'] },
  js.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  astro.configs.recommended,
  unocss,
  { files: ['scripts/**', '*.config.*'], languageOptions: { globals: globals.node } },
  { files: ['**/*.astro', 'src/scripts/**'], languageOptions: { globals: globals.browser } },
);
