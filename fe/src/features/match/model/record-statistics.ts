export type PlayerStatistics = {
  actualParticipated: boolean;
  late: boolean;
  goalCount: number;
  assistCount: number;
  cleanSheetCount: number;
};

export function toPlayerStatistics(value?: Partial<PlayerStatistics>): PlayerStatistics {
  return {
    actualParticipated: value?.actualParticipated ?? false,
    late: value?.late ?? false,
    goalCount: value?.goalCount ?? 0,
    assistCount: value?.assistCount ?? 0,
    cleanSheetCount: value?.cleanSheetCount ?? 0,
  };
}

export function hasAttendanceConflict(value: PlayerStatistics): boolean {
  return !value.actualParticipated && (
    value.late || value.goalCount > 0 || value.assistCount > 0 || value.cleanSheetCount > 0
  );
}

export function changeActualParticipation(
  value: PlayerStatistics | undefined,
  actualParticipated: boolean,
): PlayerStatistics {
  return { ...toPlayerStatistics(value), actualParticipated };
}
