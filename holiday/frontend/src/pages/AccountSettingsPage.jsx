import { useCallback, useEffect, useState } from "react";
import { getUserById, updateUserProfile } from "../api/authApi";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const AccountSettingsPage = () => {
  const { user, patchUser } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    preferredCountry: "",
    preferredMonth: "",
  });
  const [readOnly, setReadOnly] = useState({ email: "", role: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUser = useCallback(async () => {
    if (!user?._id && !user?.id) return;
    const id = user._id ?? user.id;
    try {
      const { data } = await getUserById(id);
      const u = data.user;
      setForm({
        firstName: u.firstName ?? "",
        lastName: u.lastName ?? "",
        phone: u.phone ?? "",
        preferredCountry: u.preferredCountry ?? "",
        preferredMonth: u.preferredMonth ?? "",
      });
      setReadOnly({ email: u.email ?? "", role: u.role ?? "" });
    } catch {
      setError("Could not load account details.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const id = user._id ?? user.id;
      await updateUserProfile(id, {
        ...form,
        preferredMonth: form.preferredMonth ? Number(form.preferredMonth) : undefined,
      });
      patchUser({ firstName: form.firstName, lastName: form.lastName });
      setSuccess("Account updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message ?? "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 lg:px-8">
      <div className="space-y-7">

        <section className="soft-panel px-6 py-8 lg:px-8">
          <p className="soft-kicker">Account</p>
          <h1 className="soft-display mt-4 text-[clamp(2.6rem,5vw,4.6rem)] italic leading-[0.95] tracking-tight text-[#4d463f]">
            Account settings
          </h1>
          <p className="soft-note mt-4 max-w-2xl text-sm leading-relaxed">
            Update your name, contact details, and calendar preferences. If you need to change your email address, please contact support.
          </p>
        </section>

        <section className="soft-panel p-6 sm:p-8">
          {loading ? (
            <p className="text-sm text-[#84786b]">Loading…</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 lg:grid-cols-2">

                <div>
                  <p className="soft-kicker mb-5">Personal details</p>
                  <div className="space-y-4">
                    <div>
                      <label className="soft-label mb-1 block" htmlFor="firstName">
                        First name
                      </label>
                      <input
                        className="soft-field"
                        id="firstName"
                        name="firstName"
                        onChange={handleChange}
                        placeholder="First name"
                        type="text"
                        value={form.firstName}
                      />
                    </div>
                    <div>
                      <label className="soft-label mb-1 block" htmlFor="lastName">
                        Last name
                      </label>
                      <input
                        className="soft-field"
                        id="lastName"
                        name="lastName"
                        onChange={handleChange}
                        placeholder="Last name"
                        type="text"
                        value={form.lastName}
                      />
                    </div>
                    <div>
                      <label className="soft-label mb-1 block" htmlFor="phone">
                        Phone <span className="normal-case tracking-normal text-[#a09488]">(optional)</span>
                      </label>
                      <input
                        className="soft-field"
                        id="phone"
                        name="phone"
                        onChange={handleChange}
                        placeholder="+353 80 000 0000"
                        type="tel"
                        value={form.phone}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="soft-kicker mb-5">Preferences & account</p>
                  <div className="space-y-4">
                    <div>
                      <label className="soft-label mb-1 block" htmlFor="preferredCountry">
                        Preferred country
                      </label>
                      <input
                        className="soft-field"
                        id="preferredCountry"
                        name="preferredCountry"
                        onChange={handleChange}
                        placeholder="e.g. Ireland"
                        type="text"
                        value={form.preferredCountry}
                      />
                    </div>
                    <div>
                      <label className="soft-label mb-1 block" htmlFor="preferredMonth">
                        Preferred month
                      </label>
                      <select
                        className="soft-field"
                        id="preferredMonth"
                        name="preferredMonth"
                        onChange={handleChange}
                        value={form.preferredMonth}
                      >
                        <option value="">Select a month</option>
                        {MONTH_NAMES.map((m, i) => (
                          <option key={m} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="soft-label mb-1">Email</p>
                      <div className="soft-field cursor-not-allowed bg-[#f7f2ec] text-[#9a8f84]">
                        {readOnly.email}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="mt-6 rounded-[1.1rem] border border-[#e4c7bf] bg-[#fff2ee] px-4 py-3 text-sm text-[#9a5c49]">
                  {error}
                </div>
              ) : null}
              {success ? (
                <div className="mt-6 rounded-[1.1rem] border border-[#cfe0d2] bg-[#eef7f0] px-4 py-3 text-sm text-[#55755d]">
                  {success}
                </div>
              ) : null}

              <div className="mt-7">
                <Button disabled={saving} type="submit">
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
