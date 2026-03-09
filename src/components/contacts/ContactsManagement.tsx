"use client";

import { useEffect, useState } from "react";
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeEuropeAfricaIcon,
  BuildingOfficeIcon,
  UserIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  CalendarDaysIcon,
  ChatBubbleLeftIcon,
  LinkIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  position: string;
  email: string;
  phone?: string;
  linkedIn?: string;
  xing?: string;
  location: string;
  country: string;
  isInland: boolean;
  contactType:
    | "RECRUITER"
    | "HR_MANAGER"
    | "TEAM_LEAD"
    | "COLLEAGUE"
    | "REFERRER"
    | "OTHER";
  industry: string;
  notes?: string;
  tags: string[];
  isFavorite: boolean;
  lastContact?: string;
  nextFollowUp?: string;
  relatedApplications: string[];
  addedAt: string;
  source: string;
}

export default function ContactsManagement() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [dupLoading, setDupLoading] = useState(false);
  const [dupPairs, setDupPairs] = useState<
    { a: string; b: string; score: number; reasons: string[] }[]
  >([]);
  const [dupError, setDupError] = useState<string | null>(null);

  const loadContacts = async () => {
    setContactsLoading(true);
    setContactsError(null);
    try {
      const res = await fetch("/api/contacts");
      if (!res.ok) throw new Error(`Kontakt-Laden fehlgeschlagen (${res.status})`);
      const data = (await res.json()) as Contact[];
      setContacts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kontakte konnten nicht geladen werden.";
      setContactsError(message);
    } finally {
      setContactsLoading(false);
    }
  };

  const loadDuplicates = async () => {
    setDupLoading(true);
    setDupError(null);
    try {
      const res = await fetch("/api/contacts/duplicates?threshold=0.75");
      if (!res.ok) throw new Error(`Duplikat-Check fehlgeschlagen (${res.status})`);
      const data = (await res.json()) as {
        pairs?: { a: string; b: string; score: number; reasons: string[] }[];
      };
      setDupPairs(data.pairs ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Duplikate konnten nicht geladen werden.";
      setDupError(message);
    } finally {
      setDupLoading(false);
    }
  };

  const mergeDuplicate = async (keepId: string, dropId: string) => {
    setDupLoading(true);
    setDupError(null);
    try {
      const res = await fetch("/api/contacts/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryId: keepId, duplicateId: dropId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.error || `Merge fehlgeschlagen (${res.status})`;
        throw new Error(msg);
      }
      await loadContacts();
      await loadDuplicates();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Merge fehlgeschlagen.";
      setDupError(message);
    } finally {
      setDupLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const contactTypes = {
    RECRUITER: {
      label: "Recruiter",
      color: "bg-blue-100 text-blue-800",
      icon: UserIcon,
    },
    HR_MANAGER: {
      label: "HR Manager",
      color: "bg-green-100 text-green-800",
      icon: BuildingOfficeIcon,
    },
    TEAM_LEAD: {
      label: "Team Lead",
      color: "bg-purple-100 text-purple-800",
      icon: UserIcon,
    },
    COLLEAGUE: {
      label: "Kollege",
      color: "bg-yellow-100 text-yellow-800",
      icon: UserIcon,
    },
    REFERRER: {
      label: "Vermittler",
      color: "bg-indigo-100 text-indigo-800",
      icon: UserIcon,
    },
    OTHER: {
      label: "Sonstiges",
      color: "bg-gray-100 text-gray-800",
      icon: UserIcon,
    },
  };

  // Get unique locations and industries
  const allLocations = [
    ...new Set(contacts.map((contact) => contact.location)),
  ];
  const allIndustries = [
    ...new Set(contacts.map((contact) => contact.industry)),
  ];

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesType =
      selectedType === "all" || contact.contactType === selectedType;
    const matchesLocation =
      selectedLocation === "all" || contact.location === selectedLocation;
    const matchesFavorites = !showFavoritesOnly || contact.isFavorite;

    return matchesSearch && matchesType && matchesLocation && matchesFavorites;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getTypeBadge = (type: string) => {
    const config = contactTypes[type as keyof typeof contactTypes];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getDaysUntilFollowUp = (followUpDate: string) => {
    const today = new Date();
    const followUp = new Date(followUpDate);
    const diffTime = followUp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getFollowUpBadge = (followUpDate?: string) => {
    if (!followUpDate) return null;

    const days = getDaysUntilFollowUp(followUpDate);

    if (days < 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
          {Math.abs(days)} Tage überfällig
        </span>
      );
    } else if (days === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
          Heute fällig
        </span>
      );
    } else if (days <= 3) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
          In {days} Tagen
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
        In {days} Tagen
      </span>
    );
  };

  const ContactGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredContacts.map((contact) => (
        <div
          key={contact.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">
                  {contact.firstName[0]}
                  {contact.lastName[0]}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {contact.firstName} {contact.lastName}
                </h3>
                <p className="text-sm text-gray-600">{contact.position}</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-yellow-500">
              {contact.isFavorite ? (
                <StarIconSolid className="w-5 h-5 text-yellow-500" />
              ) : (
                <StarIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Company & Location */}
          <div className="mb-4">
            <div className="flex items-center text-sm text-gray-700 mb-1">
              <BuildingOfficeIcon className="w-4 h-4 mr-2" />
              {contact.company}
            </div>
            <div className="flex items-center text-sm text-gray-700">
              {contact.isInland ? (
                <MapPinIcon className="w-4 h-4 mr-2" />
              ) : (
                <GlobeEuropeAfricaIcon className="w-4 h-4 mr-2" />
              )}
              {contact.location}, {contact.country}
            </div>
          </div>

          {/* Type Badge */}
          <div className="mb-4">{getTypeBadge(contact.contactType)}</div>

          {/* Contact Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              <a
                href={`mailto:${contact.email}`}
                className="hover:text-blue-600 truncate"
              >
                {contact.email}
              </a>
            </div>
            {contact.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <PhoneIcon className="w-4 h-4 mr-2" />
                <a
                  href={`tel:${contact.phone}`}
                  className="hover:text-blue-600"
                >
                  {contact.phone}
                </a>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {contact.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {tag}
              </span>
            ))}
            {contact.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{contact.tags.length - 3}
              </span>
            )}
          </div>

          {/* Follow-up */}
          {contact.nextFollowUp && (
            <div className="mb-4">{getFollowUpBadge(contact.nextFollowUp)}</div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <div className="flex space-x-2">
              <button className="text-blue-600 hover:text-blue-800 p-1">
                <EyeIcon className="w-4 h-4" />
              </button>
              <button className="text-indigo-600 hover:text-indigo-800 p-1">
                <PencilIcon className="w-4 h-4" />
              </button>
              <button className="text-green-600 hover:text-green-800 p-1">
                <ChatBubbleLeftIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-500">
              {contact.lastContact
                ? `Letzter Kontakt: ${formatDate(contact.lastContact)}`
                : "Noch kein Kontakt"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const ContactListView = () => (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Kontakt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Unternehmen & Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Typ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Standort
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Letzter Kontakt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Follow-up
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredContacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-medium text-sm">
                        {contact.firstName[0]}
                        {contact.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </div>
                        {contact.isFavorite && (
                          <StarIconSolid className="w-4 h-4 text-yellow-500 ml-1" />
                        )}
                      </div>
                      <div className="text-sm text-gray-700">
                        {contact.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {contact.company}
                    </div>
                    <div className="text-sm text-gray-700">
                      {contact.position}
                    </div>
                    <div className="text-xs text-gray-600">
                      {contact.industry}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getTypeBadge(contact.contactType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {contact.isInland ? (
                      <MapPinIcon className="w-4 h-4 text-blue-500 mr-1" />
                    ) : (
                      <GlobeEuropeAfricaIcon className="w-4 h-4 text-purple-500 mr-1" />
                    )}
                    <div>
                      <div className="text-sm text-gray-900">
                        {contact.location}
                      </div>
                      <div className="text-xs text-gray-700">
                        {contact.country}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {contact.lastContact ? formatDate(contact.lastContact) : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getFollowUpBadge(contact.nextFollowUp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button className="text-blue-600 hover:text-blue-900 p-1">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button className="text-indigo-600 hover:text-indigo-900 p-1">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900 p-1">
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900 p-1">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <UserIcon className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Keine Kontakte gefunden
            </h3>
            <p>
              Versuchen Sie andere Suchkriterien oder fügen Sie einen neuen
              Kontakt hinzu.
            </p>
            <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Ersten Kontakt hinzufügen
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kontakte</h1>
          <p className="mt-2 text-gray-600">
            Verwalten Sie Ihr berufliches Netzwerk und Recruiting-Kontakte.
          </p>
          {contactsLoading && (
            <p className="text-sm text-gray-500 mt-1">Lade Kontakte...</p>
          )}
          {contactsError && (
            <p className="text-sm text-red-600 mt-1">{contactsError}</p>
          )}
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
          <UserPlusIcon className="w-4 h-4 mr-2" />
          Neuer Kontakt
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Gesamt</p>
              <p className="text-xl font-bold text-gray-900">
                {contactsLoading ? "…" : contacts.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <StarIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Favoriten</p>
              <p className="text-xl font-bold text-gray-900">
                {contacts.filter((c) => c.isFavorite).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CalendarDaysIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Follow-ups</p>
              <p className="text-xl font-bold text-gray-900">
                {contacts.filter((c) => c.nextFollowUp).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <GlobeEuropeAfricaIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">International</p>
              <p className="text-xl font-bold text-gray-900">
                {contacts.filter((c) => !c.isInland).length}
              </p>
            </div>
          </div>
        </div>

        {Object.entries(contactTypes)
          .slice(0, 2)
          .map(([type, config]) => {
            const count = contacts.filter((c) => c.contactType === type).length;
            const Icon = config.icon;
            return (
              <div
                key={type}
                className="bg-white p-4 rounded-lg border border-gray-200"
              >
                <div className="flex items-center">
                  <div
                    className={`p-2 rounded-lg ${config.color
                      .replace("text-", "bg-")
                      .replace("-800", "-100")}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">{config.label}</p>
                    <p className="text-xl font-bold text-gray-900">{count}</p>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Duplicate Finder */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-gray-900">Duplikate finden & mergen</p>
            <p className="text-xs text-gray-600">Fuzzy (Jaro-Winkler + TF-IDF) auf Name + E-Mail + Firma.</p>
          </div>
          <button
            type="button"
            onClick={loadDuplicates}
            disabled={dupLoading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {dupLoading ? "Prüfe..." : "Duplikate prüfen"}
          </button>
        </div>

        {dupError && <p className="text-sm text-red-600">{dupError}</p>}

        {dupPairs.length > 0 && (
          <div className="divide-y divide-gray-200">
            {dupPairs.map((pair) => {
              const cA = contacts.find((c) => c.id === pair.a);
              const cB = contacts.find((c) => c.id === pair.b);
              if (!cA || !cB) return null;

              const keepA = () => mergeDuplicate(cA.id, cB.id);
              const keepB = () => mergeDuplicate(cB.id, cA.id);

              return (
                <div key={`${pair.a}-${pair.b}`} className="py-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-semibold">Score {(pair.score * 100).toFixed(0)}%</span>
                    <span className="text-xs text-gray-500">{pair.reasons.join(" · ")}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border rounded-lg p-3">
                      <p className="font-semibold text-gray-900">{cA.firstName} {cA.lastName}</p>
                      <p className="text-sm text-gray-700">{cA.company}</p>
                      <p className="text-xs text-gray-500">{cA.email}</p>
                      <button
                        type="button"
                        onClick={keepA}
                        disabled={dupLoading}
                        className="mt-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        Behalten & mergen
                      </button>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="font-semibold text-gray-900">{cB.firstName} {cB.lastName}</p>
                      <p className="text-sm text-gray-700">{cB.company}</p>
                      <p className="text-xs text-gray-500">{cB.email}</p>
                      <button
                        type="button"
                        onClick={keepB}
                        disabled={dupLoading}
                        className="mt-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        Diesen behalten & mergen
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!dupLoading && dupPairs.length === 0 && (
          <p className="text-sm text-gray-600">Noch keine Duplikate geladen. Prüfen starten.</p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                id="contacts-search"
                name="search"
                type="text"
                placeholder="Nach Name, Unternehmen, Position oder Tags suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg placeholder-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center">
            <FunnelIcon className="w-4 h-4 text-gray-600 mr-2" />
            <select
              id="contacts-type-filter"
              name="typeFilter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle Typen</option>
              {Object.entries(contactTypes).map(([type, config]) => (
                <option key={type} value={type}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              id="contacts-location-filter"
              name="locationFilter"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle Standorte</option>
              {allLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* Favorites Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="favorites-only"
              name="favoritesOnly"
              checked={showFavoritesOnly}
              onChange={(e) => setShowFavoritesOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="favorites-only"
              className="ml-2 text-sm text-gray-700"
            >
              Nur Favoriten
            </label>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${
                viewMode === "grid"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM11 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM11 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 border-l border-gray-300 ${
                viewMode === "list"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 000 2h14a1 1 0 100-2H3zM3 8a1 1 0 000 2h14a1 1 0 100-2H3zM3 12a1 1 0 100 2h14a1 1 0 100-2H3z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Contacts View */}
      {viewMode === "grid" ? <ContactGridView /> : <ContactListView />}

      {/* Results Summary */}
      {filteredContacts.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          {filteredContacts.length} von {contacts.length} Kontakten angezeigt
        </div>
      )}
    </div>
  );
}
