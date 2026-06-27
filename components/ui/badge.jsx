import { cn } from "@/utils/cn";

export function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    success: "bg-green-500/10 text-green-600 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    outline: "border border-input text-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
