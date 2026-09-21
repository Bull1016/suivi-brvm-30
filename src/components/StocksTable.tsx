import React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink, Info } from "lucide-react";
import { StockData } from "../types";
import { SECTOR_CONFIG } from "../constants/brvmData";
import { formatPrice } from "../utils/formatters";
import { CountryFlag } from "./CountryFlag";

interface StocksTableProps {
  stocks: StockData[];
  selectedStock: StockData | null;
  onSelectStock: (stock: StockData) => void;
  sortField: keyof StockData | "";
  sortDirection: "asc" | "desc";
  onSort: (field: keyof StockData) => void;
  error: string | null;
  isLoading?: boolean;
}

export const StocksTable: React.FC<StocksTableProps> = ({
  stocks,
  selectedStock,
  onSelectStock,
  sortField,
  sortDirection,
  onSort,
  error,
  isLoading = false
}) => {
  const renderSortableHeader = (
    field: keyof StockData,
    label: string,
    cellClassName = "",
    justifyClassName = "justify-start"
  ) => {
    const ariaSort = sortField === field
      ? sortDirection === "asc" ? "ascending" : "descending"
      : "none";

    return (
      <th className={cellClassName} aria-sort={ariaSort}>
        <button
          type="button"
          onClick={() => onSort(field)}
          className={`flex w-full items-center ${justifyClassName} space-x-1 py-3.5 px-4 cursor-pointer select-none hover:bg-neutral-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none h-11`}
        >
          <span>{label}</span>
          {sortField === field ? (
            sortDirection === "asc" ? (
              <ChevronUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            )
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-500" aria-hidden="true" />
          )}
        </button>
      </th>
    );
  };

  return (
    <div className="bg-white border-2 border-[#141414] rounded-none shadow-[6px_6px_0px_#141414] overflow-hidden mb-8">
      {error && (
        <div className="p-4 text-center bg-rose-50 border-b-2 border-[#141414]">
          <div className="bg-rose-100 border-2 border-[#141414] text-[#141414] px-4 py-3.5 rounded-none inline-flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider max-w-lg shadow-[2px_2px_0px_#141414]">
            <Info className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Mobile Card List (screens < 640px) */}
      <div className="block sm:hidden divide-y-2 divide-[#141414]">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="p-4 bg-[#141414]/5 animate-pulse space-y-2">
              <div className="h-5 bg-[#141414]/10 w-3/4 rounded-none" />
              <div className="h-6 bg-[#141414]/10 w-1/2 rounded-none" />
            </div>
          ))
        ) : stocks.length > 0 ? (
          stocks.map((stock) => {
            const isUp = stock.variation > 0;
            const isDown = stock.variation < 0;
            const isSelected = selectedStock?.symbol === stock.symbol;

            return (
              <div
                key={stock.symbol}
                role="button"
                tabIndex={0}
                aria-label={`Voir les détails de ${stock.name} (${stock.symbol})`}
                onClick={() => onSelectStock(stock)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectStock(stock);
                  }
                }}
                className={`p-4 cursor-pointer hover:bg-[#141414]/5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[56px] ${
                  isSelected ? "bg-[#141414]/10 font-bold" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <CountryFlag code={stock.country} />
                    <span className="font-bold text-sm text-[#141414] truncate font-sans">
                      {stock.name}
                    </span>
                  </div>
                  <span className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 font-mono text-xs font-bold shrink-0">
                    {stock.symbol}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#141414]/15 font-mono">
                  <div>
                    <span className="text-base font-black text-[#141414] tabular-nums">
                      {formatPrice(stock.currentPrice)}
                    </span>
                    {stock.source === "fallback" && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-800 border border-amber-600 px-1 py-0.5 font-bold uppercase">
                        Non actualisé
                      </span>
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center space-x-0.5 px-2.5 py-1 text-xs font-bold border ${
                      isUp
                        ? "bg-emerald-100 text-emerald-800 border-emerald-600"
                        : isDown
                        ? "bg-rose-100 text-rose-800 border-rose-600"
                        : "bg-[#E4E3E0]/50 text-[#141414]/70 border-[#141414]/20"
                    }`}
                  >
                    <span>{isUp ? "▲ " : isDown ? "▼ " : ""}</span>
                    <span>{isUp && "+"}{stock.variation.toFixed(2)}%</span>
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2 text-xs font-mono">
                  <span className="text-[#141414]/80 font-bold truncate">
                    {stock.sector}
                  </span>
                  <span className="bg-[#E4E3E0]/60 text-[#141414] px-2 py-0.5 border border-[#141414]/30 font-bold">
                    {stock.dividendStatus === "en_attente" ? (
                      <span className="text-amber-800 font-bold">En attente ({stock.streak}/5)</span>
                    ) : stock.streak >= 3 ? (
                      <span className="text-emerald-800 font-bold">D {stock.streak}/5</span>
                    ) : (
                      <span className="text-[#141414]/70">{stock.streak}/5</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs font-bold font-mono text-[#141414]/60">
            Aucun résultat ne correspond à vos filtres.
          </div>
        )}
      </div>

      {/* Desktop Table View (screens ≥ 640px) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#141414] text-[#E4E3E0] text-xs font-bold uppercase tracking-wider border-b-2 border-[#141414] font-mono">
              {renderSortableHeader("symbol", "Symbole", "w-28")}
              {renderSortableHeader("name", "Entreprise")}
              {renderSortableHeader("sector", "Secteur BRVM")}
              {renderSortableHeader("currentPrice", "Prix (FCFA)", "w-32", "justify-end")}
              {renderSortableHeader("variation", "Variation", "w-28", "justify-end")}
              {renderSortableHeader("streak", "Dividende (D)", "w-36", "justify-center")}
              <th className="w-28 px-4 text-center">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]/15 text-xs font-mono text-[#141414]">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse bg-[#141414]/5 h-14">
                  <td className="py-3 px-4"><div className="h-6 bg-[#141414]/10 w-16 rounded-none" /></td>
                  <td className="py-3 px-4"><div className="h-6 bg-[#141414]/10 w-48 rounded-none" /></td>
                  <td className="py-3 px-4"><div className="h-6 bg-[#141414]/10 w-32 rounded-none" /></td>
                  <td className="py-3 px-4"><div className="h-6 bg-[#141414]/10 w-24 ml-auto rounded-none" /></td>
                  <td className="py-3 px-4"><div className="h-6 bg-[#141414]/10 w-20 ml-auto rounded-none" /></td>
                  <td className="py-3 px-4"><div className="h-6 bg-[#141414]/10 w-24 mx-auto rounded-none" /></td>
                  <td className="py-3 px-4"><div className="h-6 bg-[#141414]/10 w-16 mx-auto rounded-none" /></td>
                </tr>
              ))
            ) : stocks.length > 0 ? (
              stocks.map((stock) => {
                const isUp = stock.variation > 0;
                const isDown = stock.variation < 0;
                const isEligible = stock.streak >= 3;

                return (
                  <tr
                    key={stock.symbol}
                    className={`hover:bg-[#141414]/5 transition-colors duration-150 h-14 ${
                      selectedStock?.symbol === stock.symbol ? "bg-[#141414]/10 font-bold" : ""
                    }`}
                    id={`row-${stock.symbol}`}
                  >
                    {/* Symbol Column */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center space-x-1.5">
                        <span className="bg-[#141414]/5 text-[#141414] px-2 py-1 border border-[#141414]/20 rounded-none text-xs font-bold">
                          {stock.symbol}
                        </span>
                        {stock.source === "fallback" && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-600/60 px-1 py-0.5 rounded-none font-bold uppercase whitespace-nowrap" title="Cours non actualisé (donnée de repli)">
                            Non actualisé
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Company Name Column */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <CountryFlag code={stock.country} />
                        <span className="text-[#141414] font-bold text-sm leading-tight font-sans truncate max-w-xs">
                          {stock.name}
                        </span>
                      </div>
                    </td>

                    {/* Sector Column */}
                    <td className="py-3 px-4">
                      {stock.sector && SECTOR_CONFIG[stock.sector] ? (
                        <a
                          href={SECTOR_CONFIG[stock.sector].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center space-x-1 px-2 py-1 text-xs font-bold border shadow-[1px_1px_0px_#141414] hover:opacity-80 transition-all ${
                            SECTOR_CONFIG[stock.sector].badgeBg
                          }`}
                          title={`Voir la page officielle BRVM: ${stock.sector}`}
                        >
                          <span>{SECTOR_CONFIG[stock.sector].icon}</span>
                          <span>{stock.sector}</span>
                          <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-xs text-[#141414]/60 font-mono italic">
                          {stock.sector || "Non spécifié"}
                        </span>
                      )}
                    </td>

                    {/* Current Price Column */}
                    <td className="py-3 px-4 text-right font-mono font-black text-sm text-[#141414] tabular-nums">
                      {formatPrice(stock.currentPrice)}
                    </td>

                    {/* Variation % Column */}
                    <td className="py-3 px-4 text-right font-mono">
                      <span
                        className={`inline-flex items-center space-x-0.5 rounded-none px-2 py-0.5 text-xs font-bold border ${
                          isUp
                            ? "bg-emerald-100 text-emerald-900 border-emerald-600/40"
                            : isDown
                            ? "bg-rose-100 text-rose-900 border-rose-600/40"
                            : "bg-[#E4E3E0]/50 text-[#141414]/80 border-[#141414]/10"
                        }`}
                      >
                        <span>{isUp ? "▲ " : isDown ? "▼ " : ""}</span>
                        <span>{isUp && "+"}{stock.variation.toFixed(2)}%</span>
                      </span>
                    </td>

                    {/* Dividends Badge Score Column */}
                    <td className="py-3 px-4 text-center">
                      {stock.dividendStatus === "en_attente" ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="bg-amber-100 text-amber-900 text-xs font-bold uppercase px-2.5 py-0.5 border border-amber-700 flex items-center space-x-1">
                            <span>En attente</span>
                            <span className="bg-amber-700 text-white font-mono px-1 text-xs">
                              {stock.streak}/5
                            </span>
                          </span>
                        </div>
                      ) : isEligible ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="bg-emerald-100 text-emerald-900 text-xs font-bold uppercase px-2.5 py-0.5 border border-emerald-700 flex items-center space-x-1">
                            <span>D</span>
                            <span className="bg-emerald-700 text-[#E4E3E0] font-mono px-1 text-xs">
                              {stock.streak}/5
                            </span>
                          </span>
                          <span className="text-xs text-[#141414] font-mono font-bold mt-0.5 tabular-nums">
                            {formatPrice(stock.latestDividend)}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="bg-[#E4E3E0]/50 text-[#141414]/80 text-xs font-bold px-2 py-0.5 border border-[#141414]/20 font-mono">
                            {stock.dividendStatus === "aucun" || stock.streak === 0 ? "0/5" : `${stock.streak}/5`}
                          </span>
                          <span className="text-[10px] text-[#141414]/70 font-mono uppercase mt-0.5">
                            {stock.dividendStatus === "aucun" ? "Aucun" : stock.dividendStatus === "interrompu" ? "Interrompu" : "Non éligible"}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Details Action Column */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectStock(stock)}
                        aria-label={`Voir les détails de ${stock.name} (${stock.symbol})`}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 border border-[#141414] px-2 text-xs font-bold hover:bg-[#141414] hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-500 focus:outline-none"
                      >
                        <Info className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Détails</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="py-12 text-center text-[#141414]/70 font-bold uppercase tracking-wider font-sans text-xs"
                >
                  Aucun résultat ne correspond à vos filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
