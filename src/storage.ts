import { SEED_RECORDS } from "./data";
import type { ExamRecord } from "./types";

// ─────────────────────────────────────────────
// 保存逻辑：记录仓库
// 只追加、不改写旧记录；保存成功的本次结果
// 自动成为该患者下次复查的比较依据
// ─────────────────────────

const STORAGE_KEY = "hxwl-11.exam-records.v1";

export function loadRecords(): ExamRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ExamRecord[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // 存储不可用时回退到种子数据
  }
  return SEED_RECORDS;
}

function persist(records: ExamRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // 忽略写入失败（隐私模式等），本次会话内仍可用
  }
}

/**
 * 追加一条已通过校验的记录。
 * 患者信息在保存时快照进记录，之后改名或改镜片类型不影响旧记录查询。
 */
export function saveRecord(
  records: ExamRecord[],
  draft: Omit<ExamRecord, "id" | "createdAt">,
  now: number = Date.now()
): ExamRecord[] {
  const record: ExamRecord = {
    ...draft,
    id: `rec-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now
  };
  const next = [record, ...records];
  persist(next);
  return next;
}
