import React from "react";
import { AlertTriangle, Check, ExternalLink, KeyRound } from "lucide-react";
import { PendingComposition, StockData } from "../types";

interface CompositionUpdateBannerProps {
  /** Candidate composition detected from the official avis, awaiting confirmation. */
  compositionUpdate: PendingComposition | null;
  /** Composition currently served, used to display the entrants and leavers. */
  currentStocks: StockData[];
  /** Called after a successful confirmation so the app reloads the served stocks. */
  onConfirmed: () => void;
}

/**
 * Banner shown when an official avis describes a composition different from the active one.
 * The active composition stays served until an operator confirms it with the CRON_SECRET token.
 */
export const CompositionUpdateBanner: React.FC<CompositionUpdateBannerProps> = ({
  compositionUpdate,
  currentStocks,
  onConfirmed,
}) => {
  const [token, setToken] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  if (!compositionUpdate) return null;

  const currentSymbols = new Set(currentStocks.map((s) => s.symbol.toUpperCase()));
  const candidateSymbols = new Set(compositionUpdate.stocks.map((s) => s.symbol.toUpperCase()));
  const entrants = compositionUpdate.stocks.filter((s) => !currentSymbols.has(s.symbol.toUpperCase()));
  const leavers = currentStocks.filter((s) => !candidateSymbols.has(s.symbol.toUpperCase()));

  const confirm = async () => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/brvm30/confirm-composition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: compositionUpdate.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message || "Composition confirmée.");
        onConfirmed();
      } else {
        setMessage(data.message || "Confirmation refusée.");
      }
    } catch {
      setMessage("Erreur réseau lors de la confirmation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      role="status"
      aria-live="polite"
      className="mb-6 bg-amber-50 border-2 border-[#141414] shadow-[3px_3px_0px_#141414] p-3 sm:p-4 font-mono text-xs space-y-2"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-bold uppercase tracking-wider">
            Nouvelle composition détectée — avis n°{compositionUpdate.avis}
          </p>
          <p className="text-[#141414]/80">
            Datée du {compositionUpdate.date}. La composition active reste affichée jusqu'à
            confirmation manuelle.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="border border-[#141414]/30 bg-white p-2">
          <p className="font-bold uppercase text-emerald-800">
            Entrants ({entrants.length})
          </p>
          <p className="text-[#141414]/80 break-words">
            {entrants.length > 0 ? entrants.map((s) => s.symbol).join(", ") : "Aucun"}
          </p>
        </div>
        <div className="border border-[#141414]/30 bg-white p-2">
          <p className="font-bold uppercase text-rose-800">Sortants ({leavers.length})</p>
          <p className="text-[#141414]/80 break-words">
            {leavers.length > 0 ? leavers.map((s) => s.symbol).join(", ") : "Aucun"}
          </p>
        </div>
      </div>

      <a
        href={compositionUpdate.archivedPdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[44px] items-center gap-1 underline hover:no-underline"
      >
        Consulter l'avis officiel
        <ExternalLink className="w-3 h-3" aria-hidden="true" />
      </a>

      {/* Confirmation is an operator action: the CRON_SECRET is required and never bundled. */}
      <details className="border-t border-[#141414]/20 pt-2">
        <summary className="cursor-pointer font-bold uppercase tracking-wider">
          Confirmer cette composition (opérateur)
        </summary>
        <div className="mt-2 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <label htmlFor="composition-token" className="sr-only">
            Jeton CRON_SECRET
          </label>
          <div className="relative flex-1 min-w-[200px]">
            <KeyRound
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]/60"
              aria-hidden="true"
            />
            <input
              id="composition-token"
              type="password"
              autoComplete="off"
              placeholder="Jeton CRON_SECRET"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full h-11 bg-white border-2 border-[#141414] pl-9 pr-2 font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={confirm}
            disabled={isSubmitting || token.trim() === ""}
            className="h-11 px-3.5 bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            {isSubmitting ? "Confirmation…" : "Confirmer"}
          </button>
        </div>
        {message && <p className="mt-2 text-[#141414]/80">{message}</p>}
      </details>
    </section>
  );
};
