import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axiosClient";

const API_URL = api.defaults.baseURL;

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
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
  });

  useEffect(() => {
    async function fetchComplaint() {
      try {
        const res = await api.get(`/complaints/${id}`);
        setComplaint(res.data);
        setFormData({
          title: res.data.title,
          description: res.data.description,
          status: res.data.status,
        });
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("status", formData.status);

      const res = await api.put(`/complaints/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setComplaint(res.data.data);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update complaint");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    if (complaint) {
      setFormData({
        title: complaint.title,
        description: complaint.description,
        status: complaint.status,
      });
    }
    setIsEditing(false);
  }

  if (loading) return <div className="text-white p-10">Loading...</div>;
  if (!complaint) return <div className="text-white p-10">Complaint not found.</div>;

  return (
    <div className="bg-black min-h-screen text-white p-10 space-y-6">
      {!isEditing ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-gray-400">{complaint.id}</p>
              <h1 className="text-3xl mb-2 font-bold">{complaint.title}</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs px-4 py-2 rounded-full bg-gray-900 border border-gray-800">
                {complaint.status}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 rounded text-white font-semibold hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed">{complaint.description}</p>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm uppercase tracking-widest text-gray-400 mb-2">{complaint.id}</p>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 rounded mb-3 text-black text-2xl font-bold"
                placeholder="Title"
                required
              />
            </div>
            <div className="flex items-center gap-4">
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="px-4 py-2 rounded text-black"
                required
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>

          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 rounded text-black leading-relaxed"
            placeholder="Description"
            rows={6}
            required
          />

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-green-600 rounded text-white font-semibold hover:bg-green-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="px-6 py-2 border border-gray-700 rounded hover:bg-gray-800 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

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
                src={`${API_URL}/complaints/images/${img}`}
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
