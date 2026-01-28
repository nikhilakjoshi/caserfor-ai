"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
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
import { cn } from "@/lib/utils";

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

export interface MentionDropdownRef {
  moveUp: () => void;
  moveDown: () => void;
  selectCurrent: () => boolean;
}

// Inner component that resets via key-based remounting
const MentionDropdownInner = forwardRef<
  MentionDropdownRef,
  MentionDropdownProps
>(function MentionDropdownInner(
  { open, onOpenChange, position, searchQuery, onSelect },
  ref
) {
  const { vaults, agents, loading } = useMentions(searchQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Build flat list of all items for keyboard navigation
  const allItems: Mention[] = [
    ...vaults.map((v) => ({ id: v.id, type: "vault" as const, name: v.name })),
    ...agents.map((a) => ({ id: a.id, type: "agent" as const, name: a.name })),
  ];

    // Expose navigation methods
    useImperativeHandle(ref, () => ({
      moveUp: () => {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
      },
      moveDown: () => {
        setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0));
      },
      selectCurrent: () => {
        if (allItems.length > 0 && selectedIndex < allItems.length) {
          onSelect(allItems[selectedIndex]);
          onOpenChange(false);
          return true;
        }
        return false;
      },
    }));

    const handleSelectVault = (vault: MentionableVault) => {
      onSelect({ id: vault.id, type: "vault", name: vault.name });
      onOpenChange(false);
    };

    const handleSelectAgent = (agent: MentionableAgent) => {
      onSelect({ id: agent.id, type: "agent", name: agent.name });
      onOpenChange(false);
    };

    // Calculate which item index corresponds to vault/agent lists
    const getItemIndex = (type: "vault" | "agent", idx: number) => {
      if (type === "vault") return idx;
      return vaults.length + idx;
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
                      {vaults.map((vault, idx) => (
                        <CommandItem
                          key={vault.id}
                          onSelect={() => handleSelectVault(vault)}
                          className={cn(
                            "cursor-pointer",
                            selectedIndex === getItemIndex("vault", idx) &&
                              "bg-accent text-accent-foreground"
                          )}
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
                      {agents.map((agent, idx) => (
                        <CommandItem
                          key={agent.id}
                          onSelect={() => handleSelectAgent(agent)}
                          className={cn(
                            "cursor-pointer",
                            selectedIndex === getItemIndex("agent", idx) &&
                              "bg-accent text-accent-foreground"
                          )}
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
);

// Wrapper that uses key to force remount and reset selectedIndex when searchQuery/open change
export const MentionDropdown = forwardRef<MentionDropdownRef, MentionDropdownProps>(
  function MentionDropdown(props, ref) {
    // Use searchQuery + open as key to reset state when they change
    const resetKey = `${props.searchQuery}-${props.open}`;
    return <MentionDropdownInner key={resetKey} {...props} ref={ref} />;
  }
);
