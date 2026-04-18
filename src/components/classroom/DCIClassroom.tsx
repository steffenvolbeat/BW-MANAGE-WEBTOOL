"use client";

import { useState, useEffect, useCallback } from "react";
import { computeCurrentWeek, getWeekStart } from "@/lib/classroom/schedule";

// ─── Typen ───────────────────────────────────────────────────────────────────
interface Task {
  id: string;
  text: string;
  done: boolean;
}

interface DailyStatEntry {
  date: string;
  count: number;
  statuses: { applied: number; interview: number; offer: number; rejected: number };
}

interface AppWeekStat {
  week: number;
  weekStart?: string;
  weekEnd?: string;
  count: number;
  target: number;
  statuses: { applied: number; interview: number; offer: number; rejected: number };
  dailyStats?: DailyStatEntry[];
  applications: { id: string; company: string; position: string; status: string; appliedAt: string }[];
}

interface ClassroomStats {
  courseStart: string;
  weekStats: AppWeekStat[];
  total: number;
  totalInterviews: number;
  totalOffers: number;
  totalRejected: number;
}

// Musterlösungen pro Woche
const MUSTERLOESUNGEN: Record<number, { title: string; content: string }[]> = {
  2: [
    {
      title: "Beispiel-Anschreiben (Junior Web Developer)",
      content: `Max Mustermann · Musterstraße 1 · 10115 Berlin · max@example.com

Tech GmbH
z. Hd. Frau Schmidt
Hauptstraße 42
10178 Berlin

Berlin, den ${new Date().toLocaleDateString("de-DE")}

Bewerbung als Junior Web Developer (m/w/d)

Sehr geehrte Frau Schmidt,

als frisch ausgebildeter Full-Stack-Entwickler mit Schwerpunkt auf React und Node.js begeistert mich die Möglichkeit, bei Tech GmbH Teil eines innovativen Teams zu werden. Besonders Ihr Fokus auf nutzerzentrierte Softwarelösungen und agile Entwicklungsmethoden deckt sich vollständig mit meiner Arbeitsweise.

Im Rahmen meiner Ausbildung beim Digital Career Institute habe ich eigenständig eine Bewerbungsmanagement-Anwendung mit Next.js, TypeScript und PostgreSQL entwickelt. Dabei habe ich nicht nur technische Kompetenz aufgebaut, sondern gelernt, komplexe Anforderungen strukturiert umzusetzen und selbstständig Lösungen zu finden.

Ich bin überzeugt, dass ich mit meiner Lernbereitschaft und meinem technischen Fundament schnell einen echten Mehrwert in Ihrem Team liefern kann. Ich freue mich auf ein persönliches Gespräch.

Mit freundlichen Grüßen
Max Mustermann`,
    },
  ],
  4: [
    {
      title: "Beispiel Elevator Pitch (Junior Developer)",
      content: `„Guten Tag, mein Name ist Max Mustermann, und ich bewerbe mich als Junior Web Developer.

In meiner Ausbildung beim Digital Career Institute habe ich in weniger als einem Jahr Full-Stack-Entwicklung mit React, Node.js und PostgreSQL gelernt und dabei eigenständig eine vollständige Webanwendung mit über 30 Features gebaut.

Was mich besonders auszeichnet: Ich arbeite strukturiert, lerne extrem schnell und bringe frische Perspektiven aus einem Quereinstieg mit – ich weiß, wie man sich Dinge selbst beibringt und wie man unter Druck liefert.

Ich würde mich sehr freuen, mehr über die offene Position bei Ihnen zu erfahren – haben Sie einen Moment Zeit?"

— Dauer: ca. 35 Sekunden`,
    },
  ],
  5: [
    {
      title: "Beispiel-Antworten auf typische Fragen",
      content: `❓ „Erzählen Sie etwas über sich."
→ „Ich bin Quereinsteiger in die IT und habe beim Digital Career Institute Full-Stack-Webentwicklung erlernt. Zuvor habe ich [X] Jahre in [Bereich] gearbeitet, was mir starke Kommunikations- und Problemlösungsfähigkeiten gegeben hat. Mein größtes Projekt war [kurz beschreiben]. Ich suche jetzt eine erste Stelle als Junior Developer, wo ich wachsen und echten Mehrwert liefern kann."

❓ „Warum wechseln Sie in die IT?"
→ „Ich habe mich schon lange für Technologie begeistert und gemerkt, dass meine stärksten Momente bei der Arbeit die waren, bei denen ich Probleme analytisch lösen musste. Die IT-Ausbildung hat das bestätigt – ich liebe es zu bauen und zu sehen, wie etwas funktioniert."

❓ „Was ist Ihre größte Schwäche?"
→ „Ich neige manchmal dazu, Dinge zu perfektionieren, bevor ich sie zeige. Ich arbeite aktiv daran, früher Feedback einzuholen – 'Done is better than perfect' ist mein Lernziel."`,
    },
  ],
};


interface WeekContent {
  week: number;
  title: string;
  goal: string;
  applicationGoal: string | null;
  tags: string[];
  tagesplan: { day: string; focus: string }[];
  aufgaben: { title: string; items: string[] }[];
  checkliste: string[];
  tools: { name: string; url: string; desc: string }[];
  dosAndDonts?: { dos: string[]; donts: string[] };
  sheetLink: string;
}

// ─── Wochendaten (aus PDFs) ───────────────────────────────────────────────────
const WEEKS: WeekContent[] = [
  {
    week: 0,
    title: "Kick-Off & Orientierungswoche",
    goal: "Den Start der ISP-Phase strukturieren, Tools einrichten und erste Ziele setzen",
    applicationGoal: null,
    tags: ["Kick-Off", "Orientierung", "Vorbereitung"],
    tagesplan: [
      { day: "Tag 1", focus: "Begrüßung & Kursüberblick: Was erwartet dich in den 12 Wochen?" },
      { day: "Tag 2", focus: "Tools einrichten: Tracking-System, LinkedIn & Profil-Check" },
      { day: "Tag 3", focus: "Ziele setzen: Was will ich am Ende der ISP-Phase erreicht haben?" },
      { day: "Tag 4", focus: "Erste Stellenrecherche: Arbeitsmarkt erkunden, erste Wunschliste" },
      { day: "Tag 5", focus: "Planung W1: Bewerbungsziel und Wochenstrategie für Woche 1 festlegen" },
    ],
    aufgaben: [
      {
        title: "Orientierungswoche – Vorbereitung",
        items: [
          "Kursüberblick 12 Wochen verstehen: Was passiert wann?",
          "Bewerbungs-Tracking-Tool einrichten (z. B. BW-Manage, Teal, Google Sheets)",
          "LinkedIn-Profil auf Vollständigkeit prüfen und optimieren",
          "XING-Profil anlegen oder aktualisieren",
          "Erste 5–10 Wunschunternehmen recherchieren",
          "Erwartungsmanagement: mind. 80 Bewerbungen in der gesamten ISP-Phase",
          "Power- und Ruhephasen für 12 Wochen einplanen",
          "Bewerbungskurve verstehen: W1: 7, W2: 15, W3: 20, W4: 10, W5: 10, W6: 15, W7: 20, W8: 15",
        ],
      },
    ],
    checkliste: [
      "Tracking-System (BW-Manage / Teal) eingerichtet",
      "LinkedIn-Profil vollständig und aktuell",
      "Kursplan (12 Wochen) bekannt und verstanden",
      "Erste Wunschunternehmen / Stellen recherchiert",
      "Wochenziel für Woche 1 definiert",
    ],
    tools: [
      { name: "BW-Manage", url: "/applications", desc: "Internes Tracking-Tool" },
      { name: "Teal", url: "https://www.tealhq.com", desc: "Bewerbungstracking" },
      { name: "LinkedIn", url: "https://www.linkedin.com", desc: "Profil optimieren" },
    ],
    sheetLink:
      "https://docs.google.com/spreadsheets/d/1kk1JvZLwQsocXY-aEKfuSW_jtyYidvxLLK-QskSek54/edit?gid=776040445#gid=776040445",
  },
  {
    week: 1,
    title: "Aufbau deiner Struktur für die Zeit der Jobsuche",
    goal: "Struktur und Überblick für die Bewerbungsphase schaffen",
    applicationGoal: "7 qualitative Bewerbungen",
    tags: ["Planung", "Tracking", "Struktur"],
    tagesplan: [
      { day: "Tag 1", focus: "Planung & Zielsetzung: Was ist mein Ziel diese Woche?" },
      { day: "Tag 2", focus: "Fokus Bewerbungen: Mindestens 2 Bewerbungen versenden" },
      { day: "Tag 3", focus: "Fokus Wochenziel: Weitere Bewerbungen & Recherche" },
      { day: "Tag 4", focus: "Fokus fachliche Skills: Weiterbildung, Portfolio" },
      {
        day: "Tag 5",
        focus:
          "Reflektion & Arbeitsmarkt-Screening: Was habe ich diese Woche erreicht?",
      },
    ],
    aufgaben: [
      {
        title: "Bewerbungsstrategie festlegen",
        items: [
          "Mehrgleisig fahren – parallel auf mehrere Stellenangebote bewerben",
          "Alternativen überlegen: welche Schnittstellenpositionen gibt es?",
          "Gleichgewicht zwischen Qualität und Quantität der Bewerbungen finden",
          "Bewerbungsziel von mind. 80 Bewerbungen im Gesamtprozess im Blick behalten",
          "Bei Absage erneut bewerben, wenn neue passende Stelle aufgeht",
        ],
      },
      {
        title: "Profile auf Plattformen anlegen",
        items: [
          "LinkedIn-Profil optimieren / aktualisieren",
          "XING-Profil anlegen oder aktualisieren",
          "Aktive Plattformen: Indeed, Monster, StepStone, Gründerszene, StackOverflow, Honeypot, Jobbörse, IAmExpat, GetInIT",
          "Passive Plattformen: Moberries, 4scotty, Taledo, talent.io, CodersFirst",
          "Unternehmenswebseiten direkt aufrufen",
          "Profil auf Stepstone als passives Recruiting-Profil anlegen (keine Garantie auf Kontakt!)",
        ],
      },
      {
        title: "Bewerbungstracking einrichten",
        items: [
          "Liste mit allen Unternehmen/Stellen anlegen (Datum, Ansprechpartner, Antwort, Interview)",
          "Screenshot jeder Stellenausschreibung speichern (Stellen werden offline gesetzt!)",
          "Tracking-Tool nutzen: z. B. Teal (https://www.tealhq.com)",
          "Eigene Motivations- & Bewerbungskurve tracken",
        ],
      },
      {
        title: "Erwartungsmanagement verstehen",
        items: [
          "Bewerbungskurve verinnerlichen: W1: 7, W2: 15, W3: 20, W4: 10, W5: 10, W6: 15, W7: 20, W8: 15",
          "Power- und Ruhephasen einplanen – nicht 8 Wochen durchpowern",
          "Quereinstiegsmöglichkeiten einschätzen: Praktika (2-6 Mo), Werkstudium (1-3 J), Traineeship (6-12 Mo), Junior (1-3 J)",
          "Mit 80+ Bewerbungen rechnen – das ist für Berufseinsteiger normal",
        ],
      },
    ],
    checkliste: [
      "LinkedIn/XING-Profil ist aktuell und vollständig",
      "Tagesstruktur (Tag 1-5) ist bekannt und wird eingehalten",
      "Bewerbungs-Tracking-Tabelle ist eingerichtet",
      "Mind. 7 qualitative Bewerbungen diese Woche versendet",
      "Screenshots aller Stellenausschreibungen gespeichert",
      "Bewerbungskurve verstanden und Power-/Ruhephasen eingeplant",
    ],
    tools: [
      { name: "Teal", url: "https://www.tealhq.com", desc: "Bewerbungstracking" },
      {
        name: "Indeed",
        url: "https://www.indeed.de",
        desc: "Aktive Jobplattform",
      },
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com",
        desc: "Netzwerk + Jobsuche",
      },
      {
        name: "StepStone",
        url: "https://www.stepstone.de",
        desc: "Aktive Jobplattform",
      },
      {
        name: "Gründerszene",
        url: "https://jobs.gruenderszene.de",
        desc: "Startup-Jobs",
      },
      {
        name: "Honeypot",
        url: "https://www.honeypot.io",
        desc: "Developer-Focused Plattform",
      },
    ],
    sheetLink:
      "https://docs.google.com/spreadsheets/d/1kk1JvZLwQsocXY-aEKfuSW_jtyYidvxLLK-QskSek54/edit?gid=776040445#gid=776040445",
  },
  {
    week: 2,
    title: "Professionalisierung deines Portfolios – Anschreiben",
    goal: "Individuelles, überzeugendes Anschreiben für jede Bewerbung verfassen",
    applicationGoal: null,
    tags: ["Anschreiben", "Portfolio", "Do's & Don'ts"],
    tagesplan: [
      { day: "Tag 1", focus: "Planung & Zielsetzung: Stellen analysieren" },
      {
        day: "Tag 2",
        focus: "Anschreiben verfassen: Struktur und Inhalt erarbeiten",
      },
      { day: "Tag 3", focus: "Anschreiben überarbeiten und korrigieren" },
      {
        day: "Tag 4",
        focus: "Formatierung, Speichern als PDF, Bewerbungen absenden",
      },
      { day: "Tag 5", focus: "Reflektion: Was lief gut? Was verbessern?" },
    ],
    aufgaben: [
      {
        title: "Anschreiben-Struktur anwenden",
        items: [
          "01 – Kontaktinformationen: Eigene Adresse + Adresse des Zielunternehmens",
          "02 – Betreff: Titel der Stelle, auf die du dich bewirbst",
          "03 – Anrede: Konkrete Ansprechperson recherchieren ('Sehr geehrte Frau/Herr [Name]')",
          "04 – Einleitung: Aufmerksamkeit wecken, Vorstellung + Motivation",
          "05 – Hauptteil: Fähigkeiten zeigen, Mehrwert für Unternehmen herausstellen",
          "06 – Call-to-Action & Verabschiedung: Verfügbarkeit, nächste Schritte",
        ],
      },
      {
        title: "Inhaltliche Schwerpunkte gewichten",
        items: [
          "Motivation & Interesse zeigen (ca. 60%) – warum genau dieses Unternehmen?",
          "Qualifikation und Erfahrung darstellen (ca. 50%) – konkret und mit Belegen",
          "Persönlichkeit und Soft Skills einbringen (ca. 40%) – authentisch bleiben",
          "Für Video-Anschreiben: kurz, professionell, gut beleuchtet",
        ],
      },
      {
        title: "Überprüfung und Formatierung",
        items: [
          "Rechtschreib- und Grammatikfehler dreifach prüfen",
          "Anschreiben an spezifische Position & Unternehmen anpassen",
          "Schriftart, Abstände, Lesbarkeit und Farben prüfen",
          "Als PDF speichern mit kurzer, knapper Dateibenennung",
          "Anweisungen der Stellenanzeige beim Senden genau befolgen",
          "PDF-Merging falls mehrere Dokumente verlangt werden",
        ],
      },
      {
        title: "Checkliste vollständiges Anschreiben",
        items: [
          "Rechtschreibung und Zeichensetzung sind einwandfrei",
          "Formelle Sprache mit persönlicher Verbindung",
          "Einleitung, Hauptteil und Schlussteil vorhanden",
          "Call-to-Action vorhanden (z. B. 'Ich würde mich gerne vorstellen')",
          "Fähigkeiten präzisiert (welche Frameworks/Sprachen, in welchem Rahmen)",
          "Vorerfahrungen hervorgehoben",
          "Kontext zu 'fehlenden' Fähigkeiten geliefert",
          "Unternehmensbezug und Recherche deutlich",
        ],
      },
    ],
    checkliste: [
      "Anschreiben ist individuell auf Position und Unternehmen zugeschnitten",
      "Alle 6 Strukturelemente (01-06) sind vorhanden",
      "Motivation (60%), Qualifikation (50%), Soft Skills (40%) sind berücksichtigt",
      "Dreifache Korrekturlesung durchgeführt",
      "Als PDF gespeichert mit sinnvollem Dateinamen",
      "Keine Entschuldigungen für fehlende Skills",
      "Keine Konjunktiv-Formulierungen ('Ich hoffe...')",
      "Fähigkeiten mit konkreten Beispielen belegt",
    ],
    tools: [
      {
        name: "Anschreiben-Studio",
        url: "/anschreiben",
        desc: "DIN-5008 & Novoresume-Template",
      },
      {
        name: "LanguageTool",
        url: "https://languagetool.org",
        desc: "Rechtschreibprüfung",
      },
    ],
    dosAndDonts: {
      dos: [
        "Fähigkeiten durch konkrete Beispiele belegen",
        "Authentisch sein – nur Fähigkeiten erwähnen, von denen du überzeugt bist",
        "Dreifache Prüfung auf Grammatik und Tippfehler",
        "Lebenslauf durch Kontext ergänzen – eine Geschichte erzählen",
        "Selbstbewusste Formulierungen verwenden",
      ],
      donts: [
        "Den Lebenslauf in Textform wiederholen",
        "Entschuldigungen für fehlende Fähigkeiten suchen",
        "Unterwürfige Formulierungen ('Ich hoffe, eingeladen zu werden')",
        "Generisches Anschreiben – wirkt weniger überzeugend",
        "Bewerbung ohne Korrekturlesung absenden",
      ],
    },
    sheetLink:
      "https://docs.google.com/spreadsheets/d/1kk1JvZLwQsocXY-aEKfuSW_jtyYidvxLLK-QskSek54/edit?gid=776040445#gid=776040445",
  },
  {
    week: 3,
    title: "Verbesserung deiner Networking Skills",
    goal: "Netzwerk aktiv aufbauen und Netzwerk-Events strategisch nutzen",
    applicationGoal: null,
    tags: ["Networking", "Events", "LinkedIn"],
    tagesplan: [
      {
        day: "Tag 1",
        focus: "Planung: Welche Netzwerk-Events & Plattformen passen zu mir?",
      },
      {
        day: "Tag 2",
        focus: "LinkedIn-Netzwerk erweitern: 5 neue Kontakte hinzufügen",
      },
      {
        day: "Tag 3",
        focus: "Elevator Pitch für Netzwerk-Events vorbereiten",
      },
      {
        day: "Tag 4",
        focus: "An einem Event oder einer Online-Diskussion teilnehmen",
      },
      { day: "Tag 5", focus: "Reflektion: Was habe ich diese Woche Networking-mäßig erreicht?" },
    ],
    aufgaben: [
      {
        title: "Netzwerk-Events vorbereiten",
        items: [
          "Ziele setzen: Warum gehe ich hin? Was will ich erreichen?",
          "Über Speaker, Firmen und Teilnehmer informieren",
          "Visitenkarten oder digitale Kontaktinfos vorbereiten",
          "Elevator Pitch (30 Sek.) üben",
          "Small Talk Themen vorbereiten",
        ],
      },
      {
        title: "Beim Event: Richtig auftreten",
        items: [
          "Aktiv zuhören und Fragen stellen",
          "Small Talk locker und freundlich führen",
          "Kontakte qualitativ auswählen – Qualität vor Quantität",
          "Gruppen & Diskussionen beitreten, Meinungen teilen",
        ],
      },
      {
        title: "Nach dem Event: Follow-Up",
        items: [
          "Innerhalb von 24h auf LinkedIn mit neuen Kontakten vernetzen",
          "Personalisierte Nachricht schreiben (auf das Gespräch Bezug nehmen)",
          "Online-Präsenz pflegen: LinkedIn-Profil aktuell halten",
          "Kommunikation anpassen – vielseitig und flexibel sein",
          "Geduld haben: Netzwerke entstehen über Zeit",
        ],
      },
      {
        title: "Arten von Netzwerk-Events kennen",
        items: [
          "Konferenzen & Messen: Branchenexperten, Unternehmen, Fachleute",
          "Meet-ups: Treffen unter Fachleuten in entspannter Atmosphäre",
          "Vorträge & Seminare: Einblicke in Fachthemen",
          "Business Lunches: Vernetzung in lockerer Atmosphäre",
          "Soziale Veranstaltungen: Cocktail-Parties, After-Work",
          "Workshops: Wissensaustausch und gemeinsame Lösungsfindung",
        ],
      },
    ],
    checkliste: [
      "LinkedIn-Profil ist vollständig und professionell",
      "Mind. 5 neue relevante LinkedIn-Kontakte hinzugefügt",
      "Elevator Pitch (30 Sek.) wurde formuliert und geübt",
      "An einem Event oder Online-Forum aktiv teilgenommen",
      "Follow-up Nachrichten an neue Kontakte gesendet",
      "Unternehmensseiten auf LinkedIn folgen (für Neuigkeiten und Interesse zeigen)",
    ],
    tools: [
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com",
        desc: "Netzwerk + Events + Content",
      },
      {
        name: "Meetup",
        url: "https://www.meetup.com",
        desc: "Lokale Events finden",
      },
      {
        name: "XING",
        url: "https://www.xing.com",
        desc: "D-A-CH Netzwerk",
      },
    ],
    sheetLink:
      "https://docs.google.com/spreadsheets/d/1kk1JvZLwQsocXY-aEKfuSW_jtyYidvxLLK-QskSek54/edit?gid=776040445#gid=776040445",
  },
  {
    week: 4,
    title: "Erstellung deines Elevator Pitchs",
    goal: "Einen überzeugenden 30–60-Sekunden Elevator Pitch entwickeln und üben",
    applicationGoal: null,
    tags: ["Elevator Pitch", "Selbstpräsentation", "Feedback"],
    tagesplan: [
      { day: "Tag 1", focus: "Selbstanalyse: Stärken, Ziele, USP definieren" },
      { day: "Tag 2", focus: "Elevator Pitch schreiben (4-Schritte-Aufbau)" },
      { day: "Tag 3", focus: "Pitch laut üben & aufnehmen, Feedback einholen (C.O.I.N.)" },
      { day: "Tag 4", focus: "Pitch verbessern, auf verschiedene Situationen anpassen" },
      { day: "Tag 5", focus: "Reflektion & Bewerbungsziel prüfen" },
    ],
    aufgaben: [
      {
        title: "Selbstpräsentation: Worauf achten?",
        items: [
          "1. Selbstbewusstsein: Über eigene Stärken, Schwächen, Werte und Ziele bewusst sein",
          "2. Körpersprache: Augenkontakt, Händedruck, Haltung & Gestik",
          "3. Kommunikation: Präzise Sprache, kein Jargon, klare Gedanken",
          "4. Präzision & Klarheit: Qualifikationen, Erfahrungen und Ziele verständlich vermitteln",
          "5. Storytelling: Erfahrungen und Erfolge veranschaulichen",
          "6. Empathie: Sich in das Publikum hineinversetzen",
          "7. Flexibilität: An Publikum und Situation anpassen",
        ],
      },
      {
        title: "Elevator Pitch: 4-Schritte-Aufbau",
        items: [
          "Schritt 1 – Einleitung: Name + angestrebte Position ('Guten Tag, mein Name ist [Name], und ich bewerbe mich um die Position als [Position] in Ihrem Unternehmen.')",
          "Schritt 2 – Qualifikationen: Relevante Fähigkeiten und Erfolge kurz darstellen ('Mit X Jahren Erfahrung in Y und starker Expertise in Z bringe ich...')",
          "Schritt 3 – Warum du?: Bezug zum Unternehmen & wie du einen Mehrwert schaffst ('Ich bin motiviert bei [Unternehmen] zu arbeiten, da...')",
          "Schritt 4 – Abschluss: Klare Handlungsaufforderung ('Ich würde gerne mehr darüber erfahren...')",
        ],
      },
      {
        title: "Pitch üben und verfeinern",
        items: [
          "Pitch muss vorher geübt werden – mindestens 5x laut üben",
          "30–60 Sekunden lang – nicht länger",
          "Flexibel anpassbar an die Gesprächssituation",
          "Vor dem Spiegel oder mit Aufnahme üben",
          "Feedback vom Umfeld einholen (C.O.I.N. Modell)",
        ],
      },
      {
        title: "Feedback geben & nehmen (C.O.I.N. Modell)",
        items: [
          "C – Context (Kontext): Konkrete Situation beschreiben, in der das Verhalten gezeigt wurde",
          "O – Observation (Beobachtung): Verhalten klar und objektiv beschreiben",
          "I – Impact (Auswirkungen): Konsequenzen des Verhaltens benennen (Ich-Botschaften, Vergangenheit)",
          "N – Need (Bitte): Was könnte die Person das nächste Mal besser machen?",
          "Beispiel: 'Während deines Pitches habe ich bemerkt, dass du sehr schnell gesprochen hast. Das machte es schwer zu folgen. Ein langsameres Tempo würde deinen Pitch verständlicher machen.'",
        ],
      },
    ],
    checkliste: [
      "Elevator Pitch (30-60 Sek.) ist schriftlich ausgearbeitet",
      "Alle 4 Schritte sind vorhanden (Einleitung, Qualifikationen, Warum du?, Abschluss)",
      "Pitch mindestens 5x laut geübt",
      "Aufnahme gemacht und selbst kritisch angehört",
      "Feedback von mind. einer Person eingeholt (C.O.I.N.)",
      "Pitch für verschiedene Situationen angepasst (formell/informell)",
    ],
    tools: [
      {
        name: "Interview Warmup",
        url: "https://grow.google/certificates/interview-warmup/",
        desc: "Pitch und Fragen üben",
      },
    ],
    sheetLink:
      "https://docs.google.com/spreadsheets/d/1kk1JvZLwQsocXY-aEKfuSW_jtyYidvxLLK-QskSek54/edit?gid=776040445#gid=776040445",
  },
  {
    week: 5,
    title: "Vorbereitung auf Interviews",
    goal: "Professionell auf Vorstellungsgespräche vorbereiten",
    applicationGoal: null,
    tags: ["Interview", "Vorbereitung", "Recherche"],
    tagesplan: [
      { day: "Tag 1", focus: "Unternehmen recherchieren, Gesprächspartner googlen" },
      { day: "Tag 2", focus: "Typische Interviewfragen vorbereiten & Antworten üben" },
      { day: "Tag 3", focus: "Selbstvorstellung (Elevator Pitch) üben" },
      {
        day: "Tag 4",
        focus: "Eigene Fragen fürs Ende des Gesprächs vorbereiten (mind. 2-3)",
      },
      { day: "Tag 5", focus: "Setting vorbereiten (Kleidung, Anfahrt/Technik)" },
    ],
    aufgaben: [
      {
        title: "Was Firmen von Berufseinsteigern erwarten",
        items: [
          "Langfristige Bindung: Bereitschaft, zu bleiben und zu wachsen",
          "Motivation & Begeisterung: Leidenschaft für die Arbeit",
          "Diversität und Inklusion: Verschiedene Perspektiven einbringen",
          "Flexibilität: Sich schnell an neue Situationen anpassen",
          "Wille zur Weiterentwicklung: Continuous Learning",
          "Lernbereitschaft: Neues schnell aufnehmen",
          "Frische Perspektiven: Querdenken und neue Ideen einbringen",
        ],
      },
      {
        title: "Bewerbungsprozess verstehen",
        items: [
          "Schritt 1: Bewerbungseingang – Unterlagen werden geprüft",
          "Schritt 2: Erstgespräch (Telefon/Video) – erstes Kennenlernen",
          "Schritt 3: 1. Interview – tieferes Gespräch über Erfahrungen & Skills",
          "Schritt 4: Abschluss-Interview – oft mit Management/HR",
          "Schritt 5: Entscheidung – Angebot oder Absage",
          "Wenn eingeladen: Das Unternehmen ist BEREITS an mir interessiert!",
        ],
      },
      {
        title: "Interview-Phasen kennen & vorbereiten",
        items: [
          "Smalltalk (~5 min): Ankunft, Getränk, Aufwärmen ('Haben Sie uns gut gefunden?')",
          "Einleitung (~15 min): Unternehmensvorstellung, eigene Selbstvorstellung ('Erzählen Sie etwas über sich')",
          "Hauptteil (~20 min): Situative Fragen, Fragen zum Lebenslauf, Karrierewechsel begründen",
          "Eigene Fragen (~10 min): Mind. 2-3 Fragen vorbereiten ('Was erwarten Sie in den ersten 6 Monaten?', 'Wie würden Sie die Unternehmenskultur beschreiben?')",
          "Ende (~5 min): Nächste Schritte klären, Gehaltsvorstellungen, Feedback-Zeitplan erfragen",
        ],
      },
      {
        title: "Konkrete Vorbereitung",
        items: [
          "Stellenanforderungen studieren – Herausforderungen antizipieren",
          "Gesprächspartner googlen (Hintergrund, Erfahrung, Unternehmenszugehörigkeit)",
          "Unternehmen recherchieren (Team, Produkte, Kultur, Bewerbungsprozess)",
          "Dresscode des Unternehmens herausfinden",
          "Unternehmen auf LinkedIn folgen",
          "Eigene Unterlagen (Lebenslauf, Anschreiben) nochmal lesen",
          "Selbstbewusste Körpersprache üben (vor Spiegel oder mit Aufnahme)",
          "Für Vor-Ort: Anfahrt planen, ggf. vorher hinfahren, Laptop aufladen",
          "Für Online: Videotool testen, Setting prüfen, professioneller Hintergrund",
        ],
      },
    ],
    checkliste: [
      "Unternehmen und Gesprächspartner recherchiert",
      "Selbstvorstellung (2-3 Min.) vorbereitet und geübt",
      "Antworten auf typische Fragen vorbereitet",
      "Mind. 3 eigene Fragen für das Gesprächsende vorbereitet",
      "Dresscode geklärt, Kleidung ausgewählt",
      "Anfahrt/Tech-Setup gecheckt",
      "Lebenslauf und Anschreiben nochmal gelesen",
    ],
    tools: [
      {
        name: "Interview Warmup",
        url: "https://grow.google/certificates/interview-warmup/",
        desc: "Interview-Training mit echten Fragen",
      },
      {
        name: "Glassdoor",
        url: "https://www.glassdoor.de",
        desc: "Unternehmensreviews & Interview-Fragen",
      },
      {
        name: "KI-Interview-Simulator",
        url: "/ai/interview-simulator",
        desc: "Interview-Training mit KI (intern)",
      },
    ],
    sheetLink:
      "https://docs.google.com/spreadsheets/d/1kk1JvZLwQsocXY-aEKfuSW_jtyYidvxLLK-QskSek54/edit?gid=776040445#gid=776040445",
  },
  {
    week: 6,
    title: "Interviews üben",
    goal: "Selbstbewusstsein im Interview stärken, schwierige Situationen meistern",
    applicationGoal: null,
    tags: ["Interview", "Mindset", "Üben"],
    tagesplan: [
      { day: "Tag 1", focus: "Mindset-Übung: Stärken aufschreiben, positiv starten" },
      {
        day: "Tag 2",
        focus: "Mock-Interview simulieren (mit Freund/Aufnahme)",
      },
      {
        day: "Tag 3",
        focus: "Schwierige Fragen üben, Zeitbeschaffungs-Floskeln einüben",
      },
      { day: "Tag 4", focus: "Online-Setting vorbereiten & testen" },
      { day: "Tag 5", focus: "Reflektion & Bewerbungsaktivitäten" },
    ],
    aufgaben: [
      {
        title: "Das richtige Mindset",
        items: [
          "Glaube an dich und dein Potenzial – wenn nicht du, wer dann?",
          "Eine Einladung bedeutet: 'Du hast unser Interesse geweckt. Wir sehen in dir ein potenzielles Match.'",
          "Ein Interview ist KEIN Test – es ist ein gegenseitiges Kennenlernen",
          "Das Unternehmen muss auch dich als Bewerber überzeugen!",
          "Positiven Anker setzen: Erfolge und Stärken aufschreiben",
        ],
      },
      {
        title: "Umgang mit schwierigen Fragen",
        items: [
          "Du musst NICHT perfekt sein – Blackouts sind normal",
          "Bei Verständnisproblemen: Frage die Person, die Frage zu wiederholen",
          "Nach mehr Kontext fragen, um die Frage besser einschätzen zu können",
          "Frage selbst zusammenfassen: 'Habe ich Sie richtig verstanden, dass...' – zeigt Aufmerksamkeit",
          "Zeit nehmen ist ok und professionell",
        ],
      },
      {
        title: "Floskeln zur Zeitbeschaffung einüben",
        items: [
          "'Das ist eine interessante Frage. Darüber muss ich kurz nachdenken.'",
          "'Ich möchte sicherstellen, dass ich eine fundierte Antwort gebe. Erlauben Sie mir einen kurzen Moment.'",
          "'Das ist eine herausfordernde Frage. Ich würde gerne einen Moment nachdenken, wie ich sie am besten beantworte.'",
          "'Ich möchte alle Aspekte Ihrer Frage berücksichtigen. Darf ich kurz überlegen?'",
        ],
      },
      {
        title: "Setting vorbereiten",
        items: [
          "Für Vor-Ort: Professionelle und bequeme Kleidung wählen, Anfahrt planen",
          "Laptop mitbringen und sicherstellen, dass er funktioniert und aufgeladen ist",
          "Für Online: Videotool spätestens 1h vorher testen",
          "Internetverbindung, Audio- und Videoqualität prüfen",
          "Professionellen Hintergrund sicherstellen (real oder virtuell)",
          "Lichtverhältnisse prüfen (Fenster vor dir, nicht hinter dir)",
        ],
      },
    ],
    checkliste: [
      "Mind. 1 Mock-Interview durchgeführt (mit Aufnahme oder Person)",
      "Interview Warmup Tool genutzt",
      "Mind. 3 Zeitbeschaffungs-Floskeln gelernt und geübt",
      "Online-Setting vollständig getestet",
      "Mindset-Übung: Stärken schriftlich aufgelistet",
      "Kleidung und Setting für bevorstehende Interviews vorbereitet",
    ],
    tools: [
      {
        name: "Interview Warmup (Google)",
        url: "https://grow.google/certificates/interview-warmup/",
        desc: "Fragen üben, Insights erhalten, Selbstvertrauen aufbauen",
      },
      {
        name: "KI-Interview-Simulator",
        url: "/ai/interview-simulator",
        desc: "KI-gestütztes Interview-Training",
      },
    ],
    sheetLink:
      "https://docs.google.com/spreadsheets/d/1kk1JvZLwQsocXY-aEKfuSW_jtyYidvxLLK-QskSek54/edit?gid=776040445#gid=776040445",
  },
  {
    week: 7,
    title: "Fokus Soft Skills – Umgang mit Absagen",
    goal: "Absagen professionell verarbeiten, Soft Skills stärken, Unternehmensperspektive verstehen",
    applicationGoal: null,
    tags: ["Soft Skills", "Absagen", "Recruiting"],
    tagesplan: [
      { day: "Tag 1", focus: "Planung & Zielsetzung: Absagen analysieren und Learnings ableiten" },
      {
        day: "Tag 2",
        focus: "Soft Skills: Welche fehlen? Wie entwickeln?",
      },
      {
        day: "Tag 3",
        focus: "Recruiting-Prozess aus Unternehmensperspektive verstehen",
      },
      {
        day: "Tag 4",
        focus: "Bewerbungsunterlagen nochmal kritisch prüfen",
      },
      { day: "Tag 5", focus: "Reflektion & positiver Ausblick" },
    ],
    aufgaben: [
      {
        title: "Absagen richtig einordnen",
        items: [
          "Nur ca. 10% aller Bewerber werden zu einem Interview eingeladen – Absagen sind normal",
          "In Deutschland sind allgemeine Absagen üblich (gesetzlicher Schutz für Unternehmen)",
          "Du könntest der/die zweitbeste Kandidat:in gewesen sein – und es trotzdem nicht erfahren",
          "Tipp: Telefonisches Feedback-Gespräch anfragen",
          "Die meisten Absagegründe haben NICHTS mit dir als Person zu tun: Budget, Prozesse, keine Seniors für Einarbeitung, etc.",
          "Perspektive: Eine Absage spart langfristig Zeit – kein Match ist besser als falscher Job",
        ],
      },
      {
        title: "Mit Absagen umgehen",
        items: [
          "Perspektive wechseln: Absage = kein schlechter Arbeitgeber für mich",
          "Sich mit unterstützenden Menschen umgeben",
          "Eigene Erfolge und Stärken aufschreiben",
          "Positive Aktivität für den Tag planen (Sport, Natur, Soziales)",
          "Verantwortung für eigene Emotionen übernehmen – aktiv aus negativen Mustern ausbrechen",
        ],
      },
      {
        title: "Selbstkritisch weiterentwickeln",
        items: [
          "Bewerbe ich mich auf die richtigen Stellen?",
          "Kann ich meine Bewerbungsunterlagen optimieren?",
          "Sind meine Unterlagen auf das Unternehmen und die Stelle zugeschnitten?",
          "Habe ich Fehler gemacht, aus denen ich lernen kann?",
          "Gibt es Tipps oder Ratschläge, die ich noch nicht ausprobiert habe?",
        ],
      },
      {
        title: "Recruiting-Prozess aus Unternehmenssicht",
        items: [
          "Phase 1: Bedarfsanalyse & Ressourcenplanung (Fähigkeiten, Aufgaben, Budget)",
          "Phase 2: Erstellung Stellenprofil & Ausschreibung + Active Sourcing",
          "Phase 3: Bewerbungsscreening (Schlüsselfähigkeiten, Basisanforderungen, allgemeiner Eindruck)",
          "Phase 4: Bewerbungsgespräche & Assessment Center (Persönlichkeit + technische Skills)",
          "Phase 5: Entscheidungsphase (Kandidatenvergleich + Vertragserstellung)",
          "Unternehmensgegenmittel Fachkräftemangel: Employer Branding, Active Sourcing, Mitarbeiterbenefits, Weiterqualifizierung",
        ],
      },
      {
        title: "Was Unternehmen von Bewerber:innen erwarten",
        items: [
          "Anpassungsfähigkeit – schnell in neuen Umgebungen ankommen",
          "Teamfähigkeit – kooperativ und konstruktiv",
          "Lernbereitschaft – neue Technologien und Prozesse annehmen",
          "Flexibilität – sich an Veränderungen anpassen",
          "Wille zur Weiterentwicklung – aktiv Lernangebote suchen",
          "Motivation & Engagement – mit Begeisterung dabei sein",
          "Fachkenntnisse & Erfahrung – relevantes Wissen mitbringen",
        ],
      },
    ],
    checkliste: [
      "Absagen analysiert und konkrete Learnings abgeleitet",
      "Telefonisches Feedback bei mind. 1 Unternehmen angefragt",
      "Bewerbungsunterlagen kritisch geprüft und ggf. optimiert",
      "Recruiting-Prozess aus Unternehmenssicht verstanden",
      "Mind. 1 Soft Skill identifiziert, der gestärkt werden soll",
      "Positive Aktivität zur Stärkung der Motivation geplant",
    ],
    tools: [
      {
        name: "Absagen-Analyse",
        url: "/ai/rejection-analysis",
        desc: "KI-Absagen-Analyse (intern)",
      },
    ],
    sheetLink:
      "https://docs.google.com/spreadsheets/d/1kk1JvZLwQsocXY-aEKfuSW_jtyYidvxLLK-QskSek54/edit?gid=776040445#gid=776040445",
  },
  {
    week: 8,
    title: "Aufbau deiner Struktur für die Zeit nach dem DCI Kurs",
    goal: "Langfristige Bewerbungsstruktur und Selbstmanagement nach Kursende entwickeln",
    applicationGoal: null,
    tags: ["Struktur", "Planung", "Nachhaltigkeit"],
    tagesplan: [
      { day: "Tag 1", focus: "Ziele für die nächsten Wochen setzen" },
      { day: "Tag 2", focus: "Aktionsplan erstellen" },
      { day: "Tag 3", focus: "Herausforderungen und Hindernisse identifizieren" },
      { day: "Tag 4", focus: "Stärken weiterentwickeln, Schwächen minimieren" },
      { day: "Tag 5", focus: "Ressourcen planen & Fortschritt reflektieren" },
    ],
    aufgaben: [
      {
        title: "8-Punkte-Plan für nachhaltige Struktur",
        items: [
          "1. Klare Ziele setzen: Was möchte ich in den nächsten Wochen erreichen?",
          "2. Aktionsplan erstellen: Konkrete Schritte definieren, um die Ziele zu erreichen",
          "3. Herausforderungen identifizieren: Welche Hindernisse könnten auftreten? Wie damit umgehen?",
          "4. Stärken und Schwächen betrachten: Stärken ausbauen, Schwächen minimieren",
          "5. Ressourcen nutzen: Alle verfügbaren Unterstützungsmöglichkeiten planen",
          "6. Fortschritt regelmäßig reflektieren und Aktionsplan bei Bedarf anpassen",
          "7. Offen für Feedback: Aktiv nach Entwicklungsmöglichkeiten suchen",
          "8. Ziele beibehalten: Motiviert bleiben, auch bei Rückschlägen",
        ],
      },
      {
        title: "Diese Schritte immer wiederholen",
        items: [
          "Diese 8 Schritte sind KEINE einmalige Übung – regelmäßig wiederholen",
          "Veränderungen erkennen, neue Erkenntnisse über sich selbst gewinnen",
          "Weitere Möglichkeiten entdecken, die sich durch Wiederholung ergeben",
          "Eigene Situation aktiv gestalten und regelmäßig neu bewerten",
        ],
      },
    ],
    checkliste: [
      "Konkrete Ziele für die nächsten 4 Wochen schriftlich definiert",
      "Aktionsplan mit messbaren Schritten erstellt",
      "Potenzielle Hindernisse identifiziert und Strategien entwickelt",
      "Stärken und Schwächen reflektiert",
      "Verfügbare Ressourcen (Menschen, Tools, Plattformen) aufgelistet",
      "Fortschritt der Vorwochen reflektiert",
    ],
    tools: [
      {
        name: "Bewerbungs-Tracker",
        url: "/applications",
        desc: "Bewerbungen verwalten",
      },
      {
        name: "Stimmungs-Barometer",
        url: "/mood",
        desc: "Motivation und Stimmung tracken",
      },
    ],
    sheetLink:
      "https://docs.google.com/spreadsheets/d/1kk1JvZLwQsocXY-aEKfuSW_jtyYidvxLLK-QskSek54/edit?gid=776040445#gid=776040445",
  },
  {
    week: 9,
    title: "Aktivität in sozialen Medien erhöhen",
    goal: "Professionelle Social-Media-Präsenz aufbauen und LinkedIn-Netzwerk aktiv nutzen",
    applicationGoal: null,
    tags: ["LinkedIn", "Content", "Sichtbarkeit"],
    tagesplan: [
      { day: "Tag 1", focus: "Planung: Welche Inhalte kann ich posten? Ziele festlegen" },
      { day: "Tag 2", focus: "Effektiven Content erstellen und veröffentlichen" },
      {
        day: "Tag 3",
        focus: "LinkedIn-Netzwerk: Kommentieren, Fragen stellen, Verbindungen aufbauen",
      },
      { day: "Tag 4", focus: "Content verbessern und Beiträge optimieren" },
      { day: "Tag 5", focus: "Reflektion: Was wurde erreicht? Analytics auswerten" },
    ],
    aufgaben: [
      {
        title: "Wertvollen Content erstellen",
        items: [
          "Content sollte relevant und wertvoll für die Zielgruppe sein",
          "Auffällige Titel, interessante Fragen und handlungsorientierter Content",
          "Hashtags nutzen (maximal 3-5): für mehr Reichweite und Engagement",
          "Themenideen: Eigene Erfahrungen, Erfolge, aktuelle Trends, interessante Artikel/Branchennews",
          "Visuelle Elemente einsetzen: Bilder, Grafiken, Videos",
        ],
      },
      {
        title: "Interaktion und Sichtbarkeit steigern",
        items: [
          "Es reicht NICHT, nur Inhalte zu teilen – regelmäßig mit anderen interagieren!",
          "Kommentare: wertorientiert und sachlich, konkrete Fragen stellen",
          "Keine oberflächlichen Kommentare ('Toller Beitrag!') – sei spezifisch",
          "LinkedIn-Gruppen beitreten, die zur Branche oder zu Karrierezielen passen",
          "Aktiv an Diskussionen teilnehmen",
        ],
      },
      {
        title: "Beiträge optimieren",
        items: [
          "Timing: Früh morgens oder nachmittags für mehr Reichweite posten",
          "Texte kurz und prägnant halten, mit klarer Botschaft und Handlungsaufforderung",
          "Feedback von Kollegen oder Freunden für Inhaltsverbesserung einholen",
          "LinkedIn Analytics nutzen: Welcher Content performt gut? Welche Zielgruppe wird erreicht?",
        ],
      },
    ],
    checkliste: [
      "Mind. 1 LinkedIn-Beitrag veröffentlicht (eigene Erfahrung oder Branchennews)",
      "Mind. 5 LinkedIn-Beiträge anderer kommentiert (wertorientiert, nicht oberflächlich)",
      "Mind. 1 LinkedIn-Gruppe beigetreten und aktiv teilgenommen",
      "LinkedIn-Profil mit aktuellem Foto und Headline optimiert",
      "Hashtag-Strategie entwickelt (3-5 relevante Hashtags)",
      "LinkedIn Analytics für eigene Beiträge analysiert",
    ],
    tools: [
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com",
        desc: "Hauptplattform für professionelles Netzwerk",
      },
      {
        name: "Canva",
        url: "https://www.canva.com",
        desc: "Visuelle Content-Erstellung",
      },
    ],
    sheetLink:
      "https://docs.google.com/spreadsheets/d/1kk1JvZLwQsocXY-aEKfuSW_jtyYidvxLLK-QskSek54/edit?gid=776040445#gid=776040445",
  },
  {
    week: 10,
    title: "Entwicklung von Zusatzqualifikationen",
    goal: "Relevante Soft Skills und Tech Skills für den Arbeitsmarkt gezielt weiterentwickeln",
    applicationGoal: null,
    tags: ["Qualifikationen", "Soft Skills", "Tech Skills"],
    tagesplan: [
      { day: "Tag 1", focus: "Planung: Welche Qualifikationen fehlen? Prioritäten setzen" },
      { day: "Tag 2", focus: "Soft Skills entwickeln (Ressourcen nutzen)" },
      { day: "Tag 3", focus: "Tech Skills entwickeln (Kurs/Tutorial/Projekt)" },
      { day: "Tag 4", focus: "Fokus auf Bewerbungen: Mit neuen Skills bewerben" },
      { day: "Tag 5", focus: "Reflektion: Was habe ich diese Woche gelernt?" },
    ],
    aufgaben: [
      {
        title: "Warum Zusatzqualifikationen wichtig sind",
        items: [
          "Bessere Chancen auf dem Arbeitsmarkt: Bereitschaft zu investieren zeigen",
          "Schnellere Einarbeitung: Neues Wissen = sofortiger Mehrwert im Job",
          "Stärkt Selbstvertrauen: Unsicherheiten überwinden, selbstbewusster auftreten",
          "Erhöhung der Glaubwürdigkeit: Qualifikation = Vertrauen beim Unternehmen",
        ],
      },
      {
        title: "Soft Skills für Verkauf & Marketing entwickeln",
        items: [
          "Kommunikationsfähigkeiten: Klar und präzise kommunizieren",
          "Menschenkenntnis: Bedürfnisse und Motivationen anderer erkennen",
          "Verhandlungsgeschick: Win-Win-Situationen schaffen",
          "Empathie: Sich in Gesprächspartner hineinversetzen",
          "Anpassungsfähigkeit: Flexibel auf neue Situationen reagieren",
          "Resilienz & Stressresistenz: Mit Druck und Rückschlägen umgehen",
          "Intrinsische Motivation: Aus sich selbst heraus motiviert bleiben",
        ],
      },
      {
        title: "Lernressourcen nutzen",
        items: [
          "Zusatzqualifikationen im Lebenslauf: Lohnenswerte Zertifikate recherchieren",
          "Udemy, LinkedIn Learning, Coursera, edX, Codecademy",
          "Interne Weiterbildungsangebote (Academies, Workshops, E-Learning)",
          "Mentoring- & Coaching-Programme suchen",
          "Wissen regelmäßig auffrischen und kontinuierlich erweitern",
        ],
      },
    ],
    checkliste: [
      "Mind. 1 Qualifikationslücke identifiziert und Kurs gestartet",
      "Soft Skill Ressourcen gefunden und begonnen",
      "Neue Qualifikation/Zertifikat im Lebenslauf ergänzt",
      "Mind. 1 Stunde Learning-Content konsumiert",
      "Bewerbungen mit aktualisierten Skills versendet",
    ],
    tools: [
      {
        name: "Udemy",
        url: "https://www.udemy.com",
        desc: "Online-Kurse zu Tech und Business Skills",
      },
      {
        name: "LinkedIn Learning",
        url: "https://www.linkedin.com/learning",
        desc: "Professionelle Weiterbildung",
      },
      {
        name: "freeCodeCamp",
        url: "https://www.freecodecamp.org",
        desc: "Kostenlose Programmierkurse",
      },
      {
        name: "Coursera",
        url: "https://www.coursera.org",
        desc: "Universitätskurse online",
      },
    ],
    sheetLink:
      "https://docs.google.com/spreadsheets/d/1kk1JvZLwQsocXY-aEKfuSW_jtyYidvxLLK-QskSek54/edit?gid=776040445#gid=776040445",
  },
  {
    week: 11,
    title: "Bewerbungs-Sprint",
    goal: "Intensive Bewerbungsphase – alle gelernten Kompetenzen in die Praxis umsetzen",
    applicationGoal: "15 Bewerbungen diese Woche",
    tags: ["Sprint", "Bewerbungen", "Umsetzung"],
    tagesplan: [
      { day: "Tag 1", focus: "Stellenrecherche: 20 passende Stellen finden und priorisieren" },
      { day: "Tag 2", focus: "Stellenanalyse + 3 individuelle Anschreiben verfassen" },
      { day: "Tag 3", focus: "Weitere 3 Bewerbungen + Elevator Pitch üben" },
      { day: "Tag 4", focus: "Weitere Bewerbungen + Interview-Vorbereitung" },
      { day: "Tag 5", focus: "Restliche Bewerbungen + Wochenreflektion" },
    ],
    aufgaben: [
      {
        title: "6-Schritte-Bewerbungsprozess anwenden",
        items: [
          "1. Stellenangebote recherchieren: Passende Jobs finden, die mit Zielen & Fähigkeiten übereinstimmen",
          "2. Stellenanalyse: Anforderungen und Qualifikationen genau verstehen",
          "3. Anschreiben erstellen: Personalisiertes, überzeugendes Anschreiben für jede Stelle",
          "4. Bewerbung einreichen: Unterlagen gezielt senden und im Tracking-System dokumentieren",
          "5. Elevator Pitch vorbereiten: Kurzen, prägnanten Pitch für Interviews bereit haben",
          "6. Interview-Vorbereitung: Fragen strukturiert und selbstbewusst beantworten können",
        ],
      },
      {
        title: "Sprint-Qualität sicherstellen",
        items: [
          "Keine generischen Bewerbungen – jede Bewerbung individuell anpassen",
          "Screenshot jeder Stellenausschreibung speichern",
          "Alle Bewerbungen im Tracking-System dokumentieren",
          "Bei Einladung: sofort vorbereiten und Termin bestätigen",
          "Ziel dieser Woche: 15 Bewerbungen – Qualität vor Quantität aber Tempo beibehalten",
        ],
      },
    ],
    checkliste: [
      "15 Bewerbungen diese Woche versendet",
      "Alle Bewerbungen im Tracking-System dokumentiert",
      "Screenshots aller Stellenausschreibungen gespeichert",
      "Jedes Anschreiben individuell auf Position/Unternehmen zugeschnitten",
      "Elevator Pitch ist aktuell und geübt",
      "Interview-Vorbereitung für erwartete Einladungen durchgeführt",
    ],
    tools: [
      { name: "Teal", url: "https://www.tealhq.com", desc: "Bewerbungstracking" },
      {
        name: "Anschreiben-Studio",
        url: "/anschreiben",
        desc: "Anschreiben erstellen",
      },
      {
        name: "Lebenslauf-Template",
        url: "/lebenslauf",
        desc: "CV aktuell halten",
      },
    ],
    sheetLink:
      "https://docs.google.com/spreadsheets/d/1kk1JvZLwQsocXY-aEKfuSW_jtyYidvxLLK-QskSek54/edit?gid=776040445#gid=776040445",
  },
  {
    week: 12,
    title: "Zusammenfassung & Ausblick",
    goal: "12 Wochen ISP-Phase reflektieren und Struktur für die weitere Jobsuche festigen",
    applicationGoal: null,
    tags: ["Reflektion", "Abschluss", "Ausblick"],
    tagesplan: [
      { day: "Tag 1", focus: "Offene Themen klären (DCI, Job Coach)" },
      {
        day: "Tag 2",
        focus: "Erkenntnisse aus 12 Wochen zusammenfassen",
      },
      {
        day: "Tag 3",
        focus: "Strategien überdenken: Was hat geholfen? Was nicht?",
      },
      { day: "Tag 4", focus: "Neue Ziele und Aktionsplan für die kommenden Wochen" },
      { day: "Tag 5", focus: "Motivation stärken und positiver Ausblick" },
    ],
    aufgaben: [
      {
        title: "12 Wochen reflektieren",
        items: [
          "Welche Erkenntnisse ziehe ich aus den letzten 12 Wochen?",
          "Welche Strategien haben mir geholfen, Herausforderungen zu meistern?",
          "Habe ich allgemeine offene Fragen rund um Bewerbungen?",
          "Gibt es offene Themen mit DCI oder dem Job Coach, die vor Kursende geklärt werden müssen?",
        ],
      },
      {
        title: "Vorbereitung auf die kommenden Wochen",
        items: [
          "1. Klare Ziele für die nächsten Wochen setzen",
          "2. Schritte definieren, die nötig sind, um die Ziele zu erreichen",
          "3. Herausforderungen identifizieren und Strategien entwickeln",
          "4. Stärken und Schwächen nochmals reflektieren",
          "5. Verfügbare Ressourcen nutzen",
          "6. Regelmäßig Fortschritt überprüfen und Aktionsplan anpassen",
          "7. Offen für Feedback bleiben",
          "8. Ziele trotz Rückschlägen beibehalten",
          "Diese Schritte müssen IMMER WIEDER wiederholt werden – Veränderungen bringen neue Erkenntnisse!",
        ],
      },
    ],
    checkliste: [
      "12 Wochen ISP-Phase vollständig reflektiert",
      "Offene Themen mit DCI/Job Coach geklärt",
      "Aktionsplan für die kommenden Wochen erstellt",
      "Eigene Bewerbungskurve ausgewertet (Gesamt-Bewerbungen, Einladungen, Angebote)",
      "Profil auf allen relevanten Plattformen aktuell",
      "Nächste konkrete Schritte sind klar definiert",
    ],
    tools: [
      {
        name: "Alle internen Tools",
        url: "/dashboard",
        desc: "Dashboard als zentrale Anlaufstelle",
      },
    ],
    sheetLink:
      "https://docs.google.com/spreadsheets/d/1kk1JvZLwQsocXY-aEKfuSW_jtyYidvxLLK-QskSek54/edit?gid=776040445#gid=776040445",
  },
];

// ─── Bewerbungskurve (aus Woche 1 PDF) ───────────────────────────────────────
const APP_CURVE = [
  { week: "W0", target: 0, label: "Kick-Off" },
  { week: "W1", target: 7 },
  { week: "W2", target: 15 },
  { week: "W3", target: 20 },
  { week: "W4", target: 10 },
  { week: "W5", target: 10 },
  { week: "W6", target: 15 },
  { week: "W7", target: 20 },
  { week: "W8", target: 15 },
  { week: "W9", target: 10 },
  { week: "W10", target: 10 },
  { week: "W11", target: 15 },
  { week: "W12", target: 5 },
];

const MAX_CURVE = 25;

// ─── Komponente ───────────────────────────────────────────────────────────────
interface SyncResult {
  calendar: { created: number; skipped: number };
  kanban: { created: number; skipped: number; board: string };
}

export default function DCIClassroom() {
  const [activeWeek, setActiveWeek] = useState(computeCurrentWeek);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("dci-checklist") ?? "{}"); }
    catch { return {}; }
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<ClassroomStats | null>(null);
  const [openMuster, setOpenMuster] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // ─── Classroom-Notizen (Tag/Woche) ──────────────────────────────────────
  type EntryKey = string; // Format: `${week}-${day ?? "w"}-${type}`
  const [entries, setEntries] = useState<Record<EntryKey, string>>({});
  const [entrySaving, setEntrySaving] = useState<Record<EntryKey, boolean>>({});

  const entryKey = (week: number, day: number | null, type: string) =>
    `${week}-${day ?? "w"}-${type}`;

  const loadEntries = useCallback(async (week: number) => {
    try {
      const res = await fetch(`/api/classroom/entries?week=${week}`);
      if (!res.ok) return;
      const data = await res.json() as Array<{ week: number; day: number | null; type: string; content: string; title?: string }>;
      setEntries((prev) => {
        const next = { ...prev };
        for (const e of data) {
          next[entryKey(e.week, e.day, e.type)] = e.content;
        }
        return next;
      });
    } catch { /* ignorieren */ }
  }, []);

  const saveEntry = async (week: number, day: number | null, type: string, content: string) => {
    const key = entryKey(week, day, type);
    setEntrySaving((prev) => ({ ...prev, [key]: true }));
    try {
      await fetch("/api/classroom/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week, day, type, content }),
      });
    } catch { /* ignorieren */ } finally {
      setEntrySaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const deleteEntry = async (week: number, day: number | null, type: string) => {
    const key = entryKey(week, day, type);
    // Suche entry-id: wir haben es nicht im State, also fetch alle und lösche
    try {
      const res = await fetch(`/api/classroom/entries?week=${week}`);
      if (!res.ok) return;
      const data = await res.json() as Array<{ id: string; day: number | null; type: string }>;
      const entry = data.find((e) => e.day === day && e.type === type);
      if (!entry) return;
      await fetch(`/api/classroom/entries/${entry.id}`, { method: "DELETE" });
      setEntries((prev) => { const next = { ...prev }; delete next[key]; return next; });
    } catch { /* ignorieren */ }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const res = await fetch("/api/classroom/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Sync fehlgeschlagen");
      setSyncResult(data);
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Sync fehlgeschlagen");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadEntries(activeWeek);
  }, [activeWeek, loadEntries]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/classroom/stats", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Stats fetch failed: ${r.status}`);
        return r.json();
      })
      .then((data: ClassroomStats) => setStats(data))
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Classroom stats error:", err);
      });
    return () => controller.abort();
  }, []);

  const week = WEEKS.find((w) => w.week === activeWeek) ?? WEEKS[0];

  // Datums-Hilfsfunktionen für die aktive Woche
  const activeWeekStart = getWeekStart(activeWeek);
  const activeWeekEnd = new Date(activeWeekStart);
  activeWeekEnd.setDate(activeWeekStart.getDate() + 4);
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const fmtDayDate = (d: Date) =>
    d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
  const getTagDate = (dayIndex: number) => {
    const d = new Date(activeWeekStart);
    d.setDate(activeWeekStart.getDate() + dayIndex);
    return d;
  };

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem("dci-checklist", JSON.stringify(next)); } catch { /* ignorieren */ }
      return next;
    });
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMuster = (key: string) => {
    setOpenMuster((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const exportCSV = () => {
    const rows: string[] = [
      "Woche;Titel;Aufgabenbereich;Checklistenpunkt;Ziel\u2028",
    ];
    WEEKS.forEach((w) => {
      w.aufgaben.forEach((a) => {
        a.items.forEach((item) => {
          rows.push(
            [w.week, `"${w.title}"`, `"${a.title}"`, `"${item}"`, `"${w.goal}"`].join(";") + "\r\n"
          );
        });
      });
    });
    const csv = "\uFEFF" + rows.join("");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "DCI-Classroom-12-Wochen.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const checkedCount = week.checkliste.filter(
    (_, i) => checkedItems[`${activeWeek}-check-${i}`]
  ).length;

  const progress = Math.round((checkedCount / week.checkliste.length) * 100);

  // Live-Bewerbungszahl für aktive Woche
  const weekStat = stats?.weekStats?.find((s) => s.week === activeWeek) ?? null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🎓</span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              DCI Bewerbung – Classroom
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            12-Wochen ISP-Programm · Aufgaben, Wochenziele & Lernmaterialien
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow"
          >
            ⬇️ CSV Export
          </button>
          <a
            href="https://docs.google.com/spreadsheets/d/1kk1JvZLwQsocXY-aEKfuSW_jtyYidvxLLK-QskSek54/edit?gid=776040445#gid=776040445"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors shadow"
          >
            📊 Google Sheets öffnen
          </a>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow disabled:opacity-60"
          >
            {syncing ? "⏳ Sync läuft…" : "🔄 Sync Kalender & Kanban"}
          </button>
        </div>
      </div>

      {/* ─── Sync-Ergebnis ───────────────────────────────────────────────────── */}
      {syncResult && (
        <div className="rounded-xl border border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700 p-4 text-sm text-green-800 dark:text-green-200 flex items-start gap-3">
          <span className="text-lg">✅</span>
          <div>
            <p className="font-semibold mb-1">Sync erfolgreich!</p>
            <p>📅 Kalender: <strong>{syncResult.calendar.created}</strong> neue Termine erstellt, {syncResult.calendar.skipped} übersprungen.</p>
            <p>🗂️ Kanban (<em>{syncResult.kanban.board}</em>): <strong>{syncResult.kanban.created}</strong> neue Karten erstellt, {syncResult.kanban.skipped} übersprungen.</p>
          </div>
          <button onClick={() => setSyncResult(null)} className="ml-auto text-green-600 hover:text-green-800">✕</button>
        </div>
      )}
      {syncError && (
        <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-4 text-sm text-red-800 dark:text-red-200 flex items-center gap-3">
          <span>❌ {syncError}</span>
          <button onClick={() => setSyncError(null)} className="ml-auto text-red-600 hover:text-red-800">✕</button>
        </div>
      )}

      {/* ─── Bewerbungskurve ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">
          📈 Erwartete vs. tatsächliche Bewerbungen / Woche
        </h2>
        <div className="flex items-end gap-2 h-20">
          {APP_CURVE.map((d) => {
            const real = stats?.weekStats?.find((s) => s.week === parseInt(d.week.replace("W", "")))?.count ?? null;
            return (
              <div key={d.week} className="flex flex-col items-center flex-1 group relative">
                {/* Ziel-Balken */}
                <div className="w-full relative">
                  <div
                    className="w-full rounded-t-sm bg-blue-200 dark:bg-blue-900 transition-all"
                    style={{ height: `${(d.target / MAX_CURVE) * 64}px` }}
                  />
                  {/* Echter Wert */}
                  {real !== null && (
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-green-500 dark:bg-green-400 transition-all"
                      style={{ height: `${Math.min((real / MAX_CURVE) * 64, (d.target / MAX_CURVE) * 64)}px` }}
                    />
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">{d.week}</div>
                <div className="text-xs font-bold text-blue-600 dark:text-blue-300">
                  {real !== null ? (
                    <span>
                      <span className="text-green-600 dark:text-green-400">{real}</span>
                      <span className="text-gray-400">/{d.target}</span>
                    </span>
                  ) : (
                    d.target
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 inline-block"></span>Ziel</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"></span>Echt</span>
          {stats && (
            <span className="ml-auto font-semibold text-gray-600 dark:text-slate-300">
              Gesamt: {stats.total} · Interviews: {stats.totalInterviews} · Angebote: {stats.totalOffers}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          ⚡ Durchschnitt: 15/Woche · Gesamtziel: mind. 80 Bewerbungen · Power- und Ruhephasen einplanen
        </p>
      </div>

      {/* ─── Wochen-Tabs ─────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-slate-700 scrollbar-hide">
          {WEEKS.map((w) => {
            const done = w.checkliste.filter(
              (_, i) => checkedItems[`${w.week}-check-${i}`]
            ).length;
            const pct = Math.round((done / w.checkliste.length) * 100);
            return (
              <button
                key={w.week}
                onClick={() => setActiveWeek(w.week)}
                className={`shrink-0 px-4 py-3 text-xs font-semibold transition-colors border-b-2 ${
                  activeWeek === w.week
                    ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                }`}
              >
                <div>W{w.week}</div>
                {pct > 0 && (
                  <div
                    className={`mt-1 text-[10px] font-bold ${
                      pct === 100 ? "text-green-500" : "text-yellow-500"
                    }`}
                  >
                    {pct}%
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Wocheninhalt ─────────────────────────────────────────────────── */}
        <div className="p-6 space-y-6">
          {/* Titel + Ziel */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                  Woche {week.week}
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                  {fmtDate(activeWeekStart)} – {fmtDate(activeWeekEnd)}
                </span>
                {week.applicationGoal && (
                  <span className="text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                    🎯 {week.applicationGoal}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {week.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                🎯 {week.goal}
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {week.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            {/* Fortschritt */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {progress}%
              </div>
              <div className="text-xs text-gray-400">Erledigt</div>
              <div className="w-16 h-2 bg-gray-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Google Sheets Link */}
          <a
            href={week.sheetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
          >
            📊 Woche {week.week} im Google Sheet bearbeiten →
          </a>

          {/* ─── Tagesplan ────────────────────────────────────────────────────── */}
          <div>
            <button
              onClick={() => toggleSection(`tagesplan-${activeWeek}`)}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 hover:text-blue-600"
            >
              <span>📅 Tagesplan</span>
              <span>{openSections[`tagesplan-${activeWeek}`] ? "▲" : "▼"}</span>
            </button>
            {(openSections[`tagesplan-${activeWeek}`] !== false) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {week.tagesplan.map((t, i) => (
                  <div
                    key={i}
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
                  >
                    <div className="text-xs font-bold text-blue-700 dark:text-blue-300">
                      {t.day}
                    </div>
                    <div className="text-xs text-blue-500 dark:text-blue-400 mb-1">
                      {fmtDayDate(getTagDate(i))}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed mb-3">
                      {t.focus}
                    </div>
                    {/* Tages-Notizen */}
                    <div className="space-y-2 mt-2 border-t border-blue-200 dark:border-blue-700 pt-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-blue-700 dark:text-blue-300 mb-1">📝 Tages-Notizen</label>
                        <textarea
                          className="w-full text-xs rounded border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 px-2 py-1.5 resize-none focus:ring-1 focus:ring-blue-400 focus:outline-none"
                          rows={3}
                          placeholder="Was habe ich heute gelernt / gearbeitet?"
                          value={entries[entryKey(activeWeek, i + 1, "DAY_NOTE")] ?? ""}
                          onChange={(e) => {
                            const k = entryKey(activeWeek, i + 1, "DAY_NOTE");
                            setEntries((prev) => ({ ...prev, [k]: e.target.value }));
                          }}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val) saveEntry(activeWeek, i + 1, "DAY_NOTE", val);
                            else deleteEntry(activeWeek, i + 1, "DAY_NOTE");
                          }}
                        />
                        {entrySaving[entryKey(activeWeek, i + 1, "DAY_NOTE")] && (
                          <span className="text-[10px] text-blue-400">Speichert…</span>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-blue-700 dark:text-blue-300 mb-1">📋 Tages-Zusammenfassung</label>
                        <textarea
                          className="w-full text-xs rounded border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 px-2 py-1.5 resize-none focus:ring-1 focus:ring-blue-400 focus:outline-none"
                          rows={3}
                          placeholder="Zusammenfassung des Tages…"
                          value={entries[entryKey(activeWeek, i + 1, "DAY_SUMMARY")] ?? ""}
                          onChange={(e) => {
                            const k = entryKey(activeWeek, i + 1, "DAY_SUMMARY");
                            setEntries((prev) => ({ ...prev, [k]: e.target.value }));
                          }}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val) saveEntry(activeWeek, i + 1, "DAY_SUMMARY", val);
                            else deleteEntry(activeWeek, i + 1, "DAY_SUMMARY");
                          }}
                        />
                        {entrySaving[entryKey(activeWeek, i + 1, "DAY_SUMMARY")] && (
                          <span className="text-[10px] text-blue-400">Speichert…</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Aufgaben ─────────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">
              ✅ Aufgaben dieser Woche
            </h3>
            {week.aufgaben.map((section, si) => {
              const key = `task-${activeWeek}-${si}`;
              const isOpen = openSections[key] !== false;
              return (
                <div
                  key={si}
                  className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span>{section.title}</span>
                    <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <ul className="p-3 space-y-2">
                      {section.items.map((item, ii) => (
                        <li
                          key={ii}
                          className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-300"
                        >
                          <span className="text-blue-500 mt-0.5 shrink-0">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* ─── Do's & Don'ts ────────────────────────────────────────────────── */}
          {week.dosAndDonts && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="text-sm font-bold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                  ✅ DO&apos;S
                </h4>
                <ul className="space-y-1.5">
                  {week.dosAndDonts.dos.map((d, i) => (
                    <li
                      key={i}
                      className="text-xs text-green-800 dark:text-green-200 flex items-start gap-2"
                    >
                      <span className="shrink-0 mt-0.5">✓</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="text-sm font-bold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                  ❌ DON&apos;TS
                </h4>
                <ul className="space-y-1.5">
                  {week.dosAndDonts.donts.map((d, i) => (
                    <li
                      key={i}
                      className="text-xs text-red-800 dark:text-red-200 flex items-start gap-2"
                    >
                      <span className="shrink-0 mt-0.5">✗</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ─── Checkliste ───────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              ☑️ Checkliste Woche {week.week}
              <span className="text-xs text-gray-400">
                {checkedCount}/{week.checkliste.length}
              </span>
            </h3>
            <div className="space-y-2">
              {week.checkliste.map((item, i) => {
                const key = `${activeWeek}-check-${i}`;
                return (
                  <label
                    key={i}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedItems[key]}
                      onChange={() => toggleCheck(key)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span
                      className={`text-sm transition-colors ${
                        checkedItems[key]
                          ? "line-through text-gray-400 dark:text-slate-500"
                          : "text-gray-700 dark:text-slate-300"
                      }`}
                    >
                      {item}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* ─── Tools ────────────────────────────────────────────────────────── */}
          {week.tools.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">
                🛠️ Tools & Ressourcen
              </h3>
              <div className="flex flex-wrap gap-3">
                {week.tools.map((tool, i) => {
                  const isExternal = tool.url.startsWith("http");
                  return (
                    <a
                      key={i}
                      href={tool.url}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm"
                    >
                      <span className="font-medium text-gray-800 dark:text-slate-200">
                        {tool.name}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-slate-400">
                        {tool.desc}
                      </span>
                      {isExternal && (
                        <span className="text-xs text-gray-400">↗</span>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Musterlösungen ───────────────────────────────────────────── */}
          {MUSTERLOESUNGEN[activeWeek] && (
            <div className="mt-4 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 overflow-hidden">
              <button
                onClick={() => toggleMuster(`muster-${activeWeek}`)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">
                  🎯 Musterlösung / Beispiel (Woche {activeWeek})
                </span>
                <span className="text-yellow-600 dark:text-yellow-400 text-xs">
                  {openMuster[`muster-${activeWeek}`] ? "▲ Einklappen" : "▼ Anzeigen"}
                </span>
              </button>
              {openMuster[`muster-${activeWeek}`] && (
                <div className="px-4 pb-4 space-y-4">
                  {MUSTERLOESUNGEN[activeWeek].map((m, mi) => (
                    <div key={mi}>
                      <h4 className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-2 uppercase tracking-wide">
                        {m.title}
                      </h4>
                      <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg p-3 border border-yellow-100 dark:border-slate-700 leading-relaxed font-sans">
                        {m.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Live-Bewerbungen dieser Woche ────────────────────────────── */}
          {weekStat && (
            <div className="mt-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                  📊 Deine Bewerbungen – Woche {activeWeek}
                </span>
                <span className={`text-sm font-bold ${weekStat.count >= weekStat.target && weekStat.target > 0 ? "text-green-600" : "text-amber-600"}`}>
                  {weekStat.count} / {weekStat.target} Ziel
                </span>
              </div>

              {/* Tages-Ergebnisse Mo–So */}
              {weekStat.dailyStats && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">
                    📅 Tages-Ergebnisse
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((dayName, i) => {
                      const day = weekStat.dailyStats?.[i];
                      const count = day?.count ?? 0;
                      return (
                        <div
                          key={i}
                          className={`rounded-lg p-2 text-center ${
                            count > 0
                              ? "bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700"
                              : "bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
                          }`}
                        >
                          <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400">{dayName}</div>
                          <div
                            className={`text-base font-bold mt-0.5 ${
                              count > 0 ? "text-green-700 dark:text-green-300" : "text-gray-300 dark:text-slate-600"
                            }`}
                          >
                            {count}
                          </div>
                          {day && count > 0 && (
                            <div className="mt-0.5 space-y-0.5">
                              {day.statuses.interview > 0 && (
                                <div className="text-[9px] text-blue-600 dark:text-blue-400">📞{day.statuses.interview}</div>
                              )}
                              {day.statuses.offer > 0 && (
                                <div className="text-[9px] text-yellow-600 dark:text-yellow-400">🏆{day.statuses.offer}</div>
                              )}
                              {day.statuses.rejected > 0 && (
                                <div className="text-[9px] text-red-500">✗{day.statuses.rejected}</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bewerbungsliste */}
              {weekStat.applications.length > 0 ? (
                <ul className="space-y-1">
                  {weekStat.applications.map((app) => (
                    <li key={app.id} className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-800 rounded px-3 py-1.5 border border-green-100 dark:border-slate-700">
                      <span className="font-medium">{app.company}</span>
                      <span className="text-gray-400">{app.position}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        app.status === "INTERVIEW_SCHEDULED" || app.status === "INTERVIEWED" ? "bg-blue-100 text-blue-700" :
                        app.status === "OFFER_RECEIVED" || app.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                        app.status === "REJECTED" ? "bg-red-100 text-red-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {app.status === "APPLIED" ? "Beworben" :
                         app.status === "REVIEWED" ? "Gesichtet" :
                         app.status === "INTERVIEW_SCHEDULED" ? "Interview" :
                         app.status === "INTERVIEWED" ? "Interviewt" :
                         app.status === "OFFER_RECEIVED" ? "Angebot" :
                         app.status === "ACCEPTED" ? "Angenommen" :
                         app.status === "REJECTED" ? "Abgelehnt" :
                         app.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">Noch keine Bewerbungen diese Woche.</p>
              )}
            </div>
          )}
          {/* ─── Wochenzusammenfassung ────────────────────────────────────────── */}
          <div className="mt-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-4">
            <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
              📓 Wochenzusammenfassung – Woche {activeWeek}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Recherche & Notizen der Woche
                </label>
                <textarea
                  className="w-full text-sm rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 px-3 py-2 resize-none focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  rows={4}
                  placeholder="Was habe ich diese Woche recherchiert? Welche Ressourcen, Links, Konzepte sind wichtig?"
                  value={entries[entryKey(activeWeek, null, "RESEARCH")] ?? ""}
                  onChange={(e) => {
                    const k = entryKey(activeWeek, null, "RESEARCH");
                    setEntries((prev) => ({ ...prev, [k]: e.target.value }));
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val) saveEntry(activeWeek, null, "RESEARCH", val);
                    else deleteEntry(activeWeek, null, "RESEARCH");
                  }}
                />
                {entrySaving[entryKey(activeWeek, null, "RESEARCH")] && (
                  <span className="text-[10px] text-purple-400">Speichert…</span>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Zusammenfassung der Woche
                </label>
                <textarea
                  className="w-full text-sm rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 px-3 py-2 resize-none focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  rows={5}
                  placeholder="Was habe ich diese Woche gelernt und gemacht? Was lief gut, was schwer?"
                  value={entries[entryKey(activeWeek, null, "WEEK_SUMMARY")] ?? ""}
                  onChange={(e) => {
                    const k = entryKey(activeWeek, null, "WEEK_SUMMARY");
                    setEntries((prev) => ({ ...prev, [k]: e.target.value }));
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val) saveEntry(activeWeek, null, "WEEK_SUMMARY", val);
                    else deleteEntry(activeWeek, null, "WEEK_SUMMARY");
                  }}
                />
                {entrySaving[entryKey(activeWeek, null, "WEEK_SUMMARY")] && (
                  <span className="text-[10px] text-purple-400">Speichert…</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Gesamtübersicht ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">
          📋 Gesamtfortschritt – alle 12 Wochen
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {WEEKS.map((w) => {
            const done = w.checkliste.filter(
              (_, i) => checkedItems[`${w.week}-check-${i}`]
            ).length;
            const pct = Math.round((done / w.checkliste.length) * 100);
            return (
              <button
                key={w.week}
                onClick={() => setActiveWeek(w.week)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  activeWeek === w.week
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-slate-700 hover:border-blue-300"
                }`}
              >
                <div className="text-xs font-bold text-gray-500 dark:text-slate-400">
                  Woche {w.week}
                </div>
                <div className="text-xs text-gray-600 dark:text-slate-300 mt-1 line-clamp-2 leading-tight">
                  {w.title.split("–")[0].trim() || w.title.split(" ").slice(0, 4).join(" ")}
                </div>
                <div className="mt-2 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct === 100
                        ? "bg-green-500"
                        : pct > 0
                        ? "bg-blue-500"
                        : "bg-transparent"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div
                  className={`text-xs mt-1 font-bold ${
                    pct === 100
                      ? "text-green-500"
                      : pct > 0
                      ? "text-blue-500"
                      : "text-gray-300 dark:text-slate-600"
                  }`}
                >
                  {pct > 0 ? `${pct}%` : "–"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
