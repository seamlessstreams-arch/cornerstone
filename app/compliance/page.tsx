export default function CompliancePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Compliance + Workforce</h1>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Training Tracker</h2>
          <ul>
            <li>Fire Safety - Completed</li>
            <li>First Aid - Expiring Soon</li>
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Supervision Tracker</h2>
          <p>Supervisions here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Policy Read/Sign</h2>
          <p>Signatures here.</p>
        </div>
      </div>
    </div>
  );
}