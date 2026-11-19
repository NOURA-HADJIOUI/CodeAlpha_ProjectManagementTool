import { PRIORITIES } from "../utils/helpers";
import Icon from "./Icon";

export default function FilterBar({ filters, setFilters, members }) {
  const active = filters.q || filters.member || filters.priority;
  const set = (patch) => setFilters({ ...filters, ...patch });

  return (
    <div className="filter-bar">
      <div className="search-box">
        <Icon name="search" size={16} />
        <input
          placeholder="Rechercher une carte..."
          value={filters.q}
          onChange={(e) => set({ q: e.target.value })}
        />
      </div>
      <select value={filters.member} onChange={(e) => set({ member: e.target.value })}>
        <option value="">Tous les membres</option>
        <option value="none">Non assignées</option>
        {members.map((m) => (
          <option key={m._id} value={m._id}>{m.name}</option>
        ))}
      </select>
      <select value={filters.priority} onChange={(e) => set({ priority: e.target.value })}>
        <option value="">Toutes les priorités</option>
        {Object.entries(PRIORITIES)
          .filter(([k]) => k !== "none")
          .map(([k, p]) => (
            <option key={k} value={k}>{p.label}</option>
          ))}
      </select>
      {active && (
        <button className="btn secondary" onClick={() => setFilters({ q: "", member: "", priority: "" })}>
          Effacer
        </button>
      )}
    </div>
  );
}