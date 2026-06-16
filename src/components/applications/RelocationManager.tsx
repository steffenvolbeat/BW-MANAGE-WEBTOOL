"use client";

import { useEffect, useState } from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  HomeModernIcon,
  ShieldCheckIcon,
  BuildingLibraryIcon,
  TruckIcon,
  GlobeEuropeAfricaIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckSolid } from "@heroicons/react/24/solid";

interface Props {
  applicationId: string;
  companyName: string;
  position: string;
  country: string;
  city?: string;
  status: string;
  onClose: () => void;
}

/* ─── Typen ──────────────────────────────────────────────────────────── */
interface CheckItem {
  id: string;
  label: string;
  detail?: string;
  urgent?: boolean;
}
interface CheckCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  phase: string;
  items: CheckItem[];
}

/* ─── Hilfsfunktion: Land → Kennung ────────────────────────────────── */
function detectCountryCode(country: string): "AT" | "CH" | "EU" | "OTHER" {
  const c = country.toLowerCase();
  if (c.includes("österreich") || c.includes("austria") || c === "at") return "AT";
  if (c.includes("schweiz") || c.includes("switzerland") || c === "ch") return "CH";
  const euCountries = [
    "frankreich", "niederlande", "belgien", "luxemburg", "spanien", "portugal",
    "italien", "schweden", "norwegen", "dänemark", "finnland", "tschechien",
    "slowakei", "ungarn", "rumänien", "bulgarien", "kroatien", "slowenien",
    "estland", "lettland", "litauen", "irland", "malta", "zypern", "griechenland",
    "poland", "france", "netherlands", "belgium", "spain",
  ];
  if (euCountries.some((eu) => c.includes(eu))) return "EU";
  return "OTHER";
}

