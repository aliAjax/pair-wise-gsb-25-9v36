import type { ExamRecord, Patient } from "./types";

// 看板初始演示数据：同一患者保留多次检查，用于展示"与上次同眼比较"
export const SEED_PATIENTS: Patient[] = [
  { id: "P-032", name: "Patient-032", group: "儿童", lensType: "单光片" },
  { id: "P-081", name: "Patient-081", group: "成人", lensType: "渐进片" },
  { id: "P-144", name: "Patient-144", group: "儿童", lensType: "角膜塑形镜" },
  { id: "P-207", name: "Patient-207", group: "儿童", lensType: "单光片" }
];

const day = 86400000;
const baseDate = Date.UTC(2026, 7, 10); // 2026-08-10

function seed(
  index: number,
  offsetDays: number,
  patient: Patient,
  visitType: ExamRecord["visitType"],
  rightEye: ExamRecord["rightEye"],
  leftEye: ExamRecord["leftEye"],
  note: string
): ExamRecord {
  const d = new Date(baseDate - offsetDays * day).toISOString().slice(0, 10);
  return {
    id: `seed-${index}`,
    patientId: patient.id,
    patientName: patient.name,
    group: patient.group,
    lensType: patient.lensType,
    visitType,
    date: d,
    rightEye,
    leftEye,
    note,
    createdAt: baseDate - offsetDays * day + index
  };
}

export const SEED_RECORDS: ExamRecord[] = [
  seed(
    1,
    180,
    SEED_PATIENTS[0],
    "初配",
    { sphere: -2.5, cylinder: -0.5, axis: 175 },
    { sphere: -2.25, cylinder: -0.5, axis: 5 },
    "初次配镜，三个月后复查"
  ),
  seed(
    2,
    92,
    SEED_PATIENTS[0],
    "复查",
    { sphere: -2.75, cylinder: -0.5, axis: 180 },
    { sphere: -2.5, cylinder: -0.75, axis: 10 },
    "右眼近视加深 0.25D"
  ),
  seed(
    3,
    6,
    SEED_PATIENTS[0],
    "复查",
    { sphere: -3.25, cylinder: -0.75, axis: 5 },
    { sphere: -2.5, cylinder: -0.75, axis: 10 },
    "右眼半年内进展较快，建议缩短复查间隔"
  ),
  seed(
    4,
    40,
    SEED_PATIENTS[1],
    "初配",
    { sphere: 1.25, cylinder: -0.25, axis: 90 },
    { sphere: 1.5, cylinder: -0.25, axis: 85 },
    "ADD +1.50，瞳高已确认"
  ),
  seed(
    5,
    4,
    SEED_PATIENTS[1],
    "复查",
    { sphere: 1.25, cylinder: -0.25, axis: 90 },
    { sphere: 1.5, cylinder: -0.5, axis: 85 },
    "左眼散光加深"
  ),
  seed(
    6,
    70,
    SEED_PATIENTS[2],
    "初配",
    { sphere: -1.5, cylinder: -1.0, axis: 160 },
    { sphere: -1.25, cylinder: -1.0, axis: 20 },
    "OK 镜首次订片"
  ),
  seed(
    7,
    9,
    SEED_PATIENTS[2],
    "复查",
    { sphere: -0.75, cylinder: -0.5, axis: 160 },
    { sphere: -0.5, cylinder: -1.0, axis: 20 },
    "日间残余度数下降，塑形效果良好"
  ),
  seed(
    8,
    2,
    SEED_PATIENTS[3],
    "初配",
    { sphere: -1.0, cylinder: 0, axis: 0 },
    { sphere: -1.0, cylinder: 0, axis: 0 },
    "新患者，尚无历史记录可比较"
  )
];
