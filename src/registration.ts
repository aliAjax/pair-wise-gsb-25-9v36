import type { EyeSide, ExamRecord, Refraction } from "./types";

// ─────────────────────────────────────────────
// 登记逻辑：表单文本 → 校验 → ExamRecord
// 不触发保存，只负责"能不能存"
// ─────────────────────────────────────────────

export interface EyeForm {
  sphere: string;
  cylinder: string;
  axis: string;
}

export type EyeField = keyof EyeForm;

export const DIOPTER_KEYS: EyeField[] = ["sphere", "cylinder", "axis"];

export interface ExamFormState {
  patientId: string;
  visitType: ExamRecord["visitType"];
  date: string;
  note: string;
  R: EyeForm;
  L: EyeForm;
}

export interface EyeErrors {
  sphere?: string;
  cylinder?: string;
  axis?: string;
}

export type FormErrors = {
  patientId?: string;
  date?: string;
  R?: EyeErrors;
  L?: EyeErrors;
};

export function emptyEye(): EyeForm {
  return { sphere: "", cylinder: "", axis: "" };
}

export function todayISO(): string {
  const now = new Date();
  const tz = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tz).toISOString().slice(0, 10);
}

export function initialFormState(patientId: string): ExamFormState {
  return {
    patientId,
    visitType: "复查",
    date: todayISO(),
    note: "",
    R: emptyEye(),
    L: emptyEye()
  };
}

/** 用上次同眼结果预填，验光师在此基础上改本次值 */
export function eyeFormFromRefraction(r: Refraction): EyeForm {
  return {
    sphere: r.sphere.toFixed(2),
    cylinder: r.cylinder.toFixed(2),
    axis: String(r.axis)
  };
}

const DIOPTER = /^[+-]?\d+(\.\d{1,2})?$/;

function parseDiopter(raw: string): number | undefined {
  const text = raw.trim();
  if (!DIOPTER.test(text)) return undefined;
  return Number(text);
}

/** 三个字段都能解析成数时返回屈光值（表单实时比较用），否则返回 undefined */
export function parseEyeDraft(form: EyeForm): Refraction | undefined {
  const sphere = parseDiopter(form.sphere);
  const cylinder = parseDiopter(form.cylinder);
  const axis = parseDiopter(form.axis);
  if (sphere === undefined || cylinder === undefined || axis === undefined) {
    return undefined;
  }
  return { sphere, cylinder, axis };
}

/**
 * 校验单眼。轴位必须在 0–180 之间（含端点），越界直接拦住，
 * 补正前不允许保存。
 */
export function validateEye(side: EyeSide, form: EyeForm): EyeErrors {
  const errors: EyeErrors = {};
  const sphere = parseDiopter(form.sphere);
  const cylinder = parseDiopter(form.cylinder);
  const axis = parseDiopter(form.axis);

  if (sphere === undefined) errors.sphere = "填写球镜，如 -2.75";
  if (cylinder === undefined) errors.cylinder = "填写柱镜，如 -0.50";
  if (axis === undefined) {
    errors.axis = "填写轴位（0–180）";
  } else if (axis < 0 || axis > 180) {
    errors.axis = `轴位 ${axis}° 超出 0–180°，请补正后再保存`;
  }
  return errors;
}

export function validateForm(form: ExamFormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.patientId) errors.patientId = "请选择患者";
  if (!form.date) errors.date = "请选择检查日期";

  const rErrors = validateEye("R", form.R);
  const lErrors = validateEye("L", form.L);
  if (Object.keys(rErrors).length) errors.R = rErrors;
  if (Object.keys(lErrors).length) errors.L = lErrors;
  return errors;
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** 校验通过后把表单转成待保存记录（id / 快照字段由调用方补齐） */
export function formToRefractions(form: ExamFormState): {
  rightEye: Refraction;
  leftEye: Refraction;
} {
  return {
    rightEye: {
      sphere: Number(form.R.sphere),
      cylinder: Number(form.R.cylinder),
      axis: Number(form.R.axis)
    },
    leftEye: {
      sphere: Number(form.L.sphere),
      cylinder: Number(form.L.cylinder),
      axis: Number(form.L.axis)
    }
  };
}

export function formatRefraction(r: Refraction): string {
  const cyl = r.cylinder > 0 ? `+${r.cylinder.toFixed(2)}` : r.cylinder.toFixed(2);
  const sph = r.sphere > 0 ? `+${r.sphere.toFixed(2)}` : r.sphere.toFixed(2);
  return `${sph}DS / ${cyl}DC × ${r.axis}°`;
}
