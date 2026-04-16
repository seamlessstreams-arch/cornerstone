export default function MedicationPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Medication Core</h1>
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">MAR Records</h2>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">Medication</th>
              <th className="border border-gray-300 px-4 py-2">Scheduled</th>
              <th className="border border-gray-300 px-4 py-2">Given</th>
              <th className="border border-gray-300 px-4 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Aspirin</td>
              <td className="border border-gray-300 px-4 py-2">8:00 AM</td>
              <td className="border border-gray-300 px-4 py-2">8:05 AM</td>
              <td className="border border-gray-300 px-4 py-2">Given by Nurse</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="bg-white p-4 rounded shadow mt-6">
        <h2 className="text-lg font-semibold mb-4">PRN Reason/Effect/Follow-up</h2>
        <p>PRN records here.</p>
      </div>
    </div>
  );
}