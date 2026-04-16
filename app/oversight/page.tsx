export default function OversightPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Management Oversight</h1>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Linked Evidence View</h2>
          <p>Evidence here.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Oversight Draft</h2>
          <textarea className="w-full border border-gray-300 rounded px-3 py-2" rows={6}></textarea>
        </div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded">Approve</button>
      </div>
    </div>
  );
}