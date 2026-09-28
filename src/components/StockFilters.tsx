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
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-[#E4E3E0]/70 hover:text-white focus:outline-none focus:ring-1 focus:ring-white"
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
  const [isMobileModalOpen, setIsMobileModalOpen] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const triggerButtonRef = React.useRef<HTMLButtonElement>(null);

  const isMinGreaterThanMax =
    minPrice !== "" && maxPrice !== "" && Number(minPrice) > Number(maxPrice);

  const activeFilterCount =
    (searchTerm ? 1 : 0) +
    (dividendFilter !== "ALL" ? 1 : 0) +
    (selectedSector !== "ALL" ? 1 : 0) +
    (selectedCountry !== "ALL" ? 1 : 0) +
    (minPrice !== "" || maxPrice !== "" || pricePreset !== "ALL" ? 1 : 0);

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

  const handleModalClose = () => {
    setIsMobileModalOpen(false);
    triggerButtonRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleModalClose();
    }
  };

  React.useEffect(() => {
    if (isMobileModalOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0] as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isMobileModalOpen]);

  return (
    <section className="bg-white border-2 border-[#141414] rounded-none p-2 sm:p-4 shadow-[3px_3px_0px_#141414] mb-4 sm:mb-6 space-y-2 sm:space-y-3 font-mono text-xs">
      {/* Top Filter Controls Bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[180px] sm:min-w-[200px] max-w-sm h-9 sm:h-11">
          <label htmlFor="search-input" className="sr-only">Rechercher par symbole, nom ou secteur</label>
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#141414]/70" aria-hidden="true" />
          <input
            id="search-input"
            type="text"
            placeholder="Rechercher symbole, nom…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            className="w-full h-full bg-[#E4E3E0]/30 border-2 border-[#141414] focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-none pl-8 sm:pl-9 pr-10 sm:pr-12 text-xs font-mono text-[#141414] placeholder-[#141414]/60 outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              aria-label="Effacer la recherche"
              className="absolute right-0 top-1/2 inline-flex min-h-[36px] sm:min-h-[44px] min-w-[36px] sm:min-w-[44px] -translate-y-1/2 items-center justify-center text-[#141414]/60 hover:text-[#141414]"
            >
              <X className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </button>
          )}
        </div>

        {/* Mobile Filter Sheet Button (< 640px) */}
        <button
          ref={triggerButtonRef}
          type="button"
          onClick={() => setIsMobileModalOpen(true)}
          className="sm:hidden h-9 px-3 bg-white border-2 border-[#141414] font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-[2px_2px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          aria-label="Ouvrir les filtres avancés"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Filtres</span>
          {activeFilterCount > 0 && (
            <span className="bg-[#141414] text-[#E4E3E0] text-[9px] px-1 py-0.2 font-mono">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Desktop Controls (≥ 640px) */}
        <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Dropdown: Secteur */}
          <div className="h-9 sm:h-11">
            <label htmlFor="sector-select" className="sr-only">Filtrer par secteur BRVM</label>
            <select
              id="sector-select"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="h-full bg-white border-2 border-[#141414] text-xs font-bold font-mono text-[#141414] px-2.5 sm:px-3 pr-6 sm:pr-7 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
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
          <div className="h-9 sm:h-11">
            <label htmlFor="country-select" className="sr-only">Filtrer par pays</label>
            <select
              id="country-select"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="h-full bg-white border-2 border-[#141414] text-xs font-bold font-mono text-[#141414] px-2.5 sm:px-3 pr-6 sm:pr-7 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
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
          <div className="h-9 sm:h-11">
            <label htmlFor="price-select" className="sr-only">Filtrer par plage de prix</label>
            <select
              id="price-select"
              value={pricePreset}
              onChange={handlePriceSelect}
              className="h-full bg-white border-2 border-[#141414] text-xs font-bold font-mono text-[#141414] px-2.5 sm:px-3 pr-6 sm:pr-7 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
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
            className={`h-9 sm:h-11 px-2.5 sm:px-3.5 border-2 border-[#141414] font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer ${
              dividendFilter === "ELIGIBLE"
                ? "bg-emerald-600 text-white border-[#141414]"
                : "bg-white text-emerald-900 hover:bg-emerald-50"
            }`}
          >
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-emerald-400 border border-[#141414] rounded-full" aria-hidden="true" />
            <span className="hidden sm:inline">Réguliers (D ≥ 3 ans)</span>
            <span className="sm:hidden">Réguliers</span>
          </button>
        </div>

        {isMinGreaterThanMax && (
          <span className="h-9 sm:h-11 flex items-center text-xs text-rose-800 font-bold bg-rose-50 border-2 border-rose-400 px-2 sm:px-3">
            ⚠️ Min &gt; Max
          </span>
        )}
      </div>

      {/* Active Filter Chips Bar */}
      {activeFilterCount > 0 && (
        <div className="pt-1.5 sm:pt-2 border-t border-[#141414]/20 flex flex-wrap items-center gap-1.5 sm:gap-2">
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
            className="h-9 sm:h-11 px-2 sm:px-2.5 text-xs text-rose-700 font-bold uppercase underline hover:text-rose-900 ml-auto flex items-center space-x-1"
          >
            <RotateCcw className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            <span className="hidden sm:inline">Réinitialiser tout</span>
            <span className="sm:hidden">Réinitialiser</span>
          </button>
        </div>
      )}
      {/* Mobile Filters Modal */}
      {isMobileModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#141414]/60 flex flex-col justify-end sm:hidden animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Filtres de recherche"
          onKeyDown={handleKeyDown}
        >
          <div
            ref={modalRef}
            className="bg-white border-t-4 border-[#141414] p-3 max-h-[85vh] overflow-y-auto space-y-3 font-mono text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#141414]">
              <div className="flex items-center space-x-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#141414]" />
                <h2 className="font-black text-xs sm:text-sm uppercase tracking-wider">Filtres BRVM 30</h2>
              </div>
              <button
                type="button"
                onClick={handleModalClose}
                className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center p-1 text-[#141414] hover:bg-[#141414]/10"
                aria-label="Fermer les filtres"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Secteur */}
            <div className="space-y-1">
              <label htmlFor="mobile-sector-select" className="font-bold uppercase text-[10px] text-[#141414]/80">
                Secteur d'activité
              </label>
              <select
                id="mobile-sector-select"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full h-9 bg-white border-2 border-[#141414] text-xs font-bold font-mono px-2.5"
              >
                <option value="ALL">Tous les secteurs ({stocksFilteredByOthers.length})</option>
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

            {/* Pays */}
            <div className="space-y-1">
              <label htmlFor="mobile-country-select" className="font-bold uppercase text-[10px] text-[#141414]/80">
                Pays d'origine
              </label>
              <select
                id="mobile-country-select"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full h-9 bg-white border-2 border-[#141414] text-xs font-bold font-mono px-2.5"
              >
                <option value="ALL">Tous les pays ({stocksFilteredByOthers.length})</option>
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

            {/* Prix */}
            <div className="space-y-1">
              <label htmlFor="mobile-price-select" className="font-bold uppercase text-[10px] text-[#141414]/80">
                Plage de prix
              </label>
              <select
                id="mobile-price-select"
                value={pricePreset}
                onChange={handlePriceSelect}
                className="w-full h-9 bg-white border-2 border-[#141414] text-xs font-bold font-mono px-2.5"
              >
                <option value="ALL">Tous les prix</option>
                <option value="UNDER_2500">&lt; 2 500 FCFA</option>
                <option value="2500_10000">2 500 – 10 000 FCFA</option>
                <option value="OVER_10000">&gt; 10 000 FCFA</option>
                {pricePreset === "CUSTOM" && <option value="CUSTOM">Personnalisé</option>}
              </select>
            </div>

            {/* Dividendes */}
            <div className="space-y-1 pt-0.5">
              <label className="font-bold uppercase text-[10px] text-[#141414]/80 block">
                Historique Dividendes
              </label>
              <button
                type="button"
                onClick={() => setDividendFilter(dividendFilter === "ELIGIBLE" ? "ALL" : "ELIGIBLE")}
                className={`w-full h-9 px-3 border-2 border-[#141414] font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all ${
                  dividendFilter === "ELIGIBLE"
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-emerald-900"
                }`}
              >
                <span>Réguliers (D ≥ 3 ans)</span>
                <span className="w-2 h-2 bg-emerald-400 border border-[#141414] rounded-full" />
              </button>
            </div>

            <div className="pt-2 border-t-2 border-[#141414] flex gap-2">
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex-1 h-9 border-2 border-[#141414] font-bold text-xs uppercase bg-white hover:bg-slate-100"
              >
                Réinitialiser
              </button>
              <button
                type="button"
                onClick={handleModalClose}
                className="flex-1 h-9 border-2 border-[#141414] font-bold text-xs uppercase bg-[#141414] text-white"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
