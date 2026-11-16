export const categories = [
  { name: "Elektronik", icon: "devices", hint: "Laptop, HP, Charger", tone: "bg-primary-fixed text-primary" },
  { name: "Dompet", icon: "account_balance_wallet", hint: "Pouch, Cardholder", tone: "bg-secondary-fixed text-on-secondary-fixed" },
  { name: "Kunci", icon: "key", hint: "Motor, Kos, Loker", tone: "bg-secondary-container/20 text-secondary" },
  { name: "Kartu Identitas", icon: "badge", hint: "KTM, KTP, SIM", tone: "bg-tertiary-fixed text-on-tertiary-fixed" },
  { name: "Tas", icon: "backpack", hint: "Ransel, Totebag", tone: "bg-surface-container-high text-primary" },
  { name: "Lainnya", icon: "category", hint: "Botol, Payung, Buku", tone: "bg-surface-container text-on-surface-variant" },
];

export const locations = [
  { value: "perpus", label: "Perpustakaan Pusat" },
  { value: "gedung-kuliah", label: "Gedung Kuliah Bersama" },
  { value: "kantin", label: "Kantin & Food Court" },
  { value: "parkir", label: "Area Parkir & Lapangan" },
  { value: "lab", label: "Laboratorium & Bengkel" },
  { value: "lainnya", label: "Area Kampus Lainnya" },
];

export function locationLabel(value: string) {
  return locations.find((location) => location.value === value)?.label ?? value;
}
