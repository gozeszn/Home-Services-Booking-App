const PREFIX = "homeServices.demoAdminUsers.";

function storageKey(adminId) {
  if (!adminId) {
    throw new Error("Please log in to manage users.");
  }

  return `${PREFIX}${adminId}`;
}

function createDemoUsers(admin) {
  const createdAt = new Date().toISOString();

  return [
    {
      id: admin.id,
      fullName: admin.fullName,
      email: admin.email,
      role: "admin",
      status: "active",
      createdAt,
    },
    {
      id: "demo-customer-1",
      fullName: "Demo Customer A",
      email: "customer-a@example.test",
      role: "customer",
      status: "active",
      createdAt,
    },
    {
      id: "demo-customer-2",
      fullName: "Demo Customer B",
      email: "customer-b@example.test",
      role: "customer",
      status: "inactive",
      createdAt,
    },
    {
      id: "demo-provider-1",
      fullName: "Demo Provider A",
      email: "provider-a@example.test",
      role: "provider",
      status: "active",
      createdAt,
    },
    {
      id: "demo-provider-2",
      fullName: "Demo Provider B",
      email: "provider-b@example.test",
      role: "provider",
      status: "inactive",
      createdAt,
    },
  ];
}

function writeUsers(adminId, users) {
  try {
    sessionStorage.setItem(
      storageKey(adminId),
      JSON.stringify(users)
    );
  } catch {
    throw new Error(
      "Unable to save demo users. Check that browser storage is available."
    );
  }
}

function readUsers(admin) {
  const key = storageKey(admin.id);
  let saved;

  try {
    saved = sessionStorage.getItem(key);
  } catch {
    throw new Error("Unable to access demo user storage.");
  }

  if (saved === null) {
    const users = createDemoUsers(admin);
    writeUsers(admin.id, users);
    return users;
  }

  try {
    const users = JSON.parse(saved);

    if (
      !Array.isArray(users) ||
      users.some(
        (user) =>
          !user ||
          typeof user.id !== "string" ||
          typeof user.fullName !== "string" ||
          typeof user.email !== "string" ||
          !["customer", "provider", "admin"].includes(user.role) ||
          !["active", "inactive"].includes(user.status)
      )
    ) {
      throw new Error("Invalid user data");
    }

    return users;
  } catch {
    throw new Error("Unable to read saved demo users.");
  }
}

function requireAdmin(admin) {
  if (!admin?.id || admin.role !== "admin") {
    throw new Error("Administrator access is required.");
  }
}

export async function getAdminUsers(admin) {
  requireAdmin(admin);
  return readUsers(admin);
}

export async function updateAdminUserStatus(
  admin,
  userId,
  nextStatus
) {
  requireAdmin(admin);

  if (!["active", "inactive"].includes(nextStatus)) {
    throw new Error("Choose a valid account status.");
  }

  const users = readUsers(admin);
  const selected = users.find((user) => user.id === userId);

  if (!selected) {
    throw new Error("This user could not be found.");
  }

  if (nextStatus === "inactive") {
    if (selected.id === admin.id) {
      throw new Error("You cannot deactivate your own account.");
    }

    const activeAdmins = users.filter(
      (user) => user.role === "admin" && user.status === "active"
    );

    if (
      selected.role === "admin" &&
      selected.status === "active" &&
      activeAdmins.length <= 1
    ) {
      throw new Error("The last active administrator cannot be deactivated.");
    }
  }

  const updated = {
    ...selected,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    updatedBy: admin.id,
  };

  writeUsers(
    admin.id,
    users.map((user) =>
      user.id === userId ? updated : user
    )
  );

  return updated;
}