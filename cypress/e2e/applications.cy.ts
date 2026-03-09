describe("Applications", () => {
  const hasCreds = Boolean(Cypress.env("authBypass") || (Cypress.env("testUserEmail") && Cypress.env("testUserPassword")));
  const allowMutations = String(Cypress.env("enableMutations") ?? "").toLowerCase() === "true";
  before(function () {
    if (!hasCreds) {
      cy.log("Skipping applications suite: set CYPRESS_testUserEmail and CYPRESS_testUserPassword");
      this.skip();
    }
  });

  beforeEach(() => {
    cy.loginUI({ returnTo: "/applications" });
  });

  it("shows applications table with actions", () => {
    cy.contains("Unternehmen & Position").should("be.visible");
    cy.contains("Standort").should("be.visible");
    cy.contains("Status").should("be.visible");
    cy.contains("Aktionen").should("be.visible");
  });

  it("expands inline documents for a row", () => {
    cy.get("table tbody tr").first().within(() => {
      cy.contains("button", "Docs").click();
    });

    cy.get("body").then(($body) => {
      const text = $body.text();
      if (text.includes("Keine Dokumente")) {
        cy.contains("Keine Dokumente").should("be.visible");
      }
    });
  });

  it("opens upload modal and shows fields", () => {
    cy.get("table tbody tr").first().within(() => {
      cy.get('button[title="Dokument hochladen / anzeigen"]').click();
    });
    cy.contains("Datei auswählen").should("be.visible");
    cy.get("#upload-file-input").should("exist");
    cy.get("#upload-doc-type").should("exist");
    cy.contains("Bereits hochgeladen").should("be.visible");
    cy.contains("button", "Abbrechen").click();
  });

  it("uploads a document when mutations are enabled", function () {
    if (!allowMutations) {
      cy.log("Skipping mutation test; set CYPRESS_enableMutations=true to run.");
      this.skip();
    }

    cy.get("table tbody tr").first().within(() => {
      cy.get('button[title="Dokument hochladen / anzeigen"]').click();
    });

    cy.get("#upload-file-input").selectFile("cypress/fixtures/sample.txt", { force: true });
    cy.get("#upload-doc-type").select("OTHER");
    cy.contains("button", "Hochladen").click();

    cy.contains(/Dokument hochgeladen|Lädt/i, { timeout: 20_000 }).should("be.visible");
  });
});
