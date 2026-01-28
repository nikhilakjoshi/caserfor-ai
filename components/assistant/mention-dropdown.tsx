"use client";

import { Database, Bot } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent } from "@/components/ui/popover";
import {
  useMentions,
  type MentionableVault,
  type MentionableAgent,
} from "@/hooks/use-mentions";

export type MentionType = "vault" | "agent";

export interface Mention {
  id: string;
  type: MentionType;
  name: string;
}

interface MentionDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: { x: number; y: number };
  searchQuery: string;
  onSelect: (mention: Mention) => void;
}

export function MentionDropdown({
  open,
  onOpenChange,
  position,
  searchQuery,
  onSelect,
}: MentionDropdownProps) {
  const { vaults, agents, loading } = useMentions(searchQuery);

  const handleSelectVault = (vault: MentionableVault) => {
    onSelect({ id: vault.id, type: "vault", name: vault.name });
    onOpenChange(false);
  };

  const handleSelectAgent = (agent: MentionableAgent) => {
    onSelect({ id: agent.id, type: "agent", name: agent.name });
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <div
        style={{
          position: "absolute",
          left: position.x,
          top: position.y,
        }}
      />
      <PopoverContent
        className="w-64 p-0"
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : vaults.length === 0 && agents.length === 0 ? (
              <CommandEmpty>No results found</CommandEmpty>
            ) : (
              <>
                {vaults.length > 0 && (
                  <CommandGroup heading="Vaults">
                    {vaults.map((vault) => (
                      <CommandItem
                        key={vault.id}
                        onSelect={() => handleSelectVault(vault)}
                        className="cursor-pointer"
                      >
                        <Database className="h-4 w-4 text-blue-500" />
                        <span className="flex-1 truncate">{vault.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {vault.fileCount} files
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {agents.length > 0 && (
                  <CommandGroup heading="Agents">
                    {agents.map((agent) => (
                      <CommandItem
                        key={agent.id}
                        onSelect={() => handleSelectAgent(agent)}
                        className="cursor-pointer"
                      >
                        <Bot className="h-4 w-4 text-purple-500" />
                        <span className="truncate">{agent.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
