// 登记逻辑：常量、格式化与输入校验
import type { AgeGroup, ExamType, LensType, RxInput } from "../types";

export const CHANGE_THRESHOLD_D = 0.25;

export const AGE_GROUPS: AgeGroup[] = ["儿童", "成人"];
export const EXAM_TYPES: ExamType[] = ["复查", "初配"];
export const LENS_TYPES: LensType[] = [
  "普通单光",
  "渐进片",
  "离焦镜片",
  "角膜塑形镜",
];

/** 浮点比较容差，避免 0.1 + 0.2 之类的误差 */
const EPS = 1e-6;

/** 变化是否超过 0.25D（严格大于，0.25 不算） */
export function exceedsThreshold(delta: number): boolean {
  return Math.abs(delta) > CHANGE_THRESHOLD_D + EPS;
}

/** 球镜/柱镜：-30.00 ~ +30.00，最多两位小数（步长 0.25） */
export function parsePower(raw: string): number | null {
  const text = raw.trim();
  if (!/^[+-]?\d+(\.\d{1,2})?$/.test(text)) return null;
  const value = Number(text);
  if (!Number.isFinite(value) || Math.abs(value) > 30) return null;
  return value;
}

/**
 * 轴位：0–180 的整数。
 * 超范围（含小数、非数字）一律返回错误，需补正后才能保存。
 */
export function validateAxis(raw: string): number | string {
  const text = raw.trim();
  if (text === "") return "必填";
  if (!/^[+-]?\d+$/.test(text)) return "须为整数";
  const value = Number(text);
  if (value < 0 || value > 180) return "须在 0–180°";
  return value;
}

/** 校验单眼三个字段，返回数值或逐字段错误信息 */
export function validateEye(input: RxInput): {
  value?: { sphere: number; cylinder: number; axis: number };
  errors: { sphere?: string; cylinder?: string; axis?: string };
} {
  const errors: { sphere?: string; cylinder?: string; axis?: string } = {};

  const sphere = parsePower(input.sphere);
  if (sphere === null) errors.sphere = "如 -2.75";

  const cylinder = parsePower(input.cylinder);
  if (cylinder === null) errors.cylinder = "如 -0.75";

  const axisResult = validateAxis(input.axis);
  if (typeof axisResult === "string") errors.axis = axisResult;

  if (sphere === null || cylinder === null || typeof axisResult === "string") {
    return { errors };
  }
  return { value: { sphere, cylinder, axis: axisResult }, errors };
}

/** 带正负号与固定两位小数：-2.75 / +1.50 / 0.00 */
export function formatD(value: number): string {
  const fixed = Math.abs(value).toFixed(2);
  if (value > EPS) return `+${fixed}`;
  if (value < -EPS) return `-${fixed}`;
  return fixed;
}

/** 变化量：Δ-0.50D / Δ+0.25D */
export function formatDeltaD(delta: number): string {
  return `Δ${delta > EPS ? "+" : ""}${delta.toFixed(2)}D`;
}

/** 轴位差按圆周最短距离展示（0–90°） */
export function axisDelta(from: number, to: number): number {
  const diff = Math.abs(from - to) % 180;
  return diff > 90 ? 180 - diff : diff;
}

export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
