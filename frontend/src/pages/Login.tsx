import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-black text-white">
      <form onSubmit={handleSubmit} className="bg-red-600 p-8 rounded-lg w-96">
        <h1 className="text-2xl font-bold mb-4">Login</h1>

        <input
          className="w-full p-2 rounded mb-3 text-black"
          placeholder="Email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full p-2 rounded mb-3 text-black"
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full p-2 bg-black rounded text-white font-semibold disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Logging in..." : "Login"}
        </button>
        <p className="text-sm mt-4 text-center">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}