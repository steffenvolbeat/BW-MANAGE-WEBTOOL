/// <reference types="cypress" />
import "./commands";

Cypress.on("uncaught:exception", (err) => {
  // Ignore non-test critical frontend errors to keep CI stable
  console.error("Uncaught exception during test:", err);
  return false;
});
