/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  transform: { "^.+\\.tsx?$": "ts-jest" },
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};

module.exports = config;
