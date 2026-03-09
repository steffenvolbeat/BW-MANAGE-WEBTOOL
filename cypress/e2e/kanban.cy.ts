describe("Kanban", () => {
  const hasCreds = Boolean(Cypress.env("authBypass") || (Cypress.env("testUserEmail") && Cypress.env("testUserPassword")));
  before(function () {
    if (!hasCreds) {
      cy.log("Skipping kanban suite: set CYPRESS_testUserEmail and CYPRESS_testUserPassword");
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginUI({ returnTo: "/kanban" });
  });

  it("renders secure kanban shell", () => {
    cy.contains("Secure Kanban").should("be.visible");
    cy.contains("Redacted Mode").should("be.visible");
    cy.contains("Board Stats").should("be.visible");
    cy.contains("Agent Assist").should("be.visible");
  });

  it("shows boards and cards or graceful empty state", () => {
    cy.get("body").then(($body) => {
      const hasSelect = $body.find("select").length > 0;
      if (hasSelect) {
        cy.get("select").first().find("option").should("have.length.greaterThan", 0);
      }
      const cards = $body.find("div[draggable]");
      if (cards.length > 0) {
        cy.wrap(cards.eq(0)).click();
        cy.contains("Agent Assist").parent().within(() => {
          cy.contains("View Suggestion").should("be.visible");
          cy.contains("Approve & Apply").should("be.visible");
        });
      }
    });
  });
});
