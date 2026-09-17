import React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StockData } from "../types";
import { SECTOR_CONFIG, COUNTRIES_MAP } from "../constants/brvmData";
import { formatPrice } from "../utils/formatters";

interface StocksTableProps {
  stocks: StockData[];
  selectedStock: StockData | null;
  onSelectStock: (stock: StockData) => void;
  sortField: keyof StockData | "";
  sortDirection: "asc" | "desc";
  onSort: (field: keyof StockData) => void;
  error: string | null;
}

export const StocksTable: React.FC<StocksTableProps> = ({
  stocks,
  selectedStock,
  onSelectStock,
  sortField,
  sortDirection,
  onSort,
  error
}) => {
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
          <thead>
            <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase tracking-wider border-b-2 border-[#141414] font-mono">
              <th
                className="py-4 px-6 w-32 cursor-pointer select-none hover:bg-neutral-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus:outline-none"
                onClick={() => onSort("symbol")}
              >
                <div className="flex items-center space-x-1">
                  <span>Symbole</span>
                  {sortField === "symbol" ? (
                    sortDirection === "asc" ? (
                      <ChevronUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    )
                  ) : (
                    <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" aria-hidden="true" />
                  )}
                </div>
              </th>

              <th
                className="py-4 px-6 cursor-pointer select-none hover:bg-neutral-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus:outline-none"
                onClick={() => onSort("name")}
              >
                <div className="flex items-center space-x-1">
                  <span>Entreprise</span>
                  {sortField === "name" ? (
                    sortDirection === "asc" ? (
                      <ChevronUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    )
                  ) : (
                    <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" aria-hidden="true" />
                  )}
                </div>
              </th>

              <th
                className="py-4 px-6 cursor-pointer select-none hover:bg-neutral-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus:outline-none"
                onClick={() => onSort("sector")}
              >
                <div className="flex items-center space-x-1">
                  <span>Secteur BRVM</span>
                  {sortField === "sector" ? (
                    sortDirection === "asc" ? (
                      <ChevronUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    )
                  ) : (
                    <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" aria-hidden="true" />
                  )}
                </div>
              </th>

              <th
                className="py-4 px-6 text-right w-44 cursor-pointer select-none hover:bg-neutral-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus:outline-none"
                onClick={() => onSort("currentPrice")}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Prix actuel</span>
                  {sortField === "currentPrice" ? (
                    sortDirection === "asc" ? (
                      <ChevronUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    )
                  ) : (
                    <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" aria-hidden="true" />
                  )}
                </div>
              </th>

              <th
                className="py-4 px-6 text-right w-36 cursor-pointer select-none hover:bg-neutral-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus:outline-none"
                onClick={() => onSort("variation")}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Variation</span>
                  {sortField === "variation" ? (
                    sortDirection === "asc" ? (
                      <ChevronUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    )
                  ) : (
                    <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" aria-hidden="true" />
                  )}
                </div>
              </th>

              <th
                className="py-4 px-6 text-right w-36 cursor-pointer select-none hover:bg-neutral-800 transition-colors hidden sm:table-cell focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus:outline-none"
                onClick={() => onSort("high")}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Haut</span>
                  {sortField === "high" ? (
                    sortDirection === "asc" ? (
                      <ChevronUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    )
                  ) : (
                    <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" aria-hidden="true" />
                  )}
                </div>
              </th>

              <th
                className="py-4 px-6 text-right w-36 cursor-pointer select-none hover:bg-neutral-800 transition-colors hidden sm:table-cell focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus:outline-none"
                onClick={() => onSort("low")}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Bas</span>
                  {sortField === "low" ? (
                    sortDirection === "asc" ? (
                      <ChevronUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    )
                  ) : (
                    <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" aria-hidden="true" />
                  )}
                </div>
              </th>

              <th
                className="py-4 px-6 text-center w-52 cursor-pointer select-none hover:bg-neutral-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus:outline-none"
                onClick={() => onSort("streak")}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Dividende (D)</span>
                  {sortField === "streak" ? (
                    sortDirection === "asc" ? (
                      <ChevronUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    )
                  ) : (
                    <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-600" aria-hidden="true" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]/15 text-xs font-mono text-[#141414]">
            <AnimatePresence initial={false}>
              {stocks.length > 0 ? (
                stocks.map((stock) => {
                  const isUp = stock.variation > 0;
                  const isDown = stock.variation < 0;
                  const isEligible = stock.streak >= 3;
                  const countryInfo = COUNTRIES_MAP[stock.country];

                  return (
                    <motion.tr
                      key={stock.symbol}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => onSelectStock(stock)}
                      className={`hover:bg-[#141414]/5 transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus:outline-none ${
                        selectedStock?.symbol === stock.symbol ? "bg-[#141414]/10 font-bold" : ""
                      }`}
                      id={`row-${stock.symbol}`}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectStock(stock);
                        }
                      }}
                    >
                      {/* Symbol Column */}
                      <td className="py-3 px-6 font-mono font-bold text-slate-900">
                        <span className="bg-[#141414]/5 text-[#141414] px-2.5 py-1 border border-[#141414]/20 rounded-none text-xs font-bold">
                          {stock.symbol}
                        </span>
                      </td>

                      {/* Company Name Column with Flag Emoji */}
                      <td className="py-3 px-6">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className="text-lg leading-none select-none flex-shrink-0"
                            title={countryInfo?.name || stock.country.toUpperCase()}
                          >
                            {countryInfo?.flag || "🌍"}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-[#141414] font-bold text-sm leading-tight font-sans">
                              {stock.name}
                            </span>
                            <span className="text-[#141414]/60 text-[10px] mt-0.5 font-mono">
                              cotation_{stock.symbol}.{stock.country}
                            </span>
                          </div>
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
                          className={`inline-flex items-center rounded-none px-2 py-0.5 text-[10px] font-bold border ${
                            isUp
                              ? "bg-emerald-100 text-emerald-800 border-emerald-600/40"
                              : isDown
                              ? "bg-rose-100 text-rose-800 border-rose-600/40"
                              : "bg-[#E4E3E0]/50 text-[#141414]/60 border-[#141414]/10"
                          }`}
                        >
                          {isUp && "+"}
                          {stock.variation.toFixed(2)}%
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
                            <span className="bg-[#E4E3E0]/50 text-[#141414]/50 text-[10px] font-bold px-2.5 py-1 rounded-none border border-[#141414]/20">
                              0/5
                            </span>
                            <span className="text-[9px] text-[#141414]/40 font-mono mt-1 uppercase">
                              Non éligible
                            </span>
                          </div>
                        )}
                      </td>
                    </motion.tr>
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
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};
