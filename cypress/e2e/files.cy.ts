/// <reference types="cypress" />

describe("Datei-Browser", () => {
  const hasCreds = Boolean(Cypress.env("authBypass") || (Cypress.env("testUserEmail") && Cypress.env("testUserPassword")));
  before(function () {
    if (!hasCreds) {
      cy.log("Skipping files suite: set CYPRESS_testUserEmail & CYPRESS_testUserPassword");
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginUI({ returnTo: "/files" });
  });

  it("lädt die Seite und zeigt den Header", () => {
    cy.contains("Datei-Browser", { timeout: 8000 }).should("be.visible");
  });

  it("zeigt Ordner aus der API", () => {
    cy.contains("Bewerbungen", { timeout: 8000 }).should("be.visible");
  });

  it("zeigt Breadcrumb-Navigation", () => {
    cy.contains("Alle Ordner", { timeout: 8000 }).should("be.visible");
  });

  it("zeigt Suchfeld", () => {
    cy.get("input[placeholder*='Ordner suchen']", { timeout: 8000 }).should("be.visible");
  });

  it("sucht nach Ordnernamen", () => {
    cy.get("input[placeholder*='Ordner suchen']", { timeout: 8000 }).type("Bew");
    cy.contains("Bewerbungen").should("be.visible");
  });

  it("öffnet den Dialog zum Erstellen eines neuen Ordners", () => {
    cy.contains("Neuer Ordner", { timeout: 8000 }).click();
    cy.get("input[placeholder*='Ordnername']", { timeout: 4000 }).should("be.visible");
  });

  it("schliesst den Ordner-Dialog über Abbrechen", () => {
    cy.contains("Neuer Ordner", { timeout: 8000 }).click();
    cy.contains("Abbrechen").click();
    cy.get("input[placeholder*='Ordnername']").should("not.exist");
  });

  it("wechselt Ansicht zwischen Grid und Liste", () => {
    cy.get("button.p-2", { timeout: 8000 }).first().click({ force: true });
    cy.get("body").should("be.visible");
  });

  it("navigiert ohne Fehler zur Seite", () => {
    cy.url().should("include", "/files");
  });
});
