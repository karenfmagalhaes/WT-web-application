import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  approveSuggestion,
  deleteAdminSuggestion,
  deleteAdminUser,
  getAdminSuggestions,
  getAdminUsers,
  rejectSuggestion,
  updateUserRole,
} from "../api/adminApi";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { formatDayHeading } from "../utils/dateUtils";

const statusStyles = {
  approved: "border border-[#cfe0d2] bg-[#eef7f0] text-[#55755d]",
  pending: "border border-[#ead8a8] bg-[#fbf2dc] text-[#8b6d2d]",
  rejected: "border border-[#e5c6bf] bg-[#fff0ec] text-[#9a5c49]",
};

const roleStyles = {
  admin: "border border-[#ccd5e0] bg-[#eef2f7] text-[#3d5a7a]",
  user: "border border-[#e1d6c9] bg-[#fffaf4] text-[#75695d]",
};

const SUGGESTION_FILTERS = ["all", "pending", "approved", "rejected"];

const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("suggestions");

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionFilter, setSuggestionFilter] = useState("all");
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState("");

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");

  const loadSuggestions = useCallback(async (filter) => {
    setSuggestionsLoading(true);
    setSuggestionsError("");
    try {
      const { data } = await getAdminSuggestions(
        filter === "all" ? undefined : filter,
      );
      setSuggestions(data.suggestions);
    } catch (err) {
      setSuggestionsError(err.response?.data?.message ?? "Failed to load suggestions.");
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const { data } = await getAdminUsers();
      setUsers(data.users);
    } catch (err) {
      setUsersError(err.response?.data?.message ?? "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuggestions(suggestionFilter);
  }, [loadSuggestions, suggestionFilter]);

  useEffect(() => {
    if (tab === "users" && users.length === 0) {
      loadUsers();
    }
  }, [tab, loadUsers, users.length]);

  const handleApprove = async (id) => {
    try {
      await approveSuggestion(id);
      setSuggestions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, status: "approved" } : s)),
      );
    } catch (err) {
      setSuggestionsError(err.response?.data?.message ?? "Failed to approve suggestion.");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectSuggestion(id);
      setSuggestions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, status: "rejected" } : s)),
      );
    } catch (err) {
      setSuggestionsError(err.response?.data?.message ?? "Failed to reject suggestion.");
    }
  };

  const handleDeleteSuggestion = async (id) => {
    try {
      await deleteAdminSuggestion(id);
      setSuggestions((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setSuggestionsError(err.response?.data?.message ?? "Failed to delete suggestion.");
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await deleteAdminUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setUsersError(err.response?.data?.message ?? "Failed to delete user.");
    }
  };

  const handleRoleChange = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      const { data } = await updateUserRole(id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: data.user.role } : u)),
      );
    } catch (err) {
      setUsersError(err.response?.data?.message ?? "Failed to update role.");
    }
  };

  const tabClass = (name) =>
    `rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
      tab === name
        ? "bg-[#ece1d4] text-[#4b433b]"
        : "text-[#75695e] hover:bg-[#f4ece2] hover:text-[#4b433b]"
    }`;

  const filterClass = (name) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${
      suggestionFilter === name
        ? "bg-[#4b4743] text-[#fffaf4]"
        : "border border-[#d8ccbf] bg-[#fffaf4] text-[#75695e] hover:bg-[#f4ece2]"
    }`;

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 lg:px-8">
      <div className="space-y-7">

        {/* Header */}
        <section className="soft-panel overflow-hidden">
          <div className="px-6 py-8 lg:px-8">
            <p className="soft-kicker">Admin Dashboard</p>
            <h1 className="soft-display mt-4 text-[clamp(2.4rem,5vw,4rem)] italic leading-[0.95] tracking-tight text-[#4d463f]">
              Manage the platform
            </h1>
            <p className="soft-note mt-4 max-w-2xl text-sm leading-relaxed">
              Review community suggestions, promote or remove users, and keep
              the holiday calendar accurate and up to date.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="soft-chip">{suggestions.length} suggestions</span>
              <span className="soft-chip">{users.length} users</span>
              <span className="soft-chip">Logged in as {user?.name}</span>
            </div>
          </div>
        </section>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 rounded-full bg-[#fffaf3] p-1 w-fit">
          <button className={tabClass("suggestions")} onClick={() => setTab("suggestions")} type="button">
            Suggestions
          </button>
          <button className={tabClass("users")} onClick={() => setTab("users")} type="button">
            Users
          </button>
        </div>

        {/* Suggestions tab */}
        {tab === "suggestions" ? (
          <section className="soft-panel p-6 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="soft-kicker">Community Suggestions</p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight text-[#4d463f]">
                  Review submitted holidays
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTION_FILTERS.map((f) => (
                  <button
                    className={filterClass(f)}
                    key={f}
                    onClick={() => setSuggestionFilter(f)}
                    type="button"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {suggestionsError ? (
              <div className="mt-5 rounded-[1.1rem] border border-[#e4c7bf] bg-[#fff2ee] px-4 py-3 text-sm text-[#9a5c49]">
                {suggestionsError}
              </div>
            ) : null}

            {suggestionsLoading ? (
              <div className="soft-muted-card mt-6 px-5 py-8 text-center">
                <p className="text-sm text-[#84786b]">Loading suggestions…</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="soft-muted-card mt-6 px-5 py-8 text-center">
                <p className="text-sm font-medium text-[#5f564d]">No suggestions found.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {suggestions.map((s) => (
                  <article className="soft-card px-5 py-5" key={s._id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-medium text-[#4d463f]">{s.name}</h3>
                          <span className="rounded-full border border-[#e2d8cd] px-3 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7164]">
                            {s.country}
                          </span>
                          <span className="rounded-full border border-[#e2d8cd] px-3 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7164]">
                            {s.category}
                          </span>
                        </div>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#978b7d]">
                          {formatDayHeading(s.date)} · submitted by{" "}
                          {s.submittedBy
                            ? `${s.submittedBy.firstName} ${s.submittedBy.lastName} (${s.submittedBy.email})`
                            : "unknown"}
                        </p>
                        {s.description ? (
                          <p className="mt-3 text-sm leading-relaxed text-[#75695d]">
                            {s.description}
                          </p>
                        ) : null}
                        {s.referenceLink ? (
                          <a
                            className="mt-2 inline-block text-sm font-semibold text-[#6f5844] transition hover:text-[#4d463f]"
                            href={s.referenceLink}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Open reference link
                          </a>
                        ) : null}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                          statusStyles[s.status] ?? statusStyles.pending
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {s.status === "pending" ? (
                        <>
                          <Button onClick={() => handleApprove(s._id)} size="small">
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(s._id)}
                            size="small"
                            variant="outline"
                          >
                            Reject
                          </Button>
                        </>
                      ) : null}
                      <Button
                        onClick={() => handleDeleteSuggestion(s._id)}
                        size="small"
                        variant="danger"
                      >
                        Delete
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {/* Users tab */}
        {tab === "users" ? (
          <section className="soft-panel p-6 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="soft-kicker">Registered Users</p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight text-[#4d463f]">
                  Manage accounts
                </h2>
              </div>
              <Button onClick={loadUsers} size="small" variant="secondary">
                Refresh
              </Button>
            </div>

            {usersError ? (
              <div className="mt-5 rounded-[1.1rem] border border-[#e4c7bf] bg-[#fff2ee] px-4 py-3 text-sm text-[#9a5c49]">
                {usersError}
              </div>
            ) : null}

            {usersLoading ? (
              <div className="soft-muted-card mt-6 px-5 py-8 text-center">
                <p className="text-sm text-[#84786b]">Loading users…</p>
              </div>
            ) : users.length === 0 ? (
              <div className="soft-muted-card mt-6 px-5 py-8 text-center">
                <p className="text-sm font-medium text-[#5f564d]">No users found.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {users.map((u) => (
                  <article className="soft-card px-5 py-4" key={u._id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ece1d4] text-sm font-semibold text-[#5c5046]">
                          {u.firstName?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[#4d463f]">
                              {u.firstName} {u.lastName}
                            </p>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                                roleStyles[u.role] ?? roleStyles.user
                              }`}
                            >
                              {u.role}
                            </span>
                            {u._id === user?._id ? (
                              <span className="rounded-full border border-[#ead8a8] bg-[#fbf2dc] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b6d2d]">
                                You
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-[#978b7d]">{u.email}</p>
                          {u.preferredCountry ? (
                            <p className="mt-0.5 text-xs text-[#b0a597]">
                              Prefers {u.preferredCountry}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {u._id !== user?._id ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => handleRoleChange(u._id, u.role)}
                            size="small"
                            variant="secondary"
                          >
                            Make {u.role === "admin" ? "User" : "Admin"}
                          </Button>
                          <Button
                            onClick={() => handleDeleteUser(u._id)}
                            size="small"
                            variant="danger"
                          >
                            Delete
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        <div className="pb-4">
          <Button onClick={() => navigate("/")} size="small" variant="outline">
            Back to Calendar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
