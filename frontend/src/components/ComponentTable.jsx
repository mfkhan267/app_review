function supportEndsInfo(c) {
  if (c.status === "BLUE" && c.extended_support_date) {
    return { main: c.extended_support_date, note: `Extended support (orig. EOL ${c.eol_date})` };
  }
  return { main: c.eol_date, note: null };
}

export default function ComponentTable({ rows, isAdmin, onEditApp, onUpdatePlan }) {
  if (!rows.length) {
    return (
      <div className="table-wrap">
        <div className="empty-state">No technology instances match the current filters.</div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>App ID</th>
            <th>Application</th>
            <th>Technology</th>
            <th>Support ends</th>
            <th>Status</th>
            <th>Owner</th>
            <th>Upgrade Plan</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const { main, note } = supportEndsInfo(c);
            const needsPlan = c.status === "RED" || c.status === "AMBER";
            return (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.app_id}</td>
                <td>
                  {c.app_name}
                  <div className="hint-text">{c.platform}</div>
                </td>
                <td>
                  {c.tech_name}{c.version ? ` ${c.version}` : ""}
                  <div className="hint-text">{c.component_type}</div>
                </td>
                <td>
                  {main}
                  {note && <div className="hint-text">{note}</div>}
                </td>
                <td><span className={`badge ${c.status}`}>{c.status}</span></td>
                <td title={c.app_owner_email}>{c.app_owner}</td>
                <td style={{ whiteSpace: "normal", maxWidth: 240 }}>
                  {c.upgrade_plan ? (
                    <>
                      {c.upgrade_plan}
                      {c.upgrade_target_date ? ` (target: ${c.upgrade_target_date})` : ""}
                    </>
                  ) : needsPlan ? (
                    <span className="hint-text">Not submitted</span>
                  ) : (
                    <span className="hint-text">&mdash;</span>
                  )}
                </td>
                {isAdmin && (
                  <td>
                    <div className="row-actions">
                      {needsPlan && (
                        <button className="btn btn-outline btn-sm" onClick={() => onUpdatePlan(c)}>
                          Upgrade plan
                        </button>
                      )}
                      <button className="btn btn-outline btn-sm" onClick={() => onEditApp(c._appPk)}>
                        Edit app
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
