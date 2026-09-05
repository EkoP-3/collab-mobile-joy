import { useCallback, useEffect, useState } from "react";

const NOTES_KEY = "momentum-notes-v1";

/** dateKey -> serbest metin not */
export type NoteMap = Record<string, string>;

function loadNotes(): NoteMap {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as NoteMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function useNotes() {
  const [notes, setNotes] = useState<NoteMap | null>(null);

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  const setNote = useCallback((key: string, text: string) => {
    setNotes((prev) => {
      const next = { ...(prev ?? {}) };
      const trimmed = text.trim();
      if (trimmed) next[key] = trimmed;
      else delete next[key];
      try {
        localStorage.setItem(NOTES_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable
      }
      return next;
    });
  }, []);

  return { notes, setNote };
}
