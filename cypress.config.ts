import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.{ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    screenshotsFolder: "cypress/screenshots",
    videosFolder: "cypress/videos",
    downloadsFolder: "cypress/downloads",
    fixturesFolder: "cypress/fixtures",
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      authBypass: true,
      testUserEmail: "",
      testUserPassword: "",
      testUserTotp: "",
      enableDocsTests: false,
      enableMutations: true,
    },
  },
  viewportWidth: 1366,
  viewportHeight: 768,
});
