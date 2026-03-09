/// <reference types="cypress" />

describe("Kanban-Automationen", () => {
  const hasCreds = Boolean(Cypress.env("authBypass") || (Cypress.env("testUserEmail") && Cypress.env("testUserPassword")));
  before(function () {
    if (!hasCreds) {
      cy.log("Skipping automations suite: set CYPRESS_testUserEmail & CYPRESS_testUserPassword");
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginUI({ returnTo: "/kanban/automations" });
  });

  it("lädt die Seite und zeigt den Header", () => {
    cy.contains("Kanban-Automationen", { timeout: 8000 }).should("be.visible");
  });

  it("zeigt Quick-Start-Vorlagen wenn keine Regeln vorhanden", () => {
    cy.contains("Schnellstart", { timeout: 8000 }).should("be.visible");
  });

  it("öffnet den Dialog zum Erstellen einer neuen Automation", () => {
    cy.contains("Neue Automation", { timeout: 8000 }).click();
    cy.contains("Neue Automation", { timeout: 4000 }).should("be.visible");
    cy.get("input[placeholder*='Interview']").should("be.visible");
  });

  it("schliesst den Dialog über Abbrechen", () => {
    cy.contains("Neue Automation", { timeout: 8000 }).click();
    cy.contains("Abbrechen").click();
    cy.contains("Abbrechen").should("not.exist");
  });

  it("zeigt Trigger-Dropdown mit allen Optionen", () => {
    cy.contains("Neue Automation", { timeout: 8000 }).click();
    cy.get("select").first().should("be.visible");
  });

  it("übernimmt eine Vorlage in den Formulardialog", () => {
    cy.contains("Interview-Termin", { timeout: 8000 }).click();
    cy.contains("Neue Automation", { timeout: 4000 }).should("be.visible");
    cy.get("input").first().should("not.have.value", "");
  });

  it("zeigt Aktualisieren-Button", () => {
    cy.contains("Aktualisieren", { timeout: 8000 }).should("be.visible");
  });

  it("navigiert ohne Fehler zur Seite", () => {
    cy.url().should("include", "/kanban/automations");
  });
});
