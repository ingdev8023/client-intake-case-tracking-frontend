import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createCase } from "../api/casesApi.js";
import { listClients } from "../api/clientsApi.js";
import { listUsers } from "../api/usersApi.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { StateBlock } from "../components/StateBlock.jsx";
import { getClientFullName, getClientId, getUserDisplayName, getUserId } from "../utils/display.js";
import { CASE_STAGES, CASE_STATUS_OPTIONS } from "../utils/workflow.js";

export function NewCasePage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    client_id: "",
    case_type: "",
    case_stage: "intake",
    case_status: "open",
    assigned_user_ids: [],
  });
  const [error, setError] = useState("");
  const [isLoadingLookups, setIsLoadingLookups] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadLookups() {
      setIsLoadingLookups(true);
      setError("");

      try {
        const [clientsData, usersData] = await Promise.all([listClients(), listUsers()]);
        setClients(Array.isArray(clientsData) ? clientsData : clientsData.items || []);
        setUsers(Array.isArray(usersData) ? usersData : usersData.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoadingLookups(false);
      }
    }

    loadLookups();
  }, []);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateAssignedUsers(event) {
    const userId = event.target.value;

    setForm((current) => {
      const assignedUserIds = current.assigned_user_ids.includes(userId)
        ? current.assigned_user_ids.filter((id) => id !== userId)
        : [...current.assigned_user_ids, userId];

      return { ...current, assigned_user_ids: assignedUserIds };
    });
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
    const assignedIds = form.assigned_user_ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0);

    if (assignedIds.length === 0) {
      setError("At least one assigned user ID is required.");
      setIsSubmitting(false);
      return;
    }

    payload.assigned_user_ids = assignedIds;

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
            disabled={isLoadingLookups}
            required
            value={form.client_id}
            onChange={(event) => updateField("client_id", event.target.value)}
          >
            <option value="">{isLoadingLookups ? "Loading clients..." : "Select client"}</option>
            {clients.map((client) => (
              <option key={getClientId(client)} value={getClientId(client)}>
                {getClientFullName(client) || `Client #${getClientId(client)}`}
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
            {CASE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select value={form.case_status} onChange={(event) => updateField("case_status", event.target.value)}>
            {CASE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Assigned users</span>
          <div className="checkbox-list">
            {isLoadingLookups ? (
              <span className="muted-text">Loading users...</span>
            ) : users.length === 0 ? (
              <span className="muted-text">No users available</span>
            ) : (
              users.map((user) => {
                const userId = String(getUserId(user));

                return (
                  <label className="checkbox-row" key={userId}>
                    <input
                      checked={form.assigned_user_ids.includes(userId)}
                      onChange={updateAssignedUsers}
                      type="checkbox"
                      value={userId}
                    />
                    <span>{getUserDisplayName(user)}</span>
                  </label>
                );
              })
            )}
          </div>
        </label>
        <button className="primary-button" disabled={isSubmitting || isLoadingLookups} type="submit">
          <Plus size={16} />
          {isSubmitting ? "Creating..." : "Create case"}
        </button>
      </form>
    </>
  );
}
