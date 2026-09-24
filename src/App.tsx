import { useMemo, useState } from "react";
import "./styles.css";
import type { ExamRecord } from "./types";
import { seedRecords } from "./data/seed";
import { loadRecords, appendRecord, makeRecordId } from "./lib/storage";
import { compareRecord } from "./lib/comparison";
import { computeStats } from "./lib/stats";
import RegistrationForm, { type NewExamDraft, type PatientOption } from "./components/RegistrationForm";
import RecordList, { type Row } from "./components/RecordList";
import FilterPanel, { emptyFilters, type Filters } from "./components/FilterPanel";

const project = {
  id: "hxwl-11",
  port: 5111,
  title: "眼科验光记录",
  subtitle: "视力、屈光参数与复查处方对比",
  stack: "React + Vite + TypeScript + CSS",
  domain: "眼视光",
  users: ["验光师", "门店顾问", "复查医生"],
};

const statusColors = ["status-ok", "status-watch", "status-danger", "status-ok"];

function MetricCard({ label, value, unit, index }: { label: string; value: number; unit: string; index: number }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>
        {value}
        <em>{unit}</em>
      </strong>
      <i className={statusColors[index % statusColors.length]} />
    </article>
  );
}

function App() {
  // 保存层：首次加载从 localStorage 取，没有则用示例数据
  const [records, setRecords] = useState<ExamRecord[]>(() => loadRecords(seedRecords));
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [newId, setNewId] = useState<string | null>(null);
  const [saveHint, setSaveHint] = useState<string | null>(null);

  const stats = useMemo(() => computeStats(records), [records]);

  // 患者选项：取每个患者最新记录上的人群与镜片类型作为表单默认值
  const patients: PatientOption[] = useMemo(() => {
    const latest = new Map<string, ExamRecord>();
    for (const record of records) {
      const existing = latest.get(record.patientId);
      if (!existing || record.examDate > existing.examDate ||
        (record.examDate === existing.examDate && record.createdAt > existing.createdAt)) {
        latest.set(record.patientId, record);
      }
    }
    return [...latest.values()]
      .sort((a, b) => a.patientName.localeCompare(b.patientName))
      .map((r) => ({
        id: r.patientId,
        name: r.patientName,
        ageGroup: r.ageGroup,
        lensType: r.lensType,
      }));
  }, [records]);

  // 筛选后的记录（新到旧排列），比较始终基于“全部记录”而非筛选结果
  const filteredRows: Row[] = useMemo(() => {
    return records
      .filter((r) => {
        if (filters.patientId && r.patientId !== filters.patientId) return false;
        if (filters.ageGroup && r.ageGroup !== filters.ageGroup) return false;
        if (filters.lensType && r.lensType !== filters.lensType) return false;
        return true;
      })
      .sort((a, b) =>
        a.examDate === b.examDate ? b.createdAt - a.createdAt : a.examDate < b.examDate ? 1 : -1,
      )
      .map((record) => ({
        record,
        comparison: compareRecord(records, record),
        isNew: record.id === newId,
      }));
  }, [records, filters, newId]);

  function handleSave(draft: NewExamDraft) {
    const record: ExamRecord = {
      id: makeRecordId(),
      ...draft,
      createdAt: Date.now(),
    };
    // 保存层追加；下一次同患者登记时 compareRecord 会以本条为“上一次”
    const next = appendRecord(records, record);
    setRecords(next);
    setNewId(record.id);

    // 给出即时比较结果提示
    const comparison = compareRecord(next, record);
    if (!comparison.previous) {
      setSaveHint(`已保存 ${draft.patientName} 的首次验光记录，将作为下次复查的比较依据。`);
    } else if (comparison.flagged) {
      const changedEyes = [
        comparison.od?.flagged ? "右眼" : null,
        comparison.os?.flagged ? "左眼" : null,
      ].filter(Boolean);
      setSaveHint(`已保存复查结果：${draft.patientName} ${changedEyes.join("、")} 变化超过 0.25D，已在列表中标出。`);
    } else {
      setSaveHint(`已保存 ${draft.patientName} 的复查结果，球镜/柱镜变化均在 0.25D 以内。`);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">
            {project.id} · port {project.port}
          </p>
          <h1>{project.title}</h1>
          <p className="subtitle">{project.subtitle}</p>
        </div>
        <div className="stack-card">
          <span>技术栈</span>
          <strong>{project.stack}</strong>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard label="近视进展（最新复查超 0.25D 眼数）" value={stats.myopiaProgressEyes} unit="眼" index={0} />
        <MetricCard label="散光变化（最新复查超 0.25D 眼数）" value={stats.astigmatismChangeEyes} unit="眼" index={1} />
        <MetricCard label="复查提醒（超 180 天）" value={stats.reviewDuePatients} unit="人" index={2} />
        <MetricCard label="处方数量" value={stats.prescriptionCount} unit="条" index={3} />
      </section>

      <section className="workspace">
        <aside className="panel narrow">
          <h2>角色</h2>
          <div className="chips">
            {project.users.map((user) => (
              <span key={user}>{user}</span>
            ))}
          </div>
          <h2>筛选</h2>
          <FilterPanel
            filters={filters}
            patientNames={patients.map((p) => ({ id: p.id, name: p.name }))}
            onChange={setFilters}
          />
        </aside>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p>{project.domain}</p>
              <h2>复查登记</h2>
            </div>
          </div>
          <RegistrationForm patients={patients} onSave={handleSave} />
          {saveHint && (
            <div className="save-toast" role="status">
              {saveHint}
              <button type="button" onClick={() => setSaveHint(null)} aria-label="关闭提示">
                ×
              </button>
            </div>
          )}
        </section>
      </section>

      <section className="records panel">
        <div className="section-heading">
          <div>
            <p>全部历史记录（含本次）</p>
            <h2>复查对比列表</h2>
          </div>
          <span className="list-count">共 {filteredRows.length} 条</span>
        </div>
        <RecordList rows={filteredRows} />
      </section>
    </main>
  );
}

export default App;
