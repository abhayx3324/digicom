import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosClient";

export default function ComplaintForm() {
  const [form, setForm] = useState({
    title: "",
    description: "",
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function update(key: string, value: string) {
    setForm({ ...form, [key]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("title", form.title);
      data.append("description", form.description);
      if (files) {
        Array.from(files).forEach((file) => data.append("images", file));
      }
      await api.post("/complaints", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/complaints");
    } catch (err) {
      console.error(err);
      alert("Failed to create complaint");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-black min-h-screen text-white flex justify-center items-center">
      <form onSubmit={handleSubmit} className="bg-red-600 p-8 rounded-lg w-96">
        <h1 className="text-2xl font-bold mb-4">Create Complaint</h1>

        <input
          placeholder="Title"
          className="w-full p-2 rounded mb-3 text-black"
          onChange={(e) => update("title", e.target.value)}
        />

        <textarea
          placeholder="Description"
          className="w-full p-2 rounded mb-3 text-black"
          onChange={(e) => update("description", e.target.value)}
        />

        <input
          type="file"
          multiple
          className="w-full p-2 rounded mb-3 bg-white text-black"
          onChange={(e) => setFiles(e.target.files)}
        />

        <button
          className="w-full p-2 bg-black rounded text-white font-semibold disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Create"}
        </button>
      </form>
    </div>
  );
}
