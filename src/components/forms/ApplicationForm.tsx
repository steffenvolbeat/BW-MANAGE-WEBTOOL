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
  country: string;
  isInland: boolean;
  jobType: string;
  salary: string;
  jobUrl: string;
  companyUrl: string;
  description: string;
  requirements: string;
  priority: string;
  status: string;
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
    country: "Deutschland",
    isInland: true,
    jobType: "FULLTIME",
    salary: "",
    jobUrl: "",
    companyUrl: "",
    description: "",
    requirements: "",
    priority: "MEDIUM",
    status: "APPLIED",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    {
      value: "REVIEWED",
      label: "Geprüft",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "INTERVIEW_SCHEDULED",
      label: "Interview geplant",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "INTERVIEWED",
      label: "Interview geführt",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "OFFER_RECEIVED",
      label: "Angebot erhalten",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "ACCEPTED",
      label: "Angenommen",
      color: "bg-emerald-100 text-emerald-800",
    },
    {
      value: "REJECTED",
      label: "Abgelehnt",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "WITHDRAWN",
      label: "Zurückgezogen",
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "OTHER",
      label: "Sonstiges",
      color: "bg-slate-100 text-slate-800",
    },
  ];

  const countries = [
    "Deutschland",
    "Österreich",
    "Schweiz",
    "Niederlande",
    "Belgien",
    "Frankreich",
    "Vereinigtes Königreich",
    "USA",
    "Kanada",
    "Australien",
  ];

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
      }));
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

            {/* Inland/Ausland Toggle */}
            <div className="md:col-span-2">
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

            {/* Land */}
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
