export default function ManagerDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manager Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Live Priorities</h2>
          <p>Overdue tasks, incidents awaiting oversight, etc.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Safeguarding Alerts</h2>
          <p>Alerts here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Medication Exceptions</h2>
          <p>Exceptions here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Training & Supervision Gaps</h2>
          <p>Gaps here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Repairs & Maintenance</h2>
          <p>Issues here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Compliance Risks</h2>
          <p>Risks here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Overdue Home Safety Checks</h2>
          <p>Checks here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Expiring Certificates</h2>
          <p>Certificates here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Vehicle Compliance Alerts</h2>
          <p>Alerts here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Time Saved Widget</h2>
          <p>You saved 1h 20m this week</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Health Check Widget</h2>
          <p>Operational Score: 85%</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Aria Suggestions</h2>
          <p>Suggestions here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Unresolved Hazards</h2>
          <p>Hazards here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Open Complaints</h2>
          <p>Complaints here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Same-Day Urgent Actions</h2>
          <p>Actions here.</p>
        </div>
      </div>
    </div>
  );
}