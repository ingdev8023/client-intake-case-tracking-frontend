import { Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createClient, listClients } from "../api/clientsApi.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { StateBlock } from "../components/StateBlock.jsx";
import { getClientAddress, getClientEmail, getClientFullName, getClientPhone } from "../utils/display.js";

export function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    client_first_name: "",
    client_last_name: "",
    client_email: "",
    client_phone: "",
    client_address: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadClients() {
    setIsLoading(true);
    setError("");

    try {
      const data = await listClients();
      setClients(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await createClient(form);
      setForm({
        client_first_name: "",
        client_last_name: "",
        client_email: "",
        client_phone: "",
        client_address: "",
      });
      await loadClients();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <>
      <PageHeader
        eyebrow="Client directory"
        title="Clients"
        description="Create client records and keep intake contact data close to case work."
        actions={
          <button className="secondary-button" onClick={loadClients} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        }
      />

      {error && <StateBlock title="Client request failed" message={error} />}

      <section className="split-section">
        <form className="form-panel" onSubmit={handleSubmit}>
          <h2>New client</h2>
          <label>
            <span>First name</span>
            <input
              required
              value={form.client_first_name}
              onChange={(event) => updateField("client_first_name", event.target.value)}
            />
          </label>
          <label>
            <span>Last name</span>
            <input
              required
              value={form.client_last_name}
              onChange={(event) => updateField("client_last_name", event.target.value)}
            />
          </label>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.client_email}
              onChange={(event) => updateField("client_email", event.target.value)}
            />
          </label>
          <label>
            <span>Phone</span>
            <input value={form.client_phone} onChange={(event) => updateField("client_phone", event.target.value)} />
          </label>
          <label>
            <span>Address</span>
            <input
              value={form.client_address}
              onChange={(event) => updateField("client_address", event.target.value)}
            />
          </label>
          <button className="primary-button" disabled={isSubmitting} type="submit">
            <Plus size={16} />
            {isSubmitting ? "Creating..." : "Create client"}
          </button>
        </form>

        <section className="content-section">
          <div className="section-heading">
            <h2>Client list</h2>
            <span>{clients.length} records</span>
          </div>

          {isLoading ? (
            <StateBlock title="Loading clients..." />
          ) : clients.length === 0 ? (
            <StateBlock title="No clients found" />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.client_id}>
                      <td>{getClientFullName(client) || `Client #${client.client_id}`}</td>
                      <td>{getClientEmail(client) || "None"}</td>
                      <td>{getClientPhone(client) || "None"}</td>
                      <td>{getClientAddress(client) || "None"}</td>
                      <td>
                        <Link className="text-link" to={`/clients/${client.client_id}`}>
                          Go to client
                        </Link>
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
