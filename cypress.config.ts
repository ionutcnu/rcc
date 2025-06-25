import { defineConfig } from "cypress";
import { config } from 'dotenv';

// Load environment variables from .env file
config();

export default defineConfig({
  projectId: process.env.CYPRESS_PROJECT_ID,
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    watchForFileChanges: false,
    viewportWidth: 1920,
    viewportHeight: 1080,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 30000,
    retries: {
      runMode: 0,
      openMode: 0
    },
    video: false,
    screenshotOnRunFailure: false,
    env: {
      ADMIN_EMAIL: process.env.CYPRESS_ADMIN_EMAIL,
      ADMIN_PASSWORD: process.env.CYPRESS_ADMIN_PASSWORD,
      USER_EMAIL: process.env.CYPRESS_USER_EMAIL,
      USER_PASSWORD: process.env.CYPRESS_USER_PASSWORD,
    },
    setupNodeEvents(on, config) {
      // Add delay between commands
      on('task', {
        delay(ms) {
          return new Promise((resolve) => {
            setTimeout(() => resolve(null), ms);
          });
        }
      });
    },
  },
});
