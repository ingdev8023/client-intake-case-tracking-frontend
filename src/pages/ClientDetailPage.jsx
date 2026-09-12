import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getClient, updateClient } from "../api/clientsApi.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { StateBlock } from "../components/StateBlock.jsx";

export function ClientDetailPage() {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadClient() {
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await getClient(clientId);
      setClient(data);
      setForm({
        client_name: data.client_name || "",
        client_email: data.client_email || "",
        client_phone: data.client_phone || "",
        client_address: data.client_address || "",
        client_date_of_birth: data.client_date_of_birth || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadClient();
  }, [clientId]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const updated = await updateClient(clientId, form);
      setClient(updated);
      setMessage("Client updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Client detail"
        title={client?.client_name || `Client #${clientId}`}
        description="Review and update the selected client profile from the API."
        actions={
          <Link className="secondary-button" to="/clients">
            <ArrowLeft size={16} />
            Clients
          </Link>
        }
      />

      {error && <StateBlock title="Client detail failed" message={error} />}
      {message && <StateBlock title={message} />}
      {isLoading && <StateBlock title="Loading client..." />}

      {form && (
        <form className="form-panel detail-form" onSubmit={handleSubmit}>
          <h2>Profile</h2>
          <label>
            <span>Name</span>
            <input
              required
              value={form.client_name}
              onChange={(event) => updateField("client_name", event.target.value)}
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
          <label>
            <span>Date of birth</span>
            <input
              type="date"
              value={form.client_date_of_birth}
              onChange={(event) => updateField("client_date_of_birth", event.target.value)}
            />
          </label>
          <button className="primary-button" disabled={isSaving} type="submit">
            <Save size={16} />
            {isSaving ? "Saving..." : "Save client"}
          </button>
        </form>
      )}
    </>
  );
}
