import React from "react";
import { Search, X, SlidersHorizontal, Layers, RotateCcw } from "lucide-react";
import { SECTOR_CONFIG, COUNTRIES_MAP } from "../constants/brvmData";
import { StockData } from "../types";

export interface FilterChipProps {
  label: string;
  onRemove: () => void;
  ariaLabel: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, onRemove, ariaLabel }) => {
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#141414] text-[#E4E3E0] border border-[#141414] px-2.5 py-1 text-xs font-mono font-bold">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={ariaLabel}
        className="text-[#E4E3E0]/70 hover:text-white focus:outline-none focus:ring-1 focus:ring-white"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );
};

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

  const handlePriceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    applyPricePreset(val);
  };

  return (
    <section className="bg-white border-2 border-[#141414] rounded-none p-3 sm:p-4 shadow-[3px_3px_0px_#141414] mb-6 space-y-3 font-mono text-xs">
      {/* Top Filter Controls Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm h-11">
          <label htmlFor="search-input" className="sr-only">Rechercher par symbole, nom ou secteur</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]/70" aria-hidden="true" />
          <input
            id="search-input"
            type="text"
            placeholder="Rechercher symbole, nom…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            className="w-full h-full bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-none pl-9 pr-8 text-xs font-mono text-[#141414] placeholder-[#141414]/60 outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              aria-label="Effacer la recherche"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#141414]/60 hover:text-[#141414]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown: Secteur */}
        <div className="h-11">
          <label htmlFor="sector-select" className="sr-only">Filtrer par secteur BRVM</label>
          <select
            id="sector-select"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="h-full bg-white border-2 border-[#141414] text-xs font-bold font-mono text-[#141414] px-3 pr-7 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="ALL">Secteur: Tous ({stocksFilteredByOthers.length})</option>
            {Object.entries(SECTOR_CONFIG).map(([sName, cfg]) => {
              const count = stocksFilteredByOthers.filter((s) => s.sector === sName).length;
              return (
                <option key={sName} value={sName}>
                  {cfg.icon} {sName} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Dropdown: Pays */}
        <div className="h-11">
          <label htmlFor="country-select" className="sr-only">Filtrer par pays</label>
          <select
            id="country-select"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="h-full bg-white border-2 border-[#141414] text-xs font-bold font-mono text-[#141414] px-3 pr-7 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="ALL">Pays: Tous ({stocksFilteredByOthers.length})</option>
            {Object.entries(COUNTRIES_MAP).map(([code, data]) => {
              const count = stocksForCountryCounts.filter((s) => s.country === code).length;
              return (
                <option key={code} value={code.toUpperCase()}>
                  {data.name} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Dropdown: Prix */}
        <div className="h-11">
          <label htmlFor="price-select" className="sr-only">Filtrer par plage de prix</label>
          <select
            id="price-select"
            value={pricePreset}
            onChange={handlePriceSelect}
            className="h-full bg-white border-2 border-[#141414] text-xs font-bold font-mono text-[#141414] px-3 pr-7 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="ALL">Prix: Tous</option>
            <option value="UNDER_2500">&lt; 2 500 FCFA</option>
            <option value="2500_10000">2 500 – 10 000 FCFA</option>
            <option value="OVER_10000">&gt; 10 000 FCFA</option>
            {pricePreset === "CUSTOM" && <option value="CUSTOM">Personnalisé</option>}
          </select>
        </div>

        {/* Toggle: Dividendes Réguliers */}
        <button
          type="button"
          onClick={() => setDividendFilter(dividendFilter === "ELIGIBLE" ? "ALL" : "ELIGIBLE")}
          aria-pressed={dividendFilter === "ELIGIBLE"}
          className={`h-11 px-3.5 border-2 border-[#141414] font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
            dividendFilter === "ELIGIBLE"
              ? "bg-emerald-600 text-white border-[#141414]"
              : "bg-white text-emerald-900 hover:bg-emerald-50"
          }`}
        >
          <span className="w-2 h-2 bg-emerald-400 border border-[#141414] rounded-full" aria-hidden="true" />
          <span>Réguliers (D ≥ 3 ans)</span>
        </button>

        {isMinGreaterThanMax && (
          <span className="h-11 flex items-center text-xs text-rose-800 font-bold bg-rose-50 border-2 border-rose-400 px-3">
            ⚠️ Min &gt; Max
          </span>
        )}
      </div>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-[#141414]/20 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#141414]/70 font-bold uppercase mr-1">Filtres actifs :</span>
          {searchTerm && (
            <FilterChip
              label={`"${searchTerm}"`}
              onRemove={() => setSearchTerm("")}
              ariaLabel="Effacer la recherche"
            />
          )}
          {dividendFilter !== "ALL" && (
            <FilterChip
              label={dividendFilter === "ELIGIBLE" ? "Régulier (D ≥ 3 ans)" : "Irrégulier (D < 3 ans)"}
              onRemove={() => setDividendFilter("ALL")}
              ariaLabel="Effacer le filtre dividendes"
            />
          )}
          {selectedSector !== "ALL" && (
            <FilterChip
              label={selectedSector}
              onRemove={() => setSelectedSector("ALL")}
              ariaLabel="Effacer le filtre secteur"
            />
          )}
          {selectedCountry !== "ALL" && (
            <FilterChip
              label={COUNTRIES_MAP[selectedCountry.toLowerCase()]?.name || selectedCountry}
              onRemove={() => setSelectedCountry("ALL")}
              ariaLabel="Effacer le filtre pays"
            />
          )}
          {(minPrice || maxPrice || pricePreset !== "ALL") && (
            <FilterChip
              label={
                pricePreset === "UNDER_2500"
                  ? "< 2 500 F"
                  : pricePreset === "2500_10000"
                  ? "2 500–10 000 F"
                  : pricePreset === "OVER_10000"
                  ? "> 10 000 F"
                  : `${minPrice || 0}–${maxPrice || "∞"} F`
              }
              onRemove={() => {
                setMinPrice("");
                setMaxPrice("");
                setPricePreset("ALL");
              }}
              ariaLabel="Effacer le filtre prix"
            />
          )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="h-8 px-2.5 text-xs text-rose-700 font-bold uppercase underline hover:text-rose-900 ml-auto flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser tout</span>
          </button>
        </div>
      )}
    </section>
  );
};
