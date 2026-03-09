"use client";

import { useState } from "react";
import {
  ChartBarIcon,
  DocumentChartBarIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface ApplicationStats {
  total: number;
  applied: number;
  reviewed: number;
  interviews: number;
  offers: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
}

interface MonthlyData {
  month: string;
  applications: number;
  interviews: number;
  offers: number;
  rejections: number;
}

interface LocationStats {
  location: string;
  country: string;
  isInland: boolean;
  applications: number;
  successRate: number;
}

interface CompanyStats {
  company: string;
  applications: number;
  interviews: number;
  offers: number;
  status: string;
}

export default function ReportsAnalytics() {
  // Echte Daten werden aus der API geladen
  const [applicationStats] = useState<ApplicationStats>({
    total: 0,
    applied: 0,
    reviewed: 0,
    interviews: 0,
    offers: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
  });

  const [monthlyData] = useState<MonthlyData[]>([]);

  const [locationStats] = useState<LocationStats[]>([]);

  const [companyStats] = useState<CompanyStats[]>([]);

  const [selectedTimeRange, setSelectedTimeRange] = useState("6months");

  const calculateSuccessRate = () => {
    const successfulApplications =
      applicationStats.accepted + applicationStats.offers;
    return ((successfulApplications / applicationStats.total) * 100).toFixed(1);
  };

  const calculateInterviewRate = () => {
    return (
      (applicationStats.interviews / applicationStats.total) *
      100
    ).toFixed(1);
  };

  const calculateResponseRate = () => {
    const responses = applicationStats.total - applicationStats.applied;
    return ((responses / applicationStats.total) * 100).toFixed(1);
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 75) return "text-green-600 bg-green-100";
    if (rate >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OFFER_RECEIVED":
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case "REJECTED":
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case "INTERVIEW_SCHEDULED":
      case "INTERVIEWED":
        return <CalendarDaysIcon className="w-4 h-4 text-blue-500" />;
      case "REVIEWED":
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCurrentTrend = () => {
    const currentMonth = monthlyData[monthlyData.length - 6];
    const previousMonth = monthlyData[monthlyData.length - 7];

    if (!currentMonth || !previousMonth) return { value: 0, isPositive: true };

    const change = currentMonth.applications - previousMonth.applications;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  const trend = getCurrentTrend();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="mt-2 text-gray-600">
            Detaillierte Einblicke in Ihre Bewerbungsaktivitäten und
            Erfolgsraten.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            id="time-range"
            name="timeRange"
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="3months">Letzte 3 Monate</option>
            <option value="6months">Letzte 6 Monate</option>
            <option value="12months">Letztes Jahr</option>
            <option value="all">Gesamter Zeitraum</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
            <DocumentChartBarIcon className="w-4 h-4 mr-2" />
            Report exportieren
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Erfolgsrate</p>
              <p className="text-2xl font-bold text-gray-900">
                {calculateSuccessRate()}%
              </p>
              <div className="flex items-center mt-1">
                {trend.isPositive ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm ${
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trend.value} vs. letzter Monat
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Interview-Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {calculateInterviewRate()}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {applicationStats.interviews} von {applicationStats.total}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Antwortrate</p>
              <p className="text-2xl font-bold text-gray-900">
                {calculateResponseRate()}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Unternehmen haben geantwortet
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Durchschnittliche Zeit</p>
              <p className="text-2xl font-bold text-gray-900">18 Tage</p>
              <p className="text-sm text-gray-500 mt-1">
                Bis zur ersten Antwort
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Application Status Overview */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bewerbungsstatus Übersicht
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {applicationStats.total}
            </div>
            <div className="text-sm text-gray-600">Gesamt</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {applicationStats.applied}
            </div>
            <div className="text-sm text-gray-600">Beworben</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {applicationStats.reviewed}
            </div>
            <div className="text-sm text-gray-600">Geprüft</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {applicationStats.interviews}
            </div>
            <div className="text-sm text-gray-600">Interviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {applicationStats.offers}
            </div>
            <div className="text-sm text-gray-600">Angebote</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {applicationStats.accepted}
            </div>
            <div className="text-sm text-gray-600">Angenommen</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {applicationStats.rejected}
            </div>
            <div className="text-sm text-gray-600">Abgelehnt</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {applicationStats.withdrawn}
            </div>
            <div className="text-sm text-gray-600">Zurückgezogen</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monatlicher Trend
          </h3>
          <div className="space-y-4">
            {monthlyData.slice(-6).map((data, index) => (
              <div
                key={data.month}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">
                    {data.month}
                  </span>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>{data.applications} Bewerbungen</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{data.interviews} Interviews</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span>{data.offers} Angebote</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location Performance */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Standort-Performance
          </h3>
          <div className="space-y-3">
            {locationStats.map((location, index) => (
              <div
                key={location.location}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {location.isInland ? (
                    <MapPinIcon className="w-4 h-4 text-blue-500" />
                  ) : (
                    <MapPinIcon className="w-4 h-4 text-purple-500" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">
                      {location.location}
                    </div>
                    <div className="text-sm text-gray-500">
                      {location.country}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {location.applications} Bewerbungen
                  </div>
                  <div
                    className={`text-sm px-2 py-1 rounded ${getSuccessRateColor(
                      location.successRate
                    )}`}
                  >
                    {location.successRate}% Erfolg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Company Performance */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Unternehmen-Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">
                  Unternehmen
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">
                  Bewerbungen
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">
                  Interviews
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">
                  Angebote
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">
                  Status
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">
                  Erfolgsrate
                </th>
              </tr>
            </thead>
            <tbody>
              {companyStats.map((company, index) => {
                const successRate =
                  company.applications > 0
                    ? ((company.offers / company.applications) * 100).toFixed(0)
                    : 0;
                return (
                  <tr
                    key={company.company}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {company.company}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {company.applications}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {company.interviews}
                    </td>
                    <td className="py-3 px-4 text-center">{company.offers}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        {getStatusIcon(company.status)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded text-sm ${getSuccessRateColor(
                          Number(successRate)
                        )}`}
                      >
                        {successRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Insights & Empfehlungen
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">🎯 Positive Trends</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Amsterdam hat die höchste Erfolgsrate (83%)</li>
              <li>• Interview-Rate liegt über dem Durchschnitt (32%)</li>
              <li>• Internationale Bewerbungen sind erfolgreich</li>
              <li>• Global Tech Inc. zeigt starke Performance</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">
              📈 Verbesserungsmöglichkeiten
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Follow-up-Rate bei ausstehenden Bewerbungen erhöhen</li>
              <li>• Mehr Bewerbungen in erfolgreichen Standorten</li>
              <li>• Bewerbungsunterlagen für Zürich optimieren</li>
              <li>• Netzwerk in Hamburg und Wien ausbauen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
