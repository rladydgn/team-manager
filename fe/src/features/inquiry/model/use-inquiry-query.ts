"use client";

import { useEffect, useState } from "react";

export function useInquiryQuery<T>(load: () => Promise<{ data: T | null }>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    async function fetchInquiry() {
      try {
        const response = await load();
        if (!response.data) throw new Error("문의 정보를 받지 못했습니다.");
        if (active) setData(response.data);
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : "문의를 불러오지 못했습니다.");
      }
    }
    void fetchInquiry();
    return () => { active = false; };
  }, [load, attempt]);

  function retry() {
    setError("");
    setData(null);
    setAttempt((value) => value + 1);
  }

  return { data, error, retry };
}
