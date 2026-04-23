import { useState } from "react";
import Button from "../ui/Button";

function SignupForm({ onSubmit, loading, error }) {
  const [formData, setFormData] = useState({
    name: "",
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
        <label className="form__label" htmlFor="signup-name">
          Full name
        </label>
        <input
          className="input"
          id="signup-name"
          name="name"
          onChange={handleChange}
          placeholder="Alex Morgan"
          required
          value={formData.name}
        />
      </div>

      <div className="form__row">
        <label className="form__label" htmlFor="signup-email">
          Email
        </label>
        <input
          className="input"
          id="signup-email"
          name="email"
          onChange={handleChange}
          placeholder="you@example.com"
          required
          type="email"
          value={formData.email}
        />
      </div>

      <div className="form__row">
        <label className="form__label" htmlFor="signup-password">
          Password
        </label>
        <input
          className="input"
          id="signup-password"
          name="password"
          onChange={handleChange}
          placeholder="Choose a secure password"
          required
          type="password"
          value={formData.password}
        />
      </div>

      <Button disabled={loading} type="submit">
        {loading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}

export default SignupForm;
