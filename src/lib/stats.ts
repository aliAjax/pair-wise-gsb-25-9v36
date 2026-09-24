// 统计逻辑：指标随记录集合实时更新（不随筛选变化，反映全部门店情况）
import type { ExamRecord } from "../types";
import { compareRecord } from "./comparison";
import { exceedsThreshold } from "./registration";

/** 建议复查间隔（天），超过则进入复查提醒 */
export const REVIEW_INTERVAL_DAYS = 180;

export interface DashboardStats {
  /** 最近一次复查中球镜进展超过 0.25D 的眼数（近视加深） */
  myopiaProgressEyes: number;
  /** 最近一次复查中柱镜变化超过 0.25D 的眼数 */
  astigmatismChangeEyes: number;
  /** 距最近一次检查超过复查间隔的患者数 */
  reviewDuePatients: number;
  /** 处方总数（记录数） */
  prescriptionCount: number;
}

export function computeStats(records: ExamRecord[], now = Date.now()): DashboardStats {
  let myopiaProgressEyes = 0;
  let astigmatismChangeEyes = 0;

  // 每个患者只看其最新一条记录与上一次的对比，避免历史变化重复计数
  const latestByPatient = new Map<string, ExamRecord>();
  for (const record of records) {
    const existing = latestByPatient.get(record.patientId);
    if (!existing || isLater(record, existing)) latestByPatient.set(record.patientId, record);
  }

  for (const record of latestByPatient.values()) {
    const comparison = compareRecord(records, record);
    for (const eye of [comparison.od, comparison.os]) {
      if (!eye) continue;
      // 球镜向负方向变化超过 0.25D 视为近视进展
      if (eye.sphere.delta < 0 && exceedsThreshold(eye.sphere.delta)) myopiaProgressEyes += 1;
      if (eye.cylinder.changed) astigmatismChangeEyes += 1;
    }
  }

  const reviewDuePatients = [...latestByPatient.values()].filter((r) => {
    const ageMs = now - new Date(`${r.examDate}T00:00:00`).getTime();
    return ageMs > REVIEW_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
  }).length;

  return {
    myopiaProgressEyes,
    astigmatismChangeEyes,
    reviewDuePatients,
    prescriptionCount: records.length,
  };
}

function isLater(a: ExamRecord, b: ExamRecord): boolean {
  if (a.examDate !== b.examDate) return a.examDate > b.examDate;
  return a.createdAt > b.createdAt;
}
