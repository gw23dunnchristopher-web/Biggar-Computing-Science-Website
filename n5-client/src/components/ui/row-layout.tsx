import { cn } from "@/lib/utils";
import type { ContentBlock } from "@/lib/past-papers";

interface RowLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function RowLayout({ children, className }: RowLayoutProps) {
  return (
    <div 
      className={cn(
        "flex flex-col md:flex-row gap-4 items-start justify-start w-full",
        className
      )}
      data-testid="row-layout"
    >
      {children}
    </div>
  );
}

interface RowLayoutItemProps {
  children: React.ReactNode;
  className?: string;
}

export function RowLayoutItem({ children, className }: RowLayoutItemProps) {
  return (
    <div 
      className={cn(
        "flex-shrink min-w-0 w-auto",
        className
      )}
    >
      {children}
    </div>
  );
}
