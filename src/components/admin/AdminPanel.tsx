/* eslint-disable react-hooks/static-components */
"use client";

import { useState } from "react";
import {
  CogIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ServerIcon,
  CircleStackIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
  DocumentTextIcon,
  CpuChipIcon,
  SignalIcon,
  FireIcon,
  BugAntIcon,
} from "@heroicons/react/24/outline";

interface SystemMetric {
  name: string;
  value: string;
  status: "healthy" | "warning" | "critical";
  trend: "up" | "down" | "stable";
  lastUpdated: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "inactive" | "suspended";
  createdAt: string;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  environment: "development" | "staging" | "production";
  lastModified: string;
}

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
  status: "success" | "warning" | "error";
  ip: string;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "features" | "logs" | "system"
  >("overview");

  // Echte Admin-Daten werden aus der API geladen
  const [systemMetrics] = useState<SystemMetric[]>([]);

  const [users] = useState<User[]>([]);

  const [featureFlags] = useState<FeatureFlag[]>([]);

  const [activityLogs] = useState<ActivityLog[]>([]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "success":
      case "active":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case "warning":
      case "inactive":
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case "critical":
      case "error":
      case "suspended":
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMetricColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "border-green-200 bg-green-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "critical":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return "↗";
      case "down":
        return "↘";
      case "stable":
        return "→";
      default:
        return "•";
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* System Health */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemMetrics.map((metric) => (
            <div
              key={metric.name}
              className={`p-4 rounded-lg border ${getMetricColor(
                metric.status
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{metric.name}</h4>
                {getStatusIcon(metric.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  {metric.value}
                </span>
                <span className="text-sm text-gray-500">
                  {getTrendIcon(metric.trend)} {metric.trend}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Letztes Update: {formatDate(metric.lastUpdated)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <ArrowPathIcon className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <span className="text-sm font-medium">System Restart</span>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <CircleStackIcon className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <span className="text-sm font-medium">Database Backup</span>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <ShieldCheckIcon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <span className="text-sm font-medium">Security Scan</span>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <DocumentTextIcon className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <span className="text-sm font-medium">Generate Report</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="space-y-0">
            {activityLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-4 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {log.user} - {log.action} {log.resource}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(log.timestamp)} • IP: {log.ip}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const UsersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Benutzer-Management
        </h3>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          Neuer Benutzer
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Benutzer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rolle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role === "admin" ? "Administrator" : "Benutzer"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(user.status)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {user.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <CogIcon className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const FeaturesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Feature Flags</h3>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          Neues Feature Flag
        </button>
      </div>

      <div className="space-y-4">
        {featureFlags.map((flag) => (
          <div
            key={flag.id}
            className="bg-white p-6 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900">{flag.name}</h4>
                <p className="text-sm text-gray-500">{flag.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    flag.environment === "production"
                      ? "bg-green-100 text-green-800"
                      : flag.environment === "staging"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {flag.environment}
                </span>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    flag.enabled ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      flag.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Status:</span>
                <span
                  className={`ml-2 font-medium ${
                    flag.enabled ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  {flag.enabled ? "Aktiv" : "Inaktiv"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Rollout:</span>
                <span className="ml-2 font-medium">
                  {flag.rolloutPercentage}%
                </span>
              </div>
              <div>
                <span className="text-gray-500">Geändert:</span>
                <span className="ml-2 font-medium">
                  {formatDate(flag.lastModified)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const LogsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
        <div className="flex space-x-3">
          <select id="log-filter" name="logFilter" className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option>Alle Logs</option>
            <option>Nur Fehler</option>
            <option>Nur Warnungen</option>
            <option>Nur Erfolge</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zeitstempel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Benutzer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ressource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP-Adresse
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activityLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.resource}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(log.status)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {log.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const SystemTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        System-Konfiguration
      </h3>

      {/* Server Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Web Server</h4>
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className="font-medium text-green-600">Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Uptime:</span>
              <span className="font-medium">15 Tage 4h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Load:</span>
              <span className="font-medium">0.23</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Database</h4>
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className="font-medium text-green-600">Connected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Connections:</span>
              <span className="font-medium">45/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Size:</span>
              <span className="font-medium">1.2 GB</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Cache</h4>
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Hit Rate:</span>
              <span className="font-medium text-yellow-600">78%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Memory:</span>
              <span className="font-medium">512 MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Keys:</span>
              <span className="font-medium">1,247</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Controls */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">System Controls</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <CpuChipIcon className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <span className="text-sm font-medium">Clear Cache</span>
          </button>
          <button className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <CircleStackIcon className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <span className="text-sm font-medium">Backup DB</span>
          </button>
          <button className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <ArrowPathIcon className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <span className="text-sm font-medium">Restart Services</span>
          </button>
          <button className="p-3 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <BugAntIcon className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <span className="text-sm font-medium">Debug Mode</span>
          </button>
        </div>
      </div>

      {/* Performance Monitoring */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">
          Performance Monitoring
        </h4>
        <div className="space-y-4">
          {systemMetrics.map((metric) => (
            <div
              key={metric.name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <SignalIcon
                  className={`w-5 h-5 ${
                    metric.status === "healthy"
                      ? "text-green-500"
                      : metric.status === "warning"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                />
                <span className="font-medium">{metric.name}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-lg font-bold">{metric.value}</span>
                <span className="text-sm text-gray-500">
                  {getTrendIcon(metric.trend)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: "overview", label: "Übersicht", icon: ChartBarIcon },
    { id: "users", label: "Benutzer", icon: UserGroupIcon },
    { id: "features", label: "Features", icon: CogIcon },
    { id: "logs", label: "Logs", icon: DocumentTextIcon },
    { id: "system", label: "System", icon: ServerIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Warning */}
      <div className="bg-red-500 text-white text-center py-3 px-4 rounded-lg">
        <div className="flex items-center justify-center space-x-2">
          <ShieldCheckIcon className="w-5 h-5" />
          <span className="font-medium">
            🚨 ADMIN PANEL - Nur für Administratoren
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-gray-600">
            Erweiterte System-Verwaltung und Monitoring-Tools.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">System Online</span>
          </div>
          <span className="text-sm text-gray-500" suppressHydrationWarning>
            {formatDate(new Date().toISOString())}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "features" && <FeaturesTab />}
        {activeTab === "logs" && <LogsTab />}
        {activeTab === "system" && <SystemTab />}
      </div>
    </div>
  );
}
