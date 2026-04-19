export default function HealthCheckPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Health Check Engine</h1>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Scores</h2>
          <ul>
            <li>Operational: 85%</li>
            <li>Safeguarding: 90%</li>
            <li>Medication: 80%</li>
            <li>Staffing: 95%</li>
            <li>Compliance: 88%</li>
            <li>Environment: 82%</li>
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Risk Level</h2>
          <p>Low</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Action Plan</h2>
          <ul>
            <li>Complete overdue checks - Owner: Manager</li>
            <li>Review medication anomalies - Owner: Nurse</li>
          </ul>
        </div>
      </div>
    </div>
  );
}