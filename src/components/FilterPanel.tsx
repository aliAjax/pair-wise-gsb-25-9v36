import type { AgeGroup, LensType } from "../types";
import { AGE_GROUPS, LENS_TYPES } from "../lib/registration";

export interface Filters {
  patientId: string; // "" 全部
  ageGroup: AgeGroup | "";
  lensType: LensType | "";
}

export const emptyFilters: Filters = { patientId: "", ageGroup: "", lensType: "" };

export default function FilterPanel({
  filters,
  patientNames,
  onChange,
}: {
  filters: Filters;
  patientNames: { id: string; name: string }[];
  onChange: (next: Filters) => void;
}) {
  return (
    <div className="filters">
      <label>
        <span>患者筛选</span>
        <select
          value={filters.patientId}
          onChange={(e) => onChange({ ...filters, patientId: e.target.value })}
        >
          <option value="">全部患者（{patientNames.length}）</option>
          {patientNames.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <p className="filter-group-title">人群</p>
      <div className="chips">
        {AGE_GROUPS.map((group) => (
          <button
            key={group}
            type="button"
            className={filters.ageGroup === group ? "chip-active" : ""}
            aria-pressed={filters.ageGroup === group}
            onClick={() =>
              onChange({ ...filters, ageGroup: filters.ageGroup === group ? "" : group })
            }
          >
            {group}
          </button>
        ))}
      </div>

      <p className="filter-group-title">镜片类型</p>
      <div className="chips muted">
        {LENS_TYPES.map((lens) => (
          <button
            key={lens}
            type="button"
            className={filters.lensType === lens ? "chip-active" : ""}
            aria-pressed={filters.lensType === lens}
            onClick={() =>
              onChange({ ...filters, lensType: filters.lensType === lens ? "" : lens })
            }
          >
            {lens}
          </button>
        ))}
      </div>

      {(filters.patientId || filters.ageGroup || filters.lensType) && (
        <button
          type="button"
          className="clear-filters"
          onClick={() => onChange(emptyFilters)}
        >
          清除全部筛选
        </button>
      )}
    </div>
  );
}
