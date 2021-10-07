module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverageFrom: ["**/*.{ts,tsx}", "!**/node_modules/**"],
  coverageProvider: "v8",
  silent: true,
}
