// 验光复查看板的核心数据类型

export type EyeSide = "R" | "L";

export type PatientGroup = "儿童" | "成人";

export type LensType = "单光片" | "渐进片" | "角膜塑形镜";

export type VisitType = "初配" | "复查";

/** 单眼屈光三要素：球镜(DS)、柱镜(DC)、轴位(°) */
export interface Refraction {
  sphere: number;
  cylinder: number;
  axis: number;
}

export interface Patient {
  id: string;
  name: string;
  group: PatientGroup;
  lensType: LensType;
}

/** 一次验光/复查登记，保存后不可变，作为以后同眼比较的基准 */
export interface ExamRecord {
  id: string;
  patientId: string;
  patientName: string;
  group: PatientGroup;
  lensType: LensType;
  visitType: VisitType;
  /** ISO 日期 YYYY-MM-DD */
  date: string;
  rightEye: Refraction;
  leftEye: Refraction;
  note: string;
  /** 同日多次登记时的先后依据 */
  createdAt: number;
}

export const PATIENT_GROUPS: PatientGroup[] = ["儿童", "成人"];

export const LENS_TYPES: LensType[] = ["单光片", "渐进片", "角膜塑形镜"];

export const VISIT_TYPES: VisitType[] = ["复查", "初配"];
