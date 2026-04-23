import { useState } from "react";
import Button from "../ui/Button";

function LoginForm({ onSubmit, loading, error }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error ? <div className="alert">{error}</div> : null}

      <div className="form__row">
        <label className="form__label" htmlFor="login-email">
          Email
        </label>
        <input
          className="input"
          id="login-email"
          name="email"
          onChange={handleChange}
          placeholder="you@example.com"
          required
          type="email"
          value={formData.email}
        />
      </div>

      <div className="form__row">
        <label className="form__label" htmlFor="login-password">
          Password
        </label>
        <input
          className="input"
          id="login-password"
          name="password"
          onChange={handleChange}
          placeholder="Enter your password"
          required
          type="password"
          value={formData.password}
        />
      </div>

      <Button disabled={loading} type="submit">
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

export default LoginForm;
