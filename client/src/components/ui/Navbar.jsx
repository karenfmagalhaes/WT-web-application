import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Navbar = () => {
  const { user, logout, isDevAuthBypass } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(isDevAuthBypass ? "/" : "/login");
  };

  return (
    <nav className="z-30 border-b border-[#e2d6ca] bg-[#f7f1e8]/90 px-4 backdrop-blur lg:px-8">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#6f5e50] text-white shadow-[0_10px_18px_rgba(95,83,66,0.18)]">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z" />
            </svg>
          </div>
          <div className="leading-none">
            <span className="soft-display text-2xl italic tracking-tight text-[#463d35]">
              Calendo
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full bg-[#fffaf3] p-1 sm:flex">
          <NavLink
            className={({ isActive }) =>
              `rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                isActive
                  ? "bg-[#ece1d4] text-[#4b433b]"
                  : "text-[#75695e] hover:bg-[#f4ece2] hover:text-[#4b433b]"
              }`
            }
            end
            to="/"
          >
            Calendar
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                isActive
                  ? "bg-[#ece1d4] text-[#4b433b]"
                  : "text-[#75695e] hover:bg-[#f4ece2] hover:text-[#4b433b]"
              }`
            }
            to="/profile"
          >
            Profile
          </NavLink>
        </div>

        <div className="flex items-center gap-3">
          {isDevAuthBypass ? (
            <span className="rounded-full border border-[#e0c892] bg-[#f8edd0] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b6c27]">
              Demo Mode
            </span>
          ) : null}

          {user ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ece1d4] text-xs font-semibold text-[#5c5046]">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-[#4e463e]">{user.name}</p>
                  <p className="text-xs text-[#948679]">{user.email}</p>
                </div>
              </div>
              <button
                className="rounded-full border border-[#d8ccbf] bg-[#fffaf3] px-4 py-2 text-sm text-[#6c6257] transition hover:bg-[#f2eadf] hover:text-[#453d36]"
                onClick={handleLogout}
                type="button"
              >
                Sign out
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
