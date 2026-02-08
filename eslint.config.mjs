import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // 사용하지 않는 변수가 있으면 에러 처리 (커밋 차단)
      "@typescript-eslint/no-unused-vars": "error",
      // console.log 사용 시 경고 (필요시 error로 변경 가능)
      "no-console": "warn",
      // React Compiler 호환성 경고 비활성화
      "react-hooks/incompatible-library": "off",
    },
  },
  prettierConfig, // Prettier 설정은 항상 마지막에 위치해야 합니다.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  globalIgnores(["generated/**"]),
]);

export default eslintConfig;
