import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axiosClient";

type Complaint = {
  id: string;
  title: string;
  description: string;
  status: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
};

export default function ComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComplaint() {
      try {
        const res = await api.get(`/complaints/${id}`);
        setComplaint(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchComplaint();
    }
  }, [id]);

  if (loading) return <div className="text-white p-10">Loading...</div>;
  if (!complaint) return <div className="text-white p-10">Complaint not found.</div>;

  return (
    <div className="bg-black min-h-screen text-white p-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-gray-400">{complaint.id}</p>
          <h1 className="text-3xl mb-2 font-bold">{complaint.title}</h1>
        </div>
        <span className="text-xs px-4 py-2 rounded-full bg-gray-900 border border-gray-800">
          {complaint.status}
        </span>
      </div>

      <p className="text-gray-300 leading-relaxed">{complaint.description}</p>

      <div className="text-sm text-gray-400 space-y-1">
        <p>Created: {new Date(complaint.createdAt).toLocaleString()}</p>
        <p>Updated: {new Date(complaint.updatedAt).toLocaleString()}</p>
      </div>

      {complaint.images?.length > 0 && (
        <div>
          <p className="font-semibold mb-2">Attachments</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {complaint.images.map((img) => (
              <img
                src={`/${img}`}
                alt={complaint.title}
                key={img}
                className="rounded border border-gray-800"
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Link to="/complaints" className="px-4 py-2 border border-gray-700 rounded">
          Back
        </Link>
      </div>
    </div>
  );
}
