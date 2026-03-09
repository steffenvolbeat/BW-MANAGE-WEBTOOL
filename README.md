# BW-Manage Webtool

## Duplikat-Erkennung & Merge
- Endpunkte: `/api/applications/duplicates`, `/api/contacts/duplicates` (optional `threshold`, `targetId`).
- Merge: POST `/api/applications/merge` oder `/api/contacts/merge` mit `{ primaryId, duplicateId }` (verschiebt Relationen, löscht Dublette).
- UI: In Bewerbungen- und Kontakte-Übersicht „Duplikate finden & mergen“ (Fuzzy: Jaro-Winkler + TF-IDF auf Firma/Position/Email/Name).

## AI-Bewerbungscoach (privacy-first)
- Endpoint: `/api/ai/coach` mit `{ applicantText, requirements?, jobDescription?, mode?: "local" | "anthropic" }`.
- UI: Bewerbungs-Detail → Abschnitt „AI-Bewerbungscoach“ (lokal ohne Übertragung, optional Claude Zero-Retention mit `ANTHROPIC_API_KEY`).

## Quantenresistente Krypto (ML-KEM / ML-DSA)
- Optional-Dependency: `@noble/post-quantum` (Kyber-1024, Dilithium-87). Ohne Paket fällt das System auf ECDH zurück.
- Status: `/api/security/crypto-status` meldet PQ-Verfügbarkeit.
- Kyber Handshake: `/api/security/pq/handshake` (GET liefert Public Key, POST nimmt ciphertextB64 und gibt Hash-Fingerprint des Shared Secrets zurück).
- Library: `src/lib/crypto/postQuantum.ts` bietet Kyber/Dilithium Helper (`generateKyberKeypair`, `kyberEncapsulate`, `decapsulateServerSharedSecret`, `sharedSecretToAesKey`).

## Self-Sovereign Identity (SSI) + Verifiable Credentials
- Nutzer behält volle Kontrolle über Identitäten (W3C DID) und Zeugnisse als verifizierbare Credentials (VCs).
- Zeugnisse/Zertifikate/Referenzschreiben werden kryptografisch signiert und als VCs gespeichert; Verifier prüft Signatur gegen DID-Dokument.
- Arbeitgeber können Authentizität on-chain prüfen (DID Resolver/Registry) ohne Drittparteien oder zentrales Arbeitgeberregister.
- Kein Single-Point-of-Failure: Aussteller-Schlüssel signieren, Holder verwaltet Wallet, Prüfer validiert Proofs direkt.
- API: `/api/ssi/credentials` (GET list, POST issue VC, PATCH revoke), `/api/ssi/verify` (POST { jwt }). Server speichert VCs verschlüsselt (AES-256-GCM Vault), Herausgabe als JWT (ES256K) für `did:ethr`.
- Env: `SSI_ISSUER_DID`, `SSI_ISSUER_PRIVATE_KEY` (hex, secp256k1), `SSI_VAULT_KEY` (base64 32B), optional `ETH_RPC_URL`, `ETH_CHAIN_ID`, `DID_REGISTRY_ADDRESS`.
- Beispiel Issue (POST `/api/ssi/credentials`): `{ userId, holderDid: "did:ethr:0x...", type: "EmploymentReference", credentialSubject: { id: "did:ethr:0x...", name: "Alice", role: "Engineer", company: "ACME" } }` → Response liefert `jwt` + `fingerprint`.

## Federated Learning – Job-Match-KI ohne Datenweitergabe
- Match-Modell wird lokal auf dem Gerät trainiert; nur verschlüsselte Gradient-Updates werden an den Aggregations-Server gesendet (kein Upload von Rohdaten oder Features).
- Aggregation via FedAvg + Differential Privacy (ε-DP) mit Rauschen pro Update; Privacy-Budget (Σε) wird mitgeschnitten (`FederatedSession.epsilon`).
- Transparenz: globale Modellversionen und Training-Stats in `FederatedModel` (Gewichte, Teilnehmer, ε-Verbrauch) persistiert.
- Ziel: Job-Empfehlungen („welche Jobs passen?“) ohne zentrale Profilbildung; Server sieht nur aggregierte, verrauschte Updates.
- API: `/api/federated/submit` (POST verschlüsseltes Update + DP-Metadaten), `/api/federated/model` (GET aktuelles Modell + Meta).
- Env: `FEDERATED_AGG_KEY` (base64 32B AES-GCM für Update-Decrypt), optional `FEDERATED_QUEUE_DEBOUNCE_MS` (Millis Batch-Delay für Aggregation). Client sendet AES-GCM `{ ciphertext, iv, tag }` oder im Dev-Fall `update: number[]` + `sampleCount`, `epsilon`, `noiseScale`, optional `modelVersion`.
- Client-Helfer: `src/lib/federated/client.ts` zum AES-GCM-Verschlüsseln und Submitten der Updates.

## Dezentrales Dokumenten-Speicher (IPFS/Filecoin)
- Optionaler Upload verschlüsselter Dokumente auf IPFS (Content-addressed); in der DB wird nur der verschlüsselte CID hinterlegt (`Document.ipfsCid`, `ipfsEncrypted`).
- Verfügbarkeit auch bei Server-Ausfall: Retrieval via IPFS-Gateway (`ipfsGateway`) oder eigener Node.
- Zugriffskontrolle: Entschlüsselung nur clientseitig mit Nutzer-Schlüssel; optional NFT-/Token-Gating möglich, da CID öffentlich, Inhalt verschlüsselt.
- Content-Integrität durch CID garantiert; Server sieht keinen Klartext.

### IPFS Setup
- Prisma-Schema anwenden: `npx prisma migrate dev --name add_ipfs_fields` (oder `prisma db push` in Dev).
- Env setzen (eine der Optionen):
	- `WEB3_STORAGE_TOKEN` (oder `WEB3STORAGE_TOKEN`) für web3.storage.
	- Alternativ Infura: `IPFS_INFURA_PROJECT_ID`, `IPFS_INFURA_PROJECT_SECRET`.
	- Alternativ eigener Node: `IPFS_LOCAL_ENDPOINT` (z.B. `http://127.0.0.1:5001`).
- Optional: `IPFS_GATEWAY` wenn nicht `https://w3s.link/ipfs/` genutzt werden soll.
- App neu starten (`NEXT_DISABLE_TURBOPACK=1 npm run dev -- --hostname 127.0.0.1 --port 3000`).
- Upload-UI: Checkbox „Auf IPFS speichern“ (nur in Kombination mit Verschlüsselung aktiv).

## Development
- Typecheck: `npx tsc --noEmit`
- Lint: `npm run lint`
- Dev: `npm run dev`
