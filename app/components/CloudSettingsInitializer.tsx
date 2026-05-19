"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/lib/settingsStore";

export default function CloudSettingsInitializer() {
  const fetchFromCloud = useSettingsStore((state: any) => state.fetchFromCloud);

  useEffect(() => {
    // Call fetch only once on initial mount
    fetchFromCloud();
  }, [fetchFromCloud]);

  return null; // Renders nothing
}
