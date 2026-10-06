import { allComponents, byStatus, byType, lifecycleBuckets, techExposure } from "../aggregations.js";
import DrilldownCards from "./DrilldownCards.jsx";
import Legend from "./Legend.jsx";
import LifecycleBarChart from "./LifecycleBarChart.jsx";
import StatCard from "./StatCard.jsx";
import StatusDonut from "./StatusDonut.jsx";
import TechExposureList from "./TechExposureList.jsx";

export default function ExecutiveDashboardTab({ apps, onOpenType }) {
  const components = allComponents(apps);
  const statusCounts = byStatus(components);
  const typeCounts = byType(components);
  const buckets = lifecycleBuckets(components);
  const exposure = techExposure(components);

  return (
    <div>
      <Legend />

      <div className="stat-row">
        <StatCard label="Applications" value={apps.length} sub="Portfolio" />
        <StatCard label="Technology Instances" value={components.length} sub="Lifecycle records" />
        <StatCard label="Green" value={statusCounts.GREEN} sub="More than 18 months" accent="#2e7d32" />
        <StatCard label="Amber" value={statusCounts.AMBER} sub="Within 18 months" accent="#f9a825" />
        <StatCard label="Red" value={statusCounts.RED} sub="EOS reached" accent="#c62828" />
        <StatCard label="Blue" value={statusCounts.BLUE} sub="Extended support purchased" accent="#1565c0" />
      </div>

      <div className="dash-grid-2">
        <div className="panel">
          <h3>Portfolio Health</h3>
          <p className="hint-text">Technology instances by lifecycle status</p>
          <StatusDonut byStatus={statusCounts} />
        </div>
        <div className="panel">
          <h3>Technology Stack Drill-down</h3>
          <p className="hint-text">Open a dedicated view for each technology layer</p>
          <DrilldownCards byType={typeCounts} onOpen={onOpenType} />
        </div>
      </div>

      <div className="dash-grid-2">
        <div className="panel">
          <h3>Lifecycle Distribution</h3>
          <p className="hint-text">Components reaching End of Support, by quarter</p>
          <LifecycleBarChart buckets={buckets} />
        </div>
        <div className="panel">
          <h3>Technology Exposure</h3>
          <p className="hint-text">Most widely deployed technology/version combinations</p>
          <TechExposureList items={exposure} />
        </div>
      </div>
    </div>
  );
}
