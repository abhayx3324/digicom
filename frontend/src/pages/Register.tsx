import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    dob: "",
    phone: "",
    role: "CITIZEN",
  });
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function update(key: string, value: string) {
    setForm({ ...form, [key]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(form);
      alert("Registered successfully!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert("Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-black text-white">
      <form onSubmit={handleSubmit} className="bg-red-600 p-8 rounded-lg w-96">
        <h1 className="text-2xl font-bold mb-4">Register</h1>

        <input
          className="w-full p-2 rounded mb-3 text-black"
          placeholder="Name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />

        <input
          className="w-full p-2 rounded mb-3 text-black"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />

        <input
          className="w-full p-2 rounded mb-3 text-black"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          required
        />

        <label className="text-sm text-gray-100">Date of Birth</label>
        <input
          className="w-full p-2 rounded mb-3 text-black"
          type="date"
          value={form.dob}
          onChange={(e) => update("dob", e.target.value)}
          required
        />

        <input
          className="w-full p-2 rounded mb-3 text-black"
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />

        <label className="text-sm text-gray-100">Role</label>
        <select
          className="w-full p-2 rounded mb-4 text-black"
          value={form.role}
          onChange={(e) => update("role", e.target.value)}
        >
          <option value="CITIZEN">Citizen</option>
          <option value="ADMIN">Admin</option>
        </select>

        <button
          className="w-full p-2 bg-black rounded text-white font-semibold disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Registering..." : "Register"}
        </button>
        <p className="text-sm mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
