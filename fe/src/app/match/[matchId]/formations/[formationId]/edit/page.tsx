import { Suspense } from "react";
import { FormationLoading, FormationPage } from "@/features/match/ui/FormationPages";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ matchId: string; formationId: string }> }) {
  const { matchId, formationId } = await params;
  if (!/^\d+$/.test(formationId) || !Number.isSafeInteger(Number(formationId)) || Number(formationId) < 1) notFound();
  return <Suspense fallback={<FormationLoading />}><FormationPage matchId={Number(matchId)} formationId={Number(formationId)} mode="edit" /></Suspense>;
}
