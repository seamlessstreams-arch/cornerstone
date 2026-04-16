export default function IncidentsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Incidents + Safeguarding</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input type="text" className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" rows={4}></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium">Safeguarding Concern</label>
          <input type="checkbox" className="mt-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Body Map</label>
          <p>Body map component here</p>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Submit Incident</button>
      </form>
    </div>
  );
}