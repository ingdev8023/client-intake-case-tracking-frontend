import { BriefcaseBusiness, LayoutDashboard, LogOut, Users, UserRoundCog } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cases", label: "Cases", icon: BriefcaseBusiness },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/users", label: "Users", icon: UserRoundCog, adminOnly: true },
];

export function AppLayout() {
  const navigate = useNavigate();
  const { currentUser, isAdmin, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">CI</span>
          <div>
            <strong>Case Intake</strong>
            <span>Tracking</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className="nav-link">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span>{currentUser?.user_name || "Signed in"}</span>
            <small>{currentUser?.user_role || "user"}</small>
          </div>
          <button className="icon-button" type="button" onClick={handleLogout} aria-label="Log out" title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <Outlet />
      </main>
    </div>
  );
}
