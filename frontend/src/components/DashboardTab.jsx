import { useMemo } from "react";
import {
  allComponents, byStatus, catalogAlignment, layerHealth, needsAttention, planStats, techExposure,
} from "../aggregations.js";
import { STATUS } from "../constants.js";
import { daysBetween, fmtDate } from "../lib/dates.js";
import { pct } from "../lib/format.js";
import AttentionRail from "./AttentionRail.jsx";
import EstateMap from "./EstateMap.jsx";
import ExposureForecast from "./ExposureForecast.jsx";
import Icon from "./Icon.jsx";
import KpiCard from "./KpiCard.jsx";
import LayerHealth from "./LayerHealth.jsx";
import LifecycleCalendar from "./LifecycleCalendar.jsx";
import PortfolioHealth from "./PortfolioHealth.jsx";
import TechExposure from "./TechExposure.jsx";
import { EmptyState, PageHeader } from "./ui.jsx";

export default function DashboardTab({ apps, catalog, isAdmin, today, go, onOpenApp, onOpenStatus, onExport, onOnboard }) {
  const components = useMemo(() => allComponents(apps), [apps]);

  if (!apps.length) {
    return (
      <>
        <PageHeader title="Technology Lifecycle Overview" subtitle="No applications have been onboarded yet." />
        <div className="card">
          <EmptyState icon="layers" title="Your estate is empty"
            action={isAdmin ? <button type="button" className="btn btn-dark" onClick={onOnboard}><Icon name="plus" size={16} /> Onboard your first application</button> : null}>
            {isAdmin ? "Onboard an application, or import your Excel dataset, to light up this dashboard." : "An administrator needs to onboard applications before this dashboard has data."}
          </EmptyState>
        </div>
      </>
    );
  }

  const total = components.length;
  const counts = byStatus(components);
  const stats = planStats(components, today);
  const layers = layerHealth(components);
  const supportedPct = pct(total - counts.RED, total);
  const exposure = techExposure(components, 7);
  const attention = needsAttention(components, today, 6);
  const alignment = catalogAlignment(components, catalog);

  const amberSoon = components.filter((c) => c.status === "AMBER" && daysBetween(today, c.supportEnd) <= 183).length;
  const blueEnding = components.filter((c) => c.status === "BLUE" && daysBetween(today, c.supportEnd) <= 365).length;
  const appCount = apps.length;

  const goLayer = (type, preset) => go(type, preset);
  const goRem = (preset) => go("remediation", preset);

  return (
    <>
      <PageHeader title="Technology Lifecycle Overview"
        subtitle={`Assessment date ${fmtDate(today)} \u00B7 ${appCount} application${appCount === 1 ? "" : "s"} \u00B7 ${total} technology instances`}>
        <button type="button" className="btn btn-soft" onClick={onExport}><Icon name="download" size={16} /> Export CSV</button>
        <button type="button" className="btn btn-soft" onClick={() => window.print()}><Icon name="printer" size={16} /> Print</button>
      </PageHeader>

      <div className="kpi-grid">
        <KpiCard icon="layers" tone="#3f33a6" tint="#ece9fb" label="Portfolio" value={appCount}
          caption={`${total} technology instances`} chip="3 layers" />
        <KpiCard icon="check-circle" tone={STATUS.GREEN.color} tint={STATUS.GREEN.tint} label="Supported" value={counts.GREEN}
          caption="More than 18 months to EOS" chip={`${pct(counts.GREEN, total)}% of estate`}
          onOpen={() => onOpenStatus("GREEN")} openLabel="List Green instances" />
        <KpiCard icon="alert-triangle" tone={STATUS.AMBER.color} tint={STATUS.AMBER.tint} label="Expiring" value={counts.AMBER}
          caption="Less than 18 months to EOS" chip={`${amberSoon} within 6 months`}
          onOpen={() => onOpenStatus("AMBER")} openLabel="List Amber instances" />
        <KpiCard icon="x-circle" tone={STATUS.RED.color} tint={STATUS.RED.tint} label="Unsupported" value={counts.RED}
          caption="Past End of Support" chip={`${pct(counts.RED, total)}% of estate`}
          onOpen={() => onOpenStatus("RED")} openLabel="List Red instances" />
        <KpiCard icon="life-buoy" tone={STATUS.BLUE.color} tint={STATUS.BLUE.tint} label="Extended" value={counts.BLUE}
          caption="Extended Support purchased" chip={`${blueEnding} end within 12 months`}
          onOpen={() => onOpenStatus("BLUE")} openLabel="List Blue instances" />
      </div>

      <div className="dash">
        <div className="dash-main">
          <div className="grid-2">
            <PortfolioHealth counts={counts} total={total} onOpenStatus={onOpenStatus} />
            <LayerHealth layers={layers} totalSupportedPct={supportedPct} onOpenLayer={(l) => goLayer(l)} />
          </div>
          <ExposureForecast components={components} today={today} />
          <div className="grid-2">
            <LifecycleCalendar components={components} today={today} />
            <TechExposure items={exposure} onOpen={(t) => goLayer(t.type, { q: t.name })} />
          </div>
          <EstateMap components={components} stats={stats} alignment={alignment} onOpenApp={onOpenApp} onGoRemediation={goRem} />
        </div>
        <aside className="dash-rail">
          <AttentionRail items={attention} stats={stats} isAdmin={isAdmin} onOpenApp={onOpenApp} onGoRemediation={goRem} />
        </aside>
      </div>
    </>
  );
}
