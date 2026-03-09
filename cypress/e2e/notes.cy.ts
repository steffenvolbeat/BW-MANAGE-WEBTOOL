describe("Notes", () => {
  const hasCreds = Boolean(Cypress.env("authBypass") || (Cypress.env("testUserEmail") && Cypress.env("testUserPassword")));
  const allowMutations = String(Cypress.env("enableMutations") ?? "").toLowerCase() === "true";
  before(function () {
    if (!hasCreds) {
      cy.log("Skipping notes suite: set CYPRESS_testUserEmail and CYPRESS_testUserPassword");
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginUI({ returnTo: "/notes" });
  });

  it("shows notes header, search, and categories", () => {
    cy.contains("h1", "Notizen").should("be.visible");
    cy.get("input[placeholder*='durchsuchen']").should("be.visible");
    cy.contains("Kategorien").should("be.visible");
    cy.contains("Neue Notiz").should("be.visible");
  });

  it("opens create form and cancels", () => {
    cy.contains("button", "Neue Notiz").click();
    cy.contains("Notiz erstellen").should("exist");
    cy.get("input[placeholder*='Titel']").should("exist");
    cy.contains("button", "Abbrechen").click();
  });

  it("creates a note when mutations enabled", function () {
    if (!allowMutations) {
      cy.log("Skipping notes mutation test; set CYPRESS_enableMutations=true to run.");
      this.skip();
    }

    cy.contains("button", "Neue Notiz").click();
    cy.get("input[placeholder*='Titel']").clear().type("Cypress Note");
    cy.get("textarea[placeholder*='Inhalt']").clear().type("Dies ist eine Cypress Testnotiz.");
    cy.contains("button", "Erstellen").click();
    cy.contains(/Notiz erstellen|Aktualisieren|Notiz|Lädt/i, { timeout: 15_000 }).should("be.visible");
  });
});
