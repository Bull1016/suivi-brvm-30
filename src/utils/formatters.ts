export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0
  }).format(price);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return (
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) +
    " (" +
    d.toLocaleDateString("fr-FR") +
    ")"
  );
};
