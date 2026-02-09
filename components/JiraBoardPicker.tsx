"use client";

import { useEffect, useState } from "react";

type Board = { id: number; name: string; type: string };

export function JiraBoardPicker({ onSelect }: { onSelect: (boardId: number) => void }) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/jira/boards");
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load boards");
        setBoards(data.boards || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="card space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Select Jira Board</h2>
        <p className="text-sm text-zinc-600">We’ll use this board to pull data.</p>
      </div>

      {error && <p className="text-sm text-red-600">❌ {error}</p>}

      <select
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value);
          const id = Number(e.target.value);
          if (!Number.isNaN(id)) onSelect(id);
        }}
        className="input w-full"
      >
        <option value="">{loading ? "Loading boards..." : "Choose a board"}</option>
        {boards.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name} ({b.type}) — id:{b.id}
          </option>
        ))}
      </select>

      {selected && (
        <p className="text-sm text-zinc-700">
          ✅ Selected boardId: <span className="font-medium">{selected}</span>
        </p>
      )}
    </div>
  );
}
