export default function MaintenancePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Building, Home Health & Safety, Maintenance, Asset, and Vehicle Compliance</h1>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Building Checks</h2>
          <ul>
            <li>Fire Safety - Due: Tomorrow</li>
            <li>Electrical Safety - Completed</li>
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Vehicle Checks</h2>
          <ul>
            <li>MOT - Expiring: 2025-01-01</li>
            <li>Insurance - Expiring: 2025-02-01</li>
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Asset Tracking</h2>
          <p>Assets here.</p>
        </div>
      </div>
    </div>
  );
}