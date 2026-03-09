"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  DocumentTextIcon,
  SparklesIcon,
  PrinterIcon,
  BookmarkIcon,
  FolderOpenIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";

// ─── DIN 5008 Letter Data Model ───────────────────────────────────────────────

interface SenderBlock {
  name: string;
  street: string;
  city: string;
  zip: string;
  phone: string;
  email: string;
  web?: string;
}

interface RecipientBlock {
  company?: string;
  department?: string;
  attention?: string;
  street: string;
  city: string;
  zip: string;
  country?: string;
}

interface LetterData {
  id?: string;
  title: string;
  style: "A" | "B"; // DIN 5008 Style A (Betreff links) oder B (Betreff zentriert)
  sender: SenderBlock;
  recipient: RecipientBlock;
  place: string;
  date: string;
  reference?: string; // Geschäftszeichen / Kennzeichen
  subject: string;
  salutation: string;
  bodyParagraphs: string[];
  closing: string;
  signatureNote?: string;
  attachments: string[];
  templateName?: string;
}

const DEFAULT_LETTER: LetterData = {
  title: "Neues Anschreiben",
  style: "A",
  sender: {
    name: "",
    street: "",
    city: "",
    zip: "",
    phone: "",
    email: "",
    web: "",
  },
  recipient: {
    company: "",
    department: "",
    attention: "",
    street: "",
    city: "",
    zip: "",
    country: "",
  },
  place: "",
  date: new Date().toLocaleDateString("de-DE"),
  reference: "",
  subject: "",
  salutation: "Sehr geehrte Damen und Herren,",
  bodyParagraphs: [""],
  closing: "Mit freundlichen Grüßen",
  signatureNote: "",
  attachments: [],
};

// ─── DIN-Compliance Checker ───────────────────────────────────────────────────

type ComplianceIssue = { level: "error" | "warn"; message: string };

function checkDINCompliance(letter: LetterData): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  if (!letter.sender.name) issues.push({ level: "error", message: "Absendername fehlt (DIN 5008 §3.1)." });
  if (!letter.sender.street) issues.push({ level: "error", message: "Straße des Absenders fehlt." });
  if (!letter.sender.zip || !/^\d{5}$/.test(letter.sender.zip))
    issues.push({ level: "warn", message: "PLZ des Absenders ungültig oder fehlt (5-stellig)." });
  if (!letter.sender.email.includes("@"))
    issues.push({ level: "warn", message: "E-Mail-Adresse des Absenders fehlt oder ungültig." });

  if (!letter.recipient.street) issues.push({ level: "error", message: "Straße des Empfängers fehlt (DIN 5008 §4.2)." });
  if (!letter.recipient.zip || !/^\d{5,}/.test(letter.recipient.zip))
    issues.push({ level: "warn", message: "PLZ des Empfängers fehlt oder ungültig." });
  if (!letter.recipient.city) issues.push({ level: "error", message: "Ort des Empfängers fehlt." });

  if (!letter.date) issues.push({ level: "error", message: "Datum fehlt (DIN 5008 §5)." });
  if (!letter.subject) issues.push({ level: "error", message: "Betreff fehlt (DIN 5008 §6)." });
  if (letter.subject.length > 120) issues.push({ level: "warn", message: "Betreff ist zu lang (max. empfohlen: 2 Zeilen ≈ 120 Zeichen)." });

  if (!letter.salutation) issues.push({ level: "error", message: "Anrede fehlt." });
  const bodyText = letter.bodyParagraphs.join("").trim();
  if (!bodyText) issues.push({ level: "error", message: "Brieftext fehlt." });
  if (bodyText.length > 3000) issues.push({ level: "warn", message: "Brieftext sehr lang – empfohlen max. 1 Seite." });

  if (!letter.closing) issues.push({ level: "warn", message: "Grußformel fehlt." });
  if (!letter.sender.name) issues.push({ level: "warn", message: "Unterschrift (Name) fehlt." });

  return issues;
}

// ─── IT-Muster-Vorlagen ────────────────────────────────────────────────────────

