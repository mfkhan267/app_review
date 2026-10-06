function todayLabel() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function Header({ isAdmin, onLoginClick, onLogout }) {
  return (
    <header className="header">
      <div className="header-row">
        <div>
          <div className="eyebrow">Application Portfolio Management</div>
          <h1>Technology Lifecycle &amp; EOS Command Center</h1>
          <p className="header-sub">
            Enterprise application portfolio health, technology lifecycle exposure, and
            remediation governance
          </p>
        </div>
        <div className="header-right">
          <div className="assessment-date">
            <div className="eyebrow">Assessment Date</div>
            <div className="assessment-date-value">{todayLabel()}</div>
          </div>
          <div className="mode-controls">
            <span className={`pill ${isAdmin ? "admin" : "user"}`}>
              {isAdmin ? "Admin Mode" : "User Mode"}
            </span>
            {isAdmin ? (
              <button className="btn btn-ghost" onClick={onLogout}>Log out</button>
            ) : (
              <button className="btn btn-primary" onClick={onLoginClick}>Admin Login</button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
