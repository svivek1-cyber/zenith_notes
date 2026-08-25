import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function SignUp() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    setIsSubmitting(true);
    try {
      const { confirmPassword: _confirmPassword, ...profile } = form;
      if (!profile.lastName) delete profile.lastName;
      await signup(profile);
      navigate("/", { replace: true });
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-6 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm">
        <p className="text-primary font-semibold tracking-wide">ZENITH</p>
        <h1 className="text-3xl font-bold text-on-surface mt-3">Create your account</h1>
        <p className="text-on-surface-variant mt-2">Start building a calmer notes workspace.</p>
        <div className="grid grid-cols-2 gap-3 mt-8"><label className="text-sm font-medium">First name<input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className="w-full mt-2 px-3 py-2.5 border border-outline-variant rounded-lg bg-surface" /></label><label className="text-sm font-medium">Last name<input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className="w-full mt-2 px-3 py-2.5 border border-outline-variant rounded-lg bg-surface" /></label></div>
        <label className="block mt-4 text-sm font-medium">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full mt-2 px-3 py-2.5 border border-outline-variant rounded-lg bg-surface" /></label>
        <label className="block mt-4 text-sm font-medium">Password<input required minLength="6" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full mt-2 px-3 py-2.5 border border-outline-variant rounded-lg bg-surface" /></label>
        <label className="block mt-4 text-sm font-medium">Confirm password<input required type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} className="w-full mt-2 px-3 py-2.5 border border-outline-variant rounded-lg bg-surface" /></label>
        {error && <p role="alert" className="mt-4 text-sm text-error">{error}</p>}
        <button disabled={isSubmitting} className="w-full mt-6 py-3 rounded-lg bg-primary text-on-primary font-semibold disabled:opacity-60">{isSubmitting ? "Creating account..." : "Create account"}</button>
        <p className="mt-6 text-center text-sm text-on-surface-variant">Already have an account? <Link className="text-primary font-semibold" to="/login">Sign in</Link></p>
      </form>
    </main>
  );
}
