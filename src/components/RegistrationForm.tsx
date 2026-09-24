import { useMemo, useState } from "react";
import type { AgeGroup, ExamType, EyeRx, LensType, RxInput } from "../types";
import {
  AGE_GROUPS,
  EXAM_TYPES,
  LENS_TYPES,
  todayISO,
  validateEye,
} from "../lib/registration";

export interface PatientOption {
  id: string;
  name: string;
  ageGroup: AgeGroup;
  lensType: LensType;
}

export interface NewExamDraft {
  patientId: string;
  patientName: string;
  ageGroup: AgeGroup;
  lensType: LensType;
  examType: ExamType;
  examDate: string;
  note: string;
  od: EyeRx;
  os: EyeRx;
}

interface FormState {
  patientKey: string; // "__new__" 或已有 patientId
  newName: string;
  ageGroup: AgeGroup;
  lensType: LensType;
  examType: ExamType;
  examDate: string;
  note: string;
  od: RxInput;
  os: RxInput;
}

const emptyEye = (): RxInput => ({ sphere: "", cylinder: "", axis: "" });

const initialForm: FormState = {
  patientKey: "__new__",
  newName: "",
  ageGroup: "儿童",
  lensType: "普通单光",
  examType: "复查",
  examDate: todayISO(),
  note: "",
  od: emptyEye(),
  os: emptyEye(),
};

interface FieldErrors {
  patient?: string;
  od: { sphere?: string; cylinder?: string; axis?: string };
  os: { sphere?: string; cylinder?: string; axis?: string };
}

export default function RegistrationForm({
  patients,
  onSave,
}: {
  patients: PatientOption[];
  onSave: (draft: NewExamDraft) => void;
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const selectedExisting = useMemo(
    () => patients.find((p) => p.id === form.patientKey) ?? null,
    [patients, form.patientKey],
  );

  const patientName = selectedExisting ? selectedExisting.name : form.newName.trim();

  const odResult = validateEye(form.od);
  const osResult = validateEye(form.os);
  const errors: FieldErrors = { od: odResult.errors, os: osResult.errors };
  if (!patientName) errors.patient = "请选择患者或填写新患者姓名";

  const valid =
    !errors.patient &&
    Object.keys(errors.od).length === 0 &&
    Object.keys(errors.os).length === 0;

  function patch(changes: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...changes }));
  }

  function selectPatient(key: string) {
    const patient = patients.find((p) => p.id === key);
    patch(
      patient
        ? {
            patientKey: key,
            newName: "",
            ageGroup: patient.ageGroup,
            lensType: patient.lensType,
          }
        : { patientKey: "__new__", newName: "" },
    );
  }

  function patchEye(side: "od" | "os", field: keyof RxInput, value: string) {
    setForm((prev) => ({ ...prev, [side]: { ...prev[side], [field]: value } }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!valid || !odResult.value || !osResult.value) return;

    onSave({
      patientId: selectedExisting ? selectedExisting.id : patientName,
      patientName,
      ageGroup: form.ageGroup,
      lensType: form.lensType,
      examType: form.examType,
      examDate: form.examDate || todayISO(),
      note: form.note.trim(),
      od: odResult.value,
      os: osResult.value,
    });
    setForm({ ...initialForm, examDate: todayISO() });
    setSubmitted(false);
  }

  return (
    <form className="registration" onSubmit={handleSubmit} noValidate>
      <div className="field-grid">
        <label>
          <span>患者</span>
          <select
            value={form.patientKey}
            onChange={(e) => selectPatient(e.target.value)}
            className={submitted && errors.patient ? "invalid" : ""}
          >
            <option value="__new__">＋ 新患者</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}（{p.ageGroup} · {p.lensType}）
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>新患者姓名/编号</span>
          <input
            placeholder={selectedExisting ? "已选择已有患者" : "如 Patient-266"}
            value={form.newName}
            disabled={!!selectedExisting}
            onChange={(e) => patch({ newName: e.target.value })}
            className={submitted && errors.patient ? "invalid" : ""}
          />
        </label>

        <label>
          <span>人群</span>
          <select
            value={form.ageGroup}
            onChange={(e) => patch({ ageGroup: e.target.value as AgeGroup })}
          >
            {AGE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>镜片类型</span>
          <select
            value={form.lensType}
            onChange={(e) => patch({ lensType: e.target.value as LensType })}
          >
            {LENS_TYPES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>检查类型</span>
          <select
            value={form.examType}
            onChange={(e) => patch({ examType: e.target.value as ExamType })}
          >
            {EXAM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>检查日期</span>
          <input
            type="date"
            value={form.examDate}
            onChange={(e) => patch({ examDate: e.target.value })}
          />
        </label>
      </div>

      <EyeFields
        title="右眼 OD"
        eyeClass="eye-od"
        input={form.od}
        errors={errors.od}
        showErrors={submitted}
        onChange={(field, value) => patchEye("od", field, value)}
      />
      <EyeFields
        title="左眼 OS"
        eyeClass="eye-os"
        input={form.os}
        errors={errors.os}
        showErrors={submitted}
        onChange={(field, value) => patchEye("os", field, value)}
      />

      <label className="note-field">
        <span>备注（可选）</span>
        <input
          placeholder="如 ADD、瞳高、用眼习惯等"
          value={form.note}
          onChange={(e) => patch({ note: e.target.value })}
        />
      </label>

      {submitted && !valid && (
        <p className="form-alert" role="alert">
          请先补正标红字段：轴位须为 0–180° 的整数，球镜/柱镜格式如 -2.75。
        </p>
      )}

      <button type="submit" className="primary-action save-btn">
        保存复查结果
      </button>
    </form>
  );
}

function EyeFields({
  title,
  eyeClass,
  input,
  errors,
  showErrors,
  onChange,
}: {
  title: string;
  eyeClass: string;
  input: RxInput;
  errors: { sphere?: string; cylinder?: string; axis?: string };
  showErrors: boolean;
  onChange: (field: keyof RxInput, value: string) => void;
}) {
  return (
    <fieldset className={`eye-fields ${eyeClass}`}>
      <legend>{title}</legend>
      <div className="eye-inputs">
        <label>
          <span>球镜 DS</span>
          <input
            inputMode="decimal"
            step="0.25"
            placeholder="-2.75"
            value={input.sphere}
            onChange={(e) => onChange("sphere", e.target.value)}
            className={showErrors && errors.sphere ? "invalid" : ""}
          />
          {showErrors && errors.sphere && <em className="field-error">{errors.sphere}</em>}
        </label>
        <label>
          <span>柱镜 DC</span>
          <input
            inputMode="decimal"
            step="0.25"
            placeholder="-0.75"
            value={input.cylinder}
            onChange={(e) => onChange("cylinder", e.target.value)}
            className={showErrors && errors.cylinder ? "invalid" : ""}
          />
          {showErrors && errors.cylinder && <em className="field-error">{errors.cylinder}</em>}
        </label>
        <label>
          <span>轴位 °</span>
          <input
            inputMode="numeric"
            placeholder="0–180"
            value={input.axis}
            onChange={(e) => onChange("axis", e.target.value)}
            className={showErrors && errors.axis ? "invalid" : ""}
          />
          {showErrors && errors.axis && <em className="field-error">{errors.axis}</em>}
        </label>
      </div>
    </fieldset>
  );
}