/* ─── Checklisten-Daten ──────────────────────────────────────────────── */
function buildChecklist(code: "AT" | "CH" | "EU" | "OTHER"): CheckCategory[] {
  const base: CheckCategory[] = [
    {
      id: "vorbereitung",
      title: "Vorbereitung",
      icon: ClipboardDocumentCheckIcon,
      phase: "2–3 Monate vor Umzug",
      items: [
        { id: "v1", label: "Kündigung beim aktuellen Arbeitgeber einreichen", detail: "Kündigungsfrist prüfen (oft 3 Monate)", urgent: true },
        { id: "v2", label: "Wohnungskündigung schriftlich einreichen", detail: "Gesetzliche Kündigungsfrist in DE: meist 3 Monate", urgent: true },
        { id: "v3", label: "Unterkunft im Zielland suchen & buchen", detail: "Temporäre Unterkunft als Übergangslösung sichern" },
        { id: "v4", label: "Umzugsunternehmen vergleichen & beauftragen", detail: "Kostenvoranschläge von mind. 3 Firmen einholen" },
        { id: "v5", label: "Umzugsbudget detailliert erstellen", detail: "Kaution, erste Miete, Transport, Sonstiges kalkulieren" },
        { id: "v6", label: "Alle wichtigen Dokumente zusammenstellen & kopieren", detail: "Reisepass, Geburtsurkunde, Heiratsurkunde, Zeugnisse, Rentenbescheid" },
        { id: "v7", label: "Aktuelle Krankenversicherung Kündigungsbedingungen prüfen", urgent: true },
        { id: "v8", label: "Haustier-Reisedokumente vorbereiten (falls vorhanden)" },
      ],
    },
    {
      id: "abmeldung_de",
      title: "Abmeldung in Deutschland",
      icon: BuildingLibraryIcon,
      phase: "1–2 Monate vor Umzug",
      items: [
        { id: "a1", label: "Abmeldung beim Einwohnermeldeamt (frühestens 1 Woche vor Auszug, spätestens 2 Wochen danach)", urgent: true },
        { id: "a2", label: "Finanzamt über Wechsel ins Ausland informieren (Wohnsitzwechsel)", urgent: true },
        { id: "a3", label: "Deutsche Rentenversicherung (DRV) Adressänderung mitteilen" },
        { id: "a4", label: "Bundesagentur für Arbeit über Wegzug informieren (falls relevant)" },
        { id: "a5", label: "GEZ / Rundfunkbeitrag abmelden", detail: "Online: rundfunkbeitrag.de → Abmeldung wegen Wegzug ins Ausland" },
        { id: "a6", label: "Kfz-Zulassung & Kennzeichen: Abmeldung oder Export-Umschreibung" },
        { id: "a7", label: "Deutsches Konto entscheiden: behalten oder kündigen?", detail: "Empfehlung: behalten bis alles im neuen Land geregelt ist" },
        { id: "a8", label: "Nachsendeauftrag bei der Deutschen Post einrichten", detail: "Kosten ca. 30 €/6 Monate — lohnt sich!" },
      ],
    },
    {
      id: "vertraege",
      title: "Verträge & Mitgliedschaften kündigen",
      icon: DocumentTextIcon,
      phase: "2 Monate vor Umzug",
      items: [
        { id: "k1", label: "Deutschen Stromanbieter kündigen" },
        { id: "k2", label: "Deutsches Internet / Festnetz kündigen" },
        { id: "k3", label: "Mobilfunkvertrag prüfen / kündigen oder Roaming klären" },
        { id: "k4", label: "Krankenversicherung (GKV/PKV) kündigen", urgent: true },
        { id: "k5", label: "Private Haftpflichtversicherung prüfen / umstellen" },
        { id: "k6", label: "Hausratversicherung kündigen (nach Auszug)" },
        { id: "k7", label: "Kfz-Versicherung für Auslandsumzug informieren" },
        { id: "k8", label: "Gym-, Sport- oder Vereinsmitgliedschaften kündigen" },
        { id: "k9", label: "Streaming-Dienste prüfen (Netflix, Spotify – Geo-Einschränkungen!)" },
        { id: "k10", label: "Zeitungsabos und Abonnements kündigen" },
      ],
    },
    {
      id: "umzugstag",
      title: "Umzugstag & Wohnungsübergabe",
      icon: TruckIcon,
      phase: "Umzugstag",
      items: [
        { id: "u1", label: "Übergabeprotokoll der alten Wohnung anfertigen (Fotos!)", urgent: true },
        { id: "u2", label: "Zählerstände ablesen (Strom, Gas, Wasser) & fotografieren" },
        { id: "u3", label: "Schlüssel vollständig übergeben & Übergabe schriftlich bestätigen" },
        { id: "u4", label: "Spedition / Umzugsfahrzeug beaufsichtigen" },
        { id: "u5", label: "Inventarliste beim Be- und Entladen abhaken" },
        { id: "u6", label: "Neue Wohnung auf Schäden prüfen (vor Möbeleinzug!)" },
        { id: "u7", label: "Zählerstände der neuen Wohnung ablesen & notieren" },
        { id: "u8", label: "Schlüssel der neuen Wohnung sichern (Zweitschlüssel machen)" },
      ],
    },
    {
      id: "finanzen",
      title: "Banking & Finanzen",
      icon: CurrencyEuroIcon,
      phase: "Erste 2 Wochen im neuen Land",
      items: [
        { id: "f1", label: "Lokales Bankkonto eröffnen", urgent: true },
        { id: "f2", label: "Arbeitgeber neue IBAN mitteilen (Gehaltsüberweisung!)", urgent: true },
        { id: "f3", label: "Laufende Lastschriften / SEPA-Mandate auf neues Konto umstellen" },
        { id: "f4", label: "Steuerliche Situation prüfen (Doppelbesteuerungsabkommen DE–AT/CH)" },
        { id: "f5", label: "Notfallreserve (3 Monatsgehälter) für Unvorhergesehenes bereithalten" },
      ],
    },
    {
      id: "leben",
      title: "Alltag & Integration",
      icon: UserGroupIcon,
      phase: "Erste 4 Wochen",
      items: [
        { id: "l1", label: "Hausarzt & Zahnarzt im neuen Wohnort suchen" },
        { id: "l2", label: "Apotheke, Supermarkt, ÖPNV erkunden" },
        { id: "l3", label: "Kinder in Schule / Kindergarten anmelden (falls vorhanden)" },
        { id: "l4", label: "Haustier lokal anmelden & ggf. Hundesteuer entrichten" },
        { id: "l5", label: "Lokale Sprachkurse oder Integrationsprogramme prüfen" },
        { id: "l6", label: "Networking: LinkedIn Standort aktualisieren, lokale Berufsgruppen beitreten" },
        { id: "l7", label: "Notfallkontakte im neuen Land einrichten (Feuerwehr, Polizei, Arzt)" },
      ],
    },
  ];

  const atItems: CheckCategory[] = [
    {
      id: "at_behoerden",
      title: "🇦🇹 Behörden & Anmeldung (Österreich)",
      icon: BuildingLibraryIcon,
      phase: "Erste 3 Tage nach Einzug — PFLICHT",
      items: [
        { id: "at1", label: "Meldezettel beim Magistrat / Gemeindeamt ausfüllen", detail: "Frist: 3 Tage nach Einzug — Bußgeld bei Versäumnis!", urgent: true },
        { id: "at2", label: "Unterkunftgeber (Vermieter) muss Meldezettel mitunterschreiben", urgent: true },
        { id: "at3", label: "Sozialversicherungsnummer (SV-Nummer) beantragen oder übertragen", detail: "Wird vom Arbeitgeber über die ÖGK angemeldet — trotzdem nachfragen" },
        { id: "at4", label: "E-Card (Krankenversicherungskarte) von der ÖGK beantragen", detail: "Österreichische Gesundheitskasse — employer registriert automatisch" },
        { id: "at5", label: "Österreichischen Reisepass / Personalausweis für Meldung mitbringen" },
        { id: "at6", label: "Steuernummer beim Finanzamt Austria beantragen (falls Steuererklärung nötig)" },
        { id: "at7", label: "FinanzOnline-Account registrieren (digitale Steuererklärung AT)" },
      ],
    },
    {
      id: "at_kv",
      title: "🇦🇹 Krankenversicherung (ÖGK)",
      icon: ShieldCheckIcon,
      phase: "Automatisch über Arbeitgeber",
      items: [
        { id: "at_kv1", label: "Arbeitgeber meldet automatisch bei der ÖGK an — bestätigen lassen", urgent: true },
        { id: "at_kv2", label: "E-Card beantragen (kommt per Post, dauert ca. 2 Wochen)" },
        { id: "at_kv3", label: "Krankenversicherungsbeitrag: ca. 7,65 % des Gehalts (Arbeitnehmeranteil)" },
        { id: "at_kv4", label: "Private Zusatzversicherung prüfen (z. B. UNIQA, Generali, Wiener Städtische)" },
        { id: "at_kv5", label: "Deutsche GKV kündigen (schriftlich, Frist beachten — Formular online)" },
      ],
    },
    {
      id: "at_banking",
      title: "🇦🇹 Bank & Steuern",
      icon: CurrencyEuroIcon,
      phase: "Erste 2 Wochen",
      items: [
        { id: "at_b1", label: "Konto bei österreichischer Bank eröffnen", detail: "z. B. Bank Austria, Erste Bank, Raiffeisen, Bawag, N26 (online, EU-Konto)" },
        { id: "at_b2", label: "Währung: EURO — kein Umtausch nötig ✓" },
        { id: "at_b3", label: "Steuerklärung in AT: Pflicht ab 730 € Nebeneinkünfte pro Jahr" },
        { id: "at_b4", label: "Lohnzettel (L16) vom Arbeitgeber für Einkommensteuererklärung sichern" },
        { id: "at_b5", label: "Doppelbesteuerungsabkommen DE–AT: Einkommen wird NUR in AT besteuert" },
      ],
    },
    {
      id: "at_mobilitaet",
      title: "🇦🇹 Fahrzeug & Mobilität",
      icon: TruckIcon,
      phase: "Innerhalb von 1 Jahr",
      items: [
        { id: "at_m1", label: "Führerschein: Deutsches EU-Führerschein ist in AT gültig — KEINE Umschreibung nötig ✓" },
        { id: "at_m2", label: "Kfz-Umzulassung auf österreichisches Kennzeichen (Bezirkshauptmannschaft)" },
        { id: "at_m3", label: "Österreichische Kfz-Versicherung abschließen (STEUER pflicht!)" },
        { id: "at_m4", label: "Pickerl (§57a-Überprüfung = TÜV) alle 2 Jahre bei zugelassenen Werkstätten" },
        { id: "at_m5", label: "ÖAMTC oder ARBÖ Mitgliedschaft prüfen (= ADAC-Äquivalent)" },
        { id: "at_m6", label: "Öffi-Ticket: Österreichische Klimaticket (365 €/Jahr für ganz Österreich!)" },
      ],
    },
  ];

  const chItems: CheckCategory[] = [
    {
      id: "ch_behoerden",
      title: "🇨🇭 Behörden & Aufenthalt (Schweiz)",
      icon: BuildingLibraryIcon,
      phase: "Erste 14 Tage — GESETZESPFLICHT",
      items: [
        { id: "ch1", label: "Anmeldung bei der Einwohnerkontrolle der Gemeinde", detail: "Frist: 14 Tage nach Einzug — Bußgeld bei Versäumnis bis 500 CHF!", urgent: true },
        { id: "ch2", label: "Aufenthaltsbewilligung B-Ausweis beantragen (EU-Bürger, jährlich erneuerbar)", urgent: true, detail: "Dazu: Arbeitsvertrag, Wohnungsnachweis, Reisepass, Passfoto" },
        { id: "ch3", label: "AHV-Nummer (Sozialversicherungs-Nr.) beim Arbeitgeber / AHV-Ausgleichskasse beantragen", urgent: true },
        { id: "ch4", label: "Quellensteuer-Karte prüfen (B-Ausweis-Inhaber → Quellensteuer wird vom Arbeitgeber abgezogen)" },
        { id: "ch5", label: "Niederlassungsort: Kantonale Besonderheiten checken (Zug, Zürich, Basel, Bern, Genf unterscheiden sich!)" },
        { id: "ch6", label: "Betreibungsregisterauszug bei Schufa-Anfragen in der Schweiz sicherheitshalber besorgen" },
      ],
    },
    {
      id: "ch_kv",
      title: "🇨🇭 Krankenversicherung — PFLICHT! ⚠️",
      icon: ShieldCheckIcon,
      phase: "Innerhalb von 3 Monaten — RÜCKWIRKEND PFLICHT",
      items: [
        { id: "ch_kv1", label: "Obligatorische Krankenversicherung (OKP / Grundversicherung) abschließen", detail: "PFLICHT in der Schweiz — rückwirkend ab Einreisedatum! Nicht vergessen!", urgent: true },
        { id: "ch_kv2", label: "Krankenversicherer vergleichen & wählen", detail: "z. B. CSS, Helsana, Swica, Sympany, Visana, KPT, Concordia — auf comparis.ch vergleichen!" },
        { id: "ch_kv3", label: "Prämie kalkulieren: ca. 300–600 CHF/Monat pro Person (je nach Kanton & Franchise)", urgent: true },
        { id: "ch_kv4", label: "Franchise wählen: 300 CHF (teurer Prämie) bis 2.500 CHF (günstigere Prämie)", detail: "Bei guter Gesundheit: hohe Franchise + Unfalldeckung über Arbeitgeber" },
        { id: "ch_kv5", label: "Unfallversicherung: Arbeitgeber deckt Berufs- & Nichtberufsunfälle (ab 8h/Woche Nichtberufsunfall)" },
        { id: "ch_kv6", label: "Zusatzversicherung (Halbprivat/Privat) separat prüfen" },
        { id: "ch_kv7", label: "Deutsche GKV kündigen nach Bestätigung der Schweizer KV", urgent: true },
        { id: "ch_kv8", label: "Prämienverbilligung (Subvention) prüfen — je nach Einkommen & Kanton möglich" },
      ],
    },
    {
      id: "ch_banking",
      title: "🇨🇭 Bank, Steuern & AHV",
      icon: CurrencyEuroIcon,
      phase: "Erste 2–4 Wochen",
      items: [
        { id: "ch_b1", label: "Konto bei Schweizer Bank eröffnen", detail: "z. B. PostFinance, UBS, ZKB (Zürich), Kantonalbanken, Neon (digital/günstig), Yuh (Swissquote)", urgent: true },
        { id: "ch_b2", label: "Währung: CHF (Schweizer Franken) — ≈ 1,03–1,08 EUR", detail: "Kein Euro in der Schweiz! Bargeld & Kartenzahlungen in CHF" },
        { id: "ch_b3", label: "AHV-Beiträge: Arbeitgeber & Arbeitnehmer je 50% — automatisch abgezogen" },
        { id: "ch_b4", label: "BVG (Berufliche Vorsorge = Pensionskasse): Arbeitgeber meldet an — Ausweis anfordern" },
        { id: "ch_b5", label: "Quellensteuer (für B-Ausweis): Arbeitgeber zieht Steuer direkt ab — Steuererklärung nur auf Antrag" },
        { id: "ch_b6", label: "Doppelbesteuerungsabkommen DE–CH beachten: Grenzgänger vs. Einwohner unterschiedlich!" },
        { id: "ch_b7", label: "Steuererklärung (falls nötig): Kantonssteuer + Bundessteuer — Steuersatz je nach Kanton!" },
        { id: "ch_b8", label: "Günstigste Kantone: Zug, Schwyz, Nidwalden — Teure Kantone: Genf, Jura, Basel-Stadt" },
      ],
    },
    {
      id: "ch_mobilitaet",
      title: "🇨🇭 Fahrzeug & Mobilität",
      icon: TruckIcon,
      phase: "Innerhalb von 12 Monaten",
      items: [
        { id: "ch_m1", label: "Führerschein: Deutsches EU-Führerschein 12 Monate gültig — danach Umschreibung!", detail: "Kosten: ca. 65 CHF + Arztzeugnis (20–80 CHF) beim kantonalen Strassenverkehrsamt", urgent: true },
        { id: "ch_m2", label: "Kfz-Immatrikulation (Zulassung): Fahrzeug auf Schweizer Kennzeichen ummelden", detail: "Kosten: ca. 100–200 CHF — kantonales Strassenverkehrsamt zuständig" },
        { id: "ch_m3", label: "Motorfahrzeugsteuer (jährlich — kantonal unterschiedlich)" },
        { id: "ch_m4", label: "Motorfahrzeug-Haftpflichtversicherung in der Schweiz abschließen — PFLICHT", urgent: true },
        { id: "ch_m5", label: "MFK (Motorfahrzeugkontrolle = TÜV) bei der Anmeldung in CH" },
        { id: "ch_m6", label: "GA (Generalabonnement) oder Halbtax-Abonnement der SBB prüfen — günstiger ÖPNV!" },
        { id: "ch_m7", label: "Vignette (Autobahnvignette CH): 40 CHF/Jahr — Pflicht auf Autobahnen" },
      ],
    },
    {
      id: "ch_leben",
      title: "🇨🇭 Leben & Besonderheiten",
      icon: UserGroupIcon,
      phase: "Allgemein",
      items: [
        { id: "ch_l1", label: "Sprache: Deutsch (Deutschschweiz), Französisch (Romandie), Italienisch (Tessin)" },
        { id: "ch_l2", label: "Schweizerdeutsch: Stark abweichender Dialekt — Hochdeutsch wird verstanden & akzeptiert" },
        { id: "ch_l3", label: "Ruhezeiten beachten: Sonntag + Feiertage kein Lärm, kein Wäsche waschen in vielen Häusern" },
        { id: "ch_l4", label: "Abfalltrennung: Kehrichtsäcke (offiziell, kostenpflichtig!), Glas, PET, Karton, Sonderabfall" },
        { id: "ch_l5", label: "SRG-Abgabe (= Schweizer GEZ): 335 CHF/Jahr für Haushalte, automatisch eingezogen" },
        { id: "ch_l6", label: "Lohnkonto: Löhne in CH sind brutto deutlich höher als in DE — aber Lebenshaltungskosten auch!" },
        { id: "ch_l7", label: "Haustiere: Chip-Pflicht, EU-Heimtierausweis + aktueller Tollwutimpfung ausreichend" },
        { id: "ch_l8", label: "Hunde: Sachkundenachweis in manchen Kantonen Pflicht (z.B. Zürich: TierSchHuV)" },
      ],
    },
  ];

  const euItems: CheckCategory[] = [
    {
      id: "eu_behoerden",
      title: "🇪🇺 EU-Land: Anmeldung & Aufenthalt",
      icon: GlobeEuropeAfricaIcon,
      phase: "Erste 1–3 Monate",
      items: [
        { id: "eu1", label: "Freizügigkeit: Als EU-Bürger kein Visum nötig ✓", detail: "Aufenthalt bis 3 Monate ohne Formalitäten, danach Anmeldepflicht" },
        { id: "eu2", label: "Anmeldung bei lokaler Behörde (Frist je nach Land unterschiedlich)", urgent: true },
        { id: "eu3", label: "Aufenthaltsbescheinigung / EU-Bürger-Registrierung beantragen" },
        { id: "eu4", label: "Krankenversicherung: Nachweis im jeweiligen Land erforderlich" },
        { id: "eu5", label: "Sozialversicherungsausweis aus DE mitnehmen (A1-Bescheinigung)" },
        { id: "eu6", label: "Steuerliche Ansässigkeit im neuen Land klären" },
      ],
    },
  ];

  const categories = [...base];
  if (code === "AT") return [...categories, ...atItems];
  if (code === "CH") return [...categories, ...chItems];
  if (code === "EU") return [...categories, ...euItems];
  return categories;
}

