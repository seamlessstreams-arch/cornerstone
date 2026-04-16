export default function DailyLogsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Daily Logs + Handover</h1>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Auto-pulled Events</h2>
          <ul>
            <li>Incident logged at 10:00 AM</li>
            <li>Medication given at 11:00 AM</li>
            <li>Task completed at 12:00 PM</li>
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Staff Completion</h2>
          <p>Tracking here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Shift Summary</h2>
          <p>Draft here.</p>
        </div>
      </div>
    </div>
  );
}