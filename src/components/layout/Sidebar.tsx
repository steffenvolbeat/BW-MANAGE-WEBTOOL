"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  HomeIcon,
  BriefcaseIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  GlobeAltIcon,
  VideoCameraIcon,
  DocumentPlusIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  FolderOpenIcon,
  BoltIcon,
  PencilSquareIcon,
  BellAlertIcon,
  SparklesIcon,
  UsersIcon,
  PresentationChartLineIcon,
  DocumentMagnifyingGlassIcon,
  TrophyIcon,
  FaceSmileIcon,
  CurrencyEuroIcon,
  UserGroupIcon,
  GlobeEuropeAfricaIcon,
  ClockIcon,
  VideoCameraIcon as VideoIcon,
  QrCodeIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  restricted?: boolean;
  adminOnly?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
    description: "Übersicht und Statistiken",
  },
  {
    name: "Bewerbungen",
    href: "/applications",
    icon: BriefcaseIcon,
    description: "Alle Bewerbungen verwalten",
  },
  {
    name: "Heatmap & Graph",
    href: "/applications/heatmap",
    icon: PresentationChartLineIcon,
    description: "Aktivität, Standorte & Netzwerk-Graph",
    badge: "NEU",
  },
  {
    name: "Kalender",
    href: "/calendar",
    icon: CalendarIcon,
    description: "Termine und Erinnerungen",
  },
  {
    name: "Dokumente",
    href: "/documents",
    icon: DocumentTextIcon,
    description: "Lebenslauf und Anschreiben",
  },
  {
    name: "Aktivitäten",
    href: "/activities",
    icon: ChartBarIcon,
    description: "Aktivitäten und Übersichten",
  },
  {
    name: "Web-Anbindungen",
    href: "/integrations/job-portals",
    icon: GlobeAltIcon,
    description: "Job-Portal Integrationen",
  },
  {
    name: "Job-Match-KI",
    href: "/ml/job-match",
    icon: CpuChipIcon,
    description: "KI-gestützte Job-Empfehlungen",
  },
  {
    name: "Meetings",
    href: "/meetings",
    icon: VideoCameraIcon,
    description: "Video-Calls und Termine",
  },
  {
    name: "Notizen",
    href: "/notes",
    icon: DocumentPlusIcon,
    description: "Persönliche Notizen",
  },
  {
    name: "JobCoach AI",
    href: "/ai/jobcoach",
    icon: SparklesIcon,
    description: "Persönlicher KI-Bewerbungsassistent",
    badge: "KI",
  },
  {
    name: "3D Avatar AI",
    href: "/ai/avatar",
    icon: CpuChipIcon,
    description: "Animierter 3D-KI-Avatar & Voice-Coach",
    badge: "3D",
  },
  {
    name: "CV Scanner",
    href: "/ai/resume-parser",
    icon: DocumentMagnifyingGlassIcon,
    description: "PDF-CV scannen, Skills extrahieren & Gap-Analyse",
    badge: "KI",
  },
  {
    name: "KI-Interview",
    href: "/ai/interview-simulator",
    icon: VideoCameraIcon,
    description: "Interview-Training mit KI",
    badge: "NEU",
  },
  {
    name: "Vertrag-Analyse",
    href: "/legal/contract-analyzer",
    icon: DocumentTextIcon,
    description: "KI-Vertragsanalyse (lokal)",
    badge: "LEGAL",
  },
  {
    name: "Autonomer Agent",
    href: "/agents",
    icon: CpuChipIcon,
    description: "KI-Agent mit Human-in-the-Loop Genehmigung",
    badge: "AGENT",
  },
  {
    name: "Kanban-Board",
    href: "/kanban",
    icon: BriefcaseIcon,
    description: "Bewerbungen als Kanban-Board",
  },
  {
    name: "Kanban-Automationen",
    href: "/kanban/automations",
    icon: BoltIcon,
    description: "Automatisierungsregeln erstellen",
    badge: "AUTO",
  },
  {
    name: "Lebenslauf-Template",
    href: "/lebenslauf",
    icon: DocumentMagnifyingGlassIcon,
    description: "Novoresume-Vorlage bearbeiten",
    badge: "NEU",
  },
  {
    name: "Anschreiben-Studio",
    href: "/anschreiben",
    icon: PencilSquareIcon,
    description: "DIN-5008 & Novoresume-Template",
    badge: "NEU",
  },
  {
    name: "DCI Classroom",
    href: "/classroom",
    icon: AcademicCapIcon,
    description: "12-Wochen ISP-Bewerbungsprogramm",
    badge: "NEU",
  },
  {
    name: "Datei-Browser",
    href: "/files",
    icon: FolderOpenIcon,
    description: "Hierarchische Ordnerstruktur",
  },
  {
    name: "Erinnerungen",
    href: "/reminders",
    icon: BellAlertIcon,
    description: "Outbox-Erinnerungen mit Garantie",
  },
  {
    name: "Gamification",
    href: "/gamification",
    icon: TrophyIcon,
    description: "Achievements, XP & Karriere-Level",
    badge: "NEU",
  },
  {
    name: "Stimmungs-Barometer",
    href: "/mood",
    icon: FaceSmileIcon,
    description: "Burnout-Früherkennung & Mood-Tracker",
    badge: "NEU",
  },
  {
    name: "Gehalts-Coach",
    href: "/salary-negotiation",
    icon: CurrencyEuroIcon,
    description: "KI-Gehaltsverhandlungs-Strategie",
    badge: "KI",
  },
  {
    name: "Mentoring",
    href: "/mentoring",
    icon: UserGroupIcon,
    description: "Mentor-Marktplatz & Sessions",
    badge: "NEU",
  },
  {
    name: "Peer-Review",
    href: "/peer-reviews",
    icon: UsersIcon,
    description: "Anonymes Feedback vom Community",
    badge: "NEU",
  },
  {
    name: "Portfolio-Generator",
    href: "/portfolio",
    icon: GlobeEuropeAfricaIcon,
    description: "Öffentliche Karriere-Portfolio-Website",
    badge: "NEU",
  },
  {
    name: "Follow-up Timeline",
    href: "/follow-ups",
    icon: ClockIcon,
    description: "KI-Smart-Nachfass-Erinnerungen",
    badge: "KI",
  },
  {
    name: "Career Twin",
    href: "/career/twin",
    icon: CpuChipIcon,
    description: "Digitaler KI-Karriere-Zwilling",
    badge: "KI",
  },
  {
    name: "Video-Coach",
    href: "/ai/video-coach",
    icon: VideoIcon,
    description: "Körpersprache & Interview-Analyse",
    badge: "KI",
  },
  {
    name: "Visitenkarten-Scanner",
    href: "/ai/card-scanner",
    icon: QrCodeIcon,
    description: "AR-Scan & KI-Kontaktextraktion",
    badge: "KI",
  },
  {
    name: "Bias-Detektor",
    href: "/ai/bias-detector",
    icon: ExclamationTriangleIcon,
    description: "Bias-Erkennung in Stellenanzeigen",
    badge: "KI",
  },
  {
    name: "Fraud-Detektor",
    href: "/ai/fraud-detector",
    icon: ShieldCheckIcon,
    description: "Fake-Anzeigen-Erkennung",
    badge: "KI",
  },
  {
    name: "Absagen-Analyse",
    href: "/ai/rejection-analysis",
    icon: ArrowTrendingUpIcon,
    description: "Predictive Rejection Insights",
    badge: "KI",
  },
  {
    name: "Anomalie-Detection",
    href: "/admin/security",
    icon: ShieldCheckIcon,
    description: "Insider-Threat Detection",
    restricted: true,
    adminOnly: true,
  },
  {
    name: "Benutzerverwaltung",
    href: "/admin/users",
    icon: UsersIcon,
    description: "Rollen & Berechtigungen verwalten",
    adminOnly: true,
  },
  {
    name: "Lesezugriff verwalten",
    href: "/admin/view-access",
    icon: ShieldCheckIcon,
    description: "MANAGER / VERMITTLER Zugriffsrechte",
    adminOnly: true,
  },
  {
    name: "Roadmap",
    href: "/admin/coming-soon",
    icon: SparklesIcon,
    description: "Features & Entwicklungs-Roadmap",
    badge: "NEU",
    adminOnly: true,
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Da Sidebar nur client-seitig gerendert wird (ssr: false in MainLayout),
  // ist user immer bereits verfügbar – kein mounted-Trick nötig
  const isAdmin = user?.role === "ADMIN";

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 bg-(--card) text-foreground shadow-sm border-r border-(--border)
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="shrink-0 px-6 py-4 border-b border-(--border)">
          <h2 className="text-lg font-semibold">Navigation</h2>
          <p className="text-sm text-(--muted)">Alle Bereiche im Überblick</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const hidden = item.adminOnly && !isAdmin;

            const linkClass = [
              hidden ? "hidden" : "",
              "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors",
              active
                ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-800"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white",
            ]
              .filter(Boolean)
              .join(" ");

            const iconClass = [
              "shrink-0 h-5 w-5 mr-3 transition-colors",
              active
                ? "text-blue-500"
                : "text-gray-400 group-hover:text-gray-500 dark:text-slate-400 dark:group-hover:text-slate-200",
            ].join(" ");

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={hidden ? undefined : onClose}
                aria-hidden={hidden || undefined}
                tabIndex={hidden ? -1 : undefined}
                className={linkClass}
              >
                <Icon className={iconClass} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                    {item.description}
                  </div>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      item.badge === "ZKP"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
                        : item.badge === "NEU"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                        : item.badge === "KI"
                        ? "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300"
                        : item.badge === "LEGAL"
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300"
                        : item.badge === "DSGVO"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                        : item.badge === "AUTO"
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300"
                        : item.badge === "3D"
                        ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300"
                        : item.badge === "AGENT"
                        ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {active && !item.badge && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer intentionally left minimal */}
        <div className="shrink-0 p-4 border-t border-gray-200"></div>
      </aside>
    </>
  );
}
