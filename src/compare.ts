import type { ExamRecord, EyeSide, Refraction } from "./types";

// ─────────────────────────────────────────────
// 比较逻辑：与同一患者同一只眼睛的上次结果对照
// 纯函数，不依赖 React 与 localStorage
// ─────────────────────────────────────────────

export const CHANGE_THRESHOLD = 0.25;

export type ChangeLevel = "up" | "down" | "flat";

export interface NumericChange {
  /** 本次 - 上次 */
  delta: number;
  /** |delta| 是否超过 0.25D */
  marked: boolean;
  level: ChangeLevel;
}

export interface EyeComparison {
  side: EyeSide;
  current: Refraction;
  previous?: Refraction;
  previousDate?: string;
  previousRecordId?: string;
  sphere: NumericChange;
  cylinder: NumericChange;
  axis: NumericChange;
  /** 球镜或柱镜变化超过 0.25D（轴位按角度差同样阈值提示） */
  marked: boolean;
}

export interface RecordComparison {
  record: ExamRecord;
  right: EyeComparison;
  left: EyeComparison;
  /** 任一眼有显著变化 */
  marked: boolean;
}

export function compareNumber(current: number, previous: number | undefined): NumericChange {
  if (previous === undefined) {
    return { delta: 0, marked: false, level: "flat" };
  }
  const delta = Number((current - previous).toFixed(2));
  return {
    delta,
    marked: Math.abs(delta) > CHANGE_THRESHOLD,
    level: delta > 0 ? "up" : delta < 0 ? "down" : "flat"
  };
}

/** 取该患者在本次记录之前最近的一次记录（按日期、再按登记先后） */
export function findPreviousRecord(
  all: ExamRecord[],
  current: ExamRecord
): ExamRecord | undefined {
  return all
    .filter(
      (r) =>
        r.patientId === current.patientId &&
        r.id !== current.id &&
        (r.date < current.date ||
          (r.date === current.date && r.createdAt < current.createdAt))
    )
    .sort((a, b) =>
      a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1
    )[0];
}

/** 取该患者最新一条已有记录，供登记表单预填 */
export function findLatestForPatient(
  all: ExamRecord[],
  patientId: string
): ExamRecord | undefined {
  return all
    .filter((r) => r.patientId === patientId)
    .sort((a, b) =>
      a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1
    )[0];
}

/** 直接拿一只眼的草稿值与指定上次记录对照（表单实时提示用） */
export function compareDraftEye(
  side: EyeSide,
  current: Refraction,
  previous: ExamRecord | undefined
): EyeComparison {
  return compareEye(side, current, previous);
}

export function compareEye(
  side: EyeSide,
  current: Refraction,
  previous: ExamRecord | undefined
): EyeComparison {
  const prev = previous ? previous[side === "R" ? "rightEye" : "leftEye"] : undefined;
  const sphere = compareNumber(current.sphere, prev?.sphere);
  const cylinder = compareNumber(current.cylinder, prev?.cylinder);
  const axis = compareNumber(current.axis, prev?.axis);
  return {
    side,
    current,
    previous: prev,
    previousDate: previous?.date,
    previousRecordId: previous?.id,
    sphere,
    cylinder,
    axis,
    // 轴位单位是角度不是屈光度，是否标出只看球镜、柱镜是否超过 0.25D
    marked: sphere.marked || cylinder.marked
  };
}

export function compareRecord(
  all: ExamRecord[],
  record: ExamRecord
): RecordComparison {
  const previous = findPreviousRecord(all, record);
  const right = compareEye("R", record.rightEye, previous);
  const left = compareEye("L", record.leftEye, previous);
  return { record, right, left, marked: right.marked || left.marked };
}

export function compareRecords(all: ExamRecord[]): RecordComparison[] {
  return all.map((record) => compareRecord(all, record));
}

/** 格式化带正负号的度数变化，如 +0.50 / -0.25 */
export function formatDelta(change: NumericChange): string {
  if (change.level === "flat") return "0";
  const sign = change.delta > 0 ? "+" : "-";
  return `${sign}${Math.abs(change.delta).toFixed(2)}`;
}
