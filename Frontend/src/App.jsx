import React from "react";
import { Link, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";

function NotFoundPage() {
  return (
    <section className="panel">
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link className="button" to="/">
        Back to home
      </Link>
    </section>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, logout } = useAuth();

  return (
    <>
      <header className="site-header">
        <div className="container header-content">
          <Link className="brand" to="/">
            Home Services
          </Link>

          <nav aria-label="Main navigation">
            <Link to="/">Home</Link>

            {!isLoading && (
              isAuthenticated ? (
                <>
                  <Link to="/profile">My profile</Link>
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
                  <Link to="/login">Log in</Link>
                  <Link to="/register">Register</Link>
                </>
              )
            )}
          </nav>
        </div>
      </header>

      <main className="container main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>Home Services · Built for everyday home needs.</p>
        </div>
      </footer>
    </>
  );
}