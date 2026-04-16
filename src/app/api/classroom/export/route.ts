import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/security/guard";

// Exportiert den Classroom-Inhalt (alle 12 Wochen) als JSON oder CSV
// GET /api/classroom/export?format=json|csv

export async function GET(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "json";

    // Classroom-Daten (statisch – identisch zu DCIClassroom.tsx WEEKS)
    const weeks = [
      { week: 1, title: "Aufbau deiner Struktur für die Zeit der Jobsuche", goal: "Struktur und Überblick für die Bewerbungsphase schaffen", applicationGoal: "7 qualitative Bewerbungen", tags: "Planung,Tracking,Struktur", aufgaben: "Bewerbungsstrategie festlegen; Profile auf Plattformen anlegen; Bewerbungstracking einrichten; Erwartungsmanagement verstehen", checklistCount: 6 },
      { week: 2, title: "Professionalisierung deines Portfolios – Anschreiben", goal: "Individuelles, überzeugendes Anschreiben für jede Bewerbung verfassen", applicationGoal: "", tags: "Anschreiben,Portfolio,Do's & Don'ts", aufgaben: "Anschreiben-Struktur anwenden (01-06); Inhaltliche Schwerpunkte gewichten; Überprüfung und Formatierung; Checkliste vollständiges Anschreiben", checklistCount: 8 },
      { week: 3, title: "Verbesserung deiner Networking Skills", goal: "Netzwerk aktiv aufbauen und Netzwerk-Events strategisch nutzen", applicationGoal: "", tags: "Networking,Events,LinkedIn", aufgaben: "Netzwerk-Events vorbereiten; Beim Event richtig auftreten; Nach dem Event Follow-Up; Arten von Netzwerk-Events kennen", checklistCount: 6 },
      { week: 4, title: "Erstellung deines Elevator Pitchs", goal: "Einen überzeugenden 30–60-Sekunden Elevator Pitch entwickeln und üben", applicationGoal: "", tags: "Elevator Pitch,Selbstpräsentation,Feedback", aufgaben: "Selbstpräsentation Worauf achten; Elevator Pitch 4-Schritte-Aufbau; Pitch üben und verfeinern; Feedback geben & nehmen C.O.I.N.", checklistCount: 6 },
      { week: 5, title: "Vorbereitung auf Interviews", goal: "Professionell auf Vorstellungsgespräche vorbereiten", applicationGoal: "", tags: "Interview,Vorbereitung,Recherche", aufgaben: "Was Firmen von Berufseinsteigern erwarten; Bewerbungsprozess verstehen; Interview-Phasen kennen & vorbereiten; Konkrete Vorbereitung", checklistCount: 7 },
      { week: 6, title: "Interviews üben", goal: "Selbstbewusstsein im Interview stärken, schwierige Situationen meistern", applicationGoal: "", tags: "Interview,Mindset,Üben", aufgaben: "Das richtige Mindset; Umgang mit schwierigen Fragen; Floskeln zur Zeitbeschaffung; Setting vorbereiten", checklistCount: 6 },
      { week: 7, title: "Fokus Soft Skills – Umgang mit Absagen", goal: "Absagen professionell verarbeiten, Soft Skills stärken", applicationGoal: "", tags: "Soft Skills,Absagen,Recruiting", aufgaben: "Absagen richtig einordnen; Mit Absagen umgehen; Selbstkritisch weiterentwickeln; Recruiting-Prozess aus Unternehmenssicht; Was Unternehmen erwarten", checklistCount: 6 },
      { week: 8, title: "Aufbau deiner Struktur für die Zeit nach dem DCI Kurs", goal: "Langfristige Bewerbungsstruktur und Selbstmanagement entwickeln", applicationGoal: "", tags: "Struktur,Planung,Nachhaltigkeit", aufgaben: "8-Punkte-Plan für nachhaltige Struktur; Diese Schritte immer wiederholen", checklistCount: 6 },
      { week: 9, title: "Aktivität in sozialen Medien erhöhen", goal: "Professionelle Social-Media-Präsenz aufbauen und LinkedIn aktiv nutzen", applicationGoal: "", tags: "LinkedIn,Content,Sichtbarkeit", aufgaben: "Wertvollen Content erstellen; Interaktion und Sichtbarkeit steigern; Beiträge optimieren", checklistCount: 6 },
      { week: 10, title: "Entwicklung von Zusatzqualifikationen", goal: "Relevante Soft Skills und Tech Skills gezielt weiterentwickeln", applicationGoal: "", tags: "Qualifikationen,Soft Skills,Tech Skills", aufgaben: "Warum Zusatzqualifikationen wichtig sind; Soft Skills entwickeln; Lernressourcen nutzen", checklistCount: 5 },
      { week: 11, title: "Bewerbungs-Sprint", goal: "Intensive Bewerbungsphase – alle gelernten Kompetenzen in die Praxis umsetzen", applicationGoal: "15 Bewerbungen diese Woche", tags: "Sprint,Bewerbungen,Umsetzung", aufgaben: "6-Schritte-Bewerbungsprozess anwenden; Sprint-Qualität sicherstellen", checklistCount: 6 },
      { week: 12, title: "Zusammenfassung & Ausblick", goal: "12 Wochen ISP-Phase reflektieren und Struktur festigen", applicationGoal: "", tags: "Reflektion,Abschluss,Ausblick", aufgaben: "12 Wochen reflektieren; Vorbereitung auf die kommenden Wochen", checklistCount: 6 },
    ];

    if (format === "csv") {
      const header = "Woche;Titel;Ziel;Bewerbungsziel;Tags;Aufgabenbereiche;Checklistenpunkte";
      const rows = weeks.map((w) =>
        [
          w.week,
          `"${w.title}"`,
          `"${w.goal}"`,
          `"${w.applicationGoal}"`,
          `"${w.tags}"`,
          `"${w.aufgaben}"`,
          w.checklistCount,
        ].join(";")
      );
      const csv = [header, ...rows].join("\n");
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="dci-classroom-12-wochen.csv"',
        },
      });
    }

    return NextResponse.json({ weeks });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED" || msg === "INACTIVE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