/* ─── Kosten-Schätzer ────────────────────────────────────────────────── */
interface CostItem { label: string; low: number; high: number; currency: string; note?: string }

function buildCosts(code: "AT" | "CH" | "EU" | "OTHER"): CostItem[] {
  const cur = code === "CH" ? "CHF" : "€";
  const base: CostItem[] = [
    { label: "Umzugsunternehmen (Fernumzug)", low: 1200, high: 3500, currency: "€", note: "Je nach Volumen & Entfernung" },
    { label: "Kaution (3 Monatsmieten)", low: 2400, high: 6000, currency: cur, note: "Wird zurückerstattet bei Auszug" },
    { label: "Erste Monatsmiete", low: 800, high: 2000, currency: cur },
    { label: "Maklergebühr", low: 0, high: 2400, currency: cur, note: "In AT & CH oft 1–2 Monatsmieten" },
    { label: "Erste Einrichtung & Haushaltsgeräte", low: 500, high: 3000, currency: cur },
    { label: "Reisekosten (Wohnungsbesichtigungen etc.)", low: 200, high: 800, currency: "€" },
    { label: "Nachsendeauftrag Deutsche Post", low: 30, high: 60, currency: "€", note: "6–12 Monate" },
  ];

  if (code === "AT") {
    return [
      ...base,
      { label: "Krankenversicherung (ÖGK — über Arbeitgeber)", low: 0, high: 0, currency: "€", note: "Automatisch vom Lohn abgezogen ~7,65 %" },
      { label: "Kfz-Umzulassung Österreich", low: 150, high: 400, currency: "€" },
      { label: "Strom & Internet (Einrichtung)", low: 100, high: 300, currency: "€" },
      { label: "Diverses (Behördengänge, Kopien, Übersetzungen)", low: 100, high: 500, currency: "€" },
    ];
  }

  if (code === "CH") {
    return [
      ...base,
      { label: "Krankenversicherung (Grundversicherung p. M.)", low: 300, high: 600, currency: "CHF", note: "PRO PERSON — PFLICHT ab Tag 1! — auf comparis.ch vergleichen", },
      { label: "Vignette (Autobahngebühr jährlich)", low: 40, high: 40, currency: "CHF" },
      { label: "Führerschein-Umschreibung", low: 85, high: 200, currency: "CHF", note: "Inkl. Arztzeugnis" },
      { label: "Kfz-Zulassung Schweiz", low: 100, high: 250, currency: "CHF" },
      { label: "SRG-Abgabe (Medienabgabe, jährlich)", low: 335, high: 335, currency: "CHF" },
      { label: "Diverses (Behörden, Übersetzungen, Beglaubigungen)", low: 200, high: 800, currency: "CHF" },
    ];
  }

  return [
    ...base,
    { label: "Diverses (Behörden, Übersetzungen, Beglaubigungen)", low: 100, high: 600, currency: cur },
  ];
}

