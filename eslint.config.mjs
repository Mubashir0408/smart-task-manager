import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      ".next-tauri/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "chrome-extension/**",
      "mobile-app/**",
      "src-tauri/**",
    ],
  },
];

export default eslintConfig;
