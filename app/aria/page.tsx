export default function AriaPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Aria AI Assistant</h1>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Mode</h2>
          <select className="block w-full border border-gray-300 rounded px-3 py-2">
            <option>Write</option>
            <option>Review</option>
            <option>Oversee</option>
            <option>Assist</option>
          </select>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Writing Style</h2>
          <select className="block w-full border border-gray-300 rounded px-3 py-2">
            <option>Professional Formal</option>
            <option>Warm Professional</option>
            <option>Child-Friendly</option>
          </select>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Suggestion</h2>
          <p>AI suggestion here.</p>
          <button className="bg-green-500 text-white px-4 py-2 rounded mr-2">Accept</button>
          <button className="bg-red-500 text-white px-4 py-2 rounded">Reject</button>
        </div>
      </div>
    </div>
  );
}