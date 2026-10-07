import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "../styles/visualRefresh.css";

const roleLinks = {
  customer: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/bookings", label: "My bookings" },
  ],
  provider: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/provider/services", label: "My services" },
    { to: "/provider/bookings", label: "Booking requests" },
    { to: "/provider/profile", label: "Provider profile" },
  ],
  admin: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/services", label: "Services" },
    { to: "/admin/bookings", label: "Bookings" },
    { to: "/admin/reviews", label: "Reviews" },
  ],
};

function navigationClass({ isActive }) {
  return isActive ? "nav-link nav-link--active" : "nav-link";
}

export default function AppLayout() {
  const {
    user,
    isLoading,
    isAuthenticated,
    logout,
  } = useAuth();

  const links = isAuthenticated
    ? roleLinks[user.role] ?? []
    : [];

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <div className="container header-content">
          <Link className="brand" to="/">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 48 48" role="img">
                <path d="M7 22.2 24 8l17 14.2v17.3a2.5 2.5 0 0 1-2.5 2.5h-29A2.5 2.5 0 0 1 7 39.5V22.2Z" />
                <path d="M18 42V28h12v14" />
                <path d="m31.5 14.4 3.2-6.4" />
                <path d="m35.2 18.2 6.8-1.8" />
              </svg>
            </span>
            <span className="brand-copy">
              <strong>Home<span>Services</span></strong>
              <small>HOME SERVICES</small>
            </span>
          </Link>

          <nav
            className="primary-nav"
            aria-label="Main navigation"
          >
            <NavLink
              className={navigationClass}
              to="/"
              end
            >
              Home
            </NavLink>

            <NavLink
              className={navigationClass}
              to="/services"
            >
              Find services
            </NavLink>

            {!isLoading && (
              isAuthenticated ? (
                <>
                  <NavLink
                    className={navigationClass}
                    to="/profile"
                  >
                    My account
                  </NavLink>

                  <button
                    className="nav-button"
                    type="button"
                    onClick={logout}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    className={navigationClass}
                    to="/login"
                  >
                    Log in
                  </NavLink>

                  <NavLink
                    className={navigationClass}
                    to="/register"
                  >
                    Register
                  </NavLink>
                </>
              )
            )}
          </nav>
        </div>

        {!isLoading && isAuthenticated && (
          <div className="workspace-bar">
            <div className="container workspace-content">
              <p className="workspace-label">
                {user.role} workspace
              </p>

              <nav
                className="workspace-nav"
                aria-label={`${user.role} workspace`}
              >
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    className={navigationClass}
                    to={link.to}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}
      </header>

      <main
        id="main-content"
        className="container main-content"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>
            Home Services · Built for everyday home needs.
          </p>
        </div>
      </footer>
    </>
  );
}
