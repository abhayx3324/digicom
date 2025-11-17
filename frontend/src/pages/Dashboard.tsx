import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosClient";
import { useAuth } from "../hooks/useAuth";

type ComplaintPreview = {
  id: string;
  title: string;
  status: string;
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [recentComplaints, setRecentComplaints] = useState<ComplaintPreview[]>([]);

  useEffect(() => {
    api
      .get("/complaints", { params: { limit: 3 } })
      .then((res) => setRecentComplaints(res.data.complaints ?? []))
      .catch((err) => console.error(err));
  }, []);

  if (loading) return <div className="text-white p-10">Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white p-10 space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wider text-gray-400">Dashboard</p>
        <h1 className="text-3xl font-bold mb-2">Welcome, {user.name}</h1>
        <p className="text-gray-300">
          Quickly create complaints, review their statuses, and stay informed.
        </p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Link
          to="/complaints/create"
          className="px-6 py-3 bg-red-600 rounded text-white font-semibold"
        >
          Create Complaint
        </Link>
        <Link to="/complaints" className="px-6 py-3 border border-gray-700 rounded">
          View All
        </Link>
      </div>

      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Complaints</h2>
          <Link to="/complaints" className="text-sm text-red-400">
            See all
          </Link>
        </div>
        {recentComplaints.length === 0 ? (
          <p className="text-gray-400">No complaints yet. Start by creating one!</p>
        ) : (
          <ul className="space-y-3">
            {recentComplaints.map((complaint) => (
              <li
                key={complaint.id}
                className="flex justify-between items-center rounded border border-gray-800 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{complaint.title}</p>
                  <p className="text-sm text-gray-400">{complaint.id}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-gray-800">
                  {complaint.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
