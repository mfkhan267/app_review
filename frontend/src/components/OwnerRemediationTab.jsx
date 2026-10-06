import { ownerGroups } from "../aggregations.js";
import StatCard from "./StatCard.jsx";

export default function OwnerRemediationTab({ apps, isAdmin, onUpdatePlan }) {
  const groups = ownerGroups(apps);
  const totalItems = groups.reduce((n, g) => n + g.items.length, 0);
  const withPlan = groups.reduce(
    (n, g) => n + g.items.filter((i) => i.component.upgrade_plan).length,
    0
  );
  const redCount = groups.reduce(
    (n, g) => n + g.items.filter((i) => i.component.status === "RED").length,
    0
  );

  return (
    <div>
      <h2 className="tab-title">Owner Remediation</h2>
      <p className="hint-text" style={{ marginBottom: 16 }}>
        Red and Amber technology instances grouped by the Application Owner responsible for
        submitting an upgrade plan.
      </p>

      <div className="stat-row">
        <StatCard label="Owners with action items" value={groups.length} />
        <StatCard label="Outstanding instances" value={totalItems} />
        <StatCard label="Of which Red" value={redCount} accent="#c62828" />
        <StatCard
          label="Plans submitted"
          value={totalItems ? `${withPlan} / ${totalItems}` : "0 / 0"}
          sub={totalItems ? `${Math.round((withPlan / totalItems) * 100)}%` : null}
        />
      </div>

      {groups.length === 0 && (
        <div className="table-wrap"><div className="empty-state">
          Nothing outstanding — every component is Green or Blue. Nice work.
        </div></div>
      )}

      {groups.map((g) => (
        <div key={g.email || g.owner} className="panel owner-card">
          <div className="owner-card-head">
            <div>
              <div className="owner-name">{g.owner}</div>
              <div className="hint-text">{g.email}</div>
            </div>
            <span className="tab-count" style={{ background: "#c62828" }}>{g.items.length} open</span>
          </div>
          <div className="table-wrap" style={{ boxShadow: "none" }}>
            <table>
              <thead>
                <tr>
                  <th>App</th>
                  <th>Component</th>
                  <th>Support ends</th>
                  <th>Status</th>
                  <th>Plan</th>
                  {isAdmin && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {g.items.map(({ app, component: c }) => (
                  <tr key={c.id}>
                    <td>{app.app_id} &middot; {app.app_name}</td>
                    <td>{c.component_type}: {c.tech_name}{c.version ? ` ${c.version}` : ""}</td>
                    <td>{c.eol_date}</td>
                    <td><span className={`badge ${c.status}`}>{c.status}</span></td>
                    <td style={{ whiteSpace: "normal", maxWidth: 260 }}>
                      {c.upgrade_plan ? (
                        <>{c.upgrade_plan}{c.upgrade_target_date ? ` (target: ${c.upgrade_target_date})` : ""}</>
                      ) : (
                        <span className="hint-text">Not submitted</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => onUpdatePlan(app, c)}>
                          {c.upgrade_plan ? "Update plan" : "Submit plan"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