const IT_TEMPLATES: { name: string; subject: string; paragraphs: string[] }[] = [
  {
    name: "Senior Software Engineer",
    subject: "Bewerbung als Senior Software Engineer – Ref. [Stellenref.]",
    paragraphs: [
      "mit großem Interesse habe ich Ihre Stellenausschreibung als Senior Software Engineer auf [Portal] gelesen und bewerbe mich hiermit ausdrücklich für diese Position.",
      "Als erfahrener Software-Ingenieur mit [X] Jahren Berufserfahrung bringe ich fundierte Kenntnisse in [Technologien, z. B. TypeScript, React, Node.js, PostgreSQL] mit. In meiner bisherigen Tätigkeit bei [aktueller Arbeitgeber] habe ich [Schlüsselprojekt] erfolgreich umgesetzt und dabei [messbares Ergebnis] erreicht.",
      "Was mich an Ihrem Unternehmen besonders überzeugt, ist [spezifischer Aspekt des Unternehmens/Produkts]. Ich bin überzeugt, mit meinen Fähigkeiten und meiner Motivation einen wertvollen Beitrag zu Ihrem Team leisten zu können.",
      "Ich freue mich auf ein persönliches Gespräch, in dem wir die Details besprechen können. Meine Verfügbarkeit sowie meine Gehaltsvorstellung teile ich Ihnen gerne auf Anfrage mit.",
    ],
  },
  {
    name: "DevOps / Cloud Engineer",
    subject: "Bewerbung als DevOps / Cloud Engineer – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre ausgeschriebene Stelle als DevOps / Cloud Engineer, die ich auf [Portal] entdeckt habe.",
      "Ich verfüge über umfangreiche Erfahrung im Aufbau und Betrieb cloud-nativer Infrastrukturen (AWS / Azure / GCP) sowie in der Automatisierung von CI/CD-Pipelines mit Kubernetes, Terraform und GitLab CI. Mein Fokus liegt auf Skalierbarkeit, Sicherheit und Observability — Aspekte, die ich in meiner aktuellen Rolle täglich verantworte.",
      "Durch meine zertifizierten Kenntnisse ([Zertifizierungen, z. B. CKA, AWS SAA]) und meine Erfahrung in agilen Teams bin ich in der Lage, Infrastrukturprojekte sowohl technisch als auch organisatorisch zu begleiten.",
      "Ich würde mich freuen, Ihnen meine Kenntnisse in einem ersten Gespräch zu demonstrieren, und stehe kurzfristig zur Verfügung.",
    ],
  },
  {
    name: "IT-Sicherheitsanalyst",
    subject: "Bewerbung als IT-Sicherheitsanalyst – Ref. [Stellenref.]",
    paragraphs: [
      "mit Begeisterung habe ich Ihre Ausschreibung für die Position als IT-Sicherheitsanalyst zur Kenntnis genommen und bewerbe mich hiermit.",
      "Meine Kernkompetenz liegt in der Analyse und Abwehr von Cyberbedrohungen. Ich bringe Erfahrung in Penetrationstests, SIEM-Systemen (z. B. Splunk, Elastic), Incident Response sowie dem Aufbau von Zero-Trust-Architekturen mit. Ergänzend verfüge ich über Kenntnisse aktueller Sicherheitsstandards (ISO 27001, SOC 2, BSI IT-Grundschutz).",
      "In meiner bisherigen Tätigkeit habe ich [konkretes Sicherheitsprojekt] geleitet und dabei [messbares Ergebnis] erzielt. Die Kombination aus technischem Tiefgang und analytischem Denken zeichnet mich aus.",
      "Ich freue mich darauf, Ihnen in einem persönlichen Gespräch mehr über meine Erfahrungen zu berichten.",
    ],
  },
  {
    name: "Data Scientist / ML Engineer",
    subject: "Bewerbung als Data Scientist / ML Engineer – Ref. [Stellenref.]",
    paragraphs: [
      "mit großem Interesse habe ich Ihre Stellenanzeige als Data Scientist / Machine Learning Engineer gelesen und bewerbe mich hiermit.",
      "Ich besitze fundierte Kenntnisse in Python, scikit-learn, PyTorch sowie im gesamten MLOps-Lifecycle (Datenaufbereitung, Modelltraining, Deployment, Monitoring). Meine praktische Erfahrung umfasst [Projektbeispiel] mit einer erreichten Modellgenauigkeit von [Metrik].",
      "Besonders das Thema [KI-Schwerpunkt des Unternehmens] begeistert mich, da ich in diesem Bereich bereits eigenständig forsche und publiziere.",
      "Ich stehe Ihnen gerne für ein Gespräch zur Verfügung und freue mich auf Ihre Rückmeldung.",
    ],
  },
  {
    name: "Frontend-Entwickler (React / Vue)",
    subject: "Bewerbung als Frontend-Entwickler – Ref. [Stellenref.]",
    paragraphs: [
      "mit Begeisterung habe ich Ihre Stellenanzeige als Frontend-Entwickler auf [Portal] entdeckt und bewerbe mich hiermit.",
      "Ich bringe [X] Jahre Erfahrung in der Entwicklung moderner, performanter Web-UIs mit React, TypeScript und Tailwind CSS mit. Barrierefreiheit (WCAG 2.1), responsives Design und gute Core Web Vitals-Werte sind für mich selbstverständliche Qualitätsmerkmale.",
      "In meinem letzten Projekt habe ich [Projektname] von Grund auf neu gestaltet und dabei die Ladezeit um [X %] reduziert sowie die Accessibility-Bewertung auf [Score] gesteigert. Die Zusammenarbeit mit UX-Designern und Backend-Teams ist mir ebenso vertraut.",
      "Ich freue mich darauf, mein Können in Ihrem Team einzubringen, und stehe Ihnen für ein erstes Gespräch gerne zur Verfügung.",
    ],
  },
  {
    name: "Backend-Entwickler (Java / Spring)",
    subject: "Bewerbung als Backend-Entwickler (Java / Spring Boot) – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre ausgeschriebene Position als Backend-Entwickler, die ich auf [Portal] gefunden habe.",
      "Mit [X] Jahren Erfahrung in der Entwicklung skalierbarer Backend-Systeme auf Basis von Java und Spring Boot verfüge ich über tiefgreifendes Know-how in den Bereichen REST-APIs, Microservices, Hibernate/JPA sowie Messaging-Systemen wie Apache Kafka. Datenbanken (PostgreSQL, MySQL, MongoDB) setze ich sicher ein.",
      "Bei [früherer Arbeitgeber] habe ich eine kritische Finanzverarbeitungs-Pipeline von Monolith auf Microservices migriert, was zu einer Reduktion der Verarbeitungszeit um [X %] und einer deutlich verbesserten Skalierbarkeit führte.",
      "Ich würde mich freuen, meine Kenntnisse in einem persönlichen Gespräch zu vertiefen, und bin zeitnah verfügbar.",
    ],
  },
  {
    name: "Fullstack-Entwickler (Node.js / React)",
    subject: "Bewerbung als Fullstack-Entwickler – Ref. [Stellenref.]",
    paragraphs: [
      "mit großem Interesse habe ich Ihre Stellenausschreibung als Fullstack-Entwickler gelesen und bewerbe mich hiermit.",
      "Ich entwickle seit [X] Jahren end-to-end Webanwendungen mit Node.js (Express/Fastify) im Backend und React/Next.js im Frontend. Mein Technologie-Stack umfasst darüber hinaus PostgreSQL, Prisma ORM, Docker, CI/CD-Pipelines sowie Cloud-Deployments auf AWS und Vercel.",
      "Besonders schätze ich die Möglichkeit, Produkte ganzheitlich zu gestalten – von der Datenbankstruktur bis zur Nutzeroberfläche. In meiner aktuellen Rolle verantworte ich [Projektbeschreibung] und koordiniere dabei eng mit Product Ownern und Designern.",
      "Ich freue mich auf ein Gespräch und stehe Ihnen für Rückfragen jederzeit zur Verfügung.",
    ],
  },
  {
    name: "IT-Projektmanager / Scrum Master",
    subject: "Bewerbung als IT-Projektmanager / Scrum Master – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf die von Ihnen ausgeschriebene Stelle als IT-Projektmanager / Scrum Master.",
      "Als zertifizierter Scrum Master (PSM I / CSM) und erfahrener IT-Projektmanager bringe ich [X] Jahre Erfahrung in der Steuerung agiler Softwareprojekte mit. Ich habe Teams von bis zu [X] Personen geleitet, Sprints moderiert und regelmäßig Stakeholder-Reports auf Geschäftsführungsebene präsentiert.",
      "Mein Ansatz verbindet methodische Strenge (Scrum, Kanban, SAFe) mit pragmatischer Flexibilität, um Projekte termingerecht und im Budget zum Abschluss zu bringen. In meiner letzten Position konnte ich die Velocity meines Teams um [X %] steigern und den Release-Zyklus von quartalsweise auf zweiwöchentlich verkürzen.",
      "Ich freue mich darauf, meinen Beitrag zu Ihrem Unternehmen in einem persönlichen Gespräch zu erläutern.",
    ],
  },
  {
    name: "IT-Systemadministrator (Linux/Windows)",
    subject: "Bewerbung als IT-Systemadministrator – Ref. [Stellenref.]",
    paragraphs: [
      "mit Interesse habe ich Ihre Stellenanzeige als IT-Systemadministrator auf [Portal] entdeckt und bewerbe mich hiermit.",
      "Ich verfüge über fundierte Kenntnisse in der Administration von Linux- (Debian/Ubuntu/RHEL) und Windows-Server-Umgebungen, Active Directory, DNS/DHCP, Virtualisierung (VMware/Proxmox) sowie dem Betrieb von Monitoring-Systemen (Zabbix, Grafana, Prometheus). Skripte in Bash und PowerShell setze ich routinemäßig zur Automatisierung von Prozessen ein.",
      "In meiner bisherigen Tätigkeit bei [Arbeitgeber] habe ich die komplette On-Premise-Infrastruktur für [X] Standorte und [X] Mitarbeitende verantwortet, die Systemverfügbarkeit auf [X %] gesteigert und den Patching-Prozess vollständig automatisiert.",
      "Ich freue mich auf ein persönliches Kennenlernen und auf die Möglichkeit, Ihre IT-Infrastruktur zuverlässig zu betreuen.",
    ],
  },
  {
    name: "Datenbank-Administrator / DBA",
    subject: "Bewerbung als Datenbankadministrator (DBA) – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf die ausgeschriebene Stelle als Datenbankadministrator in Ihrem Unternehmen.",
      "Ich bringe [X] Jahre Erfahrung in der Administration und Optimierung relationaler und dokumentenbasierter Datenbanken mit (PostgreSQL, MySQL, Oracle, MongoDB). Backup-Strategien, Hochverfügbarkeit (Replikation, Failover-Cluster), Performance-Tuning und die Absicherung sensibler Daten zählen zu meinen Kernkompetenzen.",
      "Bei [früherer Firma] habe ich eine Legacy-Oracle-Datenbank nach PostgreSQL migriert, dabei die Antwortzeiten kritischer Queries um [X %] reduziert und die Betriebskosten signifikant gesenkt.",
      "Für ein detailliertes Gespräch stehe ich gerne zur Verfügung und freue mich auf Ihre Einladung.",
    ],
  },
  {
    name: "Mobile Developer (iOS / Android)",
    subject: "Bewerbung als Mobile Developer (iOS / Android) – Ref. [Stellenref.]",
    paragraphs: [
      "mit großem Interesse bewerbe ich mich auf Ihre aus­geschriebene Stelle als Mobile Developer.",
      "Ich entwickle seit [X] Jahren native und cross-platform Mobile-Apps für iOS (Swift/SwiftUI) und Android (Kotlin/Jetpack Compose) sowie plattformübergreifend mit Flutter und React Native. App-Store-Veröffentlichungen, CI/CD mit Fastlane sowie In-App-Purchases und Push-Notifications sind mir vertraut.",
      "Meine bislang veröffentlichten Apps haben zusammen über [X] Downloads erzielt und werden mit einer durchschnittlichen Bewertung von [X] Sternen bewertet. Ich lege großen Wert auf saubere Architektur (MVVM, Clean Architecture) und umfangreiche UI-Tests.",
      "Ich freue mich auf die Möglichkeit, Ihre Mobile-Produkte weiterzuentwickeln, und stehe für ein Gespräch bereit.",
    ],
  },
  {
    name: "IT-Berater / Technischer Consultant",
    subject: "Bewerbung als IT-Consultant / Technischer Berater – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre Stellenanzeige als IT-Consultant, die ich auf [Portal] gefunden habe.",
      "Als erfahrener IT-Berater verbinde ich technische Tiefe mit strategischem Denken. Ich habe Kunden aus den Branchen [z. B. Finanzdienstleistung, Gesundheitswesen, Handel] bei der Digitalisierung ihrer Prozesse begleitet – von der Anforderungsaufnahme über die Systemauswahl bis hin zur Implementierung und Hypercare.",
      "Mein Beratungsschwerpunkt liegt auf [z. B. ERP-Einführung, Cloud-Migration, Prozessautomatisierung]. Dabei agiere ich souverän auf Entscheidungsebene und bringe gleichzeitig die nötige technische Detailkenntnis mit, um Lösungen praxistauglich zu gestalten.",
      "Eine Reisetätigkeit von ca. [X %] ist für mich selbstverständlich. Ich freue mich auf ein erstes Gespräch.",
    ],
  },
  {
    name: "Netzwerkingenieur / Network Engineer",
    subject: "Bewerbung als Netzwerkingenieur – Ref. [Stellenref.]",
    paragraphs: [
      "mit Interesse habe ich Ihre Stellenanzeige als Netzwerkingenieur gelesen und bewerbe mich hiermit ausdrücklich.",
      "Ich verfüge über [X] Jahre Erfahrung im Design, Aufbau und Betrieb komplexer Netzwerkinfrastrukturen (LAN/WAN/WLAN, SD-WAN, VPN). Herstellerkenntnisse umfassen Cisco (CCNP), Juniper und Fortinet. Zudem bin ich vertraut mit Netzwerkautomatisierung (Ansible, Python-Netmiko, Napalm) und modernen Zero-Trust-Netzwerkkonzepten.",
      "In meiner aktuellen Position habe ich [konkrete Aufgabe, z. B. SD-WAN-Migration für 30 Standorte] eigenverantwortlich geplant und umgesetzt, was zu einer Kostensenkung von [X %] und einer Steigerung der Verfügbarkeit auf [X %] führte.",
      "Ich freue mich auf ein persönliches Gespräch und stehe kurzfristig zur Verfügung.",
    ],
  },
  {
    name: "SAP-Berater / SAP Developer",
    subject: "Bewerbung als SAP-Berater / SAP Developer – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf die ausgeschriebene Stelle als SAP-Berater in Ihrem Unternehmen.",
      "Ich verfüge über [X] Jahre Projekterfahrung in SAP-Umgebungen, schwerpunktmäßig in den Modulen [z. B. SAP MM, SAP SD, SAP FI/CO, SAP S/4HANA]. Entwicklungsseitig setze ich ABAP, Fiori/UI5 sowie BAPIs und RFCs sicher ein. SAP-Implementierungsprojekte nach ASAP- und Activate-Methodik habe ich mehrfach mitverantwortet.",
      "Mein letztes Großprojekt umfasste die S/4HANA-Migration bei [Kundenname/Branche] mit [X] Usern und einem Datenvolumen von [X TB]. Als technischer Lead habe ich das Cutover-Planning und die Hyper-Care-Phase geleitet.",
      "Ich freue mich auf ein erstes Gespräch und stehe gerne für weitere Details zur Verfügung.",
    ],
  },
  {
    name: "Initiativbewerbung IT (allgemein)",
    subject: "Initiativbewerbung – IT-Fachkraft mit Schwerpunkt [Technologie]",
    paragraphs: [
      "ich bewerbe mich bei Ihnen initiativ, da Ihr Unternehmen in [Branche/Produkt/Technologie] führend ist und ich meinen nächsten Karriereschritt in einem innovativen Umfeld gehen möchte.",
      "Als [Berufsbezeichnung] mit [X] Jahren Erfahrung bringe ich ein breites Spektrum an Kenntnissen mit: [Technologie 1, Technologie 2, Technologie 3]. Ich bin es gewöhnt, eigenverantwortlich zu arbeiten, Lösungen pragmatisch umzusetzen und gleichzeitig das große Bild im Blick zu behalten.",
      "Ich bin offen für verschiedene Einsatzbereiche und Teamgrößen und passe mich schnell an neue Technologien und Prozesse an. Mein aktuelles Gehaltsband liegt bei [X €] brutto jährlich; meine Kündigungsfrist beträgt [X Monate].",
      "Ich würde mich freuen, in einem unverbindlichen Gespräch auszuloten, wie ich zu Ihren Zielen beitragen kann.",
    ],
  },
  {
    name: "QA / Test Engineer",
    subject: "Bewerbung als QA / Test Engineer – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre ausgeschriebene Stelle als Quality Assurance Engineer, die ich auf [Portal] entdeckt habe.",
      "Ich bringe [X] Jahre Erfahrung in der manuellen und automatisierten Qualitätssicherung mit. Mein Werkzeugkasten umfasst Selenium, Cypress, Playwright sowie REST-API-Tests mit Postman. In CI/CD-Pipelines (GitHub Actions, Jenkins) integriere ich Tests nahtlos und stelle sicher, dass Releases qualitätsgesichert ausgeliefert werden.",
      "In meiner aktuellen Rolle habe ich die Testabdeckung von [X %] auf [X %] gesteigert, die Fehlerrate im Produktionsbetrieb um [X %] gesenkt und ein unternehmensweites Test-Framework von Grund auf aufgebaut.",
      "Ich freue mich auf ein Gespräch und stehe gerne für weitere Details zur Verfügung.",
    ],
  },
  {
    name: "Embedded / IoT Engineer",
    subject: "Bewerbung als Embedded Software Engineer – Ref. [Stellenref.]",
    paragraphs: [
      "mit großem Interesse bewerbe ich mich auf Ihre Stelle als Embedded Software Engineer.",
      "Ich entwickle seit [X] Jahren Firmware und Embedded-Software in C und C++ für mikrokontrollerbasierte Systeme (ARM Cortex-M, ESP32, STM32). Meine Erfahrungen umfassen RTOS-Umgebungen (FreeRTOS, Zephyr), Kommunikationsprotokolle (SPI, I²C, CAN, MQTT) sowie Hardware-Debugging mit JTAG/SWD.",
      "Im Projekt [Projektname] habe ich eine energieoptimierte IoT-Firmware entwickelt, die den Stromverbrauch um [X %] reduzierte und eine Over-the-Air-Update-Funktion implementierte – bei gleichbleibend hoher Zuverlässigkeit im 24/7-Betrieb.",
      "Ich würde mich freuen, meine Expertise in Ihrem Team einzubringen, und stehe kurzfristig für ein erstes Gespräch zur Verfügung.",
    ],
  },
  {
    name: "Solution Architect",
    subject: "Bewerbung als Solution Architect – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf die von Ihnen ausgeschriebene Position als Solution Architect.",
      "Mit [X] Jahren Erfahrung im Design komplexer IT-Architekturen – On-Premise und cloud-nativ (AWS, Azure, GCP) – bin ich es gewohnt, Geschäftsanforderungen in technisch tragfähige, skalierbare Lösungskonzepte zu überführen. Meine Stärken liegen in der Systemmodellierung (C4, ArchiMate, UML), Technologiebewertung und der Steuerung von Teams bei der Umsetzung.",
      "Zuletzt habe ich für [Kundenbranche] eine hybride Cloud-Architektur konzipiert, die [X] Fachanwendungen konsolidiert und die Betriebskosten um [X %] gesenkt hat. Dabei war ich zentraler Ansprechpartner für CTO, Fachabteilungen und externe Dienstleister.",
      "Ich freue mich darauf, in einem persönlichen Gespräch mehr über Ihre architekturelle Zielvorstellung zu erfahren.",
    ],
  },
  {
    name: "Platform Engineer / SRE",
    subject: "Bewerbung als Platform Engineer / Site Reliability Engineer – Ref. [Stellenref.]",
    paragraphs: [
      "mit Begeisterung habe ich Ihre Stellenanzeige als Platform Engineer / SRE gelesen und bewerbe ich mich hiermit.",
      "Ich verbinde Entwicklungs- und Betriebskompetenz: Ich baue interne Entwicklerplattformen (IDP), automatisiere Infrastruktur mit Terraform und Pulumi, betreibe Kubernetes-Cluster und implementiere Observability-Stacks mit Prometheus, Grafana und OpenTelemetry. Mein SRE-Mindset orientiert sich an SLOs, Error Budgets und Blameless Post-Mortems.",
      "In meiner aktuellen Rolle habe ich die Deployment-Frequenz von wöchentlich auf mehrfach täglich gesteigert und die MTTR (Mean Time to Recovery) bei P1-Incidents um [X %] reduziert.",
      "Ich freue mich auf ein Gespräch und bin zeitnah verfügbar.",
    ],
  },
  {
    name: "Tech Lead / Engineering Manager",
    subject: "Bewerbung als Tech Lead / Engineering Manager – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre Stelle als Tech Lead / Engineering Manager.",
      "Ich leite seit [X] Jahren interdisziplinäre Entwicklungsteams und kombiniere starke technische Kompetenz mit Führungsstärke. Ich coache Entwickler, führe Code-Reviews durch, setze Architekturentscheidungen um und kommuniziere den technischen Fortschritt transparent auf Management-Ebene.",
      "Unter meiner Leitung hat mein Team zuletzt [Produkt/Feature] in [Zeitraum] erfolgreich shipped, die Code-Qualität gemessen am SonarQube Quality Gate auf [X %] gesteigert und die Onboarding-Zeit neuer Kolleginnen und Kollegen halbiert.",
      "Ich freue mich sehr darauf, Ihr Engineering-Team zu verstärken, und stehe für ein erstes Gespräch gerne bereit.",
    ],
  },
  {
    name: "Product Manager (IT / SaaS)",
    subject: "Bewerbung als Product Manager (IT / SaaS) – Ref. [Stellenref.]",
    paragraphs: [
      "mit großem Interesse bewerbe ich mich auf Ihre ausgeschriebene Stelle als Product Manager.",
      "Ich verfüge über [X] Jahre Erfahrung im Product Management von B2B-SaaS-Produkten: Discovery, Roadmap-Priorisierung (RICE, MoSCoW), OKR-Planung, Stakeholder-Management sowie enge Zusammenarbeit mit Entwicklung, Design und Vertrieb. Datenbasierte Entscheidungen mit Amplitude oder Mixpanel sind für mich selbstverständlich.",
      "In meiner letzten Position habe ich als Lead PM [Feature/Produkt] von der Idee bis zum Launch begleitet, dabei [X neue Kunden] gewonnen und den Net Promoter Score um [X Punkte] gesteigert.",
      "Ich freue mich auf ein Gespräch, in dem wir Ihre Produktvision und meinen möglichen Beitrag erörtern.",
    ],
  },
  {
    name: "UX/UI Designer & Developer",
    subject: "Bewerbung als UX/UI Designer & Developer – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre Stelle als UX/UI Designer & Developer.",
      "Ich verbinde Designkompetenz (Figma, Adobe XD) mit der Fähigkeit, Interfaces direkt in React/TypeScript-Code umzusetzen. Nutzerzentrierung ist mein Leitprinzip: Ich führe User Research, Heuristic Evaluations und A/B-Tests durch und übersetze Erkenntnisse in iterativ verbesserte Prototypen.",
      "In einem meiner letzten Projekte habe ich den Onboarding-Flow eines SaaS-Produkts neu gestaltet – die Conversion Rate stieg dabei um [X %] und Support-Anfragen in den ersten 30 Tagen sanken um [X %].",
      "Ich freue mich darauf, Ihr Produkt nutzerfreundlicher zu machen, und stehe für ein Gespräch gerne zur Verfügung.",
    ],
  },
  {
    name: "IT-Support / Helpdesk",
    subject: "Bewerbung als IT-Support-Mitarbeiter (1st/2nd Level) – Ref. [Stellenref.]",
    paragraphs: [
      "mit Interesse habe ich Ihre Stellenanzeige als IT-Support-Mitarbeiter gelesen und bewerbe mich hiermit.",
      "Ich bringe [X] Jahre Erfahrung im IT-Support mit und bin mit der Bearbeitung von Tickets über ITSM-Systeme (ServiceNow, Jira Service Management) vertraut. Ich suppporte Windows- und macOS-Arbeitsplätze, betreue Active Directory, M365 und VPN-Clients und dokumentiere Lösungen strukturiert in der Wissensdatenbank.",
      "Meine Stärke liegt in einer ruhigen, lösungsorientierten Kommunikation mit Anwenderinnen und Anwendern aller technischen Erfahrungsstufen. In meiner bisherigen Rolle konnte ich die Ticket-Lösungszeit auf [X Std.] reduzieren und eine Erstlösungsquote von [X %] erzielen.",
      "Ich freue mich auf ein persönliches Gespräch und bin kurzfristig verfügbar.",
    ],
  },
  {
    name: "Berufseinsteiger / Junior Developer",
    subject: "Bewerbung als Junior Developer – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre ausgeschriebene Stelle als Junior Developer – mein erster Schritt nach meinem erfolgreichen Abschluss als [Studiengang/Ausbildung] an der [Hochschule/Schule].",
      "Während meines Studiums habe ich fundierte Kenntnisse in [Sprachen/Frameworks] erworben und mehrere eigene Projekte realisiert, darunter [Projektname]. Praktische Erfahrung sammelte ich im Rahmen meines Praktikums bei [Unternehmen].",
      "Ich lerne schnell, arbeite strukturiert und freue mich auf ein Umfeld, in dem ich von erfahrenen Kolleginnen und Kollegen lernen und gleichzeitig eigene Ideen einbringen kann.",
      "Ich freue mich sehr auf ein erstes Gespräch und darauf, Ihnen mehr über meine Motivation zu erzählen.",
    ],
  },
  {
    name: "Quereinsteiger in die IT",
    subject: "Bewerbung als IT-Fachkraft (Quereinsteiger) – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre Stelle als [Position] – als motivierter Quereinsteiger aus dem Bereich [bisheriger Beruf].",
      "In den vergangenen [X] Monaten habe ich mich intensiv in [Technologie/Programmiersprache] weitergebildet, mehrere Online-Kurse abgeschlossen und eigenständig [Projektname] entwickelt. Mein fachlicher Hintergrund in [bisheriger Bereich] ist ein echtes Alleinstellungsmerkmal: Ich verstehe Domänenlogik und kommuniziere sicher mit Fachabteilungen.",
      "Ich bin hochmotiviert und gewohnt, mich schnell in neue Themen einzuarbeiten. Was mir noch an Berufserfahrung fehlt, gleiche ich durch Lernbereitschaft und Eigeninitiative mehr als aus.",
      "Ich würde mich sehr freuen, Sie von meinem Potenzial in einem persönlichen Gespräch überzeugen zu dürfen.",
    ],
  },
  {
    name: "IT-Trainer / Dozent",
    subject: "Bewerbung als IT-Trainer / Dozent – Ref. [Stellenref.]",
    paragraphs: [
      "mit großem Interesse bewerbe ich mich auf Ihre Stellenanzeige als IT-Trainer / Dozent.",
      "Ich verfüge über [X] Jahre Erfahrung in der Konzeption und Durchführung von IT-Schulungen für Zielgruppen von Berufseinsteigern bis zu erfahrenen Fachkräften. Meine Themenschwerpunkte sind [z. B. Programmierung, Netzwerk, M365, Security]. Ich setze didaktische Methoden wie Blended Learning, Hands-on-Labs und Gamification ein.",
      "Meine Kursbewertungen lagen zuletzt durchschnittlich bei [X/5] Punkten, und [X %] meiner Teilnehmenden haben Prüfungen oder Zertifizierungen bestanden.",
      "Ich freue mich auf ein Gespräch und darauf, Ihr Schulungsangebot inhaltlich weiterzuentwickeln.",
    ],
  },
  {
    name: "IT-Compliance / Datenschutzbeauftragter",
    subject: "Bewerbung als IT-Compliance Manager / DSB – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre ausgeschriebene Stelle als IT-Compliance Manager / Datenschutzbeauftragter.",
      "Als zertifizierter Datenschutzbeauftragter (TÜV / GDD) mit [X] Jahren Erfahrung berate ich Unternehmen bei der DSGVO-konformen Gestaltung ihrer Prozesse und IT-Systeme. Meine Arbeit umfasst Verarbeitungsverzeichnisse, Datenschutz-Folgenabschätzungen (DSFA), Kommunikation mit Aufsichtsbehörden sowie die Schulung von Mitarbeitenden.",
      "In meiner bisherigen Tätigkeit habe ich [X] Unternehmen aus [Branchen] datenschutzrechtlich betreut, [X] ISO-27001-Audits begleitet und interne Kontrollsysteme für kritische IT-Prozesse implementiert.",
      "Ich freue mich auf ein Gespräch und biete gerne tiefere Einblicke in meine bisherigen Projekte.",
    ],
  },
  {
    name: "Scrum Master / Agile Coach",
    subject: "Bewerbung als Scrum Master / Agile Coach – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre Stelle als Scrum Master / Agile Coach.",
      "Als zertifizierter Scrum Master (PSM II / CSM) begleite ich Teams und Organisationen bei ihrer agilen Transformation. Ich moderiere alle Scrum-Events, coache Product Owner, entferne Impediments konsequent und fördere eine Kultur der kontinuierlichen Verbesserung. Ich habe Erfahrung mit SAFe, LeSS und Kanban.",
      "In meiner bisherigen Rolle habe ich [X] Teams in Scrum eingeführt, die Teamzufriedenheit auf [X %] gesteigert und die Liefertreue von [X %] auf [X %] verbessert.",
      "Ich freue mich auf ein Gespräch und darauf, Ihr Team auf dem Weg zur agilen Hochleistungsorganisation zu begleiten.",
    ],
  },
  {
    name: "BI / Data Engineer",
    subject: "Bewerbung als BI / Data Engineer – Ref. [Stellenref.]",
    paragraphs: [
      "mit Interesse habe ich Ihre Stellenanzeige als BI / Data Engineer gelesen und bewerbe mich hiermit.",
      "Ich konzipiere und betreibe datengetriebene Architekturen: ETL/ELT-Pipelines (Apache Airflow, dbt, Spark), Data Warehouses (Snowflake, BigQuery, Redshift) sowie BI-Schichten mit Power BI und Looker. Mein Fokus liegt auf Datenkonsistenz, Performance und Self-Service-Fähigkeit der Fachbereiche.",
      "In meiner jetzigen Position habe ich eine Echtzeit-Datenpipeline auf Basis von Kafka und Spark Streaming aufgebaut, die täglich [X Mio.] Events verarbeitet und die Berichtserstellungszeit von mehreren Stunden auf unter 5 Minuten reduziert hat.",
      "Ich freue mich auf ein Gespräch und darauf, Ihre Datenstrategie aktiv mitzugestalten.",
    ],
  },
  {
    name: "Blockchain / Web3 Developer",
    subject: "Bewerbung als Blockchain / Web3 Developer – Ref. [Stellenref.]",
    paragraphs: [
      "mit großem Interesse bewerbe ich mich auf Ihre Stelle als Blockchain / Web3 Developer.",
      "Ich entwickle seit [X] Jahren Smart Contracts in Solidity (Ethereum, Polygon) und habe dezentrale Anwendungen (dApps) mit ethers.js / wagmi und React umgesetzt. Zudem bringe ich Erfahrung in der Integration von IPFS und Chainlink Oracles mit. Sicherheitsaspekte – Reentrancy, Integer Overflow – stehen für mich an erster Stelle.",
      "Im Projekt [Projektname] habe ich [Protokoll/Produkt] entwickelt, das ein TVL von [X €] erreicht hat. Alle Contracts wurden von [Auditfirma] geprüft und als sicher eingestuft.",
      "Ich freue mich auf ein technisches Gespräch und darauf, an Ihrem Protokoll mitzuwirken.",
    ],
  },
  {
    name: "IT-Einkäufer / Vendor Manager",
    subject: "Bewerbung als IT-Einkäufer / Vendor Manager – Ref. [Stellenref.]",
    paragraphs: [
      "mit Interesse habe ich Ihre Stellenanzeige als IT-Einkäufer / Vendor Manager entdeckt und bewerbe mich hiermit.",
      "Ich verfüge über [X] Jahre Erfahrung im strategischen IT-Einkauf: Ausschreibungen (RFI/RFP), Lieferantenauswahl, Vertragsverhandlungen und -controlling sowie Lieferantenentwicklung. Mein Einkaufsvolumen lag zuletzt bei [X Mio. €] jährlich für Hardware-, Software- und Dienstleistungsverträge.",
      "Durch mein technisches Verständnis und meine kaufmännische Ausbildung bringe ich den Vorteil mit, sowohl mit IT-Architekten als auch mit Finanz- und Rechtsabteilungen auf Augenhöhe zu verhandeln. Einsparungen von [X %] durch optimierte Rahmenverträge weise ich konkret nach.",
      "Ich freue mich auf ein erstes Gespräch und stehe Ihnen jederzeit gerne zur Verfügung.",
    ],
  },
  {
    name: "Game Developer (Unity / Unreal)",
    subject: "Bewerbung als Game Developer (Unity / Unreal Engine) – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre Stelle als Game Developer.",
      "Ich entwickle seit [X] Jahren Spiele in Unity (C#) und Unreal Engine (C++ / Blueprints), von 2D-Mobile-Games bis zu 3D-PC-Titeln. Gameplay-Programmierung, KI-Systeme, Multiplayer-Netcode sowie Performance-Optimierung sind meine technischen Schwerpunkte.",
      "Mein letztes Projekt [Spieltitel] wurde auf Steam veröffentlicht und hat [X] Bewertungen (davon [X %] positiv) erhalten. Die interdisziplinäre Zusammenarbeit mit Art, Sound und Game Design macht mir besondere Freude.",
      "Ich freue mich auf die Möglichkeit, meinen Beitrag zu Ihrem nächsten Titel zu leisten, und stehe für ein Gespräch gerne bereit.",
    ],
  },
  {
    name: "Pflichtpraktikum IT (Studium)",
    subject: "Bewerbung um ein Pflichtpraktikum im Bereich IT / Softwareentwicklung – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich für ein Pflichtpraktikum in Ihrem Unternehmen im Rahmen meines Studiums [Studiengang] an der [Hochschule].",
      "Ich studiere im [X.] Semester und habe bislang fundierte Kenntnisse in [Programmiersprachen/Technologien] erworben. In Universitätsprojekten konnte ich erste praktische Erfahrungen sammeln, unter anderem mit [Projekt/Technologie].",
      "Das Pflichtpraktikum soll ich im Zeitraum [Monat] bis [Monat] absolvieren. Ich bin motiviert, theoretisches Wissen in einem professionellen Umfeld anzuwenden und aktiv zum Tagesgeschäft Ihres Teams beizutragen.",
      "Ich freue mich sehr auf Ihre Rückmeldung und stehe für Rückfragen jederzeit zur Verfügung.",
    ],
  },
  {
    name: "Freiwilliges Praktikum IT (außerhalb Studium)",
    subject: "Bewerbung um ein Praktikum im Bereich IT – ab [Monat Jahr]",
    paragraphs: [
      "hiermit bewerbe ich mich für ein freiwilliges Praktikum in Ihrem IT-Bereich.",
      "Um meine Kenntnisse in [Technologie/Bereich] zu vertiefen und erste Berufserfahrung zu sammeln, suche ich ein praxisnahes Umfeld. Ich bringe Grundkenntnisse in [Sprachen/Tools] mit und bin bereit, mich schnell in neue Themen einzuarbeiten.",
      "Ich kann das Praktikum ab [Datum] antreten und bin für einen Zeitraum von [X] Wochen/Monaten verfügbar. Eigeninitiative, Teamfähigkeit und Lernbereitschaft zeichnen mich aus.",
      "Ich würde mich sehr freuen, Ihr Team kennenlernen zu dürfen, und stehe für ein kurzes Gespräch jederzeit bereit.",
    ],
  },
  {
    name: "Werkstudent IT / Softwareentwicklung",
    subject: "Bewerbung als Werkstudent (m/w/d) im Bereich IT / Softwareentwicklung",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre Stellenanzeige als Werkstudent im Bereich Softwareentwicklung.",
      "Ich studiere [Studiengang] im [X.] Semester an der [Hochschule] und suche eine Werkstudentenstelle, die mir neben dem Studium praktische Erfahrung in einem professionellen Umfeld ermöglicht. Ich bin mit [Technologien] vertraut und konnte diese in Projekten und Kursen bereits einsetzen.",
      "Ich bin während der Vorlesungszeit für [X] Stunden pro Woche und in der vorlesungsfreien Zeit auch in Vollzeit verfügbar. Ich bin flexibel, belastbar und arbeite strukturiert – auch dann, wenn Studium und Arbeit parallel laufen.",
      "Ich freue mich auf ein Gespräch und bin kurzfristig einsatzbereit.",
    ],
  },
  {
    name: "Bachelorarbeit (externe Abschlussarbeit)",
    subject: "Anfrage zur Betreuung meiner Bachelorarbeit im Bereich [Thema]",
    paragraphs: [
      "hiermit wende ich mich mit der Anfrage an Sie, meine Bachelorarbeit in Ihrem Unternehmen zu schreiben und zu betreuen.",
      "Ich studiere [Studiengang] im [X.] Semester an der [Hochschule] und plane, meine Abschlussarbeit im Bereich [Themenbereich] zu verfassen. Ihr Unternehmen ist für mich besonders interessant, da Sie sich in diesem Feld durch [Produkt/Forschungsbereich] hervorheben.",
      "Mein Betreuer an der Hochschule, [Name / wird noch abgeklärt], steht für die inhaltliche Abstimmung zur Verfügung. Der angestrebte Bearbeitungszeitraum ist [Monat] bis [Monat]. Ich bin hochmotiviert, einen praxisrelevanten Beitrag zu leisten.",
      "Ich würde mich sehr freuen, in einem ersten Gespräch mögliche Themen gemeinsam zu sondieren.",
    ],
  },
  {
    name: "Masterarbeit (externe Abschlussarbeit)",
    subject: "Anfrage zur Betreuung meiner Masterarbeit im Bereich [Thema]",
    paragraphs: [
      "hiermit bewerbe ich mich um die Möglichkeit, meine Masterarbeit in Ihrem Unternehmen zu schreiben.",
      "Nach meinem Bachelor in [Fach] absolviere ich derzeit den Masterstudiengang [Studiengang] an der [Hochschule]. Für meine Masterarbeit möchte ich das Thema [Themenbereich] bearbeiten – ein Gebiet, auf dem Ihr Unternehmen durch [Projekt/Produkt] sichtbar aktiv ist.",
      "Ich bringe vertiefte Kenntnisse in [Methoden/Technologien] mit und bin mit wissenschaftlichem Arbeiten vertraut. Ich plane den Bearbeitungszeitraum von [Monat] bis [Monat] und kann parallel als Werkstudent verfügbar sein.",
      "Ich freue mich auf eine Kontaktaufnahme und stehe für eine erste Abstimmung gerne bereit.",
    ],
  },
  {
    name: "Ausbildung Fachinformatiker Anwendungsentwicklung",
    subject: "Bewerbung um einen Ausbildungsplatz als Fachinformatiker für Anwendungsentwicklung",
    paragraphs: [
      "hiermit bewerbe ich mich auf einen Ausbildungsplatz als Fachinformatiker für Anwendungsentwicklung in Ihrem Unternehmen.",
      "Ich habe die [Schule/Schulform] mit dem [Abschluss] abgeschlossen und interessiere mich seit Jahren leidenschaftlich für Software und Programmierung. Erste Erfahrungen habe ich mit [Sprachen, z. B. Python, HTML/CSS] in eigenen Projekten gesammelt.",
      "Die dreijährige Ausbildung bietet mir die ideale Grundlage, professionelle Entwicklerfähigkeiten systematisch aufzubauen. Ihr Unternehmen ist für mich besonders attraktiv, weil [Grund, z. B. moderner Tech-Stack, agiles Arbeiten, spannende Produkte].",
      "Ich bin lernbereit, teamorientiert und freue mich darauf, als zuverlässiger Auszubildender zu starten. Über eine Einladung zum Gespräch würde ich mich sehr freuen.",
    ],
  },
  {
    name: "Ausbildung Fachinformatiker Systemintegration",
    subject: "Bewerbung um einen Ausbildungsplatz als Fachinformatiker für Systemintegration",
    paragraphs: [
      "hiermit bewerbe ich mich für einen Ausbildungsplatz als Fachinformatiker für Systemintegration in Ihrem Unternehmen.",
      "Mich fasziniert die technische Welt von Netzwerken, Servern und IT-Infrastruktur. Ich habe die [Schule] mit dem [Abschluss] abgeschlossen und in meiner Freizeit erste Erfahrungen mit [z. B. Linux, Heimnetzwerk, Raspberry Pi] gesammelt.",
      "Ein Unternehmen wie Ihres bietet mir die perfekte Umgebung, um fundiertes Wissen im Bereich Systemadministration, Netzwerktechnik und IT-Support aufzubauen.",
      "Ich bin zuverlässig, technisch affin und freue mich über eine Einladung zu einem persönlichen Gespräch.",
    ],
  },
  {
    name: "Duales Studium Informatik / Wirtschaftsinformatik",
    subject: "Bewerbung für ein duales Studium Informatik / Wirtschaftsinformatik ab [Monat Jahr]",
    paragraphs: [
      "hiermit bewerbe ich mich für einen dualen Studienplatz im Bereich Informatik / Wirtschaftsinformatik in Zusammenarbeit mit der [Dualen Hochschule/DHBW/HS].",
      "Nach meinem [Schulabschluss] an der [Schule] strebe ich eine Ausbildung an, die theoretisches Fachwissen mit praktischer Berufserfahrung von Beginn an verbindet. Das duale Studium ist für mich die ideale Wahl, um direkt am Unternehmensalltag teilzuhaben und gleichzeitig einen anerkannten Abschluss zu erwerben.",
      "Ich interessiere mich besonders für [Programmierung / Infrastruktur / Business-IT] und sehe in Ihrer Unternehmenskultur mit [z. B. agilem Arbeiten, modernen Technologien] ein ideales Umfeld für meinen Einstieg.",
      "Ich freue mich auf die Möglichkeit, meine Fähigkeiten und meine Motivation in einem Gespräch persönlich vorzustellen.",
    ],
  },
  {
    name: "Wiedereinsteiger IT (nach Elternzeit)",
    subject: "Bewerbung als [Position] – Rückkehr nach Elternzeit",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre Stelle als [Position]. Nach meiner Elternzeit von [Dauer] möchte ich gezielt und mit frischer Energie in die IT-Branche zurückkehren.",
      "Vor meiner Elternzeit war ich als [frühere Position] bei [früheres Unternehmen] tätig und verfüge über [X] Jahre Berufserfahrung in [Bereich]. Während der Elternzeit habe ich mich durch [Kurs, Zertifikat, Eigenprojekt] aktuell gehalten und meine Kenntnisse in [Technologie] erweitert.",
      "Ich bin bereit für [Vollzeit / Teilzeit mit X Std./Woche] und freue mich auf ein Umfeld, das Vereinbarkeit von Familie und Beruf aktiv lebt.",
      "Ich stehe für ein erstes Gespräch gerne bereit und freue mich auf Ihre Rückmeldung.",
    ],
  },
  {
    name: "Rückkehr nach Auslandsaufenthalt / Sabbatical",
    subject: "Bewerbung als [Position] – nach Auslandsaufenthalt / Sabbatical",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre ausgeschriebene Stelle als [Position].",
      "Nach [Dauer] im Ausland / Sabbatical kehre ich mit neuen Perspektiven und geladenen Batterien in den Beruf zurück. Zuvor war ich [X] Jahre als [Position] tätig und habe in dieser Zeit [Schwerpunkte] verantwortet. Während meiner Auszeit habe ich [z. B. Land/Projekt/Weiterbildung] erlebt und dabei [Fähigkeit] vertieft.",
      "Ich bin sofort einsatzbereit und freue mich darauf, mein erweitertes Denken und meine wiedergewonnene Motivation in Ihr Team einzubringen.",
      "Ich freue mich auf ein Gespräch und stehe für Rückfragen jederzeit zur Verfügung.",
    ],
  },
  {
    name: "Teilzeitstelle IT",
    subject: "Bewerbung als [Position] in Teilzeit ([X] Std./Woche) – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre Stelle als [Position] – ich suche eine Tätigkeit in Teilzeit mit [X] Stunden pro Woche.",
      "Ich bringe [X] Jahre Berufserfahrung in [Bereich] mit und kann mein volles fachliches Know-how auch in reduzierter Stundenanzahl effektiv einbringen. Teilzeitarbeit bedeutet für mich fokussierte, qualitätsorientierte Arbeit ohne Abstriche bei Ergebnis und Engagement.",
      "Ich bin flexibel bezüglich Arbeitstage und Arbeitszeiten und verfüge auf Wunsch über die Möglichkeit zum Homeoffice. Moderne Remote-Kollaborationstools (Slack, Jira, Confluence) setze ich selbstverständlich ein.",
      "Ich freue mich auf ein persönliches Gespräch und stehe kurzfristig zur Verfügung.",
    ],
  },
  {
    name: "Remote / Full-Remote-Stelle IT",
    subject: "Bewerbung als [Position] (Remote) – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre ausgeschriebene Stelle als [Position] in vollständig remote arbeitender Form.",
      "Ich verfüge über [X] Jahre Erfahrung im Remote-Arbeiten und bin mit asynchroner Kommunikation, Remote-First-Kulturen und den dazugehörigen Tools (Slack, Zoom, Notion, Linear, GitHub) bestens vertraut. Selbstorganisation, proaktive Kommunikation und eigenverantwortliches Arbeiten sind für mich selbstverständlich.",
      "Meine technische Heimausstattung ist professionell: stabiles Glasfaser-Internet, dediziertes Arbeitszimmer, leistungsfähiges Equipment. Zeitzonendifferenzen bis [X Stunden] manage ich problemlos.",
      "Ich freue mich auf ein (Video-)Gespräch und bin zeitnah verfügbar.",
    ],
  },
  {
    name: "Bewerbung auf Englisch (IT)",
    subject: "Application for the Position of [Position] – Ref. [Ref. No.]",
    paragraphs: [
      "I am writing to apply for the position of [Position] as advertised on [Platform/Website].",
      "With [X] years of experience in [Field/Technology], I have developed strong skills in [Key Competencies]. In my current role at [Company], I am responsible for [Main Tasks] and have delivered [Concrete Achievement].",
      "I am a collaborative team player, comfortable in international and multicultural environments. I communicate fluently in English and am equally proficient in [Other Languages]. Working in an agile setup with distributed teams is something I genuinely enjoy.",
      "I would welcome the opportunity to discuss how my background aligns with your team's goals. Please find my resume attached and feel free to contact me at any time.",
    ],
  },
  {
    name: "Interne Bewerbung / Stellenwechsel innerhalb Unternehmen",
    subject: "Interne Bewerbung auf die Stelle als [Position] – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich intern auf die ausgeschriebene Stelle als [Position] in der Abteilung [Abteilung].",
      "Seit [X] Jahren bin ich als [aktuelle Position] in der Abteilung [aktuelle Abteilung] tätig und kenne die Prozesse, Strukturen und Werte unseres Unternehmens sehr gut. Diese interne Perspektive erlaubt mir einen schnellen Start ohne lange Einarbeitungszeit.",
      "Die ausgeschriebene Stelle reizt mich, weil ich meine Fähigkeiten in [Bereich] gezielt einsetzen und weiterentwickeln möchte. Ich bringe [konkrete Qualifikationen] mit und bin überzeugt, einen wertvollen Beitrag für die Abteilung [Zielabteilung] zu leisten.",
      "Ich würde mich über ein persönliches Gespräch mit Ihnen sehr freuen.",
    ],
  },
  {
    name: "Selbstständig / Freelance → Festanstellung",
    subject: "Bewerbung als [Position] – Übergang von Selbstständigkeit zur Festanstellung",
    paragraphs: [
      "hiermit bewerbe ich mich auf Ihre Stelle als [Position]. Nach [X] Jahren erfolgreicher Selbstständigkeit im IT-Bereich suche ich jetzt bewusst eine Festanstellung.",
      "Als Freelancer habe ich für [X] Kunden aus [Branchen] Projekte in [Technologien] realisiert. Ich bin es gewohnt, selbstständig zu arbeiten, Verantwortung zu übernehmen und Ergebnisse zuverlässig zu liefern. Gleichzeitig schätze ich die langfristige Zusammenarbeit in einem festen Team und möchte wieder Teil einer gemeinsamen Unternehmenskultur sein.",
      "Mein breit aufgestelltes Netzwerk und die Erfahrung aus verschiedensten Kundenprojekten bereichern jedes Team, in das ich eintrete.",
      "Ich freue mich auf ein Gespräch und stehe kurzfristig zur Verfügung.",
    ],
  },
  {
    name: "FSJ / BFD im IT-Bereich",
    subject: "Bewerbung für ein Freiwilliges Soziales Jahr / BFD im IT-Bereich",
    paragraphs: [
      "hiermit bewerbe ich mich für einen FSJ-/BFD-Platz im IT-Bereich Ihrer Einrichtung.",
      "Ich habe kürzlich meinen [Schulabschluss] erworben und möchte vor Ausbildung oder Studium praktische Einblicke in den IT-Alltag gewinnen. Technik begeistert mich seit Jahren: Ich habe erste Erfahrungen mit [z. B. Computerreparatur, Netzwerke, einfacher Programmierung] gesammelt.",
      "Ein FSJ in Ihrer Organisation bietet mir die Möglichkeit, sinnvoll beizutragen, Verantwortung zu übernehmen und mich beruflich zu orientieren. Ich bin zuverlässig, teamfähig und lernbereit.",
      "Ich freue mich über eine Einladung zu einem Kennenlerngespräch.",
    ],
  },
  {
    name: "Eigenvorlage (leer)",
    subject: "Bewerbung als [Position] – Ref. [Stellenref.]",
    paragraphs: [
      "hiermit bewerbe ich mich auf die ausgeschriebene Stelle als [Position] in Ihrem Unternehmen.",
      "[Beschreiben Sie hier Ihre relevanten Kenntnisse und Erfahrungen.]",
      "[Erläutern Sie, warum Sie zum Unternehmen passen und was Sie motiviert.]",
      "Ich freue mich auf Ihre Rückmeldung und ein persönliches Kennenlernen.",
    ],
  },
];