/* ─── Zeitplan ───────────────────────────────────────────────────────── */
const TIMELINE_EVENTS = [
  { month: "–3 Monate", events: ["Kündigung einreichen", "Wohnungssuche starten", "Umzugsunternehmen buchen"] },
  { month: "–2 Monate", events: ["Wohnung im Zielland sichern", "Verträge (Strom, Internet, Gym) kündigen", "Dokumente zusammenstellen"] },
  { month: "–1 Monat", events: ["Nachsendeauftrag einrichten", "Umzugskisten packen beginnen", "Krankenversicherung DE kündigen"] },
  { month: "Umzugswoche", events: ["Wohnungsübergabe (Protokoll!)", "Einzug in neue Wohnung", "Zählerstände ablesen"] },
  { month: "+1 Woche", events: ["Anmeldung bei Behörde (Pflicht!)", "Krankenversicherung abschließen (CH: sofort!)", "Konto eröffnen"] },
  { month: "+2–4 Wochen", events: ["Arbeitgeber neue Kontodaten mitteilen", "Aufenthaltsgenehmigung (CH: B-Ausweis)", "Arzt & Zahnarzt suchen"] },
  { month: "+1–3 Monate", events: ["Steuernummer beantragen", "Kfz ummelden", "Deutsche Abmeldung bestätigen"] },
  { month: "+6–12 Monate", events: ["Führerschein umschreiben (CH: Frist!)", "Erste Steuererklärung", "Soziale Integration festigen"] },
];

