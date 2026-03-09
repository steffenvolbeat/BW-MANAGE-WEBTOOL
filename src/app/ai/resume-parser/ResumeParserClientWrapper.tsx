"use client";

import dynamic from "next/dynamic";

const ResumeParser = dynamic(
  () => import("@/components/ai/ResumeParser"),
  { ssr: false }
);

export default function ResumeParserClientWrapper() {
  return <ResumeParser />;
}
