// 示例数据：保留原看板的三位示例患者，并补全可比较的初配/复查记录
import type { ExamRecord } from "../types";

function daysAgoISO(days: number): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function ts(days: number, offsetMinutes: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000 + offsetMinutes * 60 * 1000;
}

export const seedRecords: ExamRecord[] = [
  // Patient-032 儿童近视 · 离焦镜片：初配 → 40 天前复查
  {
    id: "seed-032-1",
    patientId: "Patient-032",
    patientName: "Patient-032",
    ageGroup: "儿童",
    lensType: "离焦镜片",
    examType: "初配",
    examDate: daysAgoISO(120),
    note: "近视进展随访首诊",
    od: { sphere: -2.5, cylinder: -0.5, axis: 175 },
    os: { sphere: -2.25, cylinder: -0.5, axis: 5 },
    createdAt: ts(120, 0),
  },
  {
    id: "seed-032-2",
    patientId: "Patient-032",
    patientName: "Patient-032",
    ageGroup: "儿童",
    lensType: "离焦镜片",
    examType: "复查",
    examDate: daysAgoISO(40),
    note: "右眼近视进展、散光加深，调整处方",
    od: { sphere: -3.0, cylinder: -1.0, axis: 170 },
    os: { sphere: -2.5, cylinder: -0.5, axis: 10 },
    createdAt: ts(40, 0),
  },
  // Patient-081 成人 · 渐进片：初配 → 20 天前复查
  {
    id: "seed-081-1",
    patientId: "Patient-081",
    patientName: "Patient-081",
    ageGroup: "成人",
    lensType: "渐进片",
    examType: "初配",
    examDate: daysAgoISO(100),
    note: "ADD +1.50，瞳高已确认",
    od: { sphere: 0.75, cylinder: -0.25, axis: 90 },
    os: { sphere: 0.5, cylinder: 0, axis: 85 },
    createdAt: ts(100, 0),
  },
  {
    id: "seed-081-2",
    patientId: "Patient-081",
    patientName: "Patient-081",
    ageGroup: "成人",
    lensType: "渐进片",
    examType: "复查",
    examDate: daysAgoISO(20),
    note: "左眼散光增加，更换镜片",
    od: { sphere: 1.0, cylinder: -0.25, axis: 90 },
    os: { sphere: 0.75, cylinder: -0.5, axis: 88 },
    createdAt: ts(20, 0),
  },
  // Patient-144 儿童 · 角膜塑形镜：初配 → 200 天前复查（已超复查间隔）
  {
    id: "seed-144-1",
    patientId: "Patient-144",
    patientName: "Patient-144",
    ageGroup: "儿童",
    lensType: "角膜塑形镜",
    examType: "初配",
    examDate: daysAgoISO(220),
    note: "散光较高",
    od: { sphere: -1.5, cylinder: -1.0, axis: 10 },
    os: { sphere: -1.25, cylinder: -0.75, axis: 170 },
    createdAt: ts(220, 0),
  },
  {
    id: "seed-144-2",
    patientId: "Patient-144",
    patientName: "Patient-144",
    ageGroup: "儿童",
    lensType: "角膜塑形镜",
    examType: "复查",
    examDate: daysAgoISO(200),
    note: "双眼柱镜变化 0.50D",
    od: { sphere: -1.5, cylinder: -1.5, axis: 15 },
    os: { sphere: -1.25, cylinder: -1.25, axis: 175 },
    createdAt: ts(200, 0),
  },
  // Patient-205 成人 · 普通单光：仅初配，已超复查间隔
  {
    id: "seed-205-1",
    patientId: "Patient-205",
    patientName: "Patient-205",
    ageGroup: "成人",
    lensType: "普通单光",
    examType: "初配",
    examDate: daysAgoISO(210),
    note: "",
    od: { sphere: -4.0, cylinder: -0.5, axis: 180 },
    os: { sphere: -3.75, cylinder: -0.5, axis: 175 },
    createdAt: ts(210, 0),
  },
];
