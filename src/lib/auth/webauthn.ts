/**
 * WebAuthn / FIDO2 Hilfsbibliothek
 * Wrapper für @simplewebauthn/server – Fingerabdruck, Face ID, Sicherheitsschlüssel
 */
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";

export const RP_ID   = process.env.WEBAUTHN_RP_ID     ?? "localhost";
export const RP_NAME = process.env.WEBAUTHN_RP_NAME   ?? "BW-Manage";
export const RP_ORIGIN = process.env.WEBAUTHN_ORIGIN  ?? "http://localhost:3000";

export {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
};
export type {
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts,
};
