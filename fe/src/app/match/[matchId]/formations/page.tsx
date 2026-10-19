import { Suspense } from "react";
import { FormationLoading, FormationPage } from "@/features/match/ui/FormationPages";

export default async function Page({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <Suspense fallback={<FormationLoading />}><FormationPage matchId={Number(matchId)} /></Suspense>;
}
