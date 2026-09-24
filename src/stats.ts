import { compareRecord, type RecordComparison } from "./compare";
import type { ExamRecord } from "./types";

// ─────────────────────────────────────────────
// 统计逻辑：随当前（已筛选）记录实时更新
// ─────────────────────────────────────────────

export interface BoardStats {
  total: number;
  rechecks: number;
  marked: number;
  children: number;
}

export function computeStats(records: ExamRecord[], all: ExamRecord[]): BoardStats {
  let marked = 0;
  for (const record of records) {
    const comparison: RecordComparison = compareRecord(all, record);
    if (comparison.marked) marked += 1;
  }
  return {
    total: records.length,
    rechecks: records.filter((r) => r.visitType === "复查").length,
    marked,
    children: records.filter((r) => r.group === "儿童").length
  };
}
