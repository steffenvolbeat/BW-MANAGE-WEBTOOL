/**
 * MFA / 2FA E2E-Tests
 *
 * Voraussetzungen:
 * - Testbenutzer muss existieren (email: mfa_test@test.de, password: Test1234!)
 * - Datenbank muss laufen (PostgreSQL)
 *
 * Hinweis: Da TOTP-Codes zeitbasiert sind, können wir das vollständige
 * Aktivierungsflow über UI nicht automatisch testen ohne den Secret abzufangen.
 * Diese Tests prüfen stattdessen das API-Verhalten und UI-Rendering.
 */

describe("MFA / 2FA – API & UI", () => {
  // ── Setup ────────────────────────────────────────────────────────────────────
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  // ── Login: Normaler Benutzer ohne MFA ────────────────────────────────────────
  it("Login ohne MFA – Direktanmeldung", () => {
    cy.visit("/auth/login");
    cy.get('input[type="email"]').type(Cypress.env("TEST_EMAIL") || "test@test.de");
    cy.get('input[type="password"]').type(Cypress.env("TEST_PASSWORD") || "Test1234!");
    cy.get('button[type="submit"]').click();
    // Kein MFA-Schritt → direkt Dashboard
    cy.url({ timeout: 10000 }).should("include", "/dashboard");
  });

  // ── Login-Seite: MFA-Schritt UI ───────────────────────────────────────────────
  it("Login-Seite zeigt MFA-Schritt wenn mfaRequired", () => {
    cy.visit("/auth/login");

    // Simuliere mfaRequired-Antwort
    cy.intercept("POST", "/api/auth/login", {
      statusCode: 200,
      body: { mfaRequired: true },
    }).as("loginMfa");

    cy.get('input[type="email"]').type("mfa@test.de");
    cy.get('input[type="password"]').type("Test1234!");
    cy.get('button[type="submit"]').click();

    cy.wait("@loginMfa");
    // MFA-Schritt soll erscheinen
    cy.contains("Zwei-Faktor-Authentifizierung").should("be.visible");
    cy.get('input[inputMode="numeric"]').should("be.visible");
    cy.contains("Backup-Code verwenden").should("be.visible");
  });

  // ── Login: Ungültiger TOTP-Code ───────────────────────────────────────────────
  it("MFA-Schritt: Ungültiger Code zeigt Fehlermeldung", () => {
    cy.visit("/auth/login");

    cy.intercept("POST", "/api/auth/login", {
      statusCode: 200,
      body: { mfaRequired: true },
    });

    cy.intercept("POST", "/api/auth/mfa/login-complete", {
      statusCode: 401,
      body: { error: "Ungültiger Code. Bitte erneut versuchen." },
    }).as("loginComplete");

    cy.get('input[type="email"]').type("mfa@test.de");
    cy.get('input[type="password"]').type("Test1234!");
    cy.get('button[type="submit"]').click();

    cy.contains("Zwei-Faktor-Authentifizierung").should("be.visible");
    cy.get('input[inputMode="numeric"]').type("000000");
    cy.get('button[type="submit"]').click();

    cy.wait("@loginComplete");
    cy.contains("Ungültiger Code").should("be.visible");
  });

  // ── Login: Zurück-Button im MFA-Schritt ──────────────────────────────────────
  it("MFA-Schritt: Zurück-Button kehrt zum Login zurück", () => {
    cy.visit("/auth/login");

    cy.intercept("POST", "/api/auth/login", {
      statusCode: 200,
      body: { mfaRequired: true },
    });

    cy.get('input[type="email"]').type("mfa@test.de");
    cy.get('input[type="password"]').type("Test1234!");
    cy.get('button[type="submit"]').click();

    cy.contains("Zwei-Faktor-Authentifizierung").should("be.visible");
    cy.contains("Zurück zur Anmeldung").click();
    cy.get('h2').should("contain", "Anmelden");
  });

  // ── Login: Backup-Code-Eingabe ────────────────────────────────────────────────
  it("MFA-Schritt: Wechsel zu Backup-Code-Eingabe", () => {
    cy.visit("/auth/login");

    cy.intercept("POST", "/api/auth/login", {
      statusCode: 200,
      body: { mfaRequired: true },
    });

    cy.get('input[type="email"]').type("mfa@test.de");
    cy.get('input[type="password"]').type("Test1234!");
    cy.get('button[type="submit"]').click();

    cy.contains("Backup-Code verwenden").click();
    cy.get('input[placeholder="XXXXX-XXXXX"]').should("be.visible");
    cy.contains("Zurück zum Authenticator-Code").should("be.visible");
  });

  // ── Sicherheits-Seite: MFA-Setup API ─────────────────────────────────────────
  it("GET /api/auth/mfa/setup ohne Auth – 401", () => {
    cy.request({
      url: "/api/auth/mfa/setup",
      method: "GET",
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([401, 403]);
    });
  });

  it("POST /api/auth/mfa/setup ohne Auth – 401", () => {
    cy.request({
      url: "/api/auth/mfa/setup",
      method: "POST",
      failOnStatusCode: false,
      body: { encryptedSecret: "test", totpCode: "123456" },
    }).then((res) => {
      expect(res.status).to.be.oneOf([401, 403]);
    });
  });

  it("DELETE /api/auth/mfa/setup ohne Auth – 401", () => {
    cy.request({
      url: "/api/auth/mfa/setup",
      method: "DELETE",
      failOnStatusCode: false,
      body: { totpCode: "123456" },
    }).then((res) => {
      expect(res.status).to.be.oneOf([401, 403]);
    });
  });

  // ── Profil-Seite: Link zur Sicherheitsseite ───────────────────────────────────
  it("Profil-Seite hat Link zur Sicherheitsseite", () => {
    // Login simulieren (Mock)
    cy.intercept("GET", "/api/auth/session", { body: { user: { id: "1", email: "test@test.de", role: "USER" } }, statusCode: 200 });
    cy.visit("/auth/login");
    cy.get('input[type="email"]').type(Cypress.env("TEST_EMAIL") || "test@test.de");
    cy.get('input[type="password"]').type(Cypress.env("TEST_PASSWORD") || "Test1234!");
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should("include", "/dashboard");

    cy.visit("/profile");
    cy.contains("Sicherheit").should("be.visible");
    cy.get('a[href="/profile/security"]').should("exist");
  });
});
