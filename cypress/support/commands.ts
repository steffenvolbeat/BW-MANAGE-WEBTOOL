/// <reference types="cypress" />
export {};

const defaultReturnUrl = "/dashboard";

Cypress.Commands.add("requireEnv", (keys: string[]) => {
  const missing = keys.filter((k) => !Cypress.env(k));
  if (missing.length) {
    throw new Error(`Fehlende Cypress env Variablen: ${missing.join(", ")}`);
  }
});

Cypress.Commands.add("loginUI", (options?: { email?: string; password?: string; returnTo?: string }) => {
  const authBypass = Cypress.env("NEXT_PUBLIC_CYPRESS") || Cypress.env("authBypass");
  const email = options?.email ?? Cypress.env("testUserEmail") ?? (authBypass ? "cypress@test.de" : "");
  const password = options?.password ?? Cypress.env("testUserPassword") ?? (authBypass ? "CypressTest123" : "");
  const returnTo = options?.returnTo ?? defaultReturnUrl;

  if (!authBypass && (!email || !password)) {
    throw new Error("loginUI benötigt testUserEmail und testUserPassword (env oder Parameter).");
  }

  if (authBypass) {
    // Mock NextAuth session so that useSession() resolves to a valid user in all page components
    cy.intercept("GET", "/api/auth/session", {
      statusCode: 200,
      body: {
        user: {
          id: "cypress-user-id",
          email: email,
          name: "Cypress Testnutzer",
          image: null,
          role: "USER",
        },
        expires: "2099-01-01T00:00:00.000Z",
      },
    }).as("cypressSession");

    // Mock data APIs so page components render their full UI without a real backend
    cy.intercept("GET", "/api/analytics*", {
      statusCode: 200,
      body: {
        applicationStats: { total: 3, pending: 1, rejected: 0, accepted: 1, interview: 1 },
        recentActivities: [],
        upcomingEvents: [],
      },
    }).as("analytics");

    cy.intercept("GET", "/api/applications*", {
      statusCode: 200,
      body: [
        {
          id: "cy-app-1",
          companyName: "Cypress Corp",
          position: "Senior Test Engineer",
          location: "Berlin",
          country: "Deutschland",
          status: "PENDING",
          priority: "HIGH",
          jobType: "FULL_TIME",
          salary: null,
          appliedAt: "2026-01-15T00:00:00.000Z",
          responseAt: null,
          jobUrl: null,
          companyUrl: null,
          notesText: null,
          requirements: null,
        },
      ],
    }).as("applications");

    const sampleContacts = [
      {
        id: "cy-contact-1",
        firstName: "Cypress",
        lastName: "Tester",
        company: "Cypress Corp",
        position: "QA Engineer",
        email: email,
        phone: "+49 30 123456",
        linkedIn: "https://www.linkedin.com/in/cypress",
        xing: "https://www.xing.com/profile/Cypress_Tester",
        location: "Berlin",
        country: "Deutschland",
        isInland: true,
        contactType: "RECRUITER",
        industry: "Technologie",
        notes: "Demo-Kontakt für Cypress Tests",
        tags: ["QA", "Recruiting"],
        isFavorite: false,
        lastContact: "2026-01-10T00:00:00.000Z",
        nextFollowUp: "2026-02-01T00:00:00.000Z",
        relatedApplications: ["cy-app-1"],
        addedAt: "2026-01-01T00:00:00.000Z",
        source: "MANUAL",
      },
    ];

    cy.intercept("GET", "/api/events*", { statusCode: 200, body: [] }).as("events");
    cy.intercept("GET", "/api/meetings*", { statusCode: 200, body: [] }).as("meetings");
    cy.intercept("GET", "/api/reminders*", { statusCode: 200, body: [] }).as("reminders");
    cy.intercept("GET", "/api/notes*", { statusCode: 200, body: [] }).as("notes");
    cy.intercept("GET", "/api/contacts*", { statusCode: 200, body: sampleContacts }).as("contacts");
    cy.intercept("GET", "/api/contacts/duplicates*", { statusCode: 200, body: { pairs: [] } }).as("contactDuplicates");
    cy.intercept("POST", "/api/contacts/merge*", { statusCode: 200, body: { success: true } }).as("contactMerge");
    cy.intercept("GET", "/api/documents*", { statusCode: 200, body: [] }).as("documents");

    // ── New feature stubs ──────────────────────────────────────────────────────
    // Kanban automations
    cy.intercept("GET", "/api/kanban/automations*", { statusCode: 200, body: [] }).as("automations");
    cy.intercept("POST", "/api/kanban/automations*", { statusCode: 201, body: { id: "cy-auto-1", name: "Test Automation", enabled: true, trigger: "CARD_MOVED", triggerConfig: {}, action: "CREATE_REMINDER", actionConfig: {}, runCount: 0, createdAt: new Date().toISOString() } }).as("createAutomation");
    cy.intercept("PATCH", "/api/kanban/automations*", { statusCode: 200, body: { id: "cy-auto-1", enabled: false } }).as("updateAutomation");
    cy.intercept("DELETE", "/api/kanban/automations*", { statusCode: 200, body: { deleted: true } }).as("deleteAutomation");

    // File browser
    cy.intercept("GET", "/api/files/folders*", { statusCode: 200, body: { folders: [{ id: "cy-folder-1", name: "Bewerbungen", parentId: null, color: "#3b82f6", icon: "briefcase", createdAt: new Date().toISOString(), childCount: 0 }], breadcrumb: [{ id: null, name: "Alle Ordner" }] } }).as("fileFolders");
    cy.intercept("POST", "/api/files/folders*", { statusCode: 201, body: { id: "cy-folder-new", name: "Neuer Ordner", parentId: null, color: "#6b7280", icon: "folder", createdAt: new Date().toISOString(), childCount: 0 } }).as("createFolder");
    cy.intercept("PATCH", "/api/files/folders*", { statusCode: 200, body: { id: "cy-folder-1", name: "Umbenennt" } }).as("updateFolder");
    cy.intercept("DELETE", "/api/files/folders*", { statusCode: 200, body: { deleted: 1 } }).as("deleteFolder");

    // Outbox reminders
    cy.intercept("GET", "/api/reminders/outbox*", { statusCode: 200, body: { reminders: [], stats: { total: 0, pending: 0, delivered: 0, failed: 0, retrying: 0 } } }).as("outboxReminders");
    cy.intercept("POST", "/api/reminders/outbox*", { statusCode: 201, body: { id: "cy-obox-1", title: "Test Erinnerung", body: "", dueAt: new Date(Date.now() + 3600000).toISOString(), status: "PENDING", priority: "MEDIUM", retryCount: 0, maxRetries: 3, tags: [], createdAt: new Date().toISOString() } }).as("createOutboxReminder");
    cy.intercept("PATCH", "/api/reminders/outbox*", { statusCode: 200, body: { id: "cy-obox-1", status: "CANCELLED" } }).as("updateOutboxReminder");
    cy.intercept("DELETE", "/api/reminders/outbox*", { statusCode: 200, body: { deleted: true } }).as("deleteOutboxReminder");

    // Anschreiben AI draft
    cy.intercept("POST", "/api/anschreiben/ai-draft*", { statusCode: 200, body: { paragraphs: ["Sehr geehrte Damen und Herren,\n\nIch bewerbe mich hiermit auf die ausgeschriebene Stelle als IT-Spezialist. Mit meiner langjährigen Erfahrung in der Softwareentwicklung bin ich überzeugt, einen wertvollen Beitrag zu Ihrem Team leisten zu können.", "Meine Kenntnisse in TypeScript, React und Next.js ermöglichen es mir, moderne und leistungsfähige Webanwendungen zu entwickeln.", "Über eine Einladung zu einem persönlichen Gespräch freue ich mich sehr."] } }).as("aiDraft");

    // Intercept mutation endpoints so form submissions complete cleanly
    cy.intercept("POST", "/api/documents*", { statusCode: 201, body: { id: "cy-doc-1", name: "Cypress Upload", type: "OTHER" } }).as("uploadDocument");
    cy.intercept("POST", "/api/applications*", { statusCode: 201, body: { id: "cy-app-new" } }).as("createApplication");
    cy.intercept("POST", "/api/meetings*", { statusCode: 201, body: { id: "cy-meeting-1" } }).as("createMeeting");
    cy.intercept("POST", "/api/reminders*", { statusCode: 201, body: { id: "cy-reminder-1" } }).as("createReminder");
    cy.intercept("POST", "/api/notes*", { statusCode: 201, body: { id: "cy-note-1" } }).as("createNote");
    cy.intercept("POST", "/api/events*", { statusCode: 201, body: { id: "cy-event-1" } }).as("createEvent");

    cy.visit(returnTo);
    return;
  }

  cy.session([
    "loginUI",
    email,
    password,
    returnTo,
  ], () => {
    cy.visit(`/auth/signin?return=${encodeURIComponent(returnTo)}`);
    cy.get("input#email").clear().type(email, { log: false });
    cy.get("input#password").clear().type(password, { log: false });
    cy.contains("button", "Anmelden").click();
    cy.url({ timeout: 20_000 }).should("include", returnTo);
    cy.contains("Dashboard", { timeout: 10_000 }).should("be.visible");
  }, {
    cacheAcrossSpecs: true,
  });
});

Cypress.Commands.add("ensureOnDashboard", () => {
  cy.visit("/dashboard");
  cy.contains("h1", "Dashboard").should("be.visible");
});

declare global {
  namespace Cypress {
    interface Chainable {
      requireEnv(keys: string[]): Chainable<void>;
      loginUI(options?: { email?: string; password?: string; returnTo?: string }): Chainable<void>;
      ensureOnDashboard(): Chainable<void>;
    }
  }
}
