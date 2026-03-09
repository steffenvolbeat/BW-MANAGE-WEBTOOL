describe("Dashboard", () => {
  const hasCreds = Boolean(Cypress.env("authBypass") || (Cypress.env("testUserEmail") && Cypress.env("testUserPassword")));
  before(function () {
    if (!hasCreds) {
      cy.log("Skipping dashboard suite: set CYPRESS_testUserEmail and CYPRESS_testUserPassword");
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginUI();
  });

  it("renders stats and quick actions", () => {
    cy.visit("/dashboard");
    cy.contains("h1", "Dashboard").should("be.visible");
    cy.contains("Quick Actions").should("be.visible");
    cy.contains("Neue Bewerbung").should("be.visible");
    cy.contains("Dokument hochladen").should("be.visible");
    cy.contains("Meeting planen").should("be.visible");
    cy.contains("Quick Actions").parent().find("a").should("have.length", 4);
  });

  it("shows recent activity or empty state", () => {
    cy.visit("/dashboard");
    cy.contains("Letzte Aktivitäten").should("be.visible");
    cy.get("body").then(($body) => {
      if ($body.text().includes("Keine Aktivitäten")) {
        cy.contains("Keine Aktivitäten").should("be.visible");
      } else {
        cy.get("div").contains("Letzte Aktivitäten").parent().find("div").its("length").should("be.greaterThan", 0);
      }
    });
  });

  it("shows upcoming events or empty state", () => {
    cy.visit("/dashboard");
    cy.contains("Anstehende Termine").should("be.visible");
    cy.get("body").then(($body) => {
      if ($body.text().includes("Keine anstehenden Termine")) {
        cy.contains("Termin hinzufügen").should("be.visible");
      } else {
        cy.contains("Anstehende Termine").parent().find("div").its("length").should("be.greaterThan", 0);
      }
    });
  });

  it("renders application progress section", () => {
    cy.visit("/dashboard");
    cy.contains("Bewerbungsfortschritt").should("be.visible");
    cy.contains("Bewerbungen gesendet").should("be.visible");
    cy.contains("Interviews geplant").should("be.visible");
    cy.contains("Angebote erhalten").should("be.visible");
  });
});
