describe("Authentication", () => {
  const hasCreds = Boolean(Cypress.env("authBypass") || (Cypress.env("testUserEmail") && Cypress.env("testUserPassword")));
  it("renders sign-in form", () => {
    cy.visit("/auth/signin");
    cy.contains("Bei Ihrem Konto anmelden").should("be.visible");
    cy.get("input#email").should("be.visible");
    cy.get("input#password").should("have.attr", "type", "password");
    cy.contains("button", "Anmelden").should("be.visible");
  });

  it("toggles password visibility", () => {
    cy.visit("/auth/signin");
    cy.get("input#password").should("have.attr", "type", "password");
    cy.get("input#password").parent().find("button").click({ force: true });
    cy.get("input#password").should("have.attr", "type", "text");
  });

  it("logs in via UI when credentials are provided", function () {
    if (!hasCreds) {
      cy.log("Skipping login test: set CYPRESS_testUserEmail and CYPRESS_testUserPassword");
      this.skip();
    }
    cy.loginUI();
    cy.url().should("include", "/dashboard");
    cy.contains("Dashboard").should("be.visible");
  });
});
