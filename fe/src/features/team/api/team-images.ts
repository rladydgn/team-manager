import { deleteJson, getJson, putJson, sendFormData } from "@/shared/api/http";

export type TeamImage = {
  id: number;
  url: string;
  originalFileName: string;
  fileSizeBytes: number;
  createdAt: string;
};

export function getTeamImages(teamId: number) {
  return getJson<TeamImage[]>(`/teams/${teamId}/images`, { cache: "no-store" });
}

export function uploadTeamImage(teamId: number, image: File) {
  const body = new FormData();
  body.append("image", image);
  return sendFormData<TeamImage[]>(`/teams/${teamId}/images`, "POST", body);
}

export function deleteTeamImage(teamId: number, imageId: number) {
  return deleteJson<TeamImage[]>(`/teams/${teamId}/images/${imageId}`);
}

export function reorderTeamImages(teamId: number, imageIds: number[], expectedImageIds: number[]) {
  return putJson<TeamImage[], { imageIds: number[]; expectedImageIds: number[] }>(`/teams/${teamId}/images/order`, { imageIds, expectedImageIds });
}
