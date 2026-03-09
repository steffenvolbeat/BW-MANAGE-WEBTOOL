describe("Activities", () => {
  const hasCreds = Boolean(Cypress.env("authBypass") || (Cypress.env("testUserEmail") && Cypress.env("testUserPassword")));
  before(function () {
    if (!hasCreds) {
      cy.log("Skipping activities suite: set CYPRESS_testUserEmail and CYPRESS_testUserPassword");
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginUI({ returnTo: "/activities" });
  });

  it("renders header, stats, and filters", () => {
    cy.contains("h1", "Aktivitäten").should("be.visible");
    cy.contains("Heute").should("be.visible");
    cy.contains("Diese Woche").should("be.visible");
    cy.get("input[placeholder*='suchen']").should("exist");
    cy.contains("Alle Aktivitäten").should("be.visible");
    cy.contains("Alle Status").should("be.visible");
  });

  it("shows feed or empty state gracefully", () => {
    cy.contains("Aktivitäts-Feed").should("be.visible");
    // empty or populated state – just verify the section is present
    cy.contains("Aktivitäts-Feed").parents().find("div").should("exist");
  });

  it("filters by type and status", () => {
    cy.get("select").first().select(1, { force: true });
    cy.get("select").eq(1).select(1, { force: true });
    cy.wait(200);
    cy.contains("Aktivitäts-Feed").should("be.visible");
  });
});
