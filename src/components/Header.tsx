import React from "react";
import { RefreshCw, TrendingUp, FileText, Sparkles } from "lucide-react";
import { formatDate } from "../utils/formatters";

interface HeaderProps {
  brvm30Url: string;
  isSyncing: boolean;
  lastSync: string;
  onTriggerSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  brvm30Url,
  isSyncing,
  lastSync,
  onTriggerSync
}) => {
  const syncStamp = lastSync ? formatDate(lastSync) : "En attente";

  return (
    <header className="mb-6 bg-white border-2 border-[#141414] shadow-[4px_4px_0px_#141414] px-4 sm:px-6 py-4 sm:py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <span className="bg-emerald-100 text-[#141414] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-[#141414] flex items-center space-x-1 font-mono">
            <Sparkles className="w-3 h-3 text-emerald-700" aria-hidden="true" />
            <span>Sika Finance</span>
          </span>
          <span className="text-xs text-[#141414]/70 font-mono">
            Cours du {syncStamp}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#141414] uppercase tracking-tight italic font-sans">
          Suivi BRVM 30
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {brvm30Url && (
          <a
            href={brvm30Url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Télécharger la composition PDF du BRVM 30"
            className="h-11 inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-[#141414] text-xs font-bold uppercase tracking-wider px-4 border-2 border-[#141414] shadow-[2px_2px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 transition-all focus-visible:ring-2 focus-visible:ring-rose-500"
            id="btn-brvm30-pdf"
          >
            <FileText className="w-4 h-4 text-rose-500" aria-hidden="true" />
            <span className="hidden sm:inline">Composition PDF</span>
          </a>
        )}

        <button
          onClick={onTriggerSync}
          disabled={isSyncing}
          aria-label={isSyncing ? "Synchronisation en cours" : "Synchroniser les cotations"}
          className={`h-11 inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider px-5 shadow-[2px_2px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${
            isSyncing
              ? "bg-blue-100 text-blue-800 border-2 border-blue-800 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white border-2 border-[#141414] cursor-pointer"
          }`}
          id="btn-sync-all"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-blue-900" : "text-white"}`} aria-hidden="true" />
          <span>{isSyncing ? "Sync…" : "Actualiser"}</span>
        </button>
      </div>
    </header>
  );
};
