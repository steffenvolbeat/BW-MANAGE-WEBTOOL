"use client";
import dynamic from "next/dynamic";

// Nur client-seitig laden, kein SSR nötig
const JobCoachDrawer = dynamic(
  () => import("@/components/ai/JobCoachDrawer"),
  { ssr: false }
);

export default function JobCoachProvider() {
  return <JobCoachDrawer />;
}
