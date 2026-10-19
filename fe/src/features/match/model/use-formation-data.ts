"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getFormations, type FormationCollection } from "../api/formations";
import { getMatch, type Match } from "../api/match";
import { ApiRequestError } from "@/shared/api/http";
import { isPageAccessFailure } from "@/features/auth/model/page-access";

export function useFormationData(matchId: number, selection = "") {
  const [data, setData] = useState<FormationCollection | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true); setError("");
    try {
      const [collection, match] = await Promise.all([getFormations(matchId), getMatch(matchId)]);
      if (request !== sequence.current) return null;
      if (!collection.data || !match.data) throw new Error("경기 정보를 받지 못했어요.");
      setData(collection.data); setMatch(match.data);
      return collection.data;
    } catch (error) {
      if (request !== sequence.current) return null;
      if (error instanceof ApiRequestError && isPageAccessFailure(error.status)) { setMissing(true); setData(null); }
      setError(error instanceof Error ? error.message : "포메이션을 불러오지 못했어요.");
      return null;
    } finally { if (request === sequence.current) setLoading(false); }
  }, [matchId]);
  useEffect(() => {
    const currentSequence = sequence;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => { window.clearTimeout(timer); currentSequence.current++; };
  }, [refresh, selection]);
  return { data, match, loading, error, missing, refresh };
}
