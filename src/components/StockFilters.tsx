import React from "react";
import { Search, X, SlidersHorizontal, Layers } from "lucide-react";
import { SECTOR_CONFIG, COUNTRIES_MAP } from "../constants/brvmData";
import { StockData } from "../types";
import { CountryFlag } from "./CountryFlag";

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
  stocksForCountryCounts?: StockData[];
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
  stocksForCountryCounts = stocksFilteredByOthers,
  applyPricePreset
}) => {
  const isMinGreaterThanMax =
    minPrice !== "" && maxPrice !== "" && Number(minPrice) > Number(maxPrice);

  const hasActiveFilters =
    searchTerm !== "" ||
    dividendFilter !== "ALL" ||
    selectedSector !== "ALL" ||
    selectedCountry !== "ALL" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    pricePreset !== "ALL";

  const clearAllFilters = () => {
    setSearchTerm("");
    setDividendFilter("ALL");
    setSelectedSector("ALL");
    setSelectedCountry("ALL");
    setMinPrice("");
    setMaxPrice("");
    setPricePreset("ALL");
  };

  return (
    <section className="bg-white border-2 border-[#141414] rounded-none p-4 sm:p-5 shadow-[3px_3px_0px_#141414] mb-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <label htmlFor="search-input" className="sr-only">Rechercher par symbole, nom ou secteur</label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]" aria-hidden="true" />
          <input
            id="search-input"
            type="text"
            placeholder="Rechercher par symbole, nom ou secteur…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            className="w-full bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:ring-0 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-none py-2.5 pl-11 pr-4 text-xs font-mono text-[#141414] placeholder-[#141414]/50 outline-none transition-all duration-200"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              aria-label="Effacer la recherche"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#141414]/50 hover:text-[#141414] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-none"
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
            aria-label="Filtrer: tous les dividendes"
            className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              dividendFilter === "ALL"
                ? "bg-[#141414] border-[#141414] text-[#E4E3E0]"
                : "bg-white border-[#141414] text-[#141414] hover:bg-slate-50"
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setDividendFilter("ELIGIBLE")}
            aria-label="Filtrer: dividendes réguliers (3 ans ou plus)"
            className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
              dividendFilter === "ELIGIBLE"
                ? "bg-emerald-600 border-[#141414] text-white"
                : "bg-white border-[#141414] text-emerald-800 hover:bg-emerald-50/50"
            }`}
          >
            <span className="w-1.5 h-1.5 bg-emerald-400 border border-[#141414]/30 rounded-full" aria-hidden="true" />
            <span>Régulier (D ≥ 3 ans)</span>
          </button>
          <button
            onClick={() => setDividendFilter("INELIGIBLE")}
            aria-label="Filtrer: dividendes irréguliers (moins de 3 ans)"
            className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
              dividendFilter === "INELIGIBLE"
                ? "bg-amber-600 border-[#141414] text-white"
                : "bg-white border-[#141414] text-amber-900 hover:bg-amber-50/50"
            }`}
          >
            <span className="w-1.5 h-1.5 bg-amber-400 border border-[#141414]/30 rounded-full" aria-hidden="true" />
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
            aria-label="Filtrer: tous les prix"
            className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              pricePreset === "ALL" && !minPrice && !maxPrice
                ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                : "bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]/40"
            }`}
          >
            Tous les prix
          </button>
          <button
            onClick={() => applyPricePreset("UNDER_2500")}
            aria-label="Filtrer: prix inférieurs à 2 500 F"
            className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              pricePreset === "UNDER_2500"
                ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                : "bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]/40"
            }`}
          >
            &lt; 2 500 F
          </button>
          <button
            onClick={() => applyPricePreset("2500_10000")}
            aria-label="Filtrer: prix entre 2 500 F et 10 000 F"
            className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              pricePreset === "2500_10000"
                ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                : "bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]/40"
            }`}
          >
            2 500 F – 10 000 F
          </button>
          <button
            onClick={() => applyPricePreset("OVER_10000")}
            aria-label="Filtrer: prix supérieurs à 10 000 F"
            className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              pricePreset === "OVER_10000"
                ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
                : "bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]/40"
            }`}
          >
            &gt; 10 000 F
          </button>
        </div>

        {/* Custom Min / Max Inputs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {isMinGreaterThanMax && (
            <span className="text-[10px] text-rose-700 font-bold font-mono bg-rose-50 border border-rose-300 px-2 py-1">
              ⚠️ Min &gt; Max
            </span>
          )}
          <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="flex items-center space-x-1 bg-[#E4E3E0]/30 border-2 border-[#141414] px-2 py-1">
            <label htmlFor="min-price" className="text-[10px] text-[#141414]/50 uppercase font-bold">Min:</label>
            <input
              id="min-price"
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setPricePreset("CUSTOM");
              }}
              autoComplete="off"
              className="w-20 bg-transparent text-xs font-bold text-[#141414] outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 font-mono"
            />
            <span className="text-[10px] text-[#141414]/50">F</span>
          </div>

          <span className="text-[#141414]/60 font-bold">-</span>

          <div className="flex items-center space-x-1 bg-[#E4E3E0]/30 border-2 border-[#141414] px-2 py-1">
            <label htmlFor="max-price" className="text-[10px] text-[#141414]/50 uppercase font-bold">Max:</label>
            <input
              id="max-price"
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setPricePreset("CUSTOM");
              }}
              autoComplete="off"
              className="w-24 bg-transparent text-xs font-bold text-[#141414] outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 font-mono"
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
              aria-label="Réinitialiser la plage de prix"
              className="p-1 text-rose-600 hover:text-rose-800 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 rounded-none"
              title="Réinitialiser la plage de prix"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          </div>
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
          aria-label="Filtrer: tous les secteurs"
          className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
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
              aria-label={`Filtrer: secteur ${sectorName}`}
              className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
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
      <div className="pt-3 border-t border-[#141414] flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-[#141414]/60 font-bold uppercase tracking-wider mr-2 font-mono">
          Pays :
        </span>
        <button
          onClick={() => setSelectedCountry("ALL")}
          aria-label="Filtrer: tous les marchés"
          className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1 focus-visible:ring-2 focus-visible:ring-blue-500 ${
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
          const countOfCountry = stocksForCountryCounts.filter(
            (s) => s.country === code
          ).length;
          return (
            <button
              key={code}
              onClick={() => setSelectedCountry(code.toUpperCase())}
              aria-label={`Filtrer: pays ${data.name}`}
              className={`text-[10px] px-3 py-1.5 rounded-none border-2 font-bold uppercase tracking-wider transition-all duration-200 flex items-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-blue-500 ${
                selectedCountry === code.toUpperCase()
                  ? "bg-emerald-100 text-[#141414] border-[#141414]"
                  : "bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]/40"
              }`}
            >
              <CountryFlag code={code} />
              <span>{data.name}</span>
              <span className="text-[9px] bg-[#141414]/10 text-[#141414] font-mono border border-[#141414]/20 rounded-none px-1.5 py-0.5 ml-1">
                {countOfCountry}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="pt-3 border-t border-[#141414] flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-[10px] text-[#141414]/60 uppercase font-bold mr-1">Filtres actifs :</span>
          {searchTerm && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-[#141414] border border-[#141414] px-2 py-0.5 font-bold text-[10px]">
              "{searchTerm}"
              <button onClick={() => setSearchTerm("")} aria-label="Effacer recherche"><X className="w-3 h-3" /></button>
            </span>
          )}
          {dividendFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-[#141414] border border-[#141414] px-2 py-0.5 font-bold text-[10px]">
              {dividendFilter === "ELIGIBLE" ? "D ≥ 3 ans" : "D < 3 ans"}
              <button onClick={() => setDividendFilter("ALL")} aria-label="Effacer filtre dividendes"><X className="w-3 h-3" /></button>
            </span>
          )}
          {selectedSector !== "ALL" && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-[#141414] border border-[#141414] px-2 py-0.5 font-bold text-[10px]">
              {selectedSector}
              <button onClick={() => setSelectedSector("ALL")} aria-label="Effacer filtre secteur"><X className="w-3 h-3" /></button>
            </span>
          )}
          {selectedCountry !== "ALL" && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-[#141414] border border-[#141414] px-2 py-0.5 font-bold text-[10px]">
              {COUNTRIES_MAP[selectedCountry.toLowerCase()]?.name || selectedCountry}
              <button onClick={() => setSelectedCountry("ALL")} aria-label="Effacer filtre pays"><X className="w-3 h-3" /></button>
            </span>
          )}
          {(minPrice || maxPrice) && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-[#141414] border border-[#141414] px-2 py-0.5 font-bold text-[10px]">
              {minPrice || 0} - {maxPrice || "∞"} F
              <button onClick={() => { setMinPrice(""); setMaxPrice(""); setPricePreset("ALL"); }} aria-label="Effacer filtre prix"><X className="w-3 h-3" /></button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-[10px] text-rose-700 font-bold uppercase underline hover:text-rose-900 ml-auto"
          >
            Réinitialiser tout
          </button>
        </div>
      )}
    </section>
  );
};
