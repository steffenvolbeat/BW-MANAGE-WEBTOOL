describe("Contacts", () => {
  const hasCreds = Boolean(Cypress.env("authBypass") || (Cypress.env("testUserEmail") && Cypress.env("testUserPassword")));
  before(function () {
    if (!hasCreds) {
      cy.log("Skipping contacts suite: set CYPRESS_testUserEmail and CYPRESS_testUserPassword");
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginUI({ returnTo: "/contacts" });
  });

  it("shows header, stats, and duplicate finder", () => {
    cy.contains("h1", "Kontakte").should("be.visible");
    cy.contains("Gesamt").should("be.visible");
    cy.contains("Favoriten").should("be.visible");
    cy.contains("Duplikate prüfen").should("be.visible");
  });

  it("searches and toggles filters", () => {
    cy.get("input[placeholder*='suchen']").first().clear().type("test");
    cy.get("select").first().select(1, { force: true });
    cy.get("select").eq(1).select(0, { force: true });
    cy.get("input#favorites-only").check({ force: true });
    cy.wait(200);
    cy.get("input#favorites-only").uncheck({ force: true });
  });

  it("shows contacts in grid or list view", () => {
    cy.contains("button", "Neuer Kontakt").should("exist");
    // Switch to list view by clicking the second icon-button in the view toggle
    cy.get("div.flex.border.border-gray-300.rounded-lg button").last().click({ force: true });
    // After switching, the table or empty-state text appears in list view
    cy.contains("Kontakten angezeigt").should("exist");
  });
});
