"use client";

import { useState, useCallback } from "react";

interface ChartState {
  activeDecade: number | null;
  setActiveDecade: (decade: number | null) => void;
  clearSelection: () => void;
}

export function useChartState(): ChartState {
  const [activeDecade, setActiveDecadeState] = useState<number | null>(null);

  const setActiveDecade = useCallback((decade: number | null) => {
    setActiveDecadeState(decade);
  }, []);

  const clearSelection = useCallback(() => {
    setActiveDecadeState(null);
  }, []);

  return {
    activeDecade,
    setActiveDecade,
    clearSelection,
  };
}
