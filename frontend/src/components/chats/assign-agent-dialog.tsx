"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAgents } from "@/features/agents/use-agents";
import { useState } from "react";
import { Label } from "@/components/ui/label";

interface AssignAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (agenteIaId: string) => void;
  isLoading?: boolean;
}

export function AssignAgentDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: AssignAgentDialogProps) {
  const { data: agents } = useAgents();
  const [selectedId, setSelectedId] = useState<string>("");

  const activeAgents = (agents || []).filter((a) => a.ativo);

  function handleConfirm() {
    if (selectedId) {
      onConfirm(selectedId);
      setSelectedId("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atribuir Agente IA</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label>Selecione o agente</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um agente…" />
            </SelectTrigger>
            <SelectContent>
              {activeAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.nome} ({agent.tipo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId || isLoading}>
            {isLoading ? "Atribuindo…" : "Atribuir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
