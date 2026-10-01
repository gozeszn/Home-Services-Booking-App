import React, { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import {
  getAdminUsers,
  updateAdminUserStatus,
} from "../services/adminUserService";

const PAGE_SIZE = 5;

export default function AdminUsersPage() {
  const { user: admin } = useAuth();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      setIsLoading(true);
      setLoadFailed(false);
      setError("");

      try {
        const data = await getAdminUsers(admin);

        if (active) setUsers(data);
      } catch (error) {
        if (active) {
          setLoadFailed(true);
          setError(error.message || "Unable to load users.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, [admin, retry]);

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
    setSelectedUser(null);
  }

  function clearFilters() {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
    setSelectedUser(null);
  }

  async function confirmStatusChange() {
    if (!selectedUser || isUpdating) return;

    setIsUpdating(true);
    setError("");
    setMessage("");

    const nextStatus =
      selectedUser.status === "active" ? "inactive" : "active";

    try {
      const updated = await updateAdminUserStatus(
        admin,
        selectedUser.id,
        nextStatus
      );

      setUsers((previous) =>
        previous.map((user) =>
          user.id === updated.id ? updated : user
        )
      );

      setMessage(
        `${updated.fullName} is now ${updated.status} in the demo.`
      );

      setSelectedUser(null);
    } catch (error) {
      setError(error.message || "Unable to update this account.");
    } finally {
      setIsUpdating(false);
    }
  }

  const query = search.trim().toLowerCase();

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !query ||
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);

    return (
      matchesSearch &&
      (!roleFilter || user.role === roleFilter) &&
      (!statusFilter || user.status === statusFilter)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <section aria-labelledby="admin-users-title">
      <div className="page-heading">
        <p className="eyebrow">Administrator workspace</p>
        <h1 id="admin-users-title">Manage users</h1>
        <p className="intro">
          Review accounts and manage their access status.
        </p>
      </div>

      <p className="demo-notice">
        This is a separate demo user list, including a copy of your
        administrator account details. Changes here do not affect
        real accounts or their ability to log in.
      </p>

      {error && (
        <p className="form-error" role="alert">{error}</p>
      )}

      {message && (
        <p className="form-success" role="status">{message}</p>
      )}

      <fieldset
        className="admin-filters"
        disabled={isLoading || isUpdating}
      >
        <legend className="sr-only">Filter users</legend>

        <div className="form-field">
          <label htmlFor="admin-user-search">Search users</label>
          <input
            id="admin-user-search"
            type="search"
            placeholder="Name or email"
            value={search}
            onChange={(event) =>
              changeFilter(setSearch, event.target.value)
            }
          />
        </div>

        <div className="form-field">
          <label htmlFor="admin-user-role">Role</label>
          <select
            id="admin-user-role"
            value={roleFilter}
            onChange={(event) =>
              changeFilter(setRoleFilter, event.target.value)
            }
          >
            <option value="">All roles</option>
            <option value="customer">Customer</option>
            <option value="provider">Provider</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="admin-user-status">Status</label>
          <select
            id="admin-user-status"
            value={statusFilter}
            onChange={(event) =>
              changeFilter(setStatusFilter, event.target.value)
            }
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <button
          className="button button--secondary"
          type="button"
          onClick={clearFilters}
        >
          Clear filters
        </button>
      </fieldset>

      {selectedUser && (
        <section
          className="panel admin-confirmation"
          aria-labelledby="status-confirmation-title"
        >
          <h2 id="status-confirmation-title">
            {selectedUser.status === "active"
              ? "Deactivate"
              : "Activate"}{" "}
            {selectedUser.fullName}?
          </h2>

          <p>
            This changes the account status in the demo data only.
          </p>

          <div className="form-actions">
            <button
              className={
                selectedUser.status === "active"
                  ? "button button--danger"
                  : "button"
              }
              type="button"
              disabled={isUpdating}
              onClick={confirmStatusChange}
            >
              {isUpdating ? "Updating..." : "Confirm change"}
            </button>

            <button
              className="button button--secondary"
              type="button"
              disabled={isUpdating}
              onClick={() => setSelectedUser(null)}
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {isLoading ? (
        <p className="panel" role="status">Loading users...</p>
      ) : loadFailed ? (
        <button
          className="button"
          type="button"
          onClick={() => setRetry((value) => value + 1)}
        >
          Try again
        </button>
      ) : filteredUsers.length === 0 ? (
        <section className="panel">
          <h2>No matching users</h2>
          <p>Try another search or clear the filters.</p>
        </section>
      ) : (
        <>
          <p role="status">
            {filteredUsers.length} matching account
            {filteredUsers.length === 1 ? "" : "s"}
          </p>

          <div
            className="admin-table-wrapper"
            role="region"
            aria-label="User accounts"
            tabIndex={0}
          >
            <table className="admin-table">
              <caption className="sr-only">
                Demo user accounts and account controls
              </caption>

              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className="status-badge">
                        {user.status}
                      </span>
                    </td>
                    <td>
                      {user.id === admin.id ? (
                        <span className="form-note">
                          Your account
                        </span>
                      ) : (
                        <button
                          className="button button--secondary"
                          type="button"
                          disabled={isUpdating}
                          onClick={() => {
                            setSelectedUser(user);
                            setError("");
                            setMessage("");
                          }}
                          aria-label={`${
                            user.status === "active"
                              ? "Deactivate"
                              : "Activate"
                          } ${user.fullName}`}
                        >
                          {user.status === "active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="User result pages">
              <button
                className="button button--secondary"
                type="button"
                disabled={currentPage === 1 || isUpdating}
                onClick={() => {
                  setPage(currentPage - 1);
                  setSelectedUser(null);
                }}
              >
                Previous
              </button>

              <span>Page {currentPage} of {totalPages}</span>

              <button
                className="button button--secondary"
                type="button"
                disabled={currentPage === totalPages || isUpdating}
                onClick={() => {
                  setPage(currentPage + 1);
                  setSelectedUser(null);
                }}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}