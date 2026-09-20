import React from "react";
import {
  Building2,
  ExternalLink,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StockData } from "../types";
import { SECTOR_CONFIG, COUNTRIES_MAP } from "../constants/brvmData";
import { formatPrice } from "../utils/formatters";

interface StockDetailDrawerProps {
  selectedStock: StockData | null;
  onClose: () => void;
  companyDescription: string | null;
  companyDescriptionSource: string | null;
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
  companyDescriptionSource,
  isFetchingDescription,
  isUpdatingDividends,
  dividendUpdateMsg,
  onSyncDividends,
  lastYear
}) => {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const isOpen = selectedStock !== null;
  const prefersReducedMotion = typeof window !== "undefined"
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  React.useEffect(() => {
    if (!isOpen) return;

    const previouslyFocusedElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusableElements.length === 0) {
        e.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      if (e.shiftKey && (activeElement === firstElement || !dialogRef.current.contains(activeElement))) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus();
      }
    };
  }, [isOpen, onClose]);

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
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-company-title"
            tabIndex={-1}
            initial={prefersReducedMotion ? { x: 0 } : { x: "100%" }}
            animate={prefersReducedMotion ? { x: 0 } : { x: 0 }}
            exit={prefersReducedMotion ? { x: "100%" } : { x: "100%" }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white border-l-4 border-[#141414] shadow-2xl z-50 overflow-y-auto flex flex-col font-mono text-xs text-[#141414] overscroll-contain"
          >
            {/* Drawer Header */}
            <div className="p-5 sm:p-6 border-b-2 border-[#141414] flex items-center justify-between bg-[#E4E3E0]/40">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white border-2 border-[#141414] rounded-none shadow-[2px_2px_0px_#141414] text-[#141414]">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-xs bg-[#141414] text-[#E4E3E0] px-2 py-0.5 rounded-none font-mono font-bold">
                      {selectedStock.symbol}
                    </span>
                    {selectedStock.source === "fallback" && (
                      <span className="text-xs bg-amber-100 text-amber-900 border border-amber-600 px-1.5 py-0.5 font-bold uppercase">
                        Non actualisé
                      </span>
                    )}
                    <span>{COUNTRIES_MAP[selectedStock.country]?.flag}</span>
                    {selectedStock.sector && SECTOR_CONFIG[selectedStock.sector] && (
                      <a
                        href={SECTOR_CONFIG[selectedStock.sector].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Voir la page officielle du secteur BRVM: ${selectedStock.sector}`}
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 text-xs font-bold uppercase tracking-tight border shadow-[1px_1px_0px_#141414] hover:opacity-80 transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                          SECTOR_CONFIG[selectedStock.sector].badgeBg
                        }`}
                        title={`Voir la page officielle du secteur BRVM: ${selectedStock.sector}`}
                      >
                        <span>{SECTOR_CONFIG[selectedStock.sector].icon}</span>
                        <span>{selectedStock.sector}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                  <h2 id="drawer-company-title" className="text-base sm:text-lg font-black text-[#141414] mt-1 leading-tight font-sans uppercase">
                    {selectedStock.name}
                  </h2>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Fermer le panneau de détails"
                className="p-2 text-[#141414] hover:bg-[#141414]/10 rounded-none transition-all focus-visible:ring-2 focus-visible:ring-rose-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-5 sm:p-6 flex-1 space-y-5">
              {/* 1. Main Price Block */}
              <div className="bg-[#E4E3E0]/30 border-2 border-[#141414] p-5 rounded-none shadow-[3px_3px_0px_#141414] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#141414]/80 font-bold uppercase tracking-wider block">
                    Dernier Cours
                  </span>
                  <span className="text-3xl font-black text-[#141414] font-mono block mt-0.5 tabular-nums">
                    {formatPrice(selectedStock.currentPrice)}
                  </span>
                </div>
                <span
                  className={`text-sm font-mono font-bold px-3 py-1.5 border border-[#141414]/30 rounded-none ${
                    selectedStock.variation > 0
                      ? "bg-emerald-100 text-emerald-900"
                      : selectedStock.variation < 0
                      ? "bg-rose-100 text-rose-900"
                      : "bg-[#E4E3E0] text-[#141414]"
                  }`}
                >
                  {selectedStock.variation > 0 && "+"}
                  {selectedStock.variation.toFixed(2)}%
                </span>
              </div>

              {/* 2. Key Stats Row */}
              <div className="grid grid-cols-3 gap-2 text-center font-mono py-2 border-y border-[#141414]/20 text-xs">
                <div className="border-r border-[#141414]/20 pr-2">
                  <span className="text-xs text-[#141414]/70 uppercase font-bold block">Plus haut</span>
                  <span className="text-xs font-bold text-[#141414] tabular-nums mt-0.5 block">{formatPrice(selectedStock.high)}</span>
                </div>
                <div className="border-r border-[#141414]/20 px-2">
                  <span className="text-xs text-[#141414]/70 uppercase font-bold block">Plus bas</span>
                  <span className="text-xs font-bold text-[#141414] tabular-nums mt-0.5 block">{formatPrice(selectedStock.low)}</span>
                </div>
                <div className="pl-2">
                  <span className="text-xs text-[#141414]/70 uppercase font-bold block">Dividende ({lastYear})</span>
                  <span className="text-xs font-bold text-[#141414] tabular-nums mt-0.5 block">{formatPrice(selectedStock.latestDividend)}</span>
                </div>
              </div>

              {/* 3. Dividend Eligibility Banner */}
              <div
                className={`p-4 rounded-none border-2 flex items-start space-x-3 ${
                  selectedStock.dividendStatus === "en_attente"
                    ? "bg-amber-50 border-amber-600 text-amber-950"
                    : selectedStock.streak >= 3
                    ? "bg-emerald-50 border-emerald-700 text-emerald-950"
                    : "bg-rose-50 border-rose-700 text-rose-950"
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {selectedStock.dividendStatus === "en_attente" ? (
                    <Clock className="w-5 h-5 text-amber-700" />
                  ) : selectedStock.streak >= 3 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-700" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide">
                    {selectedStock.dividendStatus === "en_attente"
                      ? "Mention : Publication 2025 en attente"
                      : selectedStock.streak >= 3
                      ? "Mention : Éligible Dividendes (Payeur Régulier)"
                      : "Mention : Non Éligible (Cycle < 3 ans)"}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed">
                    {selectedStock.dividendStatus === "en_attente"
                      ? `L'assemblée générale pour ${lastYear} n'a pas encore publié les chiffres. Historique régulier sur la période précédente : ${selectedStock.streak} an(s).`
                      : selectedStock.streak >= 3
                      ? `Cette entreprise verse des dividendes réguliers depuis ${selectedStock.streak} ans consécutifs.`
                      : selectedStock.dividends.find((d) => d.year === lastYear)?.paid === false
                      ? `Aucun dividende versé en ${lastYear}.`
                      : `Cycle continu de versement consécutif à partir de ${lastYear} : ${selectedStock.streak} an(s).`}
                  </p>
                </div>
              </div>

              {/* 4. Dividend History Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#141414]/70">
                    Historique complet (5 ans)
                  </h3>
                  <span className="text-xs bg-[#141414] text-[#E4E3E0] font-bold px-2.5 py-0.5 rounded-none">
                    Score : {selectedStock.streak}/5
                  </span>
                </div>

                <div className="border-2 border-[#141414] rounded-none overflow-hidden shadow-[3px_3px_0px_#141414]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#141414] text-[#E4E3E0] uppercase font-bold text-xs">
                        <th className="py-2.5 px-3">Année</th>
                        <th className="py-2.5 px-3 text-center">Statut de versement</th>
                        <th className="py-2.5 px-3 text-right">Montant brut / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#141414]/10">
                      {selectedStock.dividends.map((div) => (
                        <tr key={div.year} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-[#141414] font-mono">
                            {div.year}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {div.paid ? (
                              <span className="inline-flex items-center bg-emerald-100 text-emerald-900 border border-emerald-700 text-xs font-bold px-2 py-0.5 font-mono">
                                Versé
                              </span>
                            ) : div.year === lastYear && selectedStock.dividendStatus === "en_attente" ? (
                              <span className="inline-flex items-center bg-amber-100 text-amber-900 border border-amber-700 text-xs font-bold px-2 py-0.5 font-mono">
                                En attente
                              </span>
                            ) : (
                              <span className="inline-flex items-center bg-rose-100 text-rose-900 border border-rose-700 text-xs font-bold px-2 py-0.5 font-mono">
                                Non versé
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#141414] tabular-nums">
                            {div.paid ? formatPrice(div.amount) : "0 FCFA"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Company Description Box */}
              <div className="bg-white border-2 border-[#141414] p-4 rounded-none shadow-[3px_3px_0px_#141414] text-xs">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                  <h4 className="text-xs text-[#141414]/70 font-bold uppercase tracking-wider font-mono">
                    Description de l'entreprise
                  </h4>
                  {companyDescriptionSource === "ai-generation" && (
                    <span className="text-xs bg-purple-100 text-purple-900 border border-purple-700 font-mono font-bold px-2 py-0.5">
                      Généré par IA — peut contenir des erreurs
                    </span>
                  )}
                </div>
                {isFetchingDescription ? (
                  <div className="flex items-center space-x-2 text-[#141414]/80 py-2">
                    <RefreshCw className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    <span className="font-mono text-xs">Génération de la description par l'IA…</span>
                  </div>
                ) : companyDescription ? (
                  <p className="text-[#141414] font-sans leading-relaxed text-xs whitespace-pre-line">
                    {companyDescription}
                  </p>
                ) : (
                  <p className="text-[#141414]/70 font-mono py-1 text-xs">
                    Aucune description disponible pour cette entreprise.
                  </p>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 sm:p-6 border-t-2 border-[#141414] bg-[#E4E3E0]/30 space-y-3">
              <div className="flex gap-2">
                <a
                  href={`https://www.sikafinance.com/marches/cotation_${selectedStock.symbol}.${selectedStock.country}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-11 bg-white hover:bg-slate-50 text-[#141414] rounded-none border-2 border-[#141414] font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#141414] inline-flex items-center justify-center gap-1.5"
                >
                  <span>Sika Finance</span>
                  <ExternalLink className="w-4 h-4 text-emerald-700" />
                </a>

                <button
                  type="button"
                  onClick={() => onSyncDividends(selectedStock.symbol)}
                  disabled={isUpdatingDividends}
                  aria-label={isUpdatingDividends ? "Recherche en cours" : "Recharger l'historique officiel"}
                  className={`flex-1 h-11 bg-[#141414] hover:bg-black text-[#E4E3E0] rounded-none border-2 border-[#141414] font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_#141414] inline-flex items-center justify-center gap-1.5 ${
                    isUpdatingDividends ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  }`}
                  id={`btn-sync-div-${selectedStock.symbol}`}
                >
                  <RefreshCw className={`w-4 h-4 ${isUpdatingDividends ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
                  <span>{isUpdatingDividends ? "Mise à jour…" : "Recharger"}</span>
                </button>
              </div>

              {dividendUpdateMsg && (
                <p className="text-center text-xs font-bold text-emerald-800 uppercase font-sans">
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
