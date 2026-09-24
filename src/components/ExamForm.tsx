import { useMemo, useState } from "react";
import { compareDraftEye, findLatestForPatient, formatDelta } from "../compare";
import {
  DIOPTER_KEYS,
  eyeFormFromRefraction,
  formToRefractions,
  formatRefraction,
  hasErrors,
  initialFormState,
  parseEyeDraft,
  validateForm,
  type ExamFormState,
  type EyeField,
  type EyeForm,
  type FormErrors
} from "../registration";
import type { ExamRecord, EyeSide, Patient } from "../types";

interface ExamFormProps {
  patients: Patient[];
  records: ExamRecord[];
  onSave: (draft: Omit<ExamRecord, "id" | "createdAt">) => void;
}

const FIELD_LABELS: Record<EyeField, string> = {
  sphere: "球镜 (DS)",
  cylinder: "柱镜 (DC)",
  axis: "轴位 (°)"
};

const FIELD_PLACEHOLDERS: Record<EyeField, string> = {
  sphere: "-2.75",
  cylinder: "-0.50",
  axis: "180"
};

function EyeFields({
  side,
  title,
  form,
  errors,
  previous,
  onChange
}: {
  side: EyeSide;
  title: string;
  form: EyeForm;
  errors?: FormErrors[EyeSide];
  previous?: ExamRecord;
  onChange: (field: EyeField, value: string) => void;
}) {
  const prevRef = previous
    ? side === "R"
      ? previous.rightEye
      : previous.leftEye
    : undefined;

  // 录入过程中实时与同眼上次结果比较，|变化| > 0.25D 立即标出
  const live = useMemo(() => {
    if (!previous) return undefined;
    const draft = parseEyeDraft(form);
    if (!draft) return undefined;
    return compareDraftEye(side, draft, previous);
  }, [form, previous, side]);

  return (
    <fieldset className="eye-block">
      <legend>
        <strong>{title}</strong>
        {prevRef && (
          <span className="last-values">
            上次（{previous!.date}）：{formatRefraction(prevRef)}
          </span>
        )}
      </legend>
      <div className="eye-grid">
        {DIOPTER_KEYS.map((key) => {
          const change = live?.[key === "axis" ? "axis" : key];
          // 轴位单位是角度，只做 0–180° 越界拦截，不参与 0.25D 变化标记
          const showChange = key !== "axis" && change?.marked;
          return (
            <label key={key} className={showChange ? "field-changed" : ""}>
              <span>
                {FIELD_LABELS[key]}
                {showChange && (
                  <em className="change-badge">较上次 {formatDelta(change)}D</em>
                )}
              </span>
              <input
                inputMode="decimal"
                value={form[key]}
                placeholder={FIELD_PLACEHOLDERS[key]}
                aria-invalid={Boolean(errors?.[key])}
                onChange={(e) => onChange(key, e.target.value)}
              />
              {errors?.[key] && <small className="field-error">{errors[key]}</small>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ExamForm({ patients, records, onSave }: ExamFormProps) {
  const [form, setForm] = useState<ExamFormState>(() =>
    initialFormState(patients[0]?.id ?? "")
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const selectedPatient = patients.find((p) => p.id === form.patientId);
  const previous = form.patientId
    ? findLatestForPatient(records, form.patientId)
    : undefined;

  function patchEye(side: EyeSide, field: EyeField, value: string) {
    const next = { ...form, [side]: { ...form[side], [field]: value } };
    setForm(next);
    if (attempted) setErrors(validateForm(next)); // 补正后实时重校
  }

  function selectPatient(patientId: string) {
    setForm((f) => ({ ...f, patientId }));
    if (attempted) setErrors(validateForm({ ...form, patientId }));
  }

  function prefillFromLast() {
    if (!previous) return;
    setForm((f) => ({
      ...f,
      R: eyeFormFromRefraction(previous.rightEye),
      L: eyeFormFromRefraction(previous.leftEye)
    }));
    setAttempted(false);
    setErrors({});
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors) || !selectedPatient) return;

    const { rightEye, leftEye } = formToRefractions(form);
    onSave({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      group: selectedPatient.group,
      lensType: selectedPatient.lensType,
      visitType: form.visitType,
      date: form.date,
      note: form.note.trim(),
      rightEye,
      leftEye
    });

    // 保留患者与日期，清空双眼数值以便登记下一次
    setForm({ ...initialFormState(form.patientId), patientId: form.patientId });
    setErrors({});
    setAttempted(false);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2500);
  }

  return (
    <form className="panel exam-form" onSubmit={handleSubmit} noValidate>
      <div className="section-heading">
        <div>
          <p>复查登记</p>
          <h2>录入本次验光结果</h2>
        </div>
        {justSaved && <span className="save-toast">已保存，将作为下次比较依据</span>}
      </div>

      <div className="form-meta">
        <label>
          <span>患者</span>
          <select
            value={form.patientId}
            aria-invalid={Boolean(errors.patientId)}
            onChange={(e) => selectPatient(e.target.value)}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}（{p.group} · {p.lensType}）
              </option>
            ))}
          </select>
          {errors.patientId && <small className="field-error">{errors.patientId}</small>}
        </label>
        <label>
          <span>类型</span>
          <select
            value={form.visitType}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                visitType: e.target.value as ExamFormState["visitType"]
              }))
            }
          >
            <option value="复查">复查</option>
            <option value="初配">初配</option>
          </select>
        </label>
        <label>
          <span>检查日期</span>
          <input
            type="date"
            value={form.date}
            aria-invalid={Boolean(errors.date)}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
          {errors.date && <small className="field-error">{errors.date}</small>}
        </label>
        <label className="note-field">
          <span>备注</span>
          <input
            value={form.note}
            placeholder="如：建议三个月后复查"
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </label>
      </div>

      {previous && (
        <div className="prefill-row">
          上次检查：{previous.date}
          <button type="button" className="link-button" onClick={prefillFromLast}>
            用上次结果预填双眼
          </button>
        </div>
      )}

      <div className="eyes-row">
        <EyeFields
          side="R"
          title="右眼 OD"
          form={form.R}
          errors={errors.R}
          previous={previous}
          onChange={(field, value) => patchEye("R", field, value)}
        />
        <EyeFields
          side="L"
          title="左眼 OS"
          form={form.L}
          errors={errors.L}
          previous={previous}
          onChange={(field, value) => patchEye("L", field, value)}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="primary-action">
          保存登记
        </button>
        {attempted && hasErrors(errors) && (
          <span className="field-error form-error-summary">
            有内容未通过校验（轴位须在 0–180°），补正后才能保存
          </span>
        )}
      </div>
    </form>
  );
}
