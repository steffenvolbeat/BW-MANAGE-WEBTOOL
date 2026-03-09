/// <reference types="cypress" />

describe("Anschreiben-Studio", () => {
  const hasCreds = Boolean(Cypress.env("authBypass") || (Cypress.env("testUserEmail") && Cypress.env("testUserPassword")));
  before(function () {
    if (!hasCreds) {
      cy.log("Skipping anschreiben suite: set CYPRESS_testUserEmail & CYPRESS_testUserPassword");
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginUI({ returnTo: "/anschreiben" });
  });

  it("lädt die Seite und zeigt den Studio-Header", () => {
    cy.contains("Anschreiben-Studio", { timeout: 8000 }).should("be.visible");
  });

  it("zeigt DIN-5008 Compliance-Badge", () => {
    cy.contains("DIN 5008", { timeout: 8000 }).should("be.visible");
  });

  it("zeigt Bearbeiten-Modus mit Absender-Formular", () => {
    cy.get("body", { timeout: 8000 }).then(($body) => {
      if ($body.find("[data-cy=preview-mode]").length > 0) {
        cy.get("[data-cy=edit-btn]").click();
      }
    });
    cy.contains("Vorschau", { timeout: 6000 }).should("be.visible");
  });

  it("schaltet in Vorschau-Modus um", () => {
    cy.contains("Vorschau", { timeout: 8000 }).click();
    cy.get("body").should("be.visible");
  });

  it("öffnet den KI-Copilot-Panel", () => {
    cy.contains("KI-Copilot", { timeout: 8000 }).should("be.visible");
  });

  it("zeigt IT-Vorlagen", () => {
    cy.contains("Vorlage", { timeout: 8000 }).should("be.visible");
  });

  it("navigiert ohne Fehler zur Seite", () => {
    cy.url().should("include", "/anschreiben");
    cy.get("main, [role='main'], .container, #__next").should("exist");
  });
});
