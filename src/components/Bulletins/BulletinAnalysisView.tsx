import React from "react";
import { FileText, Sparkles, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BulletinItem } from "./BulletinsSidebar";

interface BulletinAnalysisViewProps {
  selectedBulletin: BulletinItem | null;
  bulletinAnalysis: string | null;
  bulletinSources: { title: string; uri: string }[];
  isAnalyzingBulletin: boolean;
  analysisError: string | null;
  bulletinLoadingStep: number;
  onRunAnalysis: (bulletin: BulletinItem) => void;
}

export const BulletinAnalysisView: React.FC<BulletinAnalysisViewProps> = ({
  selectedBulletin,
  bulletinAnalysis,
  bulletinSources,
  isAnalyzingBulletin,
  analysisError,
  bulletinLoadingStep,
  onRunAnalysis
}) => {
  if (!selectedBulletin) {
    return (
      <div className="lg:col-span-8 bg-slate-100 border-2 border-dashed border-[#141414]/20 rounded-none h-full flex flex-col items-center justify-center py-32 text-[#141414]/60 font-mono text-xs">
        <span>Sélectionnez un bulletin dans la colonne de gauche pour l'analyser.</span>
      </div>
    );
  }

  return (
    <div className="lg:col-span-8 bg-white border-2 border-[#141414] rounded-none p-6 shadow-[4px_4px_0px_#141414] min-h-[550px] flex flex-col justify-between animate-fade-in">
      <div>
        {/* Header of analysis card */}
        <div className="border-b-2 border-[#141414] pb-4 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="bg-amber-100 text-[#141414] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border border-[#141414] font-mono">
                {selectedBulletin.dateCode === new Date().toISOString().slice(0, 10).replace(/-/g, "") ? "Séance du Jour" : "Bulletin de Cote"}
              </span>
              <span className="text-[10px] text-[#141414]/60 font-mono">
                BOC_{selectedBulletin.dateCode}
              </span>
            </div>
            <h2 className="text-xl font-black text-[#141414] uppercase tracking-tight font-sans italic">
              {selectedBulletin.dateStr}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={selectedBulletin.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 bg-[#E4E3E0]/30 hover:bg-[#E4E3E0]/50 text-[#141414] text-[10px] font-bold uppercase tracking-wider py-2 px-3 border border-[#141414] font-mono"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF d'Origine</span>
            </a>

            {!bulletinAnalysis && !isAnalyzingBulletin && (
              <button
                onClick={() => onRunAnalysis(selectedBulletin)}
                className="inline-flex items-center space-x-1.5 bg-[#141414] hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider py-2 px-4 border border-[#141414] font-mono shadow-[2px_2px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Lancer l'analyse IA</span>
              </button>
            )}
          </div>
        </div>

        {/* Analysis Content */}
        {isAnalyzingBulletin ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#141414] border-t-amber-500 rounded-full animate-spin" />
              <Sparkles className="w-6 h-6 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div className="text-center space-y-2 max-w-md">
              <h4 className="text-xs font-black uppercase font-mono tracking-wider text-[#141414]">
                Analyse en cours avec Gemini
              </h4>
              <p className="text-[11px] font-mono text-amber-700 font-bold bg-amber-50 border border-amber-200 px-4 py-2 transition-all">
                {bulletinLoadingStep === 0 && "🔍 Scraping en cours du Bulletin Officiel de la Cote..."}
                {bulletinLoadingStep === 1 && "📈 Analyse des indices BRVM Composite, Prestige et BRVM 30..."}
                {bulletinLoadingStep === 2 && "📊 Extraction de la capitalisation globale et volumes d'échanges..."}
                {bulletinLoadingStep === 3 && "💸 Identification des détachements de dividendes & émissions d'obligations..."}
                {bulletinLoadingStep >= 4 && "⚡ Synthèse du rapport financier global..."}
              </p>
              <p className="text-[10px] text-[#141414]/50 leading-relaxed font-mono">
                Grâce au Google Grounding, l'IA effectue des recherches en temps réel pour corroborer et enrichir les informations officielles du bulletin du {selectedBulletin.dateStr}.
              </p>
            </div>
          </div>
        ) : analysisError ? (
          <div className="bg-rose-50 border-2 border-rose-300 p-5 rounded-none font-mono text-xs text-rose-800 space-y-3">
            <div className="font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Une erreur est survenue lors de l'analyse</span>
            </div>
            <p>{analysisError}</p>
            <button
              onClick={() => onRunAnalysis(selectedBulletin)}
              className="bg-white border border-rose-400 px-3 py-1.5 text-[10px] font-bold text-rose-900 uppercase tracking-wider hover:bg-rose-100 transition-all"
            >
              Réessayer l'analyse
            </button>
          </div>
        ) : bulletinAnalysis ? (
          <div className="space-y-6">
            <div className="prose prose-sm max-w-none text-[#141414]">
              <div className="text-[13px] font-sans leading-relaxed text-[#141414]/90 bg-slate-50 border-2 border-[#141414] p-5 shadow-[3px_3px_0px_#141414] rounded-none overflow-x-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-lg font-black uppercase text-[#141414] mt-4 mb-2 font-sans border-b border-[#141414]/20 pb-1">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold uppercase text-[#141414] mt-4 mb-2 font-sans">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold text-[#141414] mt-3 mb-1 font-sans">{children}</h3>,
                    p: ({ children }) => <p className="mb-3 leading-relaxed font-sans">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 font-sans">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 font-sans">{children}</ol>,
                    li: ({ children }) => <li className="font-sans">{children}</li>,
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4 border-2 border-[#141414]">
                        <table className="w-full text-left border-collapse text-xs font-mono">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-[#141414] text-[#E4E3E0] uppercase font-bold">{children}</thead>,
                    tbody: ({ children }) => <tbody className="divide-y divide-[#141414]/20 bg-white">{children}</tbody>,
                    tr: ({ children }) => <tr className="hover:bg-slate-100">{children}</tr>,
                    th: ({ children }) => <th className="p-2 border border-[#141414]/20 font-bold">{children}</th>,
                    td: ({ children }) => <td className="p-2 border border-[#141414]/20">{children}</td>,
                    strong: ({ children }) => <strong className="font-bold text-[#141414]">{children}</strong>,
                  }}
                >
                  {bulletinAnalysis}
                </ReactMarkdown>
              </div>
            </div>

            {/* Grounding Sources */}
            {bulletinSources.length > 0 && (
              <div className="border-t border-[#141414]/10 pt-4 mt-6">
                <h4 className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider mb-2.5 font-mono flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sources consultées par l'IA :</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {bulletinSources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 bg-white hover:bg-slate-50 text-[#141414] border border-[#141414] px-2.5 py-1 text-[10px] font-mono tracking-tight"
                    >
                      <span className="w-1 h-1 bg-[#141414] rounded-full" />
                      <span className="truncate max-w-[200px]">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 border-2 border-dashed border-[#141414]/10 bg-slate-50">
            <Sparkles className="w-10 h-10 text-amber-500" />
            <div className="text-center space-y-1.5">
              <h4 className="text-xs font-black uppercase font-mono text-[#141414]">
                Aucune analyse générée pour cette séance
              </h4>
              <p className="text-[11px] text-[#141414]/60 max-w-sm mx-auto font-mono leading-relaxed">
                Cliquez sur le bouton ci-dessous pour démarrer l'agent d'analyse financière intelligent avec Gemini.
              </p>
            </div>
            <button
              onClick={() => onRunAnalysis(selectedBulletin)}
              className="inline-flex items-center space-x-1.5 bg-[#141414] hover:bg-black text-[#E4E3E0] text-[10px] font-bold uppercase tracking-wider py-2.5 px-5 border-2 border-[#141414] shadow-[3px_3px_0px_#141414] font-mono active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Démarrer l'analyse de séance</span>
            </button>
          </div>
        )}
      </div>

      {/* Disclaimer banner */}
      <div className="mt-8 pt-4 border-t border-[#141414]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px] font-mono text-[#141414]/50">
        <span>
          Avertissement : Les analyses financières IA sont des synthèses automatisées et ne constituent pas des conseils d'investissement.
        </span>
        <span className="font-bold text-[#141414]/70">Suivi BRVM 30</span>
      </div>
    </div>
  );
};
