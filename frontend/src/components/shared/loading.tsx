import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  text?: string;
}

export function Loading({ className, text }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16", className)}>
      <div className="relative">
        <div className="h-10 w-10 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
      {text && (
        <span className="text-sm text-muted-foreground animate-pulse-soft">{text}</span>
      )}
    </div>
  );
}

export function InlineLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 py-4 justify-center">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
}
