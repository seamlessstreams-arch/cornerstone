export default function StaffDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Staff Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Shift Tasks</h2>
          <p>Tasks here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Handover Items</h2>
          <p>Items here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Due Recordings</h2>
          <p>Recordings here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Upcoming Appointments</h2>
          <p>Appointments here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Home Checks Due</h2>
          <p>Checks here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Vehicle Checks Due</h2>
          <p>Checks here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
          <p>Actions here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Aria Support Panel</h2>
          <p>Support here.</p>
        </div>
      </div>
    </div>
  );
}