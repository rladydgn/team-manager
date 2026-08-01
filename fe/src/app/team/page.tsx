import { getServerTeams } from "@/features/team/api/server-team";
import TeamsClientPage from "./teams-client-page";

export default async function TeamsPage() {
  const { teams, errorMessage } = await getServerTeams();

  return <TeamsClientPage initialTeams={teams} initialLoadError={errorMessage} />;
}
