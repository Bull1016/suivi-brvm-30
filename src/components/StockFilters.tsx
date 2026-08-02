import React from "react";
import { Search, X, SlidersHorizontal, Layers } from "lucide-react";
import { SECTOR_CONFIG, COUNTRIES_MAP } from "../constants/brvmData";
import { StockData } from "../types";

interface StockFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  dividendFilter: "ALL" | "ELIGIBLE" | "INELIGIBLE";
  setDividendFilter: (filter: "ALL" | "ELIGIBLE" | "INELIGIBLE") => void;
  selectedSector: string;
  setSelectedSector: (sector: string) => void;
  minPrice: string;
  setMinPrice: (price: string) => void;
  maxPrice: string;
  setMaxPrice: (price: string) => void;
  pricePreset: string;
  setPricePreset: (preset: string) => void;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  stocksFilteredByOthers: StockData[];
  applyPricePreset: (preset: string) => void;
}

export const StockFilters: React.FC<StockFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  dividendFilter,
  setDividendFilter,
  selectedSector,
  setSelectedSector,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  pricePreset,
  setPricePreset,
  selectedCountry,
  setSelectedCountry,
  stocksFilteredByOthers,
  applyPricePreset
}) => {
  return (
    <section className="bg-white border-2 border-[#141414] rounded-none p-4 sm:p-6 shadow-[4px_4px_0px_#141414] mb-8 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]" />
          <input
            type="text"
            placeholder="Rechercher par symbole, nom ou secteur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:ring-0 rounded-none py-2.5 pl-11 pr-4 text-xs font-mono text-[#141414] placeholder-[#141414]/50 outline-none transition-all duration-200"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#141414]/50 hover:text-[#141414]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dividend Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider mr-2 font-mono">
            Dividendes :
          </span>
          <button
            onClick={() => setDividendFilter("ALL")}
            className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 ${
              dividendFilter === "ALL"
                ? "bg-[#141414] border-[#141414] text-[#E4E3E0]"
                : "bg-white border-[#141414] text-[#141414] hover:bg-slate-50"
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setDividendFilter("ELIGIBLE")}
            className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1.5 ${
              dividendFilter === "ELIGIBLE"
                ? "bg-emerald-600 border-[#141414] text-white"
                : "bg-white border-[#141414] text-emerald-800 hover:bg-emerald-50/50"
            }`}
          >
            <span className="w-1.5 h-1.5 bg-emerald-400 border border-[#141414]/30 rounded-full" />
            <span>Régulier (D ≥ 3 ans)</span>
          </button>
          <button
            onClick={() => setDividendFilter("INELIGIBLE")}
            className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1.5 ${
              dividendFilter === "INELIGIBLE"
                ? "bg-amber-600 border-[#141414] text-white"
                : "bg-white border-[#141414] text-amber-900 hover:bg-amber-50/50"
            }`}
          >
            <span className="w-1.5 h-1.5 bg-amber-400 border border-[#141414]/30 rounded-full" />
            <span>Irrégulier (D &lt; 3 ans)</span>
          </button>
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="pt-4 border-t border-[#141414] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider mr-2 font-mono flex items-center space-x-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#141414]" />
            <span>Plage de Prix (FCFA) :</span>
          </span>

          <button
            onClick={() => applyPricePreset("ALL")}
            className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 ${
              pricePreset === "ALL" && !minPrice && !maxPrice
                ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                : "bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]/40"
            }`}
          >
            Tous les prix
          </button>
          <button
            onClick={() => applyPricePreset("UNDER_2500")}
            className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 ${
              pricePreset === "UNDER_2500"
                ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                : "bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]/40"
            }`}
          >
            &lt; 2 500 F
          </button>
          <button
            onClick={() => applyPricePreset("2500_10000")}
            className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 ${
              pricePreset === "2500_10000"
                ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                : "bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]/40"
            }`}
          >
            2 500 F – 10 000 F
          </button>
          <button
            onClick={() => applyPricePreset("OVER_10000")}
            className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 ${
              pricePreset === "OVER_10000"
                ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                : "bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]/40"
            }`}
          >
            &gt; 10 000 F
          </button>
        </div>

        {/* Custom Min / Max Inputs */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="flex items-center space-x-1 bg-[#E4E3E0]/30 border-2 border-[#141414] px-2 py-1">
            <span className="text-[10px] text-[#141414]/50 uppercase font-bold">Min:</span>
            <input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setPricePreset("CUSTOM");
              }}
              className="w-20 bg-transparent text-xs font-bold text-[#141414] outline-none font-mono"
            />
            <span className="text-[10px] text-[#141414]/50">F</span>
          </div>

          <span className="text-[#141414]/60 font-bold">-</span>

          <div className="flex items-center space-x-1 bg-[#E4E3E0]/30 border-2 border-[#141414] px-2 py-1">
            <span className="text-[10px] text-[#141414]/50 uppercase font-bold">Max:</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setPricePreset("CUSTOM");
              }}
              className="w-24 bg-transparent text-xs font-bold text-[#141414] outline-none font-mono"
            />
            <span className="text-[10px] text-[#141414]/50">F</span>
          </div>

          {(minPrice || maxPrice) && (
            <button
              onClick={() => {
                setMinPrice("");
                setMaxPrice("");
                setPricePreset("ALL");
              }}
              className="p-1 text-rose-600 hover:text-rose-800"
              title="Réinitialiser la plage de prix"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sector Filters */}
      <div className="pt-4 border-t border-[#141414] flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider mr-2 font-mono flex items-center space-x-1">
          <Layers className="w-3.5 h-3.5 text-[#141414]" />
          <span>Secteurs BRVM :</span>
        </span>

        <button
          onClick={() => setSelectedSector("ALL")}
          className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1 ${
            selectedSector === "ALL"
              ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
              : "bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]/40"
          }`}
        >
          <span>🏬 Tous les secteurs</span>
          <span
            className={`text-[9px] font-mono border rounded-none px-1.5 py-0.5 ml-1 ${
              selectedSector === "ALL"
                ? "bg-emerald-500/20 text-[#E4E3E0] border-[#E4E3E0]/30"
                : "bg-[#141414]/10 text-[#141414] border-[#141414]/20"
            }`}
          >
            {stocksFilteredByOthers.length}
          </span>
        </button>

        {Object.entries(SECTOR_CONFIG).map(([sectorName, cfg]) => {
          const countOfSector = stocksFilteredByOthers.filter(
            (s) => s.sector === sectorName
          ).length;
          const isSelected = selectedSector === sectorName;
          return (
            <button
              key={sectorName}
              onClick={() => setSelectedSector(sectorName)}
              className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1.5 ${
                isSelected
                  ? "bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-[2px_2px_0px_rgba(0,0,0,0.15)]"
                  : "bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]/40"
              }`}
            >
              <span>{cfg.icon}</span>
              <span>{sectorName}</span>
              <span
                className={`text-[9px] font-mono border rounded-none px-1.5 py-0.5 ml-0.5 ${
                  isSelected
                    ? "bg-white/20 text-white border-white/30"
                    : "bg-[#141414]/10 text-[#141414] border-[#141414]/20"
                }`}
              >
                {countOfSector}
              </span>
            </button>
          );
        })}
      </div>

      {/* Country Badges Filters */}
      <div className="pt-4 border-t border-[#141414] flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider mr-2 font-mono">
          Pays :
        </span>
        <button
          onClick={() => setSelectedCountry("ALL")}
          className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1 ${
            selectedCountry === "ALL"
              ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
              : "bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]/40"
          }`}
        >
          <span>🌍 Tous les marchés</span>
          <span
            className={`text-[9px] font-mono border rounded-none px-1.5 py-0.5 ml-1 ${
              selectedCountry === "ALL"
                ? "bg-emerald-500/20 text-[#E4E3E0] border-[#E4E3E0]/30"
                : "bg-[#141414]/10 text-[#141414] border-[#141414]/20"
            }`}
          >
            {stocksFilteredByOthers.length}
          </span>
        </button>
        {Object.entries(COUNTRIES_MAP).map(([code, data]) => {
          const countOfCountry = stocksFilteredByOthers.filter(
            (s) => s.country === code
          ).length;
          return (
            <button
              key={code}
              onClick={() => setSelectedCountry(code.toUpperCase())}
              className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1 ${
                selectedCountry === code.toUpperCase()
                  ? "bg-emerald-100 text-[#141414] border-[#141414]"
                  : "bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]/40"
              }`}
            >
              <span>{data.flag}</span>
              <span>{data.name}</span>
              <span className="text-[9px] bg-[#141414]/10 text-[#141414] font-mono border border-[#141414]/20 rounded-none px-1.5 py-0.5 ml-1">
                {countOfCountry}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
