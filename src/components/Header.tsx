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
  return (
    <header className="mb-8 bg-white border-2 border-[#141414] rounded-none p-6 sm:p-8 shadow-[6px_6px_0px_#141414] relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <TrendingUp className="w-48 h-48 text-[#141414]" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="bg-emerald-100 text-[#141414] text-[10px] font-bold uppercase tracking-wider px-3 py-1 border border-[#141414] flex items-center space-x-1 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Source : Sika Finance</span>
            </span>
            <span className="text-xs text-[#141414]/60 font-mono">2026-07-10 (UTC)</span>
          </div>
          <h1 className="text-3xl font-black text-[#141414] uppercase tracking-tighter italic font-sans mb-1">
            Suivi de l'Indice BRVM 30
          </h1>
          <p className="text-[#141414]/70 text-xs font-mono max-w-2xl leading-relaxed">
            Suivez en temps réel les performances des 30 actions les plus dynamiques de la BRVM. 
            Vérifiez la régularité du versement des dividendes sur 5 ans grâce à l'analyseur Gemini AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={brvm30Url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-[#141414] text-xs font-bold uppercase tracking-wider py-3 px-5 rounded-none border-2 border-[#141414] shadow-[3px_3px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 transition-all duration-100"
            id="btn-brvm30-pdf"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>Composition PDF</span>
          </a>

          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            className={`inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-none shadow-[3px_3px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 transition-all duration-100 ${
              isSyncing
                ? "bg-blue-100 text-blue-800 border-2 border-blue-800 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-800 cursor-pointer"
            }`}
            id="btn-sync-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-blue-900" : "text-white"}`} />
            <span>{isSyncing ? "Synchronisation..." : "Synchroniser manuellement"}</span>
          </button>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-[#141414] flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono uppercase">
        <div className="flex items-center space-x-2 text-[#141414]/70">
          <span className="inline-block w-2.5 h-2.5 bg-blue-500 border border-[#141414]" />
          <span>Mise à jour automatique quotidienne (Hobby plan)</span>
        </div>
        <div className="text-[#141414]/60">
          Dernière synchronisation : <span className="text-blue-700 font-bold">{formatDate(lastSync)}</span>
        </div>
      </div>
    </header>
  );
};
