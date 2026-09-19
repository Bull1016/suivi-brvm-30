export const formatPrice = (price: number): string => {
  if (price === undefined || price === null || isNaN(price)) return "0 FCFA";
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);
  return `${formatted} FCFA`;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timePart = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} à ${timePart}`;
};
