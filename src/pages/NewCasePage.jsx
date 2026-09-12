import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createCase } from "../api/casesApi.js";
import { listClients } from "../api/clientsApi.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { StateBlock } from "../components/StateBlock.jsx";
import { getClientFullName } from "../utils/display.js";

const STAGE_OPTIONS = ["intake", "document_collection", "review", "filed", "decision"];
const STATUS_OPTIONS = ["open", "pending", "closed"];

export function NewCasePage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    client_id: "",
    case_type: "",
    case_stage: "intake",
    case_status: "open",
    user_assigned_ids: "",
  });
  const [error, setError] = useState("");
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadClients() {
      setIsLoadingClients(true);
      setError("");

      try {
        const data = await listClients();
        setClients(Array.isArray(data) ? data : data.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoadingClients(false);
      }
    }

    loadClients();
  }, []);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function parseAssignedUserIds() {
    return form.user_assigned_ids
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const payload = {
      client_id: Number(form.client_id),
      case_type: form.case_type,
      case_stage: form.case_stage,
      case_status: form.case_status,
    };
    const assignedIds = parseAssignedUserIds();

    if (assignedIds.length > 0) {
      payload.user_assigned_ids = assignedIds;
    }

    try {
      const createdCase = await createCase(payload);
      const createdCaseId = createdCase?.case_id || createdCase?.id;
      navigate(createdCaseId ? `/cases/${createdCaseId}` : "/cases", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Case management"
        title="Add case"
        description="Create a new case and connect it to an existing client."
        actions={
          <Link className="secondary-button" to="/cases">
            <ArrowLeft size={16} />
            Cases
          </Link>
        }
      />

      {error && <StateBlock title="Unable to create case" message={error} />}

      <form className="form-panel detail-form" onSubmit={handleSubmit}>
        <h2>Case details</h2>
        <label>
          <span>Client</span>
          <select
            disabled={isLoadingClients}
            required
            value={form.client_id}
            onChange={(event) => updateField("client_id", event.target.value)}
          >
            <option value="">{isLoadingClients ? "Loading clients..." : "Select client"}</option>
            {clients.map((client) => (
              <option key={client.client_id} value={client.client_id}>
                {getClientFullName(client) || `Client #${client.client_id}`}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Type</span>
          <input
            placeholder="AOS"
            required
            value={form.case_type}
            onChange={(event) => updateField("case_type", event.target.value)}
          />
        </label>
        <label>
          <span>Stage</span>
          <select value={form.case_stage} onChange={(event) => updateField("case_stage", event.target.value)}>
            {STAGE_OPTIONS.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={form.case_status} onChange={(event) => updateField("case_status", event.target.value)}>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Assigned user IDs</span>
          <input
            placeholder="2, 3"
            value={form.user_assigned_ids}
            onChange={(event) => updateField("user_assigned_ids", event.target.value)}
          />
        </label>
        <button className="primary-button" disabled={isSubmitting || isLoadingClients} type="submit">
          <Plus size={16} />
          {isSubmitting ? "Creating..." : "Create case"}
        </button>
      </form>
    </>
  );
}
