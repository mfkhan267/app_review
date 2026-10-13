import { useEffect, useMemo, useRef, useState } from "react";
import { searchAll } from "../aggregations.js";
import { LAYER } from "../constants.js";
import Icon from "./Icon.jsx";

export default function GlobalSearch({ apps, onOpenApp, onOpenTech }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const input = useRef(null);
  const res = useMemo(() => searchAll(apps, q), [apps, q]);
  const has = res.apps.length + res.techs.length > 0;

  useEffect(() => {
    const onKey = (e) => {
      const typing = /input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable;
      if (e.key === "/" && !typing) { e.preventDefault(); input.current?.focus(); }
    };
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, []);

  const pick = (fn) => { fn(); setQ(""); setOpen(false); input.current?.blur(); };

  return (
    <div className="gsearch" ref={box}>
      <Icon name="search" size={16} />
      <input ref={input} value={q} placeholder="Search apps & tech" aria-label="Search applications, owners and technologies"
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Escape") { setQ(""); setOpen(false); e.currentTarget.blur(); } }} />
      <kbd>/</kbd>
      {open && q.trim() && (
        <div className="gsearch-panel" role="listbox">
          {!has && <div className="gsearch-empty">No matches for &ldquo;{q}&rdquo;</div>}
          {res.apps.length > 0 && <div className="gsearch-label">Applications</div>}
          {res.apps.map((a) => (
            <button key={a.id} type="button" className="gsearch-item" onClick={() => pick(() => onOpenApp(a.id))}>
              <strong>{a.app_name}</strong><small>{a.app_id} &middot; {a.app_owner}</small>
            </button>
          ))}
          {res.techs.length > 0 && <div className="gsearch-label">Technologies</div>}
          {res.techs.map((t) => (
            <button key={t.key} type="button" className="gsearch-item" onClick={() => pick(() => onOpenTech(t))}>
              <strong>{t.name}</strong><small>{LAYER[t.type].singular} &middot; {t.count} instance{t.count === 1 ? "" : "s"}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
