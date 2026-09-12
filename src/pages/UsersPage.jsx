import { Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { activateUser, createUser, deactivateUser, listUsers } from "../api/usersApi.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { StateBlock } from "../components/StateBlock.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    user_name: "",
    user_email: "",
    user_password: "",
    user_role: "staff",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  async function loadUsers() {
    setIsLoading(true);
    setError("");

    try {
      const data = await listUsers();
      setUsers(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await createUser(form);
      setForm({ user_name: "", user_email: "", user_password: "", user_role: "staff" });
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleUserStatus(user) {
    setUpdatingUserId(user.user_id);
    setError("");

    try {
      if (user.is_active) {
        await deactivateUser(user.user_id);
      } else {
        await activateUser(user.user_id);
      }
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Admin-only user management for staff and administrator accounts."
        actions={
          <button className="secondary-button" onClick={loadUsers} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        }
      />

      {error && <StateBlock title="User request failed" message={error} />}

      <section className="split-section">
        <form className="form-panel" onSubmit={handleSubmit}>
          <h2>New user</h2>
          <label>
            <span>Name</span>
            <input required value={form.user_name} onChange={(event) => updateField("user_name", event.target.value)} />
          </label>
          <label>
            <span>Email</span>
            <input
              required
              type="email"
              value={form.user_email}
              onChange={(event) => updateField("user_email", event.target.value)}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              required
              type="password"
              value={form.user_password}
              onChange={(event) => updateField("user_password", event.target.value)}
            />
          </label>
          <label>
            <span>Role</span>
            <select value={form.user_role} onChange={(event) => updateField("user_role", event.target.value)}>
              <option value="staff">staff</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <button className="primary-button" disabled={isSubmitting} type="submit">
            <Plus size={16} />
            {isSubmitting ? "Creating..." : "Create user"}
          </button>
        </form>

        <section className="content-section">
          <div className="section-heading">
            <h2>User list</h2>
            <span>{users.length} accounts</span>
          </div>

          {isLoading ? (
            <StateBlock title="Loading users..." />
          ) : users.length === 0 ? (
            <StateBlock title="No users found" />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.user_id}>
                      <td>{user.user_name || `User #${user.user_id}`}</td>
                      <td>{user.user_email}</td>
                      <td>{user.user_role}</td>
                      <td>
                        <StatusBadge tone={user.is_active ? "success" : "neutral"}>
                          {user.is_active ? "active" : "inactive"}
                        </StatusBadge>
                      </td>
                      <td>
                        <button
                          className="secondary-button"
                          disabled={updatingUserId === user.user_id}
                          onClick={() => handleUserStatus(user)}
                          type="button"
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </>
  );
}
