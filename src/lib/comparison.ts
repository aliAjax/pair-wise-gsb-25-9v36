// 比较逻辑：与同一患者同眼的上一次结果逐项对比
import type { ExamRecord, EyeRx, EyeSide } from "../types";
import { exceedsThreshold, axisDelta } from "./registration";

export interface ValueDelta {
  from: number;
  to: number;
  delta: number;
  /** 球镜/柱镜变化是否超过 0.25D */
  changed: boolean;
}

export interface AxisDeltaInfo {
  from: number;
  to: number;
  /** 圆周最短轴位差，仅展示不参与 0.25D 标记 */
  delta: number;
}

export interface EyeComparison {
  side: EyeSide;
  previousDate: string;
  sphere: ValueDelta;
  cylinder: ValueDelta;
  /** 球镜或柱镜任一项超过 0.25D */
  flagged: boolean;
  axis: AxisDeltaInfo;
}

export interface RecordComparison {
  /** 无上一次记录时为 null（首次登记，不比较） */
  previous: ExamRecord | null;
  od: EyeComparison | null;
  os: EyeComparison | null;
  flagged: boolean;
}

/**
 * 该患者同眼的“上一次结果”：
 * 按检查日期、保存时间排序的紧邻前一条记录（不含自身）。
 */
export function findPreviousRecord(
  records: ExamRecord[],
  current: ExamRecord,
): ExamRecord | null {
  const older = records
    .filter(
      (r) =>
        r.patientId === current.patientId &&
        (r.examDate < current.examDate ||
          (r.examDate === current.examDate && r.createdAt < current.createdAt)),
    )
    .sort(compareRecordOrder);
  return older[older.length - 1] ?? null;
}

function compareRecordOrder(a: ExamRecord, b: ExamRecord): number {
  if (a.examDate !== b.examDate) return a.examDate < b.examDate ? -1 : 1;
  return a.createdAt - b.createdAt;
}

function compareEye(side: EyeSide, prev: EyeRx, next: EyeRx, previousDate: string): EyeComparison {
  const sphereDelta = next.sphere - prev.sphere;
  const cylinderDelta = next.cylinder - prev.cylinder;
  const sphere: ValueDelta = {
    from: prev.sphere,
    to: next.sphere,
    delta: sphereDelta,
    changed: exceedsThreshold(sphereDelta),
  };
  const cylinder: ValueDelta = {
    from: prev.cylinder,
    to: next.cylinder,
    delta: cylinderDelta,
    changed: exceedsThreshold(cylinderDelta),
  };
  return {
    side,
    previousDate,
    sphere,
    cylinder,
    flagged: sphere.changed || cylinder.changed,
    axis: { from: prev.axis, to: next.axis, delta: axisDelta(prev.axis, next.axis) },
  };
}

/** 计算一条记录相对上一次结果的左右眼变化 */
export function compareRecord(
  records: ExamRecord[],
  current: ExamRecord,
): RecordComparison {
  const previous = findPreviousRecord(records, current);
  if (!previous) return { previous: null, od: null, os: null, flagged: false };

  const od = compareEye("OD", previous.od, current.od, previous.examDate);
  const os = compareEye("OS", previous.os, current.os, previous.examDate);
  return { previous, od, os, flagged: od.flagged || os.flagged };
}
