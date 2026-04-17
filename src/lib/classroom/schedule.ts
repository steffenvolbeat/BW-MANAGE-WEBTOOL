// Gemeinsam genutzte DCI-Classroom-Kursplanung (wird in Sync-API + Komponente verwendet)

export const COURSE_START = new Date(2026, 1, 9); // 09.02.2026 (Woche 0)

export interface WeekSchedule {
  week: number;
  title: string;
  goal: string;
  tagesplan: { day: string; focus: string }[];
}

export const WEEKS_SCHEDULE: WeekSchedule[] = [
  {
    week: 0,
    title: "Kick-Off & Orientierungswoche",
    goal: "Den Start der ISP-Phase strukturieren, Tools einrichten und erste Ziele setzen",
    tagesplan: [
      { day: "Tag 1", focus: "Begrüßung & Kursüberblick: Was erwartet dich in den 12 Wochen?" },
      { day: "Tag 2", focus: "Tools einrichten: Tracking-System, LinkedIn & Profil-Check" },
      { day: "Tag 3", focus: "Ziele setzen: Was will ich am Ende der ISP-Phase erreicht haben?" },
      { day: "Tag 4", focus: "Erste Stellenrecherche: Arbeitsmarkt erkunden, erste Wunschliste" },
      { day: "Tag 5", focus: "Planung W1: Bewerbungsziel und Wochenstrategie für Woche 1 festlegen" },
    ],
  },
  {
    week: 1,
    title: "Aufbau deiner Struktur für die Zeit der Jobsuche",
    goal: "Struktur und Überblick für die Bewerbungsphase schaffen",
    tagesplan: [
      { day: "Tag 1", focus: "Planung & Zielsetzung: Was ist mein Ziel diese Woche?" },
      { day: "Tag 2", focus: "Fokus Bewerbungen: Mindestens 2 Bewerbungen versenden" },
      { day: "Tag 3", focus: "Fokus Wochenziel: Weitere Bewerbungen & Recherche" },
      { day: "Tag 4", focus: "Fokus fachliche Skills: Weiterbildung, Portfolio" },
      { day: "Tag 5", focus: "Reflektion & Arbeitsmarkt-Screening: Was habe ich diese Woche erreicht?" },
    ],
  },
  {
    week: 2,
    title: "Professionalisierung deines Portfolios – Anschreiben",
    goal: "Individuelles, überzeugendes Anschreiben für jede Bewerbung verfassen",
    tagesplan: [
      { day: "Tag 1", focus: "Planung & Zielsetzung: Stellen analysieren" },
      { day: "Tag 2", focus: "Anschreiben verfassen: Struktur und Inhalt erarbeiten" },
      { day: "Tag 3", focus: "Anschreiben überarbeiten und korrigieren" },
      { day: "Tag 4", focus: "Formatierung, Speichern als PDF, Bewerbungen absenden" },
      { day: "Tag 5", focus: "Reflektion: Was lief gut? Was verbessern?" },
    ],
  },
  {
    week: 3,
    title: "Verbesserung deiner Networking Skills",
    goal: "Netzwerk aktiv aufbauen und Netzwerk-Events strategisch nutzen",
    tagesplan: [
      { day: "Tag 1", focus: "Planung: Welche Netzwerk-Events & Plattformen passen zu mir?" },
      { day: "Tag 2", focus: "LinkedIn-Netzwerk erweitern: 5 neue Kontakte hinzufügen" },
      { day: "Tag 3", focus: "Elevator Pitch für Netzwerk-Events vorbereiten" },
      { day: "Tag 4", focus: "An einem Event oder einer Online-Diskussion teilnehmen" },
      { day: "Tag 5", focus: "Reflektion: Was habe ich diese Woche Networking-mäßig erreicht?" },
    ],
  },
  {
    week: 4,
    title: "Erstellung deines Elevator Pitchs",
    goal: "Einen überzeugenden 30–60-Sekunden Elevator Pitch entwickeln und üben",
    tagesplan: [
      { day: "Tag 1", focus: "Selbstanalyse: Stärken, Ziele, USP definieren" },
      { day: "Tag 2", focus: "Elevator Pitch schreiben (4-Schritte-Aufbau)" },
      { day: "Tag 3", focus: "Pitch laut üben & aufnehmen, Feedback einholen (C.O.I.N.)" },
      { day: "Tag 4", focus: "Pitch verbessern, auf verschiedene Situationen anpassen" },
      { day: "Tag 5", focus: "Reflektion & Bewerbungsziel prüfen" },
    ],
  },
  {
    week: 5,
    title: "Vorbereitung auf Interviews",
    goal: "Professionell auf Vorstellungsgespräche vorbereiten",
    tagesplan: [
      { day: "Tag 1", focus: "Unternehmen recherchieren, Gesprächspartner googlen" },
      { day: "Tag 2", focus: "Typische Interviewfragen vorbereiten & Antworten üben" },
      { day: "Tag 3", focus: "Selbstvorstellung (Elevator Pitch) üben" },
      { day: "Tag 4", focus: "Eigene Fragen fürs Ende des Gesprächs vorbereiten (mind. 2-3)" },
      { day: "Tag 5", focus: "Setting vorbereiten (Kleidung, Anfahrt/Technik)" },
    ],
  },
  {
    week: 6,
    title: "Interviews üben",
    goal: "Selbstbewusstsein im Interview stärken, schwierige Situationen meistern",
    tagesplan: [
      { day: "Tag 1", focus: "Mindset-Übung: Stärken aufschreiben, positiv starten" },
      { day: "Tag 2", focus: "Mock-Interview simulieren (mit Freund/Aufnahme)" },
      { day: "Tag 3", focus: "Schwierige Fragen üben, Zeitbeschaffungs-Floskeln einüben" },
      { day: "Tag 4", focus: "Online-Setting vorbereiten & testen" },
      { day: "Tag 5", focus: "Reflektion & Bewerbungsaktivitäten" },
    ],
  },
  {
    week: 7,
    title: "Fokus Soft Skills – Umgang mit Absagen",
    goal: "Absagen professionell verarbeiten, Soft Skills stärken, Unternehmensperspektive verstehen",
    tagesplan: [
      { day: "Tag 1", focus: "Planung & Zielsetzung: Absagen analysieren und Learnings ableiten" },
      { day: "Tag 2", focus: "Soft Skills: Welche fehlen? Wie entwickeln?" },
      { day: "Tag 3", focus: "Recruiting-Prozess aus Unternehmensperspektive verstehen" },
      { day: "Tag 4", focus: "Bewerbungsunterlagen nochmal kritisch prüfen" },
      { day: "Tag 5", focus: "Reflektion & positiver Ausblick" },
    ],
  },
  {
    week: 8,
    title: "Aufbau deiner Struktur für die Zeit nach dem DCI Kurs",
    goal: "Langfristige Bewerbungsstruktur und Selbstmanagement nach Kursende entwickeln",
    tagesplan: [
      { day: "Tag 1", focus: "Ziele für die nächsten Wochen setzen" },
      { day: "Tag 2", focus: "Aktionsplan erstellen" },
      { day: "Tag 3", focus: "Herausforderungen und Hindernisse identifizieren" },
      { day: "Tag 4", focus: "Stärken weiterentwickeln, Schwächen minimieren" },
      { day: "Tag 5", focus: "Ressourcen planen & Fortschritt reflektieren" },
    ],
  },
  {
    week: 9,
    title: "Aktivität in sozialen Medien erhöhen",
    goal: "Professionelle Social-Media-Präsenz aufbauen und LinkedIn-Netzwerk aktiv nutzen",
    tagesplan: [
      { day: "Tag 1", focus: "Planung: Welche Inhalte kann ich posten? Ziele festlegen" },
      { day: "Tag 2", focus: "Effektiven Content erstellen und veröffentlichen" },
      { day: "Tag 3", focus: "LinkedIn-Netzwerk: Kommentieren, Fragen stellen, Verbindungen aufbauen" },
      { day: "Tag 4", focus: "Content verbessern und Beiträge optimieren" },
      { day: "Tag 5", focus: "Reflektion: Was wurde erreicht? Analytics auswerten" },
    ],
  },
  {
    week: 10,
    title: "Entwicklung von Zusatzqualifikationen",
    goal: "Relevante Soft Skills und Tech Skills für den Arbeitsmarkt gezielt weiterentwickeln",
    tagesplan: [
      { day: "Tag 1", focus: "Planung: Welche Qualifikationen fehlen? Prioritäten setzen" },
      { day: "Tag 2", focus: "Soft Skills entwickeln (Ressourcen nutzen)" },
      { day: "Tag 3", focus: "Tech Skills entwickeln (Kurs/Tutorial/Projekt)" },
      { day: "Tag 4", focus: "Fokus auf Bewerbungen: Mit neuen Skills bewerben" },
      { day: "Tag 5", focus: "Reflektion: Was habe ich diese Woche gelernt?" },
    ],
  },
  {
    week: 11,
    title: "Bewerbungs-Sprint",
    goal: "Intensive Bewerbungsphase – alle gelernten Kompetenzen in die Praxis umsetzen",
    tagesplan: [
      { day: "Tag 1", focus: "Stellenrecherche: 20 passende Stellen finden und priorisieren" },
      { day: "Tag 2", focus: "Stellenanalyse + 3 individuelle Anschreiben verfassen" },
      { day: "Tag 3", focus: "Weitere 3 Bewerbungen + Elevator Pitch üben" },
      { day: "Tag 4", focus: "Weitere Bewerbungen + Interview-Vorbereitung" },
      { day: "Tag 5", focus: "Restliche Bewerbungen + Wochenreflektion" },
    ],
  },
  {
    week: 12,
    title: "Zusammenfassung & Ausblick",
    goal: "12 Wochen ISP-Phase reflektieren und Struktur für die weitere Jobsuche festigen",
    tagesplan: [
      { day: "Tag 1", focus: "Offene Themen klären (DCI, Job Coach)" },
      { day: "Tag 2", focus: "Erkenntnisse aus 12 Wochen zusammenfassen" },
      { day: "Tag 3", focus: "Strategien überdenken: Was hat geholfen? Was nicht?" },
      { day: "Tag 4", focus: "Neue Ziele und Aktionsplan für die kommenden Wochen" },
      { day: "Tag 5", focus: "Motivation stärken und positiver Ausblick" },
    ],
  },
];

/** Gibt das Startdatum einer Kurswoche zurück (Montag) */
export function getWeekStart(week: number): Date {
  const d = new Date(COURSE_START);
  d.setDate(d.getDate() + week * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Berechnet die aktuelle Kurswoche (0–12) */
export function computeCurrentWeek(): number {
  const now = new Date();
  const diffWeeks = Math.floor(
    (now.getTime() - COURSE_START.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return Math.max(0, Math.min(12, diffWeeks));
}
