import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosClient";

type Complaint = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
};

export default function ComplaintsList() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComplaints(page, statusFilter);
  }, [page, statusFilter]);

  async function fetchComplaints(pageNumber: number, status: string) {
    setLoading(true);
    try {
      const res = await api.get("/complaints", {
        params: {
          page: pageNumber,
          status: status || undefined,
        },
      });
      setComplaints(res.data.complaints ?? []);
      setTotalPages(res.data.pagination?.total_pages ?? 1);
    } catch (err) {
      console.error(err);
      alert("Unable to load complaints");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-black min-h-screen text-white p-10 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Complaints</h1>
        <Link to="/complaints/create" className="px-4 py-2 bg-red-600 rounded">
          Create Complaint
        </Link>
      </div>

      <div className="flex gap-4 items-center">
        <label className="text-sm uppercase tracking-wide text-gray-400">Status</label>
        <select
          className="p-2 rounded text-black"
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
        >
          <option value="">All</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {loading ? (
        <p>Loading complaints...</p>
      ) : complaints.length === 0 ? (
        <p className="text-gray-400">No complaints found.</p>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <Link
              to={`/complaints/${c.id}`}
              key={c.id}
              className="block bg-gray-900 p-5 rounded border border-gray-800 hover:border-red-600 transition"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{c.title}</h2>
                <span className="text-xs px-3 py-1 rounded-full bg-gray-800">{c.status}</span>
              </div>
              <p className="text-gray-400 mt-2">{c.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                Created on {new Date(c.createdAt).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          className="px-3 py-1 border border-gray-700 rounded disabled:opacity-40"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button
          className="px-3 py-1 border border-gray-700 rounded disabled:opacity-40"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
