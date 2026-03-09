import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job-Match | BW-MANAGE",
  description: "Job-Matching-Funktion.",
};

export default function JobMatchPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Job-Match</h1>
        <p className="text-gray-600">Diese Funktion steht derzeit nicht zur Verfügung.</p>
      </div>
    </main>
  );
}
