import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) =>
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await signup({ name: form.name, email: form.email, password: form.password });
      navigate("/");
    } catch (errorValue) {
      setError(errorValue.response?.data?.message || "Could not create account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
      <div className="soft-panel w-full max-w-md p-8 sm:p-10">
        <div className="mb-8 text-center">
          <p className="soft-kicker">Create Account</p>
          <h1 className="soft-display mt-4 text-4xl italic tracking-tight text-[#4d463f]">
            Join Calendo
          </h1>
          <p className="soft-note mt-3 text-sm">
            Save favourite holidays, follow your own traditions, and make the
            calendar feel personal.
          </p>
        </div>

        {error ? (
          <div className="mb-5 rounded-[1.1rem] border border-[#e4c7bf] bg-[#fff2ee] px-4 py-3 text-sm text-[#9a5c49]">
            {error}
          </div>
        ) : null}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {[
            {
              label: "Name",
              name: "name",
              type: "text",
              placeholder: "Jane Doe",
              auto: "name",
            },
            {
              label: "Email",
              name: "email",
              type: "email",
              placeholder: "you@example.com",
              auto: "email",
            },
            {
              label: "Password",
              name: "password",
              type: "password",
              placeholder: "••••••••",
              auto: "new-password",
            },
            {
              label: "Confirm password",
              name: "confirm",
              type: "password",
              placeholder: "••••••••",
              auto: "new-password",
            },
          ].map(({ label, name, type, placeholder, auto }) => (
            <div key={name}>
              <label className="soft-label">{label}</label>
              <input
                autoComplete={auto}
                className="soft-field"
                name={name}
                onChange={handleChange}
                placeholder={placeholder}
                required
                type={type}
                value={form[name]}
              />
            </div>
          ))}

          <Button className="mt-2 w-full justify-center" disabled={loading} type="submit">
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-[#7c7064]">
          Already have an account?{" "}
          <Link className="font-semibold text-[#6f5844] transition hover:text-[#4d463f]" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
