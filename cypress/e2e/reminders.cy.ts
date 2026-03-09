/// <reference types="cypress" />

describe("Outbox-Erinnerungen", () => {
  const hasCreds = Boolean(Cypress.env("authBypass") || (Cypress.env("testUserEmail") && Cypress.env("testUserPassword")));
  before(function () {
    if (!hasCreds) {
      cy.log("Skipping reminders suite: set CYPRESS_testUserEmail & CYPRESS_testUserPassword");
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginUI({ returnTo: "/reminders" });
  });

  it("lädt die Seite und zeigt den Header", () => {
    cy.contains("Outbox-Erinnerungen", { timeout: 8000 }).should("be.visible");
  });

  it("zeigt Statistik-Kacheln", () => {
    cy.contains("Gesamt", { timeout: 8000 }).should("be.visible");
    cy.contains("Ausstehend").should("be.visible");
    cy.contains("Zugestellt").should("be.visible");
  });

  it("zeigt Filter-Buttons", () => {
    cy.contains("Alle", { timeout: 8000 }).should("be.visible");
    cy.contains("Fehlgeschlagen").should("be.visible");
  });

  it("zeigt Leer-Zustand wenn keine Erinnerungen vorhanden", () => {
    cy.contains("Keine Erinnerungen gefunden", { timeout: 8000 }).should("be.visible");
  });

  it("öffnet den Dialog zum Erstellen einer neuen Erinnerung", () => {
    cy.contains("Neue Erinnerung", { timeout: 8000 }).click();
    cy.get("input[placeholder*='Bewerbung']", { timeout: 4000 }).should("be.visible");
  });

  it("schliesst den Dialog über Abbrechen", () => {
    cy.contains("Neue Erinnerung", { timeout: 8000 }).click();
    cy.contains("Abbrechen").click();
    cy.get("input[placeholder*='Bewerbung']").should("not.exist");
  });

  it("zeigt Prioritäts-Dropdown im Formular", () => {
    cy.contains("Neue Erinnerung", { timeout: 8000 }).click();
    cy.contains("Mittel", { timeout: 4000 }).should("be.visible");
  });

  it("filtert Erinnerungen nach Status", () => {
    cy.contains("Ausstehend", { timeout: 8000 }).first().click();
    cy.url().should("include", "/reminders");
  });

  it("zeigt Aktualisieren-Button", () => {
    cy.contains("Aktualisieren", { timeout: 8000 }).should("be.visible");
  });

  it("navigiert ohne Fehler zur Seite", () => {
    cy.url().should("include", "/reminders");
  });
});
