import { ArrowLeft, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  deleteCase,
  getCase,
  reassignCaseClient,
  updateAssignedUsers,
  updateCaseStage,
  updateCaseStatus,
  updateCaseType,
} from "../api/casesApi.js";
import { getClient } from "../api/clientsApi.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { StateBlock } from "../components/StateBlock.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { getCaseClientId, getCaseClientName, getCaseNumber } from "../utils/display.js";

const STAGE_OPTIONS = ["intake", "document_collection", "review", "filed", "decision"];
const STATUS_OPTIONS = ["open", "pending", "closed"];

export function CaseDetailPage() {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const { isAdmin } = useAuth();
  const [caseItem, setCaseItem] = useState(null);
  const [client, setClient] = useState(null);
  const [workflow, setWorkflow] = useState({ case_stage: "", case_status: "", case_type: "" });
  const [assignedUserIds, setAssignedUserIds] = useState("");
  const [assignedAction, setAssignedAction] = useState("add");
  const [clientIdInput, setClientIdInput] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  async function loadCase({ quiet = false } = {}) {
    if (!quiet) {
      setIsLoading(true);
    }
    setError("");

    try {
      const data = await getCase(caseId);
      const clientId = getCaseClientId(data);

      setCaseItem(data);
      setClient(null);
      setWorkflow({
        case_stage: data.case_stage || "",
        case_status: data.case_status || "",
        case_type: data.case_type || "",
      });
      setClientIdInput(String(clientId || ""));

      if (clientId) {
        try {
          const clientData = await getClient(clientId);
          setClient(clientData);
        } catch {
          setClient(null);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCase();
  }, [caseId]);

  async function handleDelete() {
    setIsDeleting(true);
    setError("");

    try {
      await deleteCase(caseId);
      navigate("/cases", { replace: true });
    } catch (err) {
      setError(err.message);
      setIsDeleting(false);
    }
  }

  function updateWorkflowField(name, value) {
    setWorkflow((current) => ({ ...current, [name]: value }));
  }

  async function runWorkflowAction(action, successMessage) {
    setIsUpdating(true);
    setError("");
    setMessage("");

    try {
      await action();
      setMessage(successMessage);
      await loadCase({ quiet: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  }

  function parseAssignedUserIds() {
    return assignedUserIds
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);
  }

  async function handleAssignedUsersSubmit(event) {
    event.preventDefault();
    const userIds = parseAssignedUserIds();

    if (userIds.length === 0) {
      setError("Enter at least one assigned user ID.");
      return;
    }

    await runWorkflowAction(
      () => updateAssignedUsers(caseId, assignedAction, userIds),
      "Assigned users updated.",
    );
    setAssignedUserIds("");
  }

  async function handleClientSubmit(event) {
    event.preventDefault();

    if (!clientIdInput) {
      setError("Enter a client ID.");
      return;
    }

    await runWorkflowAction(() => reassignCaseClient(caseId, clientIdInput), "Client reassigned.");
  }

  return (
    <>
      <PageHeader
        eyebrow="Case detail"
        title={caseItem ? getCaseNumber(caseItem) : `#${caseId}`}
        description="Review the selected case record returned by the API."
        actions={
          <>
            <Link className="secondary-button" to="/cases">
              <ArrowLeft size={16} />
              Cases
            </Link>
            {isAdmin && (
              <button className="danger-button" disabled={isDeleting} onClick={handleDelete} type="button">
                <Trash2 size={16} />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </>
        }
      />

      {error && <StateBlock title="Case detail failed" message={error} />}
      {message && <StateBlock title={message} />}
      {isLoading && <StateBlock title="Loading case..." />}

      {caseItem && (
        <>
          <section className="detail-grid">
            <article className="detail-panel">
              <h2>Case</h2>
              <dl>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <StatusBadge tone={caseItem.case_status === "closed" ? "success" : "warning"}>
                      {caseItem.case_status || "open"}
                    </StatusBadge>
                  </dd>
                </div>
                <div>
                  <dt>Stage</dt>
                  <dd>{caseItem.case_stage || "intake"}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{caseItem.case_type || "Unassigned"}</dd>
                </div>
              </dl>
            </article>

            <article className="detail-panel">
              <h2>Client</h2>
              <dl>
                <div>
                  <dt>Name</dt>
                  <dd>{getCaseClientName(caseItem, client ? { [client.client_id]: client } : {})}</dd>
                </div>
              </dl>
            </article>
          </section>

          <section className="content-section workflow-section">
            <div className="section-heading">
              <h2>Workflow actions</h2>
              <span>Command endpoints</span>
            </div>
            <div className="workflow-grid">
              <form
                className="inline-workflow-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  runWorkflowAction(
                    () => updateCaseStage(caseId, workflow.case_stage),
                    "Case stage updated.",
                  );
                }}
              >
                <label>
                  <span>Stage</span>
                  <select
                    value={workflow.case_stage}
                    onChange={(event) => updateWorkflowField("case_stage", event.target.value)}
                  >
                    <option value="">Select stage</option>
                    {STAGE_OPTIONS.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="secondary-button" disabled={isUpdating || !workflow.case_stage} type="submit">
                  Update stage
                </button>
              </form>

              <form
                className="inline-workflow-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  runWorkflowAction(
                    () => updateCaseStatus(caseId, workflow.case_status),
                    "Case status updated.",
                  );
                }}
              >
                <label>
                  <span>Status</span>
                  <select
                    value={workflow.case_status}
                    onChange={(event) => updateWorkflowField("case_status", event.target.value)}
                  >
                    <option value="">Select status</option>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="secondary-button" disabled={isUpdating || !workflow.case_status} type="submit">
                  Update status
                </button>
              </form>

              <form
                className="inline-workflow-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  runWorkflowAction(() => updateCaseType(caseId, workflow.case_type), "Case type updated.");
                }}
              >
                <label>
                  <span>Type</span>
                  <input
                    value={workflow.case_type}
                    onChange={(event) => updateWorkflowField("case_type", event.target.value)}
                  />
                </label>
                <button className="secondary-button" disabled={isUpdating || !workflow.case_type} type="submit">
                  Update type
                </button>
              </form>

              <form className="inline-workflow-form" onSubmit={handleAssignedUsersSubmit}>
                <label>
                  <span>Assigned user IDs</span>
                  <input
                    placeholder="2, 3"
                    value={assignedUserIds}
                    onChange={(event) => setAssignedUserIds(event.target.value)}
                  />
                </label>
                <label>
                  <span>Action</span>
                  <select value={assignedAction} onChange={(event) => setAssignedAction(event.target.value)}>
                    <option value="add">add</option>
                    <option value="delete">delete</option>
                  </select>
                </label>
                <button className="secondary-button" disabled={isUpdating || !assignedUserIds} type="submit">
                  Update users
                </button>
              </form>

              <form className="inline-workflow-form" onSubmit={handleClientSubmit}>
                <label>
                  <span>Client ID</span>
                  <input value={clientIdInput} onChange={(event) => setClientIdInput(event.target.value)} />
                </label>
                <button className="secondary-button" disabled={isUpdating || !clientIdInput} type="submit">
                  Reassign client
                </button>
              </form>
            </div>
          </section>
        </>
      )}
    </>
  );
}
