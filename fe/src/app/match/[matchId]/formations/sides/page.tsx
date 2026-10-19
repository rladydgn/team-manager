import { ParticipantSidesPage } from "@/features/match/ui/ParticipantSidesPage";

export default async function Page({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <ParticipantSidesPage matchId={Number(matchId)} />;
}