/* ─── Hauptkomponente ────────────────────────────────────────────────── */
export default function RelocationManager({ applicationId, companyName, position, country, city, status, onClose }: Props) {
  const code = detectCountryCode(country);
  const [tab, setTab] = useState<"overview" | "checklist" | "timeline" | "costs" | "docs">("overview");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["vorbereitung"]));

  const storageKey = `relocation-${applicationId}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setChecked(new Set(JSON.parse(saved) as string[]));
    } catch {}
  }, [storageKey]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const toggleCat = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const categories = buildChecklist(code);
  const allItems = categories.flatMap((c) => c.items);
  const totalItems = allItems.length;
  const checkedCount = allItems.filter((i) => checked.has(i.id)).length;
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const costs = buildCosts(code);
  const costLow = costs.reduce((s, c) => s + c.low, 0);
  const costHigh = costs.reduce((s, c) => s + c.high, 0);
  const mainCurrency = code === "CH" ? "CHF" : "€";

  const flagEmoji = code === "AT" ? "🇦🇹" : code === "CH" ? "🇨🇭" : code === "EU" ? "🇪🇺" : "🌍";
  const countryLabel = code === "AT" ? "Österreich" : code === "CH" ? "Schweiz" : country;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-3 py-4 sm:px-6 sm:py-8">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="shrink-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 px-5 sm:px-6 py-4 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{flagEmoji}</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-white/70">Umzugsmanagement</span>
                {code === "CH" && (
                  <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">Hohe KV-Kosten!</span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                Umzug nach {countryLabel}{city ? ` · ${city}` : ""}
              </h2>
              <p className="text-sm text-white/80 mt-0.5 truncate">
                {position} @ {companyName}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition shrink-0">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-white/80 mb-1">
              <span>{checkedCount} von {totalItems} Aufgaben erledigt</span>
              <span className="font-bold">{progress}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Tab Nav ── */}
        <div className="shrink-0 flex border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 overflow-x-auto">
          {([
            { key: "overview", label: "Überblick", icon: InformationCircleIcon },
            { key: "checklist", label: "Checkliste", icon: ClipboardDocumentCheckIcon },
            { key: "timeline", label: "Zeitplan", icon: CalendarDaysIcon },
            { key: "costs", label: "Kosten", icon: CurrencyEuroIcon },
            { key: "docs", label: "Dokumente", icon: DocumentTextIcon },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === key
                  ? "border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900"
                  : "border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4">

          {/* ÜBERBLICK */}
          {tab === "overview" && (
            <div className="space-y-4">
              {code === "CH" && (
                <div className="flex gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-800 dark:text-red-400">Wichtig: Krankenversicherung in der Schweiz ist GESETZESPFLICHT!</p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Ab dem Tag des Einzugs in der Schweiz müssen Sie eine private Krankenversicherung abschließen — rückwirkend.
                      Kosten: <strong>300–600 CHF/Monat pro Person</strong>. Auf <strong>comparis.ch</strong> vergleichen!
                    </p>
                  </div>
                </div>
              )}

              {code === "AT" && (
                <div className="flex gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <InformationCircleIcon className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-blue-800 dark:text-blue-400">Österreich: Meldepflicht binnen 3 Tagen nach Einzug!</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Beim Magistrat / Gemeindeamt mit Unterkunftgeberbestätigung (vom Vermieter) anmelden.
                      Krankenversicherung (ÖGK) wird automatisch vom Arbeitgeber gemeldet.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    icon: HomeModernIcon,
                    title: "Wohnen",
                    color: "blue",
                    items: code === "CH"
                      ? ["Wohnungsmarkt in CH ist sehr eng — früh suchen!", "Kaution: bis 3 Monatsmieten", "Mieten in Zürich/Genf sehr hoch (2.000–4.000+ CHF/Mt.)"]
                      : code === "AT"
                      ? ["Wien: 1.000–2.500 €/Monat für 2-Zi.-Wohnung", "Kaution: max. 3 Monatsmieten gesetzlich begrenzt", "Bundesländer deutlich günstiger als Wien"]
                      : ["Lokalen Wohnungsmarkt frühzeitig recherchieren", "Kaution & erste Miete einplanen", "Temporäre Unterkunft als Übergangslösung"],
                  },
                  {
                    icon: ShieldCheckIcon,
                    title: "Versicherungen",
                    color: "green",
                    items: code === "CH"
                      ? ["Grundversicherung (OKP): Pflicht — sofort abschließen!", "comparis.ch für Preisvergleich nutzen", "Franchise 300–2500 CHF — je höher, desto günstigere Prämie"]
                      : code === "AT"
                      ? ["ÖGK: automatisch über Arbeitgeber angemeldet", "Private Zusatzversicherung optional empfohlen", "Deutsche GKV kündigen nach Anmeldung"]
                      : ["Lokale Krankenversicherung prüfen", "Deutsche GKV kündigen", "Haftpflicht & Hausrat prüfen"],
                  },
                  {
                    icon: CurrencyEuroIcon,
                    title: "Finanzen",
                    color: "purple",
                    items: code === "CH"
                      ? ["Währung: CHF — kein Euro!", "Löhne sind höher, Lebenshaltung auch", "Quellensteuer wird direkt abgezogen", "Doppelbesteuerungsabkommen DE–CH nutzen"]
                      : code === "AT"
                      ? ["Währung: Euro — gleich wie DE ✓", "Steuern: nur in AT zu zahlen (DBA DE–AT)", "FinanzOnline für Steuererklärung nutzen"]
                      : ["Bankverbindung im Zielland einrichten", "Steuerliche Situation klären", "DBA Deutschland prüfen"],
                  },
                  {
                    icon: TruckIcon,
                    title: "Mobilität",
                    color: "orange",
                    items: code === "CH"
                      ? ["Führerschein: 12 Monate gültig, dann umschreiben!", "Kfz ummelden innerhalb 12 Monate", "Vignette (40 CHF/Jahr) für Autobahnen", "SBB GA oder Halbtax stark empfohlen"]
                      : code === "AT"
                      ? ["EU-Führerschein bleibt gültig — keine Umschreibung!", "Kfz auf österr. Kennzeichen ummelden", "Klimaticket: 365 €/Jahr für ganz Österreich!"]
                      : ["Führerschein-Gültigkeit im Zielland prüfen", "Kfz-Zulassung ggf. wechseln", "ÖPNV-Optionen erkunden"],
                  },
                ].map(({ icon: Icon, title, color, items }) => (
                  <div key={title} className={`rounded-xl border p-4 ${
                    color === "blue" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    : color === "green" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : color === "purple" ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                    : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 ${
                        color === "blue" ? "text-blue-600"
                        : color === "green" ? "text-green-600"
                        : color === "purple" ? "text-purple-600"
                        : "text-orange-600"
                      }`} />
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
                    </div>
                    <ul className="space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                          <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHECKLISTE */}
          {tab === "checklist" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Alle Aufgaben für Ihren Umzug nach <strong>{countryLabel}</strong>. Fortschritt wird automatisch gespeichert.
              </p>
              {categories.map((cat) => {
                const catChecked = cat.items.filter((i) => checked.has(i.id)).length;
                const isExpanded = expandedCats.has(cat.id);
                const Icon = cat.icon;
                return (
                  <div key={cat.id} className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleCat(cat.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div className="text-left min-w-0">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">{cat.title}</span>
                          <span className="ml-2 text-xs text-gray-500 dark:text-slate-400">{cat.phase}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          catChecked === cat.items.length
                            ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                            : "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300"
                        }`}>
                          {catChecked}/{cat.items.length}
                        </span>
                        {isExpanded ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="divide-y divide-gray-100 dark:divide-slate-700/60">
                        {cat.items.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <div className="shrink-0 mt-0.5">
                              {checked.has(item.id) ? (
                                <CheckSolid className="w-5 h-5 text-green-500" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-slate-600" />
                              )}
                            </div>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked.has(item.id)}
                              onChange={() => toggle(item.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 flex-wrap">
                                <span className={`text-sm ${checked.has(item.id) ? "line-through text-gray-400 dark:text-slate-500" : "text-gray-900 dark:text-white"}`}>
                                  {item.label}
                                </span>
                                {item.urgent && !checked.has(item.id) && (
                                  <span className="shrink-0 text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                                    WICHTIG
                                  </span>
                                )}
                              </div>
                              {item.detail && (
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{item.detail}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ZEITPLAN */}
          {tab === "timeline" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Empfohlener Zeitplan für Ihren Umzug nach <strong>{countryLabel}</strong>.
              </p>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-indigo-200 dark:bg-indigo-900" />
                <div className="space-y-4 pl-10">
                  {TIMELINE_EVENTS.map(({ month, events }) => (
                    <div key={month} className="relative">
                      <div className="absolute -left-10 top-1 w-5 h-5 bg-indigo-600 rounded-full border-2 border-white dark:border-slate-900 shadow flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-4">
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">{month}</p>
                        <ul className="space-y-1">
                          {events.map((ev) => (
                            <li key={ev} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <CheckCircleIcon className="w-4 h-4 text-gray-400 shrink-0" />
                              {ev}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* KOSTEN */}
          {tab === "costs" && (
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Geschätzte Gesamtkosten (Einmalig)</p>
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">
                  {costLow.toLocaleString("de-DE")} – {costHigh.toLocaleString("de-DE")} {mainCurrency}
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Zzgl. laufende Kosten (KV, Miete, …)</p>
              </div>
              <div className="space-y-2">
                {costs.map((c) => (
                  <div key={c.label} className="flex items-start justify-between gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{c.label}</p>
                      {c.note && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{c.note}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      {c.low === 0 && c.high === 0 ? (
                        <span className="text-sm text-green-600 font-medium">Inklusive</span>
                      ) : c.low === c.high ? (
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {c.low.toLocaleString("de-DE")} {c.currency}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {c.low.toLocaleString("de-DE")}–{c.high.toLocaleString("de-DE")} {c.currency}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {code === "CH" && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
                  <strong>Tipp Schweiz:</strong> Nutzen Sie <strong>comparis.ch</strong> für Krankenkassen-Vergleich und <strong>homegate.ch</strong> oder <strong>immoscout24.ch</strong> für die Wohnungssuche. Das Preisniveau ist deutlich höher als in Deutschland — planen Sie großzügig!
                </div>
              )}
              {code === "AT" && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
                  <strong>Tipp Österreich:</strong> Nutzen Sie <strong>willhaben.at</strong>, <strong>immowelt.at</strong> oder <strong>immoScout24.at</strong> für Wohnungssuche. Wien hat einen sehr engen Wohnungsmarkt — frühzeitig suchen!
                </div>
              )}
            </div>
          )}

          {/* DOKUMENTE */}
          {tab === "docs" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-slate-400">Diese Dokumente müssen Sie für die Anmeldung und Behördengänge bereithalten.</p>
              {[
                {
                  title: "Identität & Staatsbürgerschaft",
                  color: "blue",
                  docs: [
                    { name: "Reisepass (aktuell, mind. 1 Jahr gültig)", critical: true },
                    { name: "Personalausweis", critical: true },
                    { name: "Geburtsurkunde (evtl. beglaubigte Übersetzung)" },
                    { name: "Heiratsurkunde (falls verheiratet)" },
                    { name: "Scheidungsurteil (falls zutreffend)" },
                    { name: "Namensänderungsurkunde (falls zutreffend)" },
                  ],
                },
                {
                  title: "Wohnen & Anmeldung",
                  color: "green",
                  docs: [
                    { name: "Mietvertrag der neuen Wohnung", critical: true },
                    { name: code === "AT" ? "Unterkunftgeberbestätigung (Vermieter unterschrieben)" : "Wohnungsnachweis / Mietvertrag für Anmeldung", critical: true },
                    { name: "Vorheriger Wohnungsnachweis (Abmeldebescheinigung DE)" },
                    { name: "Passfoto (2–4 Stück für Behörden)" },
                  ],
                },
                {
                  title: "Arbeit & Bildung",
                  color: "indigo",
                  docs: [
                    { name: "Unterschriebener Arbeitsvertrag", critical: true },
                    { name: "Letztes Arbeitszeugnis (DE)" },
                    { name: "Schulzeugnisse & Hochschulabschlüsse (original + Kopie)" },
                    { name: "Berufsqualifikations-Nachweise, Zertifikate" },
                    { name: "Lebenslauf (DE + evtl. englische Version)" },
                  ],
                },
                {
                  title: "Finanzen & Versicherungen",
                  color: "yellow",
                  docs: [
                    { name: "Deutsches Sozialversicherungsausweis", critical: true },
                    { name: "Letzter Steuerbescheid (DE)" },
                    { name: code === "CH" ? "Nachweis Quellensteuer-Anmeldung" : "Steuernummer AT (nach Beantragung)" },
                    { name: "Versicherungsnachweise (KV, Haftpflicht)" },
                    { name: "Kontoauszüge der letzten 3 Monate (für Bankkonten-Eröffnung)" },
                    { name: "SCHUFA-Auskunft (für Wohnungssuche & Bankkonten in CH)" },
                  ],
                },
                {
                  title: "Fahrzeug & Mobilität",
                  color: "orange",
                  docs: [
                    { name: "Führerschein (EU-Führerschein)", critical: true },
                    { name: "Kfz-Zulassungsbescheinigung Teil I & II" },
                    { name: "Kfz-Versicherungsnachweis / Grüne Karte" },
                    { name: "TÜV-Bericht / HU-Bericht des Fahrzeugs" },
                  ],
                },
                {
                  title: "Haustiere (falls vorhanden)",
                  color: "teal",
                  docs: [
                    { name: "EU-Heimtierausweis mit Chip-Nachweis", critical: true },
                    { name: "Aktueller Tollwut-Impfnachweis", critical: code === "CH" },
                    { name: code === "CH" ? "Rabies-Antikörper-Test (falls aus nicht-gelisteten Ländern)" : "Gesundheitszeugnis vom Tierarzt" },
                    { name: "Hundesteuer: Abmeldung DE + Anmeldung im Zielland" },
                  ],
                },
              ].map(({ title, color, docs }) => (
                <div key={title} className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className={`px-4 py-2.5 border-b border-gray-200 dark:border-slate-700 ${
                    color === "blue" ? "bg-blue-50 dark:bg-blue-900/20"
                    : color === "green" ? "bg-green-50 dark:bg-green-900/20"
                    : color === "indigo" ? "bg-indigo-50 dark:bg-indigo-900/20"
                    : color === "yellow" ? "bg-yellow-50 dark:bg-yellow-900/20"
                    : color === "orange" ? "bg-orange-50 dark:bg-orange-900/20"
                    : "bg-teal-50 dark:bg-teal-900/20"
                  }`}>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-slate-700/60">
                    {docs.map((doc) => (
                      <div key={doc.name} className="flex items-center gap-3 px-4 py-2.5">
                        <DocumentTextIcon className={`w-4 h-4 shrink-0 ${doc.critical ? "text-red-500" : "text-gray-400"}`} />
                        <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{doc.name}</span>
                        {doc.critical && (
                          <span className="shrink-0 text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                            Pflicht
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {checkedCount} / {totalItems} Aufgaben · Fortschritt wird lokal gespeichert
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
