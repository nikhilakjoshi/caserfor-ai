"use client";

import { useState, useEffect, useMemo } from "react";

export interface MentionableVault {
  id: string;
  name: string;
  type: string;
  description: string | null;
  fileCount: number;
}

export interface MentionableAgent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface UseMentionsResult {
  vaults: MentionableVault[];
  agents: MentionableAgent[];
  loading: boolean;
}

export function useMentions(searchQuery: string): UseMentionsResult {
  const [vaults, setVaults] = useState<MentionableVault[]>([]);
  const [agents, setAgents] = useState<MentionableAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [vaultsRes, agentsRes] = await Promise.all([
          fetch("/api/vaults"),
          fetch("/api/agents"),
        ]);

        if (vaultsRes.ok) {
          const vaultsData = await vaultsRes.json();
          setVaults(
            vaultsData.map(
              (v: {
                id: string;
                name: string;
                type: string;
                description: string | null;
                _count?: { documents: number };
              }) => ({
                id: v.id,
                name: v.name,
                type: v.type,
                description: v.description,
                fileCount: v._count?.documents ?? 0,
              })
            )
          );
        }

        if (agentsRes.ok) {
          const agentsData = await agentsRes.json();
          setAgents(
            agentsData.map(
              (a: {
                id: string;
                name: string;
                slug: string;
                description: string | null;
              }) => ({
                id: a.id,
                name: a.name,
                slug: a.slug,
                description: a.description,
              })
            )
          );
        }
      } catch {
        // Silently fail - UI will show empty results
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredVaults = useMemo(() => {
    if (!searchQuery) return vaults;
    const q = searchQuery.toLowerCase();
    return vaults.filter((v) => v.name.toLowerCase().includes(q));
  }, [vaults, searchQuery]);

  const filteredAgents = useMemo(() => {
    if (!searchQuery) return agents;
    const q = searchQuery.toLowerCase();
    return agents.filter((a) => a.name.toLowerCase().includes(q));
  }, [agents, searchQuery]);

  return {
    vaults: filteredVaults,
    agents: filteredAgents,
    loading,
  };
}
