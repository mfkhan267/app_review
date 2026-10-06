export default function FilterBar({ filters, setFilters, techNames, showPlatform = true }) {
  const update = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="filter-bar">
      <input
        type="text"
        placeholder="Search app, ID, or owner..."
        value={filters.q}
        onChange={update("q")}
      />
      {showPlatform && (
        <select value={filters.platform} onChange={update("platform")}>
          <option value="">All platforms</option>
          <option value="Web">Web</option>
          <option value="App">App</option>
          <option value="Database">Database</option>
        </select>
      )}
      <select value={filters.tech_name} onChange={update("tech_name")}>
        <option value="">All technologies</option>
        {techNames.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <select value={filters.status} onChange={update("status")}>
        <option value="">All statuses</option>
        <option value="RED">Red</option>
        <option value="AMBER">Amber</option>
        <option value="BLUE">Blue</option>
        <option value="GREEN">Green</option>
      </select>
    </div>
  );
}
