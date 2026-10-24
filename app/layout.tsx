import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RunbookAI - Enterprise Runbook & Incident Troubleshooting Engine",
  description: "Automated Runbooks, Install Guides, Application Recovery Guides, and SME Incident Triage.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
        <div className="fixed bottom-4 right-4 z-50">
          <a
            href="https://github.com/TejdeepKodati/runbook-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 shadow-xl backdrop-blur transition-all"
          >
            made with ♥ by Tejdeep
          </a>
        </div>
      </body>
    </html>
  );
}