// ─── Eigenes Anschreiben importieren / Parsen ─────────────────────────────────

/**
 * Analysiert einen eingefügten Rohtext und extrahiert:
 * Betreff, Anrede, Absatze, Grußformel und Unterschriftsnotiz.
 * Keine externe API nötig.
 */
function parseImportedText(raw: string): Partial<LetterData> {
  const CLOSING_KW = [
    "mit freundlichen", "freundliche grüße", "hochachtungsvoll",
    "viele grüße", "herzliche grüße", "mit besten grüßen",
    "with kind regards", "best regards", "kind regards",
  ];
  const SALUTATION_RE = /^(sehr geehr|guten tag|liebes|dear\s|hiermit bewerbe|mit begeisterung|mit interesse|mit großem interesse|außerdem bewerbe|mit freude)/i;
  const SUBJECT_RE = /^(betreff\s*:|betrifft\s*:|bewerbung (als|auf|um)|initiativbewerbung|anfrage zur)/i;

  // Absatz-basiertes Parsen (leere Zeilen = Absatzgrenze)
  const blocks = raw.replace(/\r\n/g, "\n").split(/\n{2,}/).map(b => b.trim()).filter(Boolean);

  let subject = "";
  let salutation = "";
  let closing = "";
  let signatureNote = "";
  const bodyParagraphs: string[] = [];
  let bodyStarted = false;
  let closingFound = false;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockLower = block.toLowerCase();

    // Betreff-Zeile
    if (!subject && SUBJECT_RE.test(block)) {
      subject = block.replace(/^(betreff|betrifft)\s*:\s*/i, "").trim();
      // Mehrzeilige Betreffzeilen zusammenführen
      if (subject.split("\n").length > 1) {
        subject = subject.split("\n").map(l => l.trim()).join(" ");
      }
      continue;
    }

    // Anrede
    if (!salutation && SALUTATION_RE.test(blockLower)) {
      salutation = block.split("\n")[0].trim();
      bodyStarted = true;
      // Rest des Blocks (falls Anrede und erster Satz zusammen) als Absatz
      const rest = block.split("\n").slice(1).join(" ").trim();
      if (rest) bodyParagraphs.push(rest);
      continue;
    }

    // Schlußformel
    if (!closingFound && CLOSING_KW.some(kw => blockLower.startsWith(kw))) {
      closing = block.split("\n")[0].trim();
      closingFound = true;
      // Nächster Block = Unterschrift / Anmerkung
      if (i + 1 < blocks.length) {
        const next = blocks[i + 1].split("\n")[0].trim();
        // Nur nehmen wenn kurz und kein Paragraph
        if (next.length < 80) signatureNote = next;
      }
      break;
    }

    // Haupttext (alles zwischen Anrede und Schlußformel)
    if (bodyStarted && !closingFound) {
      // Mehrzeiliger Block: jede Zeile als eigener Inhalt, zusammengefasst
      const linesCleaned = block.split("\n").map(l => l.trim()).filter(Boolean).join(" ");
      bodyParagraphs.push(linesCleaned);
    }
  }

  // Falls gar keine Anrede erkannt wurde: ersten Block als Anrede nehmen
  if (!salutation && blocks.length > 0) {
    salutation = blocks[0].split("\n")[0].trim();
  }
  // Falls keine Absätze und kein Parsing: ganzen Text als einen Absatz
  if (bodyParagraphs.length === 0) {
    bodyParagraphs.push(raw.trim());
  }

  const result: Partial<LetterData> = { bodyParagraphs };
  if (subject) result.subject = subject;
  if (salutation) result.salutation = salutation;
  if (closing) result.closing = closing;
  if (signatureNote) result.signatureNote = signatureNote;
  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnschreibenStudio() {
  const [letter, setLetter] = useState<LetterData>({ ...DEFAULT_LETTER });
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTarget, setAiTarget] = useState<"full" | "paragraph" | "subject">("full");
  const [aiParagraphIdx, setAiParagraphIdx] = useState(0);
  const [savedTemplates, setSavedTemplates] = useState<{ name: string; data: LetterData }[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  // ── Import-Modus ───────────────────────────────────────────────────────────
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importScope, setImportScope] = useState<"body" | "full">("body");
  const [importPreview, setImportPreview] = useState<Partial<LetterData> | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const compliance = checkDINCompliance(letter);
  const errors = compliance.filter((c) => c.level === "error");
  const warnings = compliance.filter((c) => c.level === "warn");

  // Load saved templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("anschreiben-templates");
      if (stored) setSavedTemplates(JSON.parse(stored));
    } catch {}
  }, []);

  const notify = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Patch helpers ──────────────────────────────────────────────────────────

  const patchSender = (patch: Partial<SenderBlock>) =>
    setLetter((l) => ({ ...l, sender: { ...l.sender, ...patch } }));

  const patchRecipient = (patch: Partial<RecipientBlock>) =>
    setLetter((l) => ({ ...l, recipient: { ...l.recipient, ...patch } }));

  const patchLetter = (patch: Partial<LetterData>) =>
    setLetter((l) => ({ ...l, ...patch }));

  const setParagraph = (idx: number, val: string) =>
    setLetter((l) => {
      const paras = [...l.bodyParagraphs];
      paras[idx] = val;
      return { ...l, bodyParagraphs: paras };
    });

  const addParagraph = () =>
    setLetter((l) => ({ ...l, bodyParagraphs: [...l.bodyParagraphs, ""] }));

  const removeParagraph = (idx: number) =>
    setLetter((l) => ({
      ...l,
      bodyParagraphs: l.bodyParagraphs.filter((_, i) => i !== idx),
    }));

  const addAttachment = () =>
    setLetter((l) => ({ ...l, attachments: [...l.attachments, ""] }));

  const setAttachment = (idx: number, val: string) =>
    setLetter((l) => {
      const a = [...l.attachments];
      a[idx] = val;
      return { ...l, attachments: a };
    });

  const removeAttachment = (idx: number) =>
    setLetter((l) => ({
      ...l,
      attachments: l.attachments.filter((_, i) => i !== idx),
    }));

  // ── Template actions ───────────────────────────────────────────────────────

  // ── Import-Handler ─────────────────────────────────────────────────────────

  /** Datei (.txt) einlesen und Text ins Textarea laden */
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setImportText(text);
      setImportPreview(parseImportedText(text));
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  };

  /** Vorschau live aktualisieren während Benutzer tippt/einfügt */
  const handleImportTextChange = (val: string) => {
    setImportText(val);
    setImportPreview(val.trim() ? parseImportedText(val) : null);
  };

  /** Parsed-Ergebnis auf den aktuellen Brief anwenden */
  const applyImport = () => {
    if (!importPreview) return;
    if (importScope === "body") {
      // Nur Brieftext, Betreff, Anrede, Gruss übernehmen
      setLetter(l => ({
        ...l,
        ...(importPreview.subject ? { subject: importPreview.subject } : {}),
        ...(importPreview.salutation ? { salutation: importPreview.salutation } : {}),
        bodyParagraphs: importPreview.bodyParagraphs ?? l.bodyParagraphs,
        ...(importPreview.closing ? { closing: importPreview.closing } : {}),
        ...(importPreview.signatureNote !== undefined ? { signatureNote: importPreview.signatureNote } : {}),
      }));
    } else {
      // Vollständig übernehmen (Absender/Empfänger bleiben – werden aus Text nicht extrahiert)
      setLetter(l => ({
        ...l,
        ...importPreview,
        sender: l.sender,
        recipient: l.recipient,
      }));
    }
    setShowImport(false);
    setImportText("");
    setImportPreview(null);
    notify("success", "Anschreiben erfolgreich importiert und kann nun bearbeitet werden.");
    setMode("edit");
  };

  const applyITTemplate = (t: (typeof IT_TEMPLATES)[number]) => {
    patchLetter({
      subject: t.subject,
      bodyParagraphs: [...t.paragraphs],
    });
    setShowTemplates(false);
    notify("success", `Vorlage „${t.name}" angewendet.`);
  };

  const saveTemplate = () => {
    const name = letter.templateName || `Vorlage ${savedTemplates.length + 1}`;
    const updated = [...savedTemplates, { name, data: { ...letter } }];
    setSavedTemplates(updated);
    localStorage.setItem("anschreiben-templates", JSON.stringify(updated));
    notify("success", `Vorlage „${name}" gespeichert.`);
  };

  const loadTemplate = (t: { name: string; data: LetterData }) => {
    setLetter({ ...t.data });
    setShowTemplates(false);
    notify("success", `Vorlage „${t.name}" geladen.`);
  };

  const deleteTemplate = (idx: number) => {
    const updated = savedTemplates.filter((_, i) => i !== idx);
    setSavedTemplates(updated);
    localStorage.setItem("anschreiben-templates", JSON.stringify(updated));
  };

  // ── AI Copilot ────────────────────────────────────────────────────────────

  const runAI = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/anschreiben/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: aiTarget,
          prompt: aiPrompt,
          context: {
            subject: letter.subject,
            salutation: letter.salutation,
            existing: letter.bodyParagraphs[aiParagraphIdx] ?? "",
            paragraphIndex: aiParagraphIdx,
          },
        }),
      });

      if (!res.ok) throw new Error("KI-Anfrage fehlgeschlagen");
      const data = (await res.json()) as { text?: string; subject?: string; paragraphs?: string[] };

      if (aiTarget === "subject" && data.subject) {
        patchLetter({ subject: data.subject });
        notify("success", "Betreff wurde by KI vervollständigt.");
      } else if (aiTarget === "paragraph" && data.text) {
        setParagraph(aiParagraphIdx, data.text);
        notify("success", `Absatz ${aiParagraphIdx + 1} wurde by KI überarbeitet.`);
      } else if (aiTarget === "full" && data.paragraphs) {
        patchLetter({ bodyParagraphs: data.paragraphs });
        notify("success", "Vollständiger Text by KI generiert.");
      }
    } catch {
      notify("error", "KI-Entwurf fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setAiLoading(false);
      setAiPrompt("");
    }
  }, [aiTarget, aiPrompt, letter, aiParagraphIdx]);

  // ── Print / Export ─────────────────────────────────────────────────────────

  const handlePrint = () => {
    window.print();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
            notification.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5" />
          )}
          {notification.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
            <DocumentTextIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Anschreiben-Studio
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              DIN 5008 konform · KI-unterstützt · PDF-Export
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* DIN Compliance Badge */}
          <button
            onClick={() => setShowCompliance(!showCompliance)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
              errors.length > 0
                ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300"
                : warnings.length > 0
                ? "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300"
                : "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300"
            }`}
          >
            {errors.length > 0 ? (
              <ExclamationTriangleIcon className="h-4 w-4" />
            ) : (
              <CheckCircleIcon className="h-4 w-4" />
            )}
            DIN 5008 {errors.length > 0 ? `(${errors.length} Fehler)` : warnings.length > 0 ? `(${warnings.length} Warnungen)` : "✓"}
          </button>

          {/* Mode toggle */}
          <div className="flex border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setMode("edit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition ${
                mode === "edit"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              }`}
            >
              <PencilIcon className="h-4 w-4" /> Bearbeiten
            </button>
            <button
              onClick={() => setMode("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition ${
                mode === "preview"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              }`}
            >
              <EyeIcon className="h-4 w-4" /> Vorschau
            </button>
          </div>

          {/* Templates */}
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            <ClipboardDocumentListIcon className="h-4 w-4" />
            Vorlagen
          </button>

          {/* Import eigenes Anschreiben */}
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition"
            title="Eigenes Anschreiben einfügen und bearbeiten"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            Importieren
          </button>

          {/* Save template */}
          <button
            onClick={saveTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            <BookmarkIcon className="h-4 w-4" />
            Speichern
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            <PrinterIcon className="h-4 w-4" />
            Drucken / PDF
          </button>
        </div>
      </div>

      {/* DIN Compliance Panel */}
      {showCompliance && compliance.length > 0 && (
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            DIN-5008-Prüfbericht
          </h3>
          <ul className="space-y-2">
            {compliance.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                {issue.level === "error" ? (
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                ) : (
                  <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                )}
                <span className={issue.level === "error" ? "text-red-700 dark:text-red-300" : "text-yellow-700 dark:text-yellow-300"}>
                  {issue.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Import Modal ────────────────────────────────────────────────────── */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                  <DocumentArrowUpIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Eigenes Anschreiben importieren
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Text einfügen oder .txt-Datei laden – wird automatisch analysiert
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowImport(false); setImportText(""); setImportPreview(null); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Datei-Import */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => importFileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  <FolderOpenIcon className="h-4 w-4" />
                  .txt-Datei laden
                </button>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".txt,.text"
                  className="hidden"
                  onChange={handleImportFile}
                />
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  oder unten einfügeneren (Strg+V)
                </span>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                  Anschreiben-Text einfügen
                </label>
                <textarea
                  rows={10}
                  value={importText}
                  onChange={e => handleImportTextChange(e.target.value)}
                  placeholder="Hier deinen Anschreiben-Text einfügen…&#10;&#10;Beispiel:&#10;Bewerbung als Senior Developer – Ref. XYZ&#10;&#10;Sehr geehrte Damen und Herren,&#10;&#10;mit großem Interesse habe ich Ihre Stelle gesehen…&#10;&#10;Mit freundlichen Grüßen&#10;Max Mustermann"
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono resize-none"
                />
              </div>

              {/* Importbereich-Wahl */}
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-2">Was soll übernommen werden?</p>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importScope"
                      value="body"
                      checked={importScope === "body"}
                      onChange={() => setImportScope("body")}
                      className="accent-emerald-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-slate-300">
                      Nur Brieftext, Betreff, Anrede & Grußformel
                      <span className="block text-xs text-gray-400">(Absender & Empfänger bleiben erhalten)</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importScope"
                      value="full"
                      checked={importScope === "full"}
                      onChange={() => setImportScope("full")}
                      className="accent-emerald-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-slate-300">
                      Alles übernehmen
                      <span className="block text-xs text-gray-400">(Absender/Empfänger manuell ergänzen)</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Vorschau der geparsten Felder */}
              {importPreview && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4 space-y-3">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Erkannte Felder (Vorschau)</p>
                  {importPreview.subject && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Betreff: </span>
                      <span className="text-sm text-gray-900 dark:text-white">{importPreview.subject}</span>
                    </div>
                  )}
                  {importPreview.salutation && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Anrede: </span>
                      <span className="text-sm text-gray-900 dark:text-white">{importPreview.salutation}</span>
                    </div>
                  )}
                  {importPreview.bodyParagraphs && importPreview.bodyParagraphs.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                        Absatz {importPreview.bodyParagraphs.length > 1 ? `(${importPreview.bodyParagraphs.length} Absätze)` : ""}:{" "}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-slate-300 line-clamp-2">
                        {importPreview.bodyParagraphs[0]?.slice(0, 120)}{importPreview.bodyParagraphs[0]?.length > 120 ? "…" : ""}
                      </span>
                    </div>
                  )}
                  {importPreview.closing && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Grußformel: </span>
                      <span className="text-sm text-gray-900 dark:text-white">{importPreview.closing}</span>
                    </div>
                  )}
                  {!importPreview.subject && !importPreview.salutation && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠ Betreff und Anrede nicht erkannt – werden als Freitext in den Briefkörper übernommen.
                    </p>
                  )}
                </div>
              )}

              {!importText.trim() && (
                <div className="text-center py-6 text-gray-400 dark:text-slate-500 text-sm">
                  Füge deinen Anschreiben-Text ein oder lade eine .txt-Datei –<br />die KI-Felder werden automatisch erkannt.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => { setShowImport(false); setImportText(""); setImportPreview(null); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                Abbrechen
              </button>
              <button
                onClick={applyImport}
                disabled={!importText.trim() || !importPreview}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
              >
                <CheckCircleIcon className="h-4 w-4" />
                Importieren & bearbeiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl p-6 border border-gray-200 dark:border-slate-700 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                IT-Muster-Vorlagen (DIN 5008)
              </h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* IT Templates */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                IT-Branche Mustervorlagen
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {IT_TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => applyITTemplate(t)}
                    className="text-left p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                  >
                    <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                      {t.name}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {t.paragraphs[0].slice(0, 80)}…
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Saved templates */}
            {savedTemplates.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  Eigene gespeicherte Vorlagen
                </p>
                <div className="space-y-2">
                  {savedTemplates.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {t.name}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadTemplate(t)}
                          className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Laden
                        </button>
                        <button
                          onClick={() => deleteTemplate(i)}
                          className="text-xs px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT MODE ──────────────────────────────────────────────────────── */}
      {mode === "edit" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="xl:col-span-2 space-y-6">

            {/* Titel & Stil */}
            <Section title="Brief-Einstellungen">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Interner Titel">
                  <input
                    type="text"
                    placeholder="z.B. Bewerbung Firma XYZ"
                    value={letter.title}
                    onChange={(e) => patchLetter({ title: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Vorlagenname (zum Speichern)">
                  <input
                    type="text"
                    placeholder="z.B. Meine Standard-Vorlage"
                    value={letter.templateName ?? ""}
                    onChange={(e) => patchLetter({ templateName: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="DIN-5008-Stilform">
                  <select
                    value={letter.style}
                    onChange={(e) => patchLetter({ style: e.target.value as "A" | "B" })}
                    className={inputCls}
                  >
                    <option value="A">Stil A (standard – linksbündig)</option>
                    <option value="B">Stil B (Betreff linksbündig, Bezug zentriert)</option>
                  </select>
                </Field>
              </div>
            </Section>

            {/* Absender */}
            <Section title="Absender (DIN 5008 §3.1)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Vollständiger Name *">
                  <input type="text" placeholder="Vorname Nachname" value={letter.sender.name} onChange={(e) => patchSender({ name: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Straße & Hausnummer *">
                  <input type="text" placeholder="Musterstraße 1" value={letter.sender.street} onChange={(e) => patchSender({ street: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Postleitzahl *">
                  <input type="text" placeholder="12345" value={letter.sender.zip} onChange={(e) => patchSender({ zip: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Ort *">
                  <input type="text" placeholder="Musterstadt" value={letter.sender.city} onChange={(e) => patchSender({ city: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Telefon *">
                  <input type="tel" placeholder="+49 123 456789" value={letter.sender.phone} onChange={(e) => patchSender({ phone: e.target.value })} className={inputCls} />
                </Field>
                <Field label="E-Mail *">
                  <input type="email" placeholder="name@beispiel.de" value={letter.sender.email} onChange={(e) => patchSender({ email: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Website (optional)">
                  <input type="url" placeholder="https://www.beispiel.de" value={letter.sender.web ?? ""} onChange={(e) => patchSender({ web: e.target.value })} className={inputCls} />
                </Field>
              </div>
            </Section>

            {/* Empfänger */}
            <Section title="Empfänger (DIN 5008 §4.2)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Unternehmen / Organisation">
                  <input type="text" placeholder="Muster GmbH" value={letter.recipient.company ?? ""} onChange={(e) => patchRecipient({ company: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Abteilung (optional)">
                  <input type="text" placeholder="Personalabteilung" value={letter.recipient.department ?? ""} onChange={(e) => patchRecipient({ department: e.target.value })} className={inputCls} />
                </Field>
                <Field label="z.Hd. (optional)">
                  <input type="text" placeholder="z.Hd. Frau Müller" value={letter.recipient.attention ?? ""} onChange={(e) => patchRecipient({ attention: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Straße & Hausnummer *">
                  <input type="text" placeholder="Firmenstraße 10" value={letter.recipient.street} onChange={(e) => patchRecipient({ street: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Postleitzahl *">
                  <input type="text" placeholder="10115" value={letter.recipient.zip} onChange={(e) => patchRecipient({ zip: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Ort *">
                  <input type="text" placeholder="Berlin" value={letter.recipient.city} onChange={(e) => patchRecipient({ city: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Land (optional, nur Ausland)">
                  <input type="text" placeholder="Österreich" value={letter.recipient.country ?? ""} onChange={(e) => patchRecipient({ country: e.target.value })} className={inputCls} />
                </Field>
              </div>
            </Section>

            {/* Datum, Ort, Bezugzeichen */}
            <Section title="Datumszeile & Bezug (DIN 5008 §5)">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Ort *">
                  <input type="text" placeholder="Berlin" value={letter.place} onChange={(e) => patchLetter({ place: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Datum *">
                  <input type="text" placeholder="1. März 2026" value={letter.date} onChange={(e) => patchLetter({ date: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Ihr Zeichen / Stellenref.">
                  <input type="text" placeholder="Ref. 2026-142" value={letter.reference ?? ""} onChange={(e) => patchLetter({ reference: e.target.value })} className={inputCls} />
                </Field>
              </div>
            </Section>

            {/* Betreff */}
            <Section title="Betreff (DIN 5008 §6)">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Bewerbung als Senior Software Engineer – Ref. 2026-142"
                  value={letter.subject}
                  onChange={(e) => patchLetter({ subject: e.target.value })}
                  className={`${inputCls} flex-1`}
                />
                <button
                  onClick={() => { setAiTarget("subject"); setAiPrompt(`Schreibe einen DIN-5008-konformen Betreff für eine Bewerbung als ${letter.subject || "IT-Spezialist"}.`); }}
                  className="shrink-0 px-3 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 transition"
                  title="KI-Betreff generieren"
                >
                  <SparklesIcon className="h-4 w-4" />
                </button>
              </div>
              {letter.subject.length > 120 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  ⚠ Betreff zu lang ({letter.subject.length}/120 Zeichen empfohlen)
                </p>
              )}
            </Section>

            {/* Anrede */}
            <Section title="Anrede">
              <div className="flex gap-2">
                <select
                  value={letter.salutation}
                  onChange={(e) => patchLetter({ salutation: e.target.value })}
                  className={`${inputCls} flex-1`}
                >
                  <option>Sehr geehrte Damen und Herren,</option>
                  <option>Sehr geehrte Frau [Name],</option>
                  <option>Sehr geehrter Herr [Name],</option>
                  <option>Guten Tag,</option>
                  <option>Liebes [Unternehmen]-Team,</option>
                </select>
                <input
                  type="text"
                  placeholder="Oder frei eingeben…"
                  value={letter.salutation.startsWith("Sehr") ? "" : letter.salutation}
                  onChange={(e) => patchLetter({ salutation: e.target.value })}
                  className={`${inputCls} flex-1`}
                />
              </div>
            </Section>

            {/* Brieftext */}
            <Section title="Brieftext">
              <div className="space-y-3">
                {letter.bodyParagraphs.map((para, idx) => (
                  <div key={idx} className="relative">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                        Absatz {idx + 1}
                      </span>
                      <button
                        onClick={() => { setAiTarget("paragraph"); setAiParagraphIdx(idx); }}
                        className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-800"
                        title="Diesen Absatz by KI überarbeiten"
                      >
                        <SparklesIcon className="h-3.5 w-3.5" /> KI
                      </button>
                      {letter.bodyParagraphs.length > 1 && (
                        <button
                          onClick={() => removeParagraph(idx)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={4}
                      value={para}
                      onChange={(e) => setParagraph(idx, e.target.value)}
                      placeholder={idx === 0 ? "Einleitungsatz…" : idx === letter.bodyParagraphs.length - 1 ? "Abschlusssatz / Call-to-Action…" : "Hauptinhalt, Ihre Qualifikationen…"}
                      className={inputCls}
                    />
                  </div>
                ))}
                <button
                  onClick={addParagraph}
                  className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 transition"
                >
                  <PlusIcon className="h-4 w-4" /> Absatz hinzufügen
                </button>
              </div>
            </Section>

            {/* Grußformel */}
            <Section title="Grußformel & Unterschrift">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Grußformel">
                  <select
                    value={letter.closing}
                    onChange={(e) => patchLetter({ closing: e.target.value })}
                    className={inputCls}
                  >
                    <option>Mit freundlichen Grüßen</option>
                    <option>Mit freundlichem Gruß</option>
                    <option>Herzliche Grüße</option>
                    <option>Viele Grüße</option>
                  </select>
                </Field>
                <Field label="Namenszeile / Zusatz">
                  <input
                    type="text"
                    placeholder="M.Sc. Informatik"
                    value={letter.signatureNote ?? ""}
                    onChange={(e) => patchLetter({ signatureNote: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              </div>
            </Section>

            {/* Anlagen */}
            <Section title="Anlagen">
              <div className="space-y-2">
                {letter.attachments.map((a, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Anlage ${idx + 1}, z.B. Lebenslauf`}
                      value={a}
                      onChange={(e) => setAttachment(idx, e.target.value)}
                      className={`${inputCls} flex-1`}
                    />
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addAttachment}
                  className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800"
                >
                  <PlusIcon className="h-4 w-4" /> Anlage hinzufügen
                </button>
              </div>
            </Section>
          </div>

          {/* Right: AI Copilot */}
          <div className="xl:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* AI Panel */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <SparklesIcon className="h-5 w-5 text-purple-500" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    KI-Copilot
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                    On-device sicher
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                      KI soll…
                    </label>
                    <select
                      value={aiTarget}
                      onChange={(e) => setAiTarget(e.target.value as typeof aiTarget)}
                      className={inputCls}
                    >
                      <option value="full">Gesamten Text generieren</option>
                      <option value="paragraph">Einen Absatz überarbeiten</option>
                      <option value="subject">Betreff formulieren</option>
                    </select>
                  </div>

                  {aiTarget === "paragraph" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                        Welcher Absatz?
                      </label>
                      <select
                        value={aiParagraphIdx}
                        onChange={(e) => setAiParagraphIdx(Number(e.target.value))}
                        className={inputCls}
                      >
                        {letter.bodyParagraphs.map((_, i) => (
                          <option key={i} value={i}>Absatz {i + 1}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                      Ihre Anweisung / Kontext
                    </label>
                    <textarea
                      rows={4}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="z.B. 5 Jahre Erfahrung in React & TypeScript, zertifizierter AWS Engineer, bewerbe mich als Senior Dev…"
                      className={inputCls}
                    />
                  </div>

                  <button
                    onClick={runAI}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {aiLoading ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        KI generiert…
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4" />
                        Generieren
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-3 text-xs text-gray-400 dark:text-slate-500">
                  💡 Tipp: Kein persönliches Datum wird an externe KI gesendet. Alle Anfragen werden server-seitig pseudonymisiert.
                </p>
              </div>

              {/* DIN Checklist */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                  DIN-5008-Checkliste
                </h3>
                <ul className="space-y-1.5">
                  {[
                    ["Absenderangaben vollständig", !errors.some(e => e.message.includes("Absender"))],
                    ["Empfängerangaben vollständig", !errors.some(e => e.message.includes("Empfänger"))],
                    ["Datum vorhanden", !!letter.date],
                    ["Betreff vorhanden", !!letter.subject],
                    ["Anrede vorhanden", !!letter.salutation],
                    ["Brieftext vorhanden", letter.bodyParagraphs.join("").trim().length > 0],
                    ["Grußformel vorhanden", !!letter.closing],
                  ].map(([label, ok]) => (
                    <li key={String(label)} className="flex items-center gap-2 text-xs">
                      <span className={ok ? "text-green-500" : "text-gray-300 dark:text-slate-600"}>
                        {ok ? "✓" : "○"}
                      </span>
                      <span className={ok ? "text-gray-700 dark:text-slate-300" : "text-gray-400 dark:text-slate-500"}>
                        {String(label)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW MODE ───────────────────────────────────────────────────── */}
      {mode === "preview" && (
        <div className="flex flex-col items-center">
          <div
            ref={printRef}
            id="din-letter-preview"
            className="bg-white text-black shadow-xl rounded-md"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "20mm 25mm 20mm 25mm",
              fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
              fontSize: "11pt",
              lineHeight: "1.5",
            }}
          >
            {/* Absender-Kurzzeile (Briefkopf) */}
            <div style={{ fontSize: "8pt", color: "#555", marginBottom: "8mm", borderBottom: "0.5pt solid #ccc", paddingBottom: "3mm" }}>
              {letter.sender.name} · {letter.sender.street} · {letter.sender.zip} {letter.sender.city}
              {letter.sender.phone && ` · Tel. ${letter.sender.phone}`}
              {letter.sender.email && ` · ${letter.sender.email}`}
              {letter.sender.web && ` · ${letter.sender.web}`}
            </div>

            {/* Anschriftenfeld */}
            <div style={{ marginBottom: "8.46mm", minHeight: "45mm" }}>
              {letter.recipient.company && <div style={{ fontWeight: "bold" }}>{letter.recipient.company}</div>}
              {letter.recipient.department && <div>{letter.recipient.department}</div>}
              {letter.recipient.attention && <div>{letter.recipient.attention}</div>}
              <div>{letter.recipient.street}</div>
              <div>{letter.recipient.zip} {letter.recipient.city}</div>
              {letter.recipient.country && <div style={{ textTransform: "uppercase" }}>{letter.recipient.country}</div>}
            </div>

            {/* Datumszeile */}
            <div style={{ textAlign: letter.style === "A" ? "left" : "right", marginBottom: "8mm", color: "#333" }}>
              {letter.place}{letter.place && letter.date ? ", " : ""}{letter.date}
              {letter.reference && (
                <span style={{ marginLeft: "20mm", color: "#555" }}>Ihr Zeichen: {letter.reference}</span>
              )}
            </div>

            {/* Betreff */}
            <div style={{ fontWeight: "bold", fontSize: "12pt", marginBottom: "8mm" }}>
              {letter.subject || <span style={{ color: "#aaa" }}>[Betreff]</span>}
            </div>

            {/* Anrede */}
            <div style={{ marginBottom: "6mm" }}>
              {letter.salutation || <span style={{ color: "#aaa" }}>[Anrede]</span>}
            </div>

            {/* Brieftext */}
            <div style={{ marginBottom: "6mm" }}>
              {letter.bodyParagraphs.filter(p => p.trim()).length === 0 ? (
                <p style={{ color: "#aaa" }}>[Brieftext]</p>
              ) : (
                letter.bodyParagraphs.map((para, i) => (
                  <p key={i} style={{ marginBottom: "4mm", textAlign: "justify" }}>
                    {para || <span style={{ color: "#aaa" }}>[Absatz {i + 1}]</span>}
                  </p>
                ))
              )}
            </div>

            {/* Grußformel */}
            <div style={{ marginBottom: "16mm" }}>
              {letter.closing || "Mit freundlichen Grüßen"}
            </div>

            {/* Unterschrift */}
            <div style={{ borderTop: "0.5pt solid #888", paddingTop: "1mm", width: "60mm" }}>
              <div style={{ fontWeight: "bold" }}>{letter.sender.name}</div>
              {letter.signatureNote && <div style={{ fontSize: "9pt", color: "#555" }}>{letter.signatureNote}</div>}
            </div>

            {/* Anlagen */}
            {letter.attachments.filter(a => a.trim()).length > 0 && (
              <div style={{ marginTop: "8mm", fontSize: "10pt" }}>
                <div style={{ fontWeight: "bold" }}>Anlagen:</div>
                <ul style={{ listStyle: "none", paddingLeft: 0, marginTop: "2mm" }}>
                  {letter.attachments.filter(a => a.trim()).map((a, i) => (
                    <li key={i} style={{ color: "#333" }}>– {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={handlePrint}
            className="mt-8 no-print flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg transition"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Als PDF speichern / Drucken (Strg+P)
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Helper UI Components ─────────────────────────────────────────────────────

const inputCls =
  "w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
