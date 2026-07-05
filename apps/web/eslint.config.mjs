import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      'no-inline-comments': 'off',
      'spaced-comment': ['warn', 'always', {
        line: { markers: ['/', '---', 'TODO', 'FIXME'] },
        block: { balanced: true }
      }],
    },
  },
]);

export default eslintConfig;
