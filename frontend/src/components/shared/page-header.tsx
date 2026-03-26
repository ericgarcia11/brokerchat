import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, children, className }: PageHeaderProps) {
  const trailing = action || children;
  return (
    <div className={cn("flex items-start justify-between pb-2", className)}>
      <div className="space-y-0.5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {trailing && (
        <div className="flex items-center gap-2 shrink-0 ml-4">{trailing}</div>
      )}
    </div>
  );
}
