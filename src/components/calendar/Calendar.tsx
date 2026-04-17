"use client";
import { useAppUser } from "@/hooks/useAppUser";

import { useEffect, useState, type ReactNode } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  VideoCameraIcon,
  HomeIcon,
  XMarkIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";

interface CalendarEvent {
  id: string;
  title: string;
  company?: string | null;
  type:
    | "INTERVIEW_PHONE"
    | "INTERVIEW_VIDEO"
    | "INTERVIEW_ONSITE"
    | "DEADLINE"
    | "FOLLOW_UP";
  date: string;
  time: string;
  location?: string;
  notes?: string;
  duration?: number; // in minutes
  isInland: boolean;
  application?: {
    companyName?: string | null;
    position?: string | null;
  };
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export default function Calendar() {
  const { id: userId } = useAppUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    company: "",
    type: "INTERVIEW_VIDEO" as CalendarEvent["type"],
    date: "",
    time: "",
    duration: "",
    location: "",
    notes: "",
    isInland: true,
  });

  useEffect(() => {
    if (!userId) return;

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const loadEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          userId: userId,
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
        });

        const response = await fetch(`/api/events?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Event fetch failed (${response.status})`);
        }

        const data = (await response.json()) as CalendarEvent[];
        setEvents(data);
      } catch (err) {
        console.error("Calendar events fetch failed", err);
        setError("Termine konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [userId, currentDate]);
  const eventTypeConfig = {
    INTERVIEW_PHONE: {
      label: "Telefon Interview",
      color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-100 dark:border-blue-700",
      icon: PhoneIcon,
    },
    INTERVIEW_VIDEO: {
      label: "Video Interview",
      color: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-100 dark:border-purple-700",
      icon: VideoCameraIcon,
    },
    INTERVIEW_ONSITE: {
      label: "Vor-Ort Interview",
      color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-100 dark:border-green-700",
      icon: MapPinIcon,
    },
    DEADLINE: {
      label: "Bewerbungsfrist",
      color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-100 dark:border-red-700",
      icon: ClockIcon,
    },
    FOLLOW_UP: {
      label: "Follow-up",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-100 dark:border-yellow-700",
      icon: UserIcon,
    },
  };

  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();

    // Previous month days
    while (startDate < firstDay) {
      const eventsForDay = events.filter(
        (event) =>
          new Date(event.date).toDateString() === startDate.toDateString()
      );
      days.push({
        date: new Date(startDate),
        isCurrentMonth: false,
        isToday: startDate.toDateString() === today.toDateString(),
        events: eventsForDay,
      });
      startDate.setDate(startDate.getDate() + 1);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const eventsForDay = events.filter(
        (event) =>
          new Date(event.date).toDateString() === dayDate.toDateString()
      );
      days.push({
        date: dayDate,
        isCurrentMonth: true,
        isToday: dayDate.toDateString() === today.toDateString(),
        events: eventsForDay,
      });
    }

    // Next month days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const dayDate = new Date(year, month + 1, i);
      const eventsForDay = events.filter(
        (event) =>
          new Date(event.date).toDateString() === dayDate.toDateString()
      );
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        isToday: dayDate.toDateString() === today.toDateString(),
        events: eventsForDay,
      });
    }

    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("de-DE", {
      month: "long",
      year: "numeric",
    });
  };

  const formatEventTime = (time: string, duration?: number) => {
    if (duration) {
      const [hours, minutes] = time.split(":");
      const startTime = new Date();
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const endTime = new Date(startTime.getTime() + duration * 60000);

      return `${time} - ${endTime.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return time;
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return events
      .filter((event) => new Date(event.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  };

  const getEventIcon = (type: CalendarEvent["type"]) => {
    const config = eventTypeConfig[type];
    const Icon = config.icon;
    return <Icon className="w-4 h-4" />;
  };

  const days = getDaysInMonth(currentDate);
  const upcomingEvents = getUpcomingEvents();

  const resetForm = () => {
    setForm({
      title: "",
      company: "",
      type: "INTERVIEW_VIDEO",
      date: selectedDate ? selectedDate.toISOString().slice(0, 10) : "",
      time: "",
      duration: "",
      location: "",
      notes: "",
      isInland: true,
    });
  };

  const handleCreate = async () => {
    if (!form.title || !form.type || !form.date) {
      setError("Titel, Typ und Datum sind Pflichtfelder.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          company: form.company || undefined,
          type: form.type,
          date: form.date,
          time: form.time || "",
          duration: form.duration ? Number(form.duration) : undefined,
          location: form.location || undefined,
          notes: form.notes || undefined,
          isInland: form.isInland,
        }),
      });

      if (!response.ok) {
        throw new Error(`Event create failed (${response.status})`);
      }

      setShowCreate(false);
      resetForm();

      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const params = new URLSearchParams({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
      });
      const refreshed = await fetch(`/api/events?${params.toString()}`);
      if (refreshed.ok) {
        const data = (await refreshed.json()) as CalendarEvent[];
        setEvents(data);
      }
    } catch (err) {
      console.error("Calendar create failed", err);
      setError("Termin konnte nicht erstellt werden.");
    } finally {
      setSaving(false);
    }
  };

  const tone = {
    panel: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white",
    border: "border-slate-800",
    glass: "bg-white/90 backdrop-blur",
  };

  return (
    <div className="calendar-shell space-y-6">
      {/* Header */}
      <div className={`${tone.panel} rounded-xl p-6 shadow-lg border ${tone.border}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
              <CalendarDaysIcon className="h-4 w-4" />
              Bewerbungs-Kalender
            </div>
            <h1 className="mt-3 text-3xl font-bold text-white">Kalender</h1>
            <p className="mt-2 text-slate-200/80">
              Termine, Interviews und Deadlines im Blick – kein Platz für Überraschungen.
            </p>
            {error && <p className="text-sm text-red-200 mt-2">{error}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg bg-white/10 px-4 py-3 text-sm text-slate-100">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                <span>Upcoming</span>
              </div>
              <div className="mt-1 text-lg font-semibold">
                {upcomingEvents.length} Termine
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreate(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-white text-slate-900 px-4 py-2 font-semibold shadow hover:-translate-y-0.5 hover:shadow-md transition duration-150"
            >
              <PlusIcon className="w-4 h-4" />
              Termin hinzufügen
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-(--card) rounded-lg border border-slate-200 dark:border-(--border) overflow-hidden shadow-sm transition-colors">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-(--border) transition-colors">
              <h2 className="text-lg font-semibold">
                {formatMonthYear(currentDate)}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-400 shadow-sm transition"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateMonth("next")}
                  className="p-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-400 shadow-sm transition"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0">
              {/* Days of week header */}
              {"So Mo Di Mi Do Fr Sa".split(" ").map((day) => (
                <div
                  key={day}
                  className="bg-slate-50 dark:bg-slate-900 p-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-(--border)"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {days.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`min-h-30 p-3 border-r border-b border-slate-200 dark:border-(--border) ${
                    selectedDate?.toDateString() === day.date.toDateString()
                      ? "bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-inset ring-indigo-400"
                      : !day.isCurrentMonth
                      ? "bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-600"
                      : day.isToday
                      ? "bg-blue-50 dark:bg-blue-900/40"
                      : "bg-white dark:bg-slate-950"
                  } hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors`}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <div
                    className={`text-sm font-semibold ${
                      day.isToday
                        ? "text-white bg-blue-600 w-8 h-8 inline-flex items-center justify-center rounded-full shadow"
                        : day.isCurrentMonth
                        ? "text-slate-700 dark:text-slate-100"
                        : "text-slate-400 dark:text-slate-600"
                    }`}
                  >
                    {day.date.getDate()}
                  </div>

                  {/* Events for this day */}
                  <div className="mt-1 space-y-1">
                    {day.events.slice(0, 3).map((event) => {
                      const config = eventTypeConfig[event.type];
                      return (
                        <div
                          key={event.id}
                              className={`text-xs p-1 rounded truncate border ${config.color} shadow-sm`}
                          title={`${event.time} - ${event.title} bei ${
                            event.company || event.application?.companyName || ""
                          }`}
                        >
                          <div className="flex items-center">
                            {event.isInland ? (
                              <HomeIcon className="w-3 h-3 mr-1" />
                            ) : (
                              <MapPinIcon className="w-3 h-3 mr-1" />
                            )}
                            <span>
                              {event.time} {event.title}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {day.events.length > 3 && (
                      <div className="text-xs text-gray-500 pl-1">
                        +{day.events.length - 3} weitere
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
          {/* Sidebar */}
          <div className="space-y-6">

          {/* Selected Day Detail */}
          {selectedDate && (
            <div className="bg-(--card) rounded-lg border border-indigo-200 dark:border-indigo-700 p-5 shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {selectedDate.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { resetForm(); setShowCreate(true); }}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  >
                    <PlusIcon className="w-3 h-3" /> Termin
                  </button>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-slate-400 hover:text-slate-600 transition"
                    aria-label="Schließen"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {(() => {
                const dayEvents = events.filter(
                  (e) => new Date(e.date).toDateString() === selectedDate.toDateString()
                );
                if (dayEvents.length === 0) {
                  return (
                    <p className="text-sm text-slate-400 py-3 text-center">
                      Keine Termine an diesem Tag.
                    </p>
                  );
                }
                return (
                  <div className="space-y-2">
                    {dayEvents.map((event) => {
                      const config = eventTypeConfig[event.type];
                      return (
                        <div
                          key={event.id}
                          className={`rounded-lg border p-3 ${config.color}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {getEventIcon(event.type)}
                            <span className="text-xs font-semibold">{config.label}</span>
                            <span className="ml-auto text-xs font-mono">{event.time}</span>
                          </div>
                          <p className="font-semibold text-sm">{event.title}</p>
                          {(event.company || event.application?.companyName) && (
                            <p className="text-xs mt-0.5 opacity-80">
                              {event.company || event.application?.companyName}
                            </p>
                          )}
                          {event.location && (
                            <p className="text-xs mt-1 flex items-center gap-1 opacity-75">
                              <MapPinIcon className="w-3 h-3" /> {event.location}
                            </p>
                          )}
                          {event.notes && (
                            <p className="text-xs mt-1 italic opacity-75">{event.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Upcoming Events */}
          <div className="bg-(--card) rounded-lg border border-slate-200 dark:border-(--border) p-6 shadow-sm transition-colors">
            <div className="flex items-center mb-4">
              <CalendarDaysIcon className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Anstehende Termine
              </h3>
            </div>

            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-gray-500">Lädt...</p>
              ) : (
                <>
                  {upcomingEvents.map((event) => {
                    const config = eventTypeConfig[event.type];
                    return (
                      <div
                        key={event.id}
                        className="p-3 border border-slate-200 dark:border-(--border) rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color}`}
                              >
                                {getEventIcon(event.type)}
                                <span className="ml-1">{config.label}</span>
                              </span>
                              {event.isInland ? (
                                <HomeIcon className="w-3 h-3 ml-2 text-blue-500" />
                              ) : (
                                <MapPinIcon className="w-3 h-3 ml-2 text-purple-500" />
                              )}
                            </div>

                            <h4 className="font-medium text-gray-900 mt-2">
                              {event.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {event.company || event.application?.companyName}
                            </p>

                            <div className="mt-2 text-sm text-gray-500">
                              <div className="flex items-center">
                                <CalendarDaysIcon className="w-4 h-4 mr-1" />
                                {new Date(event.date).toLocaleDateString("de-DE")}
                              </div>
                              <div className="flex items-center mt-1">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                {formatEventTime(event.time, event.duration)}
                              </div>
                              {event.location && (
                                <div className="flex items-center mt-1">
                                  <MapPinIcon className="w-4 h-4 mr-1" />
                                  {event.location}
                                </div>
                              )}
                            </div>

                            {event.notes && (
                              <p className="mt-2 text-sm text-gray-600 italic">
                                {event.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {upcomingEvents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarDaysIcon className="mx-auto h-12 w-12 mb-4" />
                      <p>Keine anstehenden Termine</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-(--card) rounded-lg border border-slate-200 dark:border-(--border) p-6 shadow-sm transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Termine diesen Monat
            </h3>

            <div className="space-y-3">
              {Object.entries(eventTypeConfig).map(([type, config]) => {
                const count = events.filter(
                  (event) =>
                    event.type === type &&
                    new Date(event.date).getMonth() ===
                      currentDate.getMonth() &&
                    new Date(event.date).getFullYear() ===
                      currentDate.getFullYear()
                ).length;

                const Icon = config.icon;

                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-2 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        {config.label}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Drawer */}
      {showCreate && (
        <div className="fixed inset-0 z-30 flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Neuer Termin</p>
                <h4 className="text-lg font-semibold text-slate-900">Interview, Frist oder Follow-up anlegen</h4>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-full p-2 hover:bg-slate-100 transition"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-5">
              <Input
                label="Titel"
                value={form.title}
                onChange={(val) => setForm((f) => ({ ...f, title: val }))}
                placeholder="z.B. TechCorp Interview"
              />

              <div className="grid grid-cols-2 gap-3 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700">
                  Typ
                  <select
                    id="event-type"
                    name="type"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CalendarEvent["type"] }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INTERVIEW_PHONE">Telefon</option>
                    <option value="INTERVIEW_VIDEO">Video</option>
                    <option value="INTERVIEW_ONSITE">Vor Ort</option>
                    <option value="DEADLINE">Deadline</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Inland / Ausland
                  <div className="mt-1 flex items-center gap-3 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm">
                    <button
                      type="button"
                      className={`flex-1 rounded-md px-2 py-1 text-center transition ${
                        form.isInland ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-600"
                      }`}
                      onClick={() => setForm((f) => ({ ...f, isInland: true }))}
                    >
                      Inland
                    </button>
                    <button
                      type="button"
                      className={`flex-1 rounded-md px-2 py-1 text-center transition ${
                        !form.isInland ? "bg-purple-50 text-purple-700 border border-purple-200" : "text-slate-600"
                      }`}
                      onClick={() => setForm((f) => ({ ...f, isInland: false }))}
                    >
                      Ausland
                    </button>
                  </div>
                </label>
              </div>

              <Input
                label="Datum"
                type="date"
                value={form.date}
                onChange={(val) => setForm((f) => ({ ...f, date: val }))}
                placeholder=""
              />

              <Input
                label="Zeit"
                type="time"
                value={form.time}
                onChange={(val) => setForm((f) => ({ ...f, time: val }))}
                placeholder=""
                right={<ClockIcon className="h-4 w-4" />}
              />

              <Input
                label="Dauer (Minuten)"
                type="number"
                value={form.duration}
                onChange={(val) => setForm((f) => ({ ...f, duration: val }))}
                placeholder="45"
              />

              <Input
                label="Unternehmen"
                value={form.company}
                onChange={(val) => setForm((f) => ({ ...f, company: val }))}
                placeholder="z.B. NextGen AG"
                right={<BuildingOffice2Icon className="h-4 w-4" />}
              />

              <Input
                label="Ort / Link"
                value={form.location}
                onChange={(val) => setForm((f) => ({ ...f, location: val }))}
                placeholder="Büroadresse oder Video-Call-Link"
                right={<MapPinIcon className="h-4 w-4" />}
              />

              <TextArea
                label="Notizen"
                value={form.notes}
                onChange={(val) => setForm((f) => ({ ...f, notes: val }))}
                placeholder="Vorbereitungsfragen, Agenda, Teilnehmende..."
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
              <div className="text-sm text-slate-500">Echte Speicherung – keine Mock-Termine.</div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreate(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Speichern..." : "Termin speichern"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .calendar-shell input::placeholder,
        .calendar-shell textarea::placeholder {
          color: #374151 !important;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  right,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  right?: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1 relative">
        <input
          id={label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
          name={label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
        {right && (
          <div className="absolute inset-y-0 right-3 flex items-center text-slate-400 text-xs">
            {right}
          </div>
        )}
      </div>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700 md:col-span-2">
      {label}
      <textarea
        id={label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
        name={label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        rows={3}
      />
    </label>
  );
}
