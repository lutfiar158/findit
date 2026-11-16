export function Icon({ name, className = "text-[20px]" }: { name: string; className?: string }) {
  return <span aria-hidden="true" className={`material-symbols-outlined shrink-0 ${className}`}>{name}</span>;
}
