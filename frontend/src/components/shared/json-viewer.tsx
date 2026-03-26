"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

interface JsonViewerProps {
  data: unknown;
  initialExpanded?: boolean;
  className?: string;
}

export function JsonViewer({ data, initialExpanded = false, className }: JsonViewerProps) {
  const [expanded, setExpanded] = useState(initialExpanded);

  const formatted = JSON.stringify(data, null, 2);

  return (
    <div className={className}>
      <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="mb-1 h-6 px-1 text-xs">
        {expanded ? <ChevronDown className="mr-1 h-3 w-3" /> : <ChevronRight className="mr-1 h-3 w-3" />}
        {expanded ? "Recolher" : "Expandir"} JSON
      </Button>
      {expanded && (
        <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
          <code>{formatted}</code>
        </pre>
      )}
    </div>
  );
}
