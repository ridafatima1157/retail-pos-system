import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Edit,
  UserRound,
  ShieldCheck,
  X,
  Loader2,
} from "lucide-react";
import api from "../services/api";

function Users() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CASHIER",
  });

  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isAdmin =
    String(currentUser.role || "").toUpperCase() === "ADMIN";

  // =========================
  // LOAD USERS
  // =========================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");

      setUsers(response.data || []);
    } catch (err) {
      console.error("Users loading error:", err);

      if (err.response?.status === 403) {
        setError("Only Admin users can access user management.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to load users."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =========================
  // OPEN MODAL
  // =========================

  const openModal = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "CASHIER",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // =========================
  // CLOSE MODAL
  // =========================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);

    setFormData({
      name: "",
      email: "",
      password: "",
      role: "CASHIER",
    });

    setError("");
  };

  // =========================
  // CREATE USER
  // =========================

  const handleCreateUser = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const role = formData.role;

    if (!name) {
      setError("Please enter the full name.");
      return;
    }

    if (!email) {
      setError("Please enter the email.");
      return;
    }

    if (!password) {
      setError("Please enter the password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setSaving(true);

      await api.post("/users", {
        name,
        email,
        password,
        role,
      });

      setSuccess("User created successfully.");

      await fetchUsers();

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "CASHIER",
      });

      setTimeout(() => {
        setShowModal(false);
        setSuccess("");
      }, 800);
    } catch (err) {
      console.error("Create user error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to create user."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // FILTER USERS
  // =========================

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalUsers = users.length;

  const administrators = users.filter(
    (user) =>
      String(user.role || "").toUpperCase() === "ADMIN"
  ).length;

  const cashiers = users.filter(
    (user) =>
      String(user.role || "").toUpperCase() === "CASHIER"
  ).length;

  // =========================
  // NON-ADMIN
  // =========================

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-bold text-red-700">
          Access Denied
        </h1>

        <p className="mt-2 text-sm text-red-600">
          Only Admin users can manage users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            User Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage system users, roles and access.
          </p>
        </div>

        <button
          onClick={openModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* ERROR */}

      {error && !showModal && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CARDS */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Users
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {totalUsers}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Administrators
          </p>

          <p className="mt-2 text-2xl font-bold text-purple-600">
            {administrators}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Cashiers
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-600">
            {cashiers}
          </p>
        </div>
      </div>

      {/* USERS TABLE */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="relative max-w-lg">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search users..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading users...
            </div>
          ) : (
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                    User
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                    Role
                  </th>

                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate-500">
                    Created
                  </th>

                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const role =
                    String(user.role || "").toUpperCase();

                  const isUserActive =
                    user.is_active !== false;

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <UserRound
                              size={18}
                              className="text-blue-600"
                            />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              {user.name}
                            </p>

                            <p className="text-xs text-slate-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            role === "ADMIN"
                              ? "bg-purple-50 text-purple-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {role === "ADMIN" && (
                            <ShieldCheck size={13} />
                          )}

                          {role === "ADMIN"
                            ? "Admin"
                            : "Cashier"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            isUserActive
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isUserActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {user.created_at
                          ? new Date(
                              user.created_at
                            ).toLocaleString()
                          : "—"}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                          title="Edit user"
                        >
                          <Edit size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!loading &&
                  filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-10 text-center text-sm text-slate-500"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ADD USER MODAL */}

      {showModal && (
        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="flex min-h-full items-start justify-center py-4 sm:items-center sm:py-8">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-user-title"
              className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              {/* MODAL HEADER */}

              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-6">
                <div>
                  <h2
                    id="add-user-title"
                    className="text-lg font-bold text-slate-800"
                  >
                    Add New User
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Create an Admin or Cashier account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              {/* FORM */}

              <form
                onSubmit={handleCreateUser}
                className="min-h-0 flex-1 overflow-y-auto"
              >
                <div className="space-y-4 p-6">
                  {/* ERROR */}

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {success}
                    </div>
                  )}

                  {/* NAME */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                      Full Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      disabled={saving}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </div>

                  {/* EMAIL */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email"
                      disabled={saving}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </div>

                  {/* PASSWORD */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                      Password
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      disabled={saving}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </div>

                  {/* ROLE */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                      Role
                    </label>

                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      disabled={saving}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                    >
                      <option value="CASHIER">
                        Cashier
                      </option>

                      <option value="ADMIN">
                        Admin
                      </option>
                    </select>
                  </div>
                </div>

                {/* FOOTER */}

                <div className="flex justify-end gap-3 border-t border-slate-200 p-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving && (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    )}

                    {saving
                      ? "Creating..."
                      : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;