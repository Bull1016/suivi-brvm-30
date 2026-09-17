import React from "react";
import {
  Building2,
  ExternalLink,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StockData } from "../types";
import { SECTOR_CONFIG, COUNTRIES_MAP } from "../constants/brvmData";
import { formatPrice } from "../utils/formatters";

interface StockDetailDrawerProps {
  selectedStock: StockData | null;
  onClose: () => void;
  companyDescription: string | null;
  isFetchingDescription: boolean;
  isUpdatingDividends: boolean;
  dividendUpdateMsg: string | null;
  onSyncDividends: (symbol: string) => void;
  lastYear: number;
}

export const StockDetailDrawer: React.FC<StockDetailDrawerProps> = ({
  selectedStock,
  onClose,
  companyDescription,
  isFetchingDescription,
  isUpdatingDividends,
  dividendUpdateMsg,
  onSyncDividends,
  lastYear
}) => {
  const prefersReducedMotion = typeof window !== "undefined"
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  return (
    <AnimatePresence>
      {selectedStock && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0.6 } : { opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 0.6 } : { opacity: 0.6 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            onClick={onClose}
            className="fixed inset-0 bg-[#141414] z-40"
          />

          {/* Panel */}
          <motion.div
            initial={prefersReducedMotion ? { x: 0 } : { x: "100%" }}
            animate={prefersReducedMotion ? { x: 0 } : { x: 0 }}
            exit={prefersReducedMotion ? { x: "100%" } : { x: "100%" }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white border-l-4 border-[#141414] shadow-2xl z-50 overflow-y-auto flex flex-col font-mono text-xs text-[#141414] overscroll-behavior-contain"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b-2 border-[#141414] flex items-center justify-between bg-[#E4E3E0]/40">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white border-2 border-[#141414] rounded-none shadow-[2px_2px_0px_#141414] text-[#141414]">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-xs bg-[#141414] text-[#E4E3E0] px-2 py-0.5 rounded-none font-mono font-bold">
                      {selectedStock.symbol}
                    </span>
                    <span>{COUNTRIES_MAP[selectedStock.country]?.flag}</span>
                    {selectedStock.sector && SECTOR_CONFIG[selectedStock.sector] && (
                      <a
                        href={SECTOR_CONFIG[selectedStock.sector].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Voir la page officielle du secteur BRVM: ${selectedStock.sector}`}
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-tight border shadow-[1px_1px_0px_#141414] hover:opacity-80 transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                          SECTOR_CONFIG[selectedStock.sector].badgeBg
                        }`}
                        title={`Voir la page officielle du secteur BRVM: ${selectedStock.sector}`}
                      >
                        <span>{SECTOR_CONFIG[selectedStock.sector].icon}</span>
                        <span>{selectedStock.sector}</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-60" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                  <h2 className="text-base font-black text-[#141414] mt-1 leading-tight font-sans uppercase">
                    {selectedStock.name}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Fermer le panneau de détails"
                className="p-2 text-[#141414] hover:bg-[#141414]/10 rounded-none transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 flex-1 space-y-6">
              {/* Company Description Box */}
              <div className="bg-white border-2 border-[#141414] p-4 rounded-none shadow-[3px_3px_0px_#141414] text-xs">
                <h4 className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider block mb-2 font-mono">
                  Description de l'entreprise
                </h4>
                {isFetchingDescription ? (
                  <div className="flex items-center space-x-2 text-[#141414]/60 py-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span className="font-mono">Chargement de la description officielle…</span>
                  </div>
                ) : companyDescription ? (
                  <p className="text-[#141414] font-sans leading-relaxed text-[11px] whitespace-pre-line">
                    {companyDescription}
                  </p>
                ) : (
                  <p className="text-[#141414]/60 font-mono py-1">
                    Impossible de charger la description de cette entreprise.
                  </p>
                )}
              </div>

              {/* Financial Summary Bento */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#E4E3E0]/30 border-2 border-[#141414] p-4 rounded-none shadow-[3px_3px_0px_#141414]">
                  <span className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider block">
                    Dernier Cours
                  </span>
                  <span className="text-xl font-bold text-[#141414] font-mono block mt-1 tabular-nums">
                    {formatPrice(selectedStock.currentPrice)}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold inline-block mt-1 px-1.5 py-0.5 border border-[#141414]/20 rounded-none ${
                      selectedStock.variation > 0
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedStock.variation < 0
                        ? "bg-rose-100 text-rose-800"
                        : "bg-[#E4E3E0] text-[#141414]"
                    }`}
                  >
                    {selectedStock.variation > 0 && "+"}
                    {selectedStock.variation.toFixed(2)}%
                  </span>
                </div>

                <div className="bg-[#E4E3E0]/30 border-2 border-[#141414] p-4 rounded-none shadow-[3px_3px_0px_#141414]">
                  <span className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider block">
                    Dernier Dividende
                  </span>
                  <span className="text-xl font-bold text-[#141414] font-mono block mt-1 tabular-nums">
                    {formatPrice(selectedStock.latestDividend)}
                  </span>
                  <span className="text-[9px] text-[#141414]/50 block mt-1.5 uppercase font-semibold">
                    (Exercice clos {lastYear})
                  </span>
                </div>
              </div>

              {/* Session High / Low Metrics */}
              <div className="bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] rounded-none p-4 flex justify-between items-center text-xs font-mono shadow-[3px_3px_0px_rgba(0,0,0,0.15)]">
                <div className="text-center flex-1 border-r border-[#E4E3E0]/20">
                  <span className="text-[9px] text-[#E4E3E0]/60 font-bold uppercase block">
                    Plus haut
                  </span>
                  <span className="text-sm font-bold text-white mt-1 block tabular-nums">
                    {formatPrice(selectedStock.high)}
                  </span>
                </div>
                <div className="text-center flex-1">
                  <span className="text-[9px] text-[#E4E3E0]/60 font-bold uppercase block">
                    Plus bas
                  </span>
                  <span className="text-sm font-bold text-white mt-1 block tabular-nums">
                    {formatPrice(selectedStock.low)}
                  </span>
                </div>
              </div>

              {/* Eligibility status box */}
              <div
                className={`p-4 rounded-none border-2 flex items-start space-x-3 ${
                  selectedStock.streak >= 3
                    ? "bg-emerald-50 border-emerald-700 text-emerald-950"
                    : "bg-amber-50 border-amber-700 text-amber-950"
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {selectedStock.streak >= 3 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <XCircle className="w-5 h-5 text-amber-700" />
                  )}
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wide">
                    {selectedStock.streak >= 3
                      ? "Mention : Éligible Dividendes"
                      : "Mention : Non Éligible"}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed">
                    {selectedStock.streak >= 3
                      ? `Cette entreprise verse des dividendes de manière régulière depuis ${selectedStock.streak} ans consécutifs.`
                      : selectedStock.dividends.find((d) => d.year === lastYear)?.paid === false
                      ? `Cette entreprise n'est pas éligible car elle n'a pas versé de dividendes en ${lastYear} (année de référence).`
                      : `Cette entreprise n'est pas éligible car son cycle continu de versement consécutif à partir de ${lastYear} est inférieur à 3 ans.`}
                  </p>
                </div>
              </div>

              {/* Dividend history table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#141414]/60">
                    Historique complet (5 ans)
                  </h3>
                  <span className="text-[9px] bg-[#141414] text-[#E4E3E0] font-bold px-2.5 py-0.5 rounded-none">
                    Score : {selectedStock.streak}/5
                  </span>
                </div>

                <div className="border-2 border-[#141414] rounded-none overflow-hidden shadow-[3px_3px_0px_#141414]">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="bg-[#141414] text-[#E4E3E0] uppercase font-bold text-[10px]">
                        <th className="py-2.5 px-4">Année</th>
                        <th className="py-2.5 px-4 text-center">Statut de versement</th>
                        <th className="py-2.5 px-4 text-right">Montant brut / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]/10">
                      {selectedStock.dividends.map((div) => (
                        <tr key={div.year} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#141414] font-mono">
                            {div.year}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {div.paid ? (
                              <span className="inline-flex items-center bg-emerald-100 text-emerald-800 border border-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-none font-mono">
                                <span>Versé</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center bg-rose-100 text-rose-800 border border-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-none font-mono">
                                <span>Non versé</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#141414]/80 tabular-nums">
                            {div.paid ? formatPrice(div.amount) : "0 FCFA"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dividend visual bar chart */}
              <div className="bg-[#E4E3E0]/30 border-2 border-[#141414] rounded-none p-4 shadow-[3px_3px_0px_#141414]">
                <h4 className="text-[10px] font-bold text-[#141414]/60 uppercase tracking-wider mb-3">
                  Progression du dividende
                </h4>
                <div className="space-y-2.5">
                  {selectedStock.dividends.map((div) => {
                    const maxAmount = Math.max(
                      ...selectedStock.dividends.map((d) => d.amount),
                      1
                    );
                    const pct = (div.amount / maxAmount) * 100;
                    return (
                      <div key={div.year} className="flex items-center space-x-3 text-[11px]">
                        <span className="w-10 font-bold font-mono text-[#141414]/60">
                          {div.year}
                        </span>
                        <div className="flex-1 bg-white border border-[#141414]/20 h-4 rounded-none overflow-hidden relative">
                          {div.paid && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, ease: "easeOut" }}
                              className="bg-gradient-to-r from-emerald-600 to-teal-600 h-full"
                            />
                          )}
                        </div>
                        <span className="w-18 text-right font-mono text-[#141414] font-bold">
                          {div.paid ? `${div.amount} F` : "0 F"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Link to detail page info */}
              <div className="text-[10px] text-[#141414]/70 bg-white border-2 border-dashed border-[#141414] p-3 rounded-none leading-relaxed flex items-start space-x-2">
                <HelpCircle className="w-4 h-4 text-[#141414]/60 mt-0.5 flex-shrink-0" />
                <span>
                  Les dividendes sont calculés pour chaque exercice budgétaire. Vous pouvez
                  visiter la page officielle de cotation de Sika Finance : <br />
                  <a
                    href={`https://www.sikafinance.com/marches/cotation_${selectedStock.symbol}.${selectedStock.country}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-bold underline hover:text-emerald-800"
                  >
                    sikafinance.com/marches/cotation_{selectedStock.symbol}.
                    {selectedStock.country}
                  </a>
                </span>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t-2 border-[#141414] bg-[#E4E3E0]/30 space-y-3">
              <button
                onClick={() => onSyncDividends(selectedStock.symbol)}
                disabled={isUpdatingDividends}
                aria-label={isUpdatingDividends ? "Recherche en cours" : "Recharger l'historique officiel"}
                className={`w-full py-3 bg-[#141414] hover:bg-black text-[#E4E3E0] rounded-none border-2 border-[#141414] font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 transition-all duration-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 inline-flex items-center justify-center gap-2 ${
                  isUpdatingDividends ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                }`}
                id={`btn-sync-div-${selectedStock.symbol}`}
              >
                <RefreshCw className={`w-4 h-4 ${isUpdatingDividends ? "animate-spin" : ""}`} aria-hidden="true" />
                <span>
                  {isUpdatingDividends
                    ? "Recherche en cours…"
                    : "Recharger l'historique officiel"}
                </span>
              </button>
              {dividendUpdateMsg && (
                <p className="text-center text-[10px] font-bold text-emerald-800 uppercase font-sans">
                  {dividendUpdateMsg}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
