import { useMemo, useState } from "react";
import "./styles.css";
import { ExamForm } from "./components/ExamForm";
import { RecordList } from "./components/RecordList";
import { SEED_PATIENTS } from "./data";
import { computeStats } from "./stats";
import { loadRecords, saveRecord } from "./storage";
import { LENS_TYPES, PATIENT_GROUPS, type LensType, type PatientGroup } from "./types";

type GroupFilter = PatientGroup | "全部";
type LensFilter = LensType | "全部";

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p className="metric-hint">{hint}</p>
    </article>
  );
}

function FilterChips<T extends string>({
  options,
  value,
  onSelect
}: {
  options: T[];
  value: T;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="chips muted filter-chips">
      {options.map((option) => (
        <button
          key={option}
          className={value === option ? "chip-active" : ""}
          aria-pressed={value === option}
          onClick={() => onSelect(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function App() {
  const [records, setRecords] = useState(() => loadRecords());
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("全部");
  const [lensFilter, setLensFilter] = useState<LensFilter>("全部");
  const [showForm, setShowForm] = useState(true);

  // 患者与镜片类型筛选继续可用；两组条件叠加
  const filtered = useMemo(
    () =>
      records.filter(
        (r) =>
          (groupFilter === "全部" || r.group === groupFilter) &&
          (lensFilter === "全部" || r.lensType === lensFilter)
      ),
    [records, groupFilter, lensFilter]
  );

  // 统计随记录（及筛选）实时更新；比较基准始终取全部记录，避免筛选后找不到上次
  const stats = useMemo(() => computeStats(filtered, records), [filtered, records]);

  function handleSave(draft: Omit<(typeof records)[number], "id" | "createdAt">) {
    setRecords((current) => saveRecord(current, draft));
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">hxwl-11 · port 5111</p>
          <h1>眼科验光记录</h1>
          <p className="subtitle">
            复查登记左右眼球镜、柱镜与轴位，自动与该患者同眼上次结果比较，变化超过 0.25D
            时在列表中标出。
          </p>
        </div>
        <div className="stack-card">
          <span>技术栈</span>
          <strong>React + Vite + TypeScript + CSS</strong>
          <span className="stack-note">登记 / 比较 / 保存逻辑分层：registration · compare · storage</span>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard label="记录总数" value={String(stats.total)} hint="当前筛选范围内" />
        <MetricCard label="复查次数" value={String(stats.rechecks)} hint="含与初配的对照" />
        <MetricCard
          label="变化超 0.25D"
          value={String(stats.marked)}
          hint="球镜或柱镜任一眼显著变化"
        />
        <MetricCard label="儿童记录" value={String(stats.children)} hint="近视进展重点关注" />
      </section>

      <section className="workspace">
        <aside className="panel narrow">
          <h2>患者筛选</h2>
          <FilterChips
            options={["全部", ...PATIENT_GROUPS] as GroupFilter[]}
            value={groupFilter}
            onSelect={setGroupFilter}
          />
          <h2>镜片类型</h2>
          <FilterChips
            options={["全部", ...LENS_TYPES] as LensFilter[]}
            value={lensFilter}
            onSelect={setLensFilter}
          />
          {(groupFilter !== "全部" || lensFilter !== "全部") && (
            <button
              className="clear-filters"
              onClick={() => {
                setGroupFilter("全部");
                setLensFilter("全部");
              }}
            >
              清除筛选
            </button>
          )}
        </aside>

        <div className="workspace-main">
          <div className="form-switch">
            <button className="primary-action" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "收起登记面板" : "新增复查登记"}
            </button>
          </div>
          {showForm && (
            <ExamForm patients={SEED_PATIENTS} records={records} onSave={handleSave} />
          )}
        </div>
      </section>

      <RecordList records={filtered} allRecords={records} />
    </main>
  );
}

export default App;
