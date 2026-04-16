export default function TasksPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Task Delegation</h1>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Assign Task</h2>
          <form className="space-y-2">
            <input type="text" placeholder="Title" className="block w-full border border-gray-300 rounded px-3 py-2" />
            <select className="block w-full border border-gray-300 rounded px-3 py-2">
              <option>By Role</option>
              <option>By Person</option>
            </select>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Assign</button>
          </form>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Task List</h2>
          <ul>
            <li>Task 1 - Assigned to John - Due Today</li>
            <li>Task 2 - Assigned to Manager - Overdue</li>
          </ul>
        </div>
      </div>
    </div>
  );
}