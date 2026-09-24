// 验光复查领域类型

/** OD = 右眼，OS = 左眼 */
export type EyeSide = "OD" | "OS";

export type AgeGroup = "儿童" | "成人";

export type ExamType = "初配" | "复查";

export type LensType = "普通单光" | "渐进片" | "离焦镜片" | "角膜塑形镜";

/** 单眼屈光处方：球镜(DS)、柱镜(DC)、轴位(°) */
export interface EyeRx {
  sphere: number;
  cylinder: number;
  axis: number;
}

/** 一次验光/复查记录 */
export interface ExamRecord {
  id: string;
  patientId: string;
  patientName: string;
  ageGroup: AgeGroup;
  lensType: LensType;
  examType: ExamType;
  /** YYYY-MM-DD */
  examDate: string;
  note?: string;
  od: EyeRx;
  os: EyeRx;
  createdAt: number;
}

/** 表单中左右眼的原始字符串输入（校验前） */
export interface RxInput {
  sphere: string;
  cylinder: string;
  axis: string;
}
