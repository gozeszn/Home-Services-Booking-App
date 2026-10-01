import React from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const dashboardContent = {
  customer: {
    description:
      "Find a service and keep track of your bookings.",
    actions: [
      {
        title: "Find a service",
        description:
          "Explore services available for your home.",
        to: "/services",
      },
      {
        title: "My bookings",
        description:
          "View your requests and upcoming appointments.",
        to: "/bookings",
      },
      {
        title: "My account",
        description:
          "Update your name and contact information.",
        to: "/profile",
      },
    ],
  },

  provider: {
    description:
      "Manage your services, public profile, and incoming bookings.",
    actions: [
      {
        title: "My services",
        description:
          "Create and manage the services you offer.",
        to: "/provider/services",
      },
      {
        title: "Booking requests",
        description:
          "Review requests and manage accepted work.",
        to: "/provider/bookings",
      },
      {
        title: "Provider profile",
        description:
          "Manage the business information customers see.",
        to: "/provider/profile",
      },
    ],
  },

  admin: {
    description:
      "Manage platform accounts and service listings, and review bookings.",
    actions: [
      {
        title: "Manage users",
        description:
          "Review customer and provider accounts.",
        to: "/admin/users",
      },
      {
        title: "Manage services",
        description:
          "Review and moderate service listings.",
        to: "/admin/services",
      },
      {
        title: "View bookings",
        description:
          "Inspect booking activity across the platform.",
        to: "/admin/bookings",
      },
    ],
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const content = dashboardContent[user.role];

  if (!content) {
    return (
      <section className="panel">
        <h1>Workspace unavailable</h1>
        <p>Your account does not have a supported workspace.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="dashboard-title">
      <div className="page-heading">
        <p className="eyebrow">
          {user.role} workspace
        </p>

        <h1 id="dashboard-title">
          Welcome, {user.fullName}
        </h1>

        <p className="intro">
          {content.description}
        </p>
      </div>

      <div className="dashboard-grid">
        {content.actions.map((action) => (
          <article
            className="dashboard-card"
            key={action.to}
          >
            <h2>{action.title}</h2>
            <p>{action.description}</p>

            <Link
              className="button"
              to={action.to}
            >
              {action.title}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}