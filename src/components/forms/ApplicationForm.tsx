"use client";
import { useAppUser } from "@/hooks/useAppUser";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyEuroIcon,
  GlobeEuropeAfricaIcon,
  LinkIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface ApplicationFormData {
  companyName: string;
  position: string;
  location: string;
  street: string;
  zip: string;
  country: string;
  state: string;
  isInland: boolean;
  jobType: string;
  salary: string;
  jobUrl: string;
  companyUrl: string;
  description: string;
  requirements: string;
  coverLetter: string;
  itBereich: string;
  priority: string;
  status: string;
  appliedAt: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function ApplicationForm() {
  const router = useRouter();
  const { id: userId } = useAppUser();
  const [formData, setFormData] = useState<ApplicationFormData>({
    companyName: "",
    position: "",
    location: "",
    street: "",
    zip: "",
    country: "Deutschland",
    state: "",
    isInland: true,
    jobType: "FULLTIME",
    salary: "",
    jobUrl: "",
    companyUrl: "",
    description: "",
    requirements: "",
    coverLetter: "",
    itBereich: "",
    priority: "MEDIUM",
    status: "APPLIED",
    appliedAt: new Date().toISOString().slice(0, 10),
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const itBereiche = [
    { value: "", label: "— Bereich wählen (optional) —" },
    { value: "frontend", label: "🖥️  Frontend-Entwicklung" },
    { value: "backend", label: "⚙️  Backend-Entwicklung" },
    { value: "fullstack", label: "🔀  Full-Stack-Entwicklung" },
    { value: "devops", label: "☁️  DevOps / Cloud Engineering" },
    { value: "datascience", label: "📊  Data Science / KI / Machine Learning" },
    { value: "security", label: "🔒  Cybersecurity / IT-Security" },
    { value: "projektmanagement", label: "📋  IT-Projektmanagement / Scrum" },
    { value: "sysadmin", label: "🖧  Systemadministration / IT-Infrastruktur" },
    { value: "qa", label: "🧪  QA / Softwaretesting" },
    { value: "mobile", label: "📱  Mobile Entwicklung (iOS / Android)" },
    { value: "architektur", label: "🏛️  Software-Architektur / Enterprise" },
    { value: "erp", label: "🗄️  ERP / SAP-Beratung" },
    { value: "embedded", label: "🔧  Embedded Systems / IoT" },
    { value: "ux", label: "🎨  UX Engineering / Design Systems" },
  ];

  const coverLetterVorlagen: Record<string, string> = {
    frontend:
`Sehr geehrte Damen und Herren,

mit großem Interesse habe ich Ihre Stellenausschreibung als [POSITION] bei [UNTERNEHMEN] gelesen. Als erfahrener Frontend-Entwickler bringe ich fundierte Kenntnisse in React, TypeScript und modernen CSS-Frameworks (Tailwind CSS, SCSS) mit und bin begeistert davon, performante und barrierefreie Benutzeroberflächen zu schaffen.

In meinen bisherigen Projekten habe ich Single-Page-Applications nach aktuellen Web-Standards entwickelt, CI/CD-Pipelines für Frontend-Deployments aufgebaut und eng mit UX-Designern zusammengearbeitet, um pixel-genaue Implementierungen zu liefern. Mein Fokus liegt auf Code-Qualität, Componentisierung und exzellenter Developer Experience.

Ich bin überzeugt, dass ich mit meiner Erfahrung und meiner Leidenschaft für saubere UI-Architekturen einen wertvollen Beitrag zu Ihrem Team leisten kann. Über eine Einladung zum Gespräch freue ich mich sehr.

Mit freundlichen Grüßen
[IHR NAME]`,

    backend:
`Sehr geehrte Damen und Herren,

die Stellenausschreibung für [POSITION] bei [UNTERNEHMEN] hat mein Interesse sofort geweckt. Als Backend-Entwickler mit Schwerpunkt auf skalierbaren Microservices und RESTful APIs bringe ich mehrjährige Erfahrung mit Node.js/TypeScript, Java Spring Boot und PostgreSQL/MongoDB mit.

Zu meinen Stärken zählen der Entwurf robuster Datenbankarchitekturen, die Implementierung sicherer Authentifizierungskonzepte (OAuth2, JWT) sowie die Optimierung von Datenbankabfragen für hohe Last. Ich arbeite nach Clean-Code-Prinzipien und schätze kollaborative Code-Reviews.

Ich würde mich freuen, meine Backend-Expertise in Ihr Unternehmen einzubringen und gemeinsam mit Ihrem Team leistungsfähige Systeme zu entwickeln.

Mit freundlichen Grüßen
[IHR NAME]`,

    fullstack:
`Sehr geehrte Damen und Herren,

die ausgeschriebene Stelle als [POSITION] bei [UNTERNEHMEN] entspricht genau meinem Profil als Full-Stack-Entwickler. Ich beherrsche den gesamten Technologie-Stack – von React/Next.js im Frontend über Node.js/TypeScript im Backend bis hin zu Datenbankdesign mit PostgreSQL und Cloud-Deployments auf AWS/Vercel.

Meine Erfahrung in agilen Teams ermöglicht es mir, Feature-Entwicklungen eigenverantwortlich von der Anforderungsanalyse bis zum produktiven Deployment zu begleiten. Ich schätze es, sowohl technische Tiefe als auch den Gesamtüberblick über Systemarchitekturen zu haben.

Gerne überzeuge ich Sie in einem persönlichen Gespräch von meinen Fähigkeiten und meiner Motivation.

Mit freundlichen Grüßen
[IHR NAME]`,

    devops:
`Sehr geehrte Damen und Herren,

Ihre Ausschreibung für [POSITION] bei [UNTERNEHMEN] spricht mich als DevOps Engineer sehr an. Ich verfüge über umfangreiche Erfahrung in der Automatisierung von Build-, Test- und Deployment-Pipelines mit GitHub Actions, Jenkins und ArgoCD sowie in der Verwaltung von Kubernetes-Clustern auf AWS EKS und Azure AKS.

Infrastruktur-as-Code mit Terraform und Ansible sowie Monitoring- und Observability-Lösungen (Prometheus, Grafana, ELK) gehören zu meinem täglichen Werkzeugkasten. Mein Ziel ist es, Entwicklungsteams durch schlanke, zuverlässige Prozesse zu unterstützen und die Time-to-Market zu verkürzen.

Ich freue mich darauf, Ihre Cloud-Infrastruktur auf das nächste Level zu heben.

Mit freundlichen Grüßen
[IHR NAME]`,

    datascience:
`Sehr geehrte Damen und Herren,

mit Begeisterung bewerbe ich mich auf die Stelle als [POSITION] bei [UNTERNEHMEN]. Als Data Scientist mit Schwerpunkt Machine Learning und KI bringe ich fundierte Kenntnisse in Python (pandas, scikit-learn, PyTorch/TensorFlow), statistischer Modellierung und der Entwicklung von Produktiv-ML-Pipelines mit.

Ich habe Erfahrung in der Aufbereitung großer Datensätze, der Entwicklung und Evaluierung von Klassifikations-, Regressions- und NLP-Modellen sowie in der Kommunikation komplexer Ergebnisse an nicht-technische Stakeholder. MLOps-Praktiken wie Modell-Versionierung (MLflow) und automatisiertes Retraining sind für mich selbstverständlich.

Ich freue mich auf die Möglichkeit, datengetriebene Entscheidungen in Ihrem Unternehmen voranzutreiben.

Mit freundlichen Grüßen
[IHR NAME]`,

    security:
`Sehr geehrte Damen und Herren,

die Position als [POSITION] bei [UNTERNEHMEN] reizt mich als passionierter Cybersecurity-Experte außerordentlich. Mit Erfahrung in Penetrationstests, Sicherheitsaudits und der Implementierung von Zero-Trust-Architekturen helfe ich Unternehmen, ihre Angriffsfläche nachhaltig zu minimieren.

Ich bin vertraut mit OWASP Top 10, MITRE ATT&CK, SIEM-Systemen (Splunk, Microsoft Sentinel) und habe Incident-Response-Prozesse in produktiven Umgebungen geleitet. Zertifizierungen (CEH / OSCP / CompTIA Security+) unterstreichen mein Engagement für dieses Fachgebiet.

Gerne bringe ich mein Wissen ein, um die Sicherheitspostur Ihres Unternehmens zu stärken.

Mit freundlichen Grüßen
[IHR NAME]`,

    projektmanagement:
`Sehr geehrte Damen und Herren,

die ausgeschriebene Stelle als [POSITION] bei [UNTERNEHMEN] entspricht meinem beruflichen Profil als erfahrener IT-Projektmanager. Ich habe mehrjährige Erfahrung in der Leitung agiler Entwicklungsteams nach Scrum und SAFe und bin zertifizierter Scrum Master (PSM I) sowie PMP.

Meine Stärken liegen in der Stakeholder-Kommunikation, der Risikobewertung komplexer IT-Vorhaben und der Sicherstellung von Lieferterminen bei gleichzeitiger Qualitätssicherung. Ich moderiere Sprint-Reviews, Retrospektiven und technische Plannings auf Augenhöhe mit Entwicklungsteams und Management.

Ich freue mich darauf, Ihre Projekte zum Erfolg zu führen.

Mit freundlichen Grüßen
[IHR NAME]`,

    sysadmin:
`Sehr geehrte Damen und Herren,

für die Position als [POSITION] bei [UNTERNEHMEN] bringe ich als Systemadministrator umfassende Erfahrung mit Windows Server, Linux (RHEL/Ubuntu), Active Directory sowie VMware vSphere-Virtualisierungsumgebungen mit.

Ich verantworte den Betrieb kritischer Infrastruktur, inklusive Backup-Konzepten, Patch-Management und IT-Sicherheitsrichtlinien. Netzwerkkenntnisse (TCP/IP, VLANs, VPN, Firewall-Konfiguration) sowie Erfahrung mit Monitoring-Tools (Zabbix, Nagios) runden mein Profil ab. Im Support behalte ich auch unter Druck den Überblick.

Ich würde mich freuen, zum stabilen Betrieb Ihrer IT-Infrastruktur beizutragen.

Mit freundlichen Grüßen
[IHR NAME]`,

    qa:
`Sehr geehrte Damen und Herren,

die Stelle als [POSITION] bei [UNTERNEHMEN] reizt mich als QA Engineer, der leidenschaftlich dafür sorgt, dass Software fehlerfrei und zuverlässig läuft. Ich verfüge über Erfahrung in manuellen und automatisierten Tests mit Cypress, Playwright und Jest sowie in der Erstellung strukturierter Testpläne und Bug-Reports.

Ich arbeite eng mit Entwicklern zusammen, um Fehler frühzeitig im Entwicklungszyklus zu identifizieren (Shift-Left-Testing), und integriere Testsuiten nahtlos in CI/CD-Pipelines. Lasttest-Erfahrung mit k6 und JMeter sowie Kenntnisse im API-Testing (Postman, REST Assured) ergänzen mein Profil.

Qualität ist keine Aufgabe – sie ist eine Haltung. Ich freue mich auf Ihre Einladung.

Mit freundlichen Grüßen
[IHR NAME]`,

    mobile:
`Sehr geehrte Damen und Herren,

die Ausschreibung für [POSITION] bei [UNTERNEHMEN] trifft genau mein Erfahrungsfeld als Mobile Developer. Ich entwickle native iOS-Apps mit Swift/SwiftUI sowie Android-Apps mit Kotlin/Jetpack Compose und habe umfangreiche Erfahrung mit cross-platform-Entwicklung via React Native und Flutter.

Von der App-Architektur (MVVM, Clean Architecture) über Performance-Optimierung bis hin zur Veröffentlichung im App Store / Google Play begleite ich den gesamten Lifecycle einer mobilen Anwendung. Erfahrung mit Push-Notifications, Offline-Synchronisation und biometrischer Authentifizierung runden mein Profil ab.

Ich freue mich darauf, Ihre mobile Produktvision umzusetzen.

Mit freundlichen Grüßen
[IHR NAME]`,

    architektur:
`Sehr geehrte Damen und Herren,

als Software-Architekt mit Schwerpunkt Enterprise-Architektur bewerbe ich mich mit großem Interesse auf die Stelle als [POSITION] bei [UNTERNEHMEN]. Ich entwerfe skalierbare Systemlandschaften mit Microservices, Event-Driven Architecture (Kafka, RabbitMQ) und API-Gateway-Mustern, stets unter Berücksichtigung von Wartbarkeit und Zukunftsfähigkeit.

Meine Erfahrung umfasst die technische Führung verteilter Entwicklungsteams, Architecture Decision Records (ADRs) sowie die Begleitung von Legacy-Modernisierungsprojekten. Ich kommuniziere technische Konzepte klar sowohl mit Entwicklern als auch mit dem Management.

Gerne gestalte ich die technische Zukunft Ihres Unternehmens mit.

Mit freundlichen Grüßen
[IHR NAME]`,

    erp:
`Sehr geehrte Damen und Herren,

mit ausgeprägter Begeisterung bewerbe ich mich auf die Position als [POSITION] bei [UNTERNEHMEN]. Als ERP-/SAP-Berater verfüge ich über tiefgehende Kenntnisse in SAP S/4HANA (Module: FI/CO, MM, SD, HCM) sowie in der Customizing-Konfiguration, Anforderungsanalyse und SAP-Projektleitung nach ASAP/Activate-Methodik.

Ich habe Rollouts in internationalen Konzernen begleitet, Endanwenderschulungen durchgeführt und ABAP-Entwickler bei der Umsetzung kundenspezifischer Anforderungen koordiniert. Die Verbindung aus betriebswirtschaftlichem Verständnis und technischem Know-how zeichnet mich aus.

Ich freue mich auf ein persönliches Kennenlernen.

Mit freundlichen Grüßen
[IHR NAME]`,

    embedded:
`Sehr geehrte Damen und Herren,

die Stelle als [POSITION] bei [UNTERNEHMEN] interessiert mich als Embedded-Systems-Entwickler, der in der Schnittmenge von Hardware und Software zu Hause ist. Ich programmiere microcontrollerbasierte Systeme in C/C++ (ARM Cortex-M, ESP32), arbeite mit RTOS (FreeRTOS, Zephyr) und habe Erfahrung in der Kommunikation über SPI, I2C, CAN, UART und Bluetooth/WiFi.

Neben der Firmware-Entwicklung bringe ich JTAG/SWD-Debugging, das Schreiben von Treibern sowie das Design energieeffizienter IoT-Lösungen mit. Erfahrung in der Zusammenarbeit mit Hardware-Ingenieuren und im EMV-konformen Design runden mein Profil ab.

Mit freundlichen Grüßen
[IHR NAME]`,

    ux:
`Sehr geehrte Damen und Herren,

die Ausschreibung als [POSITION] bei [UNTERNEHMEN] begeistert mich als UX Engineer an der Schnittstelle zwischen Design und Entwicklung. Ich überführe Figma-Designs in zugängliche, pixel-genaue Komponenten-Bibliotheken (Storybook, Design Tokens) und treibe Design-System-Governance in agilen Produktteams voran.

Mit Kenntnissen in Accessibility (WCAG 2.2, ARIA), Animation (Framer Motion, CSS Transitions) und User-Research-Methoden (Usability-Tests, A/B-Tests) brücke ich die Lücke zwischen subjektivem Design und messbarer Nutzerqualität. Meine Arbeit basiert auf Datenpunkten, nicht nur auf Geschmack.

Ich freue mich auf den Austausch mit Ihrem Produkt-Team.

Mit freundlichen Grüßen
[IHR NAME]`,
  };

  const handleBereichChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      itBereich: val,
      coverLetter: val ? coverLetterVorlagen[val] ?? prev.coverLetter : prev.coverLetter,
    }));
  };

  const jobTypes = [
    { value: "FULLTIME", label: "Vollzeit" },
    { value: "PARTTIME", label: "Teilzeit" },
    { value: "CONTRACT", label: "Vertrag" },
    { value: "FREELANCE", label: "Freiberuflich" },
    { value: "INTERNSHIP", label: "Praktikum" },
  ];

  const priorities = [
    { value: "LOW", label: "Niedrig", color: "bg-gray-100 text-gray-800" },
    {
      value: "MEDIUM",
      label: "Mittel",
      color: "bg-yellow-100 text-yellow-800",
    },
    { value: "HIGH", label: "Hoch", color: "bg-orange-100 text-orange-800" },
    { value: "URGENT", label: "Dringend", color: "bg-red-100 text-red-800" },
  ];

  const statuses = [
    { value: "APPLIED", label: "Beworben", color: "bg-blue-100 text-blue-800" },
    { value: "INITIATIVE", label: "Initiativbewerbung", color: "bg-teal-100 text-teal-800" },
    { value: "REVIEWED", label: "Geprüft", color: "bg-purple-100 text-purple-800" },
    { value: "INTERVIEW_SCHEDULED", label: "Interview geplant", color: "bg-yellow-100 text-yellow-800" },
    { value: "INTERVIEWED", label: "Interview geführt", color: "bg-indigo-100 text-indigo-800" },
    { value: "OFFER_RECEIVED", label: "Angebot erhalten", color: "bg-green-100 text-green-800" },
    { value: "ACCEPTED", label: "Angenommen", color: "bg-emerald-100 text-emerald-800" },
    { value: "REJECTED", label: "Abgelehnt", color: "bg-red-100 text-red-800" },
    { value: "WITHDRAWN", label: "Zurückgezogen", color: "bg-gray-100 text-gray-800" },
    { value: "OTHER", label: "Sonstiges", color: "bg-slate-100 text-slate-800" },
  ];

  const countries = [
    "Deutschland",
    "Österreich",
    "Schweiz",
    "Luxemburg",
    "Niederlande",
    "Belgien",
    "Frankreich",
    "Italien",
    "Spanien",
    "Portugal",
    "Polen",
    "Tschechien",
    "Ungarn",
    "Rumänien",
    "Schweden",
    "Norwegen",
    "Dänemark",
    "Finnland",
    "Irland",
    "Vereinigtes Königreich",
    "Griechenland",
    "Kroatien",
    "Slowenien",
    "Slowakei",
    "Estland",
    "Lettland",
    "Litauen",
    "USA",
    "Kanada",
    "Australien",
    "Neuseeland",
    "Singapur",
    "Vereinigte Arabische Emirate",
    "Sonstiges",
  ];

  const statesByCountry: Record<string, string[]> = {
    Deutschland: [
      "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen",
      "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen",
      "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen",
      "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen",
    ],
    "Österreich": [
      "Burgenland", "Kärnten", "Niederösterreich", "Oberösterreich",
      "Salzburg", "Steiermark", "Tirol", "Vorarlberg", "Wien",
    ],
    Schweiz: [
      "Aargau", "Appenzell Ausserrhoden", "Appenzell Innerrhoden", "Basel-Landschaft",
      "Basel-Stadt", "Bern", "Freiburg", "Genève", "Glarus", "Graubünden",
      "Jura", "Luzern", "Nidwalden", "Obwalden", "Schaffhausen", "Schwyz",
      "Solothurn", "St. Gallen", "Thurgau", "Ticino", "Uri", "Valais",
      "Vaud", "Zug", "Zürich",
    ],
    Luxemburg: ["Capellen", "Clervaux", "Diekirch", "Echternach", "Esch-sur-Alzette",
      "Grevenmacher", "Luxemburg", "Mersch", "Redange", "Remich", "Vianden", "Wiltz"],
  };

  const availableStates = statesByCountry[formData.country] ?? [];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Firmenname ist erforderlich";
    }

    if (!formData.position.trim()) {
      newErrors.position = "Position ist erforderlich";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Ort ist erforderlich";
    }

    if (formData.jobUrl && !isValidUrl(formData.jobUrl)) {
      newErrors.jobUrl = "Bitte geben Sie eine gültige URL ein";
    }

    if (formData.companyUrl && !isValidUrl(formData.companyUrl)) {
      newErrors.companyUrl = "Bitte geben Sie eine gültige URL ein";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        country: checked ? "Deutschland" : prev.country,
        state: "",
      }));
    } else if (name === "country") {
      setFormData((prev) => ({ ...prev, country: value, state: "" }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!userId) {
      setSubmitError("Bitte melden Sie sich an, um eine Bewerbung zu erstellen.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        userId: userId,
        ...formData,
        country: formData.country || "Deutschland",
        street: formData.street || null,
        zip: formData.zip || null,
        state: formData.state || null,
        appliedAt: formData.appliedAt || new Date().toISOString().slice(0, 10),
        coverLetter: formData.coverLetter || null,
        itBereich: formData.itBereich || null,
      };

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error || "Fehler beim Speichern der Bewerbung.";
        throw new Error(message);
      }

      router.push("/applications");
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Fehler beim Speichern der Bewerbung"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentPriority = () => {
    return priorities.find((p) => p.value === formData.priority);
  };

  const getCurrentStatus = () => {
    return statuses.find((s) => s.value === formData.status);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Neue Bewerbung erstellen
        </h1>
        <p className="mt-2 text-gray-600">
          Erfassen Sie alle wichtigen Details zu Ihrer neuen Bewerbung.
        </p>
        {false && (
          <p className="text-sm text-gray-500 mt-1">Lade Benutzer...</p>
        )}
        {submitError && (
          <p className="text-sm text-red-600 mt-1">{submitError}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Grundlegende Informationen */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-500" />
            Grundlegende Informationen
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Firmenname */}
            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Firmenname *
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.companyName ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="z.B. TechCorp GmbH"
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {errors.companyName}
                </p>
              )}
            </div>

            {/* Position */}
            <div>
              <label
                htmlFor="position"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Position *
              </label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.position ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="z.B. Senior Frontend Developer"
              />
              {errors.position && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {errors.position}
                </p>
              )}
            </div>

            {/* Beworben am */}
            <div>
              <label
                htmlFor="appliedAt"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Beworben am
              </label>
              <input
                type="date"
                id="appliedAt"
                name="appliedAt"
                value={formData.appliedAt}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Inland/Ausland Toggle */}
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isInland"
                  checked={formData.isInland}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Inland (Deutschland)
                </span>
                <GlobeEuropeAfricaIcon className="h-4 w-4 ml-1 text-gray-400" />
              </label>
            </div>

            {/* Ort */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Ort *
              </label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg shadow-sm placeholder-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.location ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="z.B. Berlin, München, Remote"
                />
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {errors.location}
                </p>
              )}
            </div>

            {/* Straße */}
            <div className="md:col-span-2">
              <label
                htmlFor="street"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Straße &amp; Hausnummer
              </label>
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="z.B. Musterstraße 42"
              />
            </div>

            {/* PLZ */}
            <div>
              <label
                htmlFor="zip"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Postleitzahl (PLZ)
              </label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={formData.zip}
                onChange={handleInputChange}
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="z.B. 07743"
              />
            </div>
            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Land
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                disabled={formData.isInland}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              >
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Bundesland / Kanton */}
            {availableStates.length > 0 && (
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {formData.country === "Schweiz" ? "Kanton" : "Bundesland"}
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">
                    {formData.country === "Schweiz" ? "Kanton wählen…" : "Bundesland wählen…"}
                  </option>
                  {availableStates.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-green-500" />
            Job Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Type */}
            <div>
              <label
                htmlFor="jobType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Arbeitstyp
              </label>
              <select
                id="jobType"
                name="jobType"
                value={formData.jobType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              >
                {jobTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Salary */}
            <div>
              <label
                htmlFor="salary"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Gehalt
              </label>
              <div className="relative">
                <CurrencyEuroIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="z.B. 60.000 - 80.000 €"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Priorität
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
              {getCurrentPriority() && (
                <div className="mt-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      getCurrentPriority()?.color
                    }`}
                  >
                    {getCurrentPriority()?.label}
                  </span>
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              {getCurrentStatus() && (
                <div className="mt-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      getCurrentStatus()?.color
                    }`}
                  >
                    {getCurrentStatus()?.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* URLs */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <LinkIcon className="h-5 w-5 mr-2 text-purple-500" />
            Links & URLs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job URL */}
            <div>
              <label
                htmlFor="jobUrl"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Job-Ausschreibung URL
              </label>
              <input
                type="url"
                id="jobUrl"
                name="jobUrl"
                value={formData.jobUrl}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.jobUrl ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="https://example.com/jobs/123"
              />
              {errors.jobUrl && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {errors.jobUrl}
                </p>
              )}
            </div>

            {/* Company URL */}
            <div>
              <label
                htmlFor="companyUrl"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Firmen-Website URL
              </label>
              <input
                type="url"
                id="companyUrl"
                name="companyUrl"
                value={formData.companyUrl}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.companyUrl ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="https://company.com"
              />
              {errors.companyUrl && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {errors.companyUrl}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Beschreibung & Anforderungen */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Zusätzliche Informationen
          </h2>

          <div className="space-y-6">
            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Stellenbeschreibung
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Beschreibung der Position und des Unternehmens..."
              />
            </div>

            {/* Requirements */}
            <div>
              <label
                htmlFor="requirements"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Anforderungen
              </label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Erforderliche Qualifikationen und Fähigkeiten..."
              />
            </div>

            {/* Cover Letter */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                Bewerbungsanschreiben
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Wählen Sie einen IT-Bereich, um eine passende Vorlage einzufügen – oder schreiben Sie direkt Ihr individuelles Anschreiben.
              </p>

              {/* IT-Bereich Selector */}
              <div className="mb-4">
                <label
                  htmlFor="itBereich"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  IT-Bereich (Vorlage auswählen)
                </label>
                <select
                  id="itBereich"
                  name="itBereich"
                  value={formData.itBereich}
                  onChange={handleBereichChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {itBereiche.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
                {formData.itBereich && (
                  <p className="mt-1 text-xs text-blue-600">
                    ✓ Vorlage eingefügt – bitte [POSITION] und [UNTERNEHMEN] durch echte Werte ersetzen.
                  </p>
                )}
              </div>

              {/* Cover Letter Textarea */}
              <div>
                <label
                  htmlFor="coverLetter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Anschreiben-Text
                </label>
                <textarea
                  id="coverLetter"
                  name="coverLetter"
                  value={formData.coverLetter}
                  onChange={handleInputChange}
                  rows={14}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm leading-relaxed"
                  placeholder="Sehr geehrte Damen und Herren,&#10;&#10;mit großem Interesse habe ich Ihre Stellenausschreibung gelesen..."
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-400">
                    {formData.coverLetter.length} Zeichen
                  </p>
                  {formData.coverLetter.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, coverLetter: "", itBereich: "" }))}
                      className="text-xs text-red-500 hover:text-red-700 underline"
                    >
                      Anschreiben leeren
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => window.history.back()}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !userId}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Wird gespeichert...
              </>
            ) : (
              "Bewerbung erstellen"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
