import { useState } from "react";
import {
  compareRecord,
  formatDelta,
  type EyeComparison,
  type RecordComparison
} from "../compare";
import { formatRefraction } from "../registration";
import type { ExamRecord, EyeSide } from "../types";

interface RecordListProps {
  records: ExamRecord[];
  allRecords: ExamRecord[];
}

function ChangeTag({
  value,
  unit,
  alarm
}: {
  value: EyeComparison["sphere"];
  unit: "D" | "°";
  /** 轴位只作信息展示，不参与 >0.25D 报警 */
  alarm?: boolean;
}) {
  if (value.level === "flat") {
    return <span className="change-tag flat">±0{unit}</span>;
  }
  const tagClass = alarm === false || !value.marked ? "minor" : "marked";
  return (
    <span className={`change-tag ${tagClass}`}>
      {formatDelta(value)}
      {unit}
    </span>
  );
}

function EyeRow({
  title,
  comparison
}: {
  title: string;
  comparison: EyeComparison;
}) {
  const hasPrevious = Boolean(comparison.previous);
  return (
    <div className={`eye-row ${comparison.marked ? "eye-row-marked" : ""}`}>
      <span className="eye-name">{title}</span>
      <span className="eye-values">{formatRefraction(comparison.current)}</span>
      <span className="eye-changes">
        {hasPrevious ? (
          <>
            球镜 <ChangeTag value={comparison.sphere} unit="D" alarm />
            柱镜 <ChangeTag value={comparison.cylinder} unit="D" alarm />
            轴位 <ChangeTag value={comparison.axis} unit="°" />
          </>
        ) : (
          <span className="no-baseline">无上期记录</span>
        )}
      </span>
    </div>
  );
}

function RecordCard({
  comparison,
  allRecords,
  defaultExpanded
}: {
  comparison: RecordComparison;
  allRecords: ExamRecord[];
  defaultExpanded: boolean;
}) {
  const { record } = comparison;
  const [expanded, setExpanded] = useState(defaultExpanded);

  // 该患者全部旧记录，按时间倒序；比较始终基于"本次之前最近一次"
  const history = allRecords
    .filter((r) => r.patientId === record.patientId)
    .sort((a, b) =>
      a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1
    );

  return (
    <article className={`record-card ${comparison.marked ? "record-card-marked" : ""}`}>
      <header className="record-head">
        <div className="record-index">
          {record.group === "儿童" ? "童" : "成"}
        </div>
        <div className="record-id">
          <h3>
            {record.patientName}
            {comparison.marked && <em className="alert-pill">变化 &gt;0.25D</em>}
          </h3>
          <p>
            {record.date} · {record.visitType} · {record.lensType}
            {record.note ? ` · ${record.note}` : ""}
          </p>
        </div>
        <button
          type="button"
          className="history-toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "收起历史" : `历史 ${history.length} 次`}
        </button>
      </header>

      <div className="eye-rows">
        <EyeRow title="右眼" comparison={comparison.right} />
        <EyeRow title="左眼" comparison={comparison.left} />
      </div>

      {expanded && (
        <div className="history-panel">
          <h4>{record.patientName} 的全部验光记录（旧记录只读保留）</h4>
          <ol>
            {history.map((item) => {
              const itemComparison = compareRecord(allRecords, item);
              const isCurrent = item.id === record.id;
              return (
                <li key={item.id} className={isCurrent ? "history-current" : ""}>
                  <span className="history-date">
                    {item.date} · {item.visitType}
                    {isCurrent && <em className="current-dot">本次</em>}
                  </span>
                  <span className="history-eye">
                    <SideText side="R" comparison={itemComparison} />
                  </span>
                  <span className="history-eye">
                    <SideText side="L" comparison={itemComparison} />
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </article>
  );
}

function SideText({
  side,
  comparison
}: {
  side: EyeSide;
  comparison: RecordComparison;
}) {
  const eye = side === "R" ? comparison.right : comparison.left;
  return (
    <>
      {side === "R" ? "右" : "左"} {formatRefraction(eye.current)}
      {!eye.previous && <span className="no-baseline">（初配）</span>}
      {eye.previous && eye.marked && <em className="alert-pill small">有变化</em>}
      {eye.previous && !eye.marked && (
        <span className="no-baseline">（与上次持平）</span>
      )}
    </>
  );
}

export function RecordList({ records, allRecords }: RecordListProps) {
  const sorted = [...records].sort((a, b) =>
    a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1
  );

  return (
    <section className="records panel">
      <div className="section-heading">
        <div>
          <p>复查对比</p>
          <h2>近期记录（{sorted.length}）</h2>
        </div>
        <span className="legend">
          <i className="legend-dot marked" /> 球镜/柱镜较上次变化超过 0.25D
        </span>
      </div>
      {sorted.length === 0 ? (
        <p className="empty-hint">当前筛选条件下没有记录</p>
      ) : (
        <div className="record-list">
          {sorted.map((record) => (
            <RecordCard
              key={record.id}
              comparison={compareRecord(allRecords, record)}
              allRecords={allRecords}
              defaultExpanded={false}
            />
          ))}
        </div>
      )}
    </section>
  );
}
