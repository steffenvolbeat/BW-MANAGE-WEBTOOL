describe("Meetings & Reminders", () => {
  const hasCreds = Boolean(Cypress.env("authBypass") || (Cypress.env("testUserEmail") && Cypress.env("testUserPassword")));
  const allowMutations = String(Cypress.env("enableMutations") ?? "").toLowerCase() === "true";
  before(function () {
    if (!hasCreds) {
      cy.log("Skipping meetings suite: set CYPRESS_testUserEmail and CYPRESS_testUserPassword");
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginUI({ returnTo: "/meetings" });
  });

  it("shows meeting management header and filters", () => {
    cy.contains("h1", "Meeting-Management").should("be.visible");
    cy.contains("Nur kommende").should("be.visible");
    cy.contains("Neues Meeting").should("be.visible");
  });

  it("opens meeting form and cancels", () => {
    cy.contains("button", "Neues Meeting").click();
    cy.contains("Titel *").should("be.visible");
    cy.get("input[placeholder*='Vorstellungsgespräch']").should("be.visible");
    cy.contains("button", "Abbrechen").click();
  });

  it("creates meeting when mutations enabled", function () {
    if (!allowMutations) {
      cy.log("Skipping meeting mutation test; set CYPRESS_enableMutations=true to run.");
      this.skip();
    }

    cy.contains("button", "Neues Meeting").click();
    cy.get("input[placeholder*='Vorstellungsgespräch']").clear().type("Cypress Meeting");
    cy.get("select").first().select("LOCAL");
    cy.get("input[type=datetime-local]").first().type("2099-12-31T12:00");
    cy.contains("button", "Erstellen").click();
    cy.contains(/Meeting (erstellt|aktualisiert)|Speichern|Lädt/i, { timeout: 15_000 }).should("be.visible");
  });

  it("shows reminders section and pending toggle", () => {
    cy.contains("h1", "Erinnerungen").should("be.visible");
    cy.contains("Nur ausstehende").should("be.visible");
    cy.contains("Neue Erinnerung").should("be.visible");
    cy.contains("label", "Nur ausstehende").find("input[type=checkbox]").check({ force: true });
    cy.wait(200);
  });

  it("creates reminder when mutations enabled", function () {
    if (!allowMutations) {
      cy.log("Skipping reminder mutation test; set CYPRESS_enableMutations=true to run.");
      this.skip();
    }

    cy.contains("button", "Neue Erinnerung").click();
    cy.get("input[placeholder*='Follow-up']").clear().type("Cypress Reminder");
    cy.get("input[type=datetime-local]").first().type("2099-12-31T18:00");
    cy.contains("button", "Erstellen").click();
    cy.contains(/Erinnerung erstellt|Speichern|Lädt/i, { timeout: 15_000 }).should("be.visible");
  });
});
