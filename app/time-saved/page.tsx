export default function TimeSavedPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Time Saved Engine</h1>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">This Week</h2>
          <p>You saved 1h 20m</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">This Month</h2>
          <p>Team saved 24 hours</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Calculations</h2>
          <ul>
            <li>Auto-filled forms: 30m</li>
            <li>Linked records: 45m</li>
            <li>AI drafting: 15m</li>
          </ul>
        </div>
      </div>
    </div>
  );
}