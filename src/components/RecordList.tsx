import type { ExamRecord } from "../types";
import type { EyeComparison, RecordComparison } from "../lib/comparison";
import { formatD, formatDeltaD } from "../lib/registration";

export interface Row {
  record: ExamRecord;
  comparison: RecordComparison;
  isNew?: boolean;
}

export default function RecordList({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="empty-hint">没有符合筛选条件的记录。</p>;
  }

  return (
    <div className="record-list">
      {rows.map(({ record, comparison, isNew }, index) => (
        <article
          key={record.id}
          className={`record-card${comparison.flagged ? " has-change" : ""}${isNew ? " is-new" : ""}`}
        >
          <div className="record-index">{String(index + 1).padStart(2, "0")}</div>
          <div className="record-body">
            <div className="record-head">
              <h3>
                {record.patientName}
                {isNew && <span className="new-badge">本次新登记</span>}
              </h3>
              <span className="record-meta">
                {record.examDate} · {record.examType} · {record.ageGroup} · {record.lensType}
              </span>
            </div>

            {comparison.previous ? (
              <p className="compare-base">
                对比同眼上次结果（{comparison.previous.examDate}
                {comparison.previous.examType}）
                {comparison.flagged ? (
                  <strong className="change-flag">⚑ 变化超过 0.25D</strong>
                ) : (
                  <span className="no-change">变化在 0.25D 以内</span>
                )}
              </p>
            ) : (
              <p className="compare-base first-visit">首次登记，暂无上次结果可比较</p>
            )}

            <div className="eye-result-grid">
              <EyeResult label="右眼 OD" comparison={comparison.od} current={record.od} />
              <EyeResult label="左眼 OS" comparison={comparison.os} current={record.os} />
            </div>

            {record.note && <p className="record-note">备注：{record.note}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}

function EyeResult({
  label,
  comparison,
  current,
}: {
  label: string;
  comparison: EyeComparison | null;
  current: ExamRecord["od"];
}) {
  return (
    <div className={`eye-result${comparison?.flagged ? " flagged" : ""}`}>
      <h4>{label}</h4>
      <RxValue
        name="球镜"
        current={current.sphere}
        unit="DS"
        comparison={comparison?.sphere ?? null}
      />
      <RxValue
        name="柱镜"
        current={current.cylinder}
        unit="DC"
        comparison={comparison?.cylinder ?? null}
      />
      <div className="rx-row">
        <span className="rx-name">轴位</span>
        <span className="rx-current">{current.axis}°</span>
        {comparison && (
          <span className={`rx-delta${comparison.axis.delta > 0 ? " axis-shift" : ""}`}>
            上次 {comparison.axis.from}°{comparison.axis.delta > 0 ? ` · 偏 ${comparison.axis.delta}°` : ""}
          </span>
        )}
      </div>
    </div>
  );
}

function RxValue({
  name,
  current,
  unit,
  comparison,
}: {
  name: string;
  current: number;
  unit: "DS" | "DC";
  comparison:
    | { from: number; delta: number; changed: boolean }
    | null;
}) {
  return (
    <div className="rx-row">
      <span className="rx-name">{name}</span>
      <span className="rx-current">
        {formatD(current)}
        {unit}
      </span>
      {comparison && (
        <span className={`rx-delta${comparison.changed ? " over" : ""}`}>
          {formatDeltaD(comparison.delta)}（上次 {formatD(comparison.from)}
          {unit}）
        </span>
      )}
    </div>
  );
}
