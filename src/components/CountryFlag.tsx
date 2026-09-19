import React from "react";
import CI from "country-flag-icons/react/3x2/CI";
import SN from "country-flag-icons/react/3x2/SN";
import BF from "country-flag-icons/react/3x2/BF";
import BJ from "country-flag-icons/react/3x2/BJ";
import TG from "country-flag-icons/react/3x2/TG";
import ML from "country-flag-icons/react/3x2/ML";
import NE from "country-flag-icons/react/3x2/NE";

const FLAG_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  ci: CI,
  sn: SN,
  bf: BF,
  bj: BJ,
  tg: TG,
  ml: ML,
  ne: NE,
};

export const CountryFlag: React.FC<{ code: string; className?: string }> = ({
  code,
  className = "w-5 h-3.5 inline-block rounded-none border border-[#141414]/30 shadow-xs flex-shrink-0"
}) => {
  const Flag = FLAG_COMPONENTS[code.toLowerCase()];
  if (!Flag) return <span className="text-base leading-none">🌍</span>;
  return <Flag className={className} />;
};
