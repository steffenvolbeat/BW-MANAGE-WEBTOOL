describe("Documents", () => {
  const hasCreds = Boolean(Cypress.env("authBypass") || (Cypress.env("testUserEmail") && Cypress.env("testUserPassword")));
  const allowMutations = String(Cypress.env("enableMutations") ?? "").toLowerCase() === "true";
  before(function () {
    if (!hasCreds) {
      cy.log("Skipping documents suite: set CYPRESS_testUserEmail and CYPRESS_testUserPassword");
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginUI({ returnTo: "/documents" });
  });

  it("shows heading, upload form, and filters", () => {
    cy.contains("h1", "Dokumente").should("be.visible");
    cy.contains("Dokument hochladen").should("be.visible");
    cy.get("input[type=file]").should("exist");
    cy.get("input[type=text][placeholder*='suchen']", { timeout: 10_000 }).should("be.visible");
    cy.contains("button", "Grid").should("exist");
    cy.contains("button", "Liste").should("exist");
  });

  it("searches and filters documents", () => {
    cy.get("input[placeholder*='Tag suchen']").clear().type("cv");
    cy.wait(300);
    cy.get("select").first().should("exist");
  });

  it("uploads via documents page when mutations are enabled", function () {
    if (!allowMutations) {
      cy.log("Skipping mutation test; set CYPRESS_enableMutations=true to run.");
      this.skip();
    }

    cy.get("input[type=file]").selectFile("cypress/fixtures/sample.txt", { force: true });
    cy.get("input[placeholder='z.B. Lebenslauf 2026']").clear().type("Cypress Upload");
    cy.get("select").first().select("OTHER");
    cy.contains("button", "Hochladen").click({ force: true });
    cy.wait(500);
  });
});
