"use client";

import { useEffect } from "react";
import { addSearchHistory } from "@/lib/client-auth";

type SearchHistoryTrackerProps = {
  query: string;
};

export default function SearchHistoryTracker({ query }: SearchHistoryTrackerProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      addSearchHistory(query);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  return null;
}
