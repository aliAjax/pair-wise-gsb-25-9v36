// 保存逻辑：记录持久化。每次保存都是追加，旧记录始终保留。
import type { ExamRecord } from "../types";

const STORAGE_KEY = "hxwl-11.exam-records.v1";

export function loadRecords(fallback: ExamRecord[]): ExamRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as ExamRecord[];
    if (!Array.isArray(parsed)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

/** 追加保存：新记录排在数组末尾，并成为该患者下次比较的依据 */
export function appendRecord(records: ExamRecord[], record: ExamRecord): ExamRecord[] {
  const next = [...records, record];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 存储不可用时仍在内存中保留本次会话的数据
  }
  return next;
}

export function makeRecordId(): string {
  return `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
