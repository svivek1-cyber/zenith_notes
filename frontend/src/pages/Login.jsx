import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-6 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm"
      >
        <p className="text-primary font-semibold tracking-wide">ZENITH</p>
        <h1 className="text-3xl font-bold text-on-surface mt-3">
          Welcome back
        </h1>
        <p className="text-on-surface-variant mt-2">
          Sign in to continue to your notes.
        </p>
        <label className="block mt-8 text-sm font-medium">
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            className="w-full mt-2 px-3 py-2.5 border border-outline-variant rounded-lg bg-surface outline-none focus:border-primary"
          />
        </label>
        <label className="block mt-4 text-sm font-medium">
          Password
          <input
            required
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
            className="w-full mt-2 px-3 py-2.5 border border-outline-variant rounded-lg bg-surface outline-none focus:border-primary"
          />
        </label>
        {error && (
          <p role="alert" className="mt-4 text-sm text-error">
            {error}
          </p>
        )}
        <button
          disabled={isSubmitting}
          className="w-full mt-6 py-3 rounded-lg bg-primary text-on-primary font-semibold disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          New to Zenith?{" "}
          <Link className="text-primary font-semibold" to="/signup">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}
