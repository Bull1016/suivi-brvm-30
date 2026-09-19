import React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
          className={`flex w-full items-center ${justifyClassName} space-x-1 py-4 px-6 cursor-pointer select-none hover:bg-neutral-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus:outline-none`}
        >
          <span>{label}</span>
          {sortField === field ? (
            sortDirection === "asc" ? (
              <ChevronUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            )
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" aria-hidden="true" />
          )}
        </button>
      </th>
    );
  };

  return (
    <div className="bg-white border-2 border-[#141414] rounded-none shadow-[8px_8px_0px_#141414] overflow-hidden mb-8">
      {error && (
        <div className="p-6 text-center bg-rose-50 border-b-2 border-[#141414]">
          <div className="bg-rose-100 border-2 border-[#141414] text-[#141414] px-4 py-3 rounded-none inline-flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider max-w-lg shadow-[3px_3px_0px_#141414]">
            <Info className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase tracking-wider border-b-2 border-[#141414] font-mono">
              {renderSortableHeader("symbol", "Symbole", "w-24")}
              {renderSortableHeader("name", "Entreprise")}
              {renderSortableHeader("sector", "Secteur BRVM")}
              {renderSortableHeader("currentPrice", "Prix (FCFA)", "w-32", "justify-end")}
              {renderSortableHeader("variation", "Variation", "w-28", "justify-end")}
              {renderSortableHeader("high", "Haut", "w-28 hidden xl:table-cell", "justify-end")}
              {renderSortableHeader("low", "Bas", "w-28 hidden xl:table-cell", "justify-end")}
              {renderSortableHeader("streak", "Dividende (D)", "w-36", "justify-center")}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]/15 text-xs font-mono text-[#141414]">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse bg-[#141414]/5">
                  <td className="py-4 px-6"><div className="h-6 bg-[#141414]/10 w-16 rounded-none" /></td>
                  <td className="py-4 px-6"><div className="h-6 bg-[#141414]/10 w-48 rounded-none" /></td>
                  <td className="py-4 px-6"><div className="h-6 bg-[#141414]/10 w-32 rounded-none" /></td>
                  <td className="py-4 px-6"><div className="h-6 bg-[#141414]/10 w-24 ml-auto rounded-none" /></td>
                  <td className="py-4 px-6"><div className="h-6 bg-[#141414]/10 w-20 ml-auto rounded-none" /></td>
                  <td className="py-4 px-6 hidden sm:table-cell"><div className="h-6 bg-[#141414]/10 w-20 ml-auto rounded-none" /></td>
                  <td className="py-4 px-6 hidden sm:table-cell"><div className="h-6 bg-[#141414]/10 w-20 ml-auto rounded-none" /></td>
                  <td className="py-4 px-6"><div className="h-6 bg-[#141414]/10 w-24 mx-auto rounded-none" /></td>
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
                    onClick={() => onSelectStock(stock)}
                    className={`hover:bg-[#141414]/5 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus:outline-none ${
                      selectedStock?.symbol === stock.symbol ? "bg-[#141414]/10 font-bold" : ""
                    }`}
                    id={`row-${stock.symbol}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectStock(stock);
                      }
                    }}
                  >
                    {/* Symbol Column */}
                    <td className="py-3 px-6 font-mono font-bold text-slate-900">
                      <div className="flex items-center space-x-1.5">
                        <span className="bg-[#141414]/5 text-[#141414] px-2.5 py-1 border border-[#141414]/20 rounded-none text-xs font-bold">
                          {stock.symbol}
                        </span>
                        {stock.source === "fallback" && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-600/60 px-1 py-0.5 rounded-none font-bold uppercase whitespace-nowrap" title="Cours non actualisé (donnée de repli)">
                            Non actualisé
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Company Name Column with SVG Flag */}
                    <td className="py-3 px-6">
                      <div className="flex items-center space-x-2.5">
                        <CountryFlag code={stock.country} />
                        <span className="text-[#141414] font-bold text-sm leading-tight font-sans">
                          {stock.name}
                        </span>
                      </div>
                    </td>

                    {/* Sector Column */}
                    <td className="py-3 px-6">
                      {stock.sector && SECTOR_CONFIG[stock.sector] ? (
                        <a
                          href={SECTOR_CONFIG[stock.sector].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight border shadow-[1px_1px_0px_#141414] hover:opacity-80 transition-all ${
                            SECTOR_CONFIG[stock.sector].badgeBg
                          }`}
                          title={`Voir la page officielle BRVM: ${stock.sector}`}
                        >
                          <span>{SECTOR_CONFIG[stock.sector].icon}</span>
                          <span>{stock.sector}</span>
                          <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-[#141414]/50 font-mono italic">
                          {stock.sector || "Non spécifié"}
                        </span>
                      )}
                    </td>

                    {/* Current Price Column */}
                    <td className="py-3 px-6 text-right font-mono font-black text-sm text-[#141414] tabular-nums">
                      {formatPrice(stock.currentPrice)}
                    </td>

                    {/* Variation % Column */}
                    <td className="py-3 px-6 text-right font-mono">
                      <span
                        className={`inline-flex items-center space-x-0.5 rounded-none px-2 py-0.5 text-[10px] font-bold border ${
                          isUp
                            ? "bg-emerald-100 text-emerald-800 border-emerald-600/40"
                            : isDown
                            ? "bg-rose-100 text-rose-800 border-rose-600/40"
                            : "bg-[#E4E3E0]/50 text-[#141414]/60 border-[#141414]/10"
                        }`}
                      >
                        <span>{isUp ? "▲ " : isDown ? "▼ " : ""}</span>
                        <span>{isUp && "+"}{stock.variation.toFixed(2)}%</span>
                      </span>
                    </td>

                    {/* High Session Column */}
                    <td className="py-3 px-6 text-right font-mono text-xs text-[#141414]/60 hidden sm:table-cell tabular-nums">
                      {formatPrice(stock.high)}
                    </td>

                    {/* Low Session Column */}
                    <td className="py-3 px-6 text-right font-mono text-xs text-[#141414]/60 hidden sm:table-cell tabular-nums">
                      {formatPrice(stock.low)}
                    </td>

                    {/* Dividends Badge Score Column */}
                    <td className="py-3 px-6 text-center">
                      {isEligible ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase px-3 py-1 rounded-none border border-emerald-700 flex items-center space-x-1 shadow-[1px_1px_0px_rgba(0,0,0,0.15)]">
                            <span>D</span>
                            <span className="bg-emerald-700 text-[#E4E3E0] font-mono px-1 rounded-none text-[9px]">
                              {stock.streak}/5
                            </span>
                          </span>
                          <span className="text-[11px] text-[#141414] font-mono font-bold mt-1 tabular-nums">
                            {formatPrice(stock.latestDividend)}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="bg-[#E4E3E0]/50 text-[#141414]/70 text-[10px] font-bold px-2.5 py-1 rounded-none border border-[#141414]/20 font-mono">
                            {stock.dividendStatus === "aucun" || stock.streak === 0 ? "0/5" : `${stock.streak}/5`}
                          </span>
                          <span className="text-[9px] text-[#141414]/50 font-mono mt-1 uppercase">
                            {stock.dividendStatus === "aucun" ? "Aucun" : stock.dividendStatus === "interrompu" ? "Interrompu" : "Non éligible"}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-[#141414]/50 font-bold uppercase tracking-wider font-sans"
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
