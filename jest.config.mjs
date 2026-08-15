import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // next.config.ts と .env を読み込むため Next.js アプリのルートを指定
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // E2E（Playwright）は Jest の対象外
  testPathIgnorePatterns: ["/node_modules/", "/e2e/", "/.next/"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    // WebGL キャンバスは jsdom でテスト不能のため除外
    "!src/components/canvas/**",
  ],
};

export default createJestConfig(config);
