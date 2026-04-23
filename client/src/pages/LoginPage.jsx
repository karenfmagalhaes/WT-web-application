import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) =>
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form);
      navigate("/");
    } catch (errorValue) {
      setError(errorValue.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
      <div className="soft-panel w-full max-w-md p-8 sm:p-10">
        <div className="mb-8 text-center">
          <p className="soft-kicker">Welcome Back</p>
          <h1 className="soft-display mt-4 text-4xl italic tracking-tight text-[#4d463f]">
            Sign in to Calendo
          </h1>
          <p className="soft-note mt-3 text-sm">
            Pick up where you left off and keep your favourite holidays close.
          </p>
        </div>

        {error ? (
          <div className="mb-5 rounded-[1.1rem] border border-[#e4c7bf] bg-[#fff2ee] px-4 py-3 text-sm text-[#9a5c49]">
            {error}
          </div>
        ) : null}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div>
            <label className="soft-label">Email</label>
            <input
              autoComplete="email"
              className="soft-field"
              name="email"
              onChange={handleChange}
              placeholder="you@example.com"
              required
              type="email"
              value={form.email}
            />
          </div>
          <div>
            <label className="soft-label">Password</label>
            <input
              autoComplete="current-password"
              className="soft-field"
              name="password"
              onChange={handleChange}
              placeholder="••••••••"
              required
              type="password"
              value={form.password}
            />
          </div>

          <Button className="mt-2 w-full justify-center" disabled={loading} type="submit">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-[#7c7064]">
          No account?{" "}
          <Link className="font-semibold text-[#6f5844] transition hover:text-[#4d463f]" to="/signup">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
