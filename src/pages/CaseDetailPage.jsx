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
import { getClient, listClients } from "../api/clientsApi.js";
import { listUsers } from "../api/usersApi.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { StateBlock } from "../components/StateBlock.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import {
  getCaseClientId,
  getCaseClientName,
  getCaseNumber,
  getClientAddress,
  getClientDateOfBirth,
  getClientEmail,
  getClientFullName,
  getClientId,
  getClientPhone,
  getUserDisplayName,
  getUserId,
} from "../utils/display.js";
import { CASE_STATUS_OPTIONS, getAllowedNextStages } from "../utils/workflow.js";

export function CaseDetailPage() {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const { isAdmin } = useAuth();
  const [caseItem, setCaseItem] = useState(null);
  const [client, setClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [workflow, setWorkflow] = useState({ case_stage: "", case_status: "", case_type: "" });
  const [selectedAssignedUserId, setSelectedAssignedUserId] = useState("");
  const [assignedAction, setAssignedAction] = useState("add");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLookups, setIsLoadingLookups] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
        case_stage: "",
        case_status: data.case_status || "",
        case_type: data.case_type || "",
      });
      setSelectedClientId(String(clientId || ""));

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

  useEffect(() => {
    async function loadLookups() {
      setIsLoadingLookups(true);

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

  async function handleDelete() {
    setIsDeleting(true);
    setError("");

    try {
      await deleteCase(caseId);
      navigate("/cases", { replace: true });
    } catch (err) {
      setError(err.message);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  }

  function updateWorkflowField(name, value) {
    setWorkflow((current) => ({ ...current, [name]: value }));
  }

  const allowedNextStages = getAllowedNextStages(caseItem?.case_stage);

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

  async function handleAssignedUsersSubmit(event) {
    event.preventDefault();
    const userId = Number(selectedAssignedUserId);

    if (!Number.isInteger(userId) || userId <= 0) {
      setError("Select a user.");
      return;
    }

    await runWorkflowAction(
      () => updateAssignedUsers(caseId, assignedAction, [userId]),
      "Assigned users updated.",
    );
    setSelectedAssignedUserId("");
  }

  async function handleClientSubmit(event) {
    event.preventDefault();

    if (!selectedClientId) {
      setError("Select a client email.");
      return;
    }

    await runWorkflowAction(() => reassignCaseClient(caseId, selectedClientId), "Client reassigned.");
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
              <button
                className="danger-button"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(true)}
                type="button"
              >
                <Trash2 size={16} />
                Delete
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
                  <dt>Complete name</dt>
                  <dd>{getCaseClientName(caseItem, client ? { [client.client_id]: client } : {})}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{getClientEmail(client) || "None"}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{getClientPhone(client) || "None"}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{getClientAddress(client) || "None"}</dd>
                </div>
                <div>
                  <dt>DOB</dt>
                  <dd>{getClientDateOfBirth(client) || "None"}</dd>
                </div>
              </dl>
            </article>
          </section>

          <section className="content-section workflow-section">
            <div className="section-heading">
              <h2>Workflow actions</h2>
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
                  <span>Next stage</span>
                  <select
                    value={workflow.case_stage}
                    disabled={allowedNextStages.length === 0}
                    onChange={(event) => updateWorkflowField("case_stage", event.target.value)}
                  >
                    <option value="">
                      {allowedNextStages.length === 0 ? "No available transitions" : "Select next stage"}
                    </option>
                    {allowedNextStages.map((stage) => (
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
                    {CASE_STATUS_OPTIONS.map((status) => (
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
                  <span>Assigned user</span>
                  <select
                    disabled={isLoadingLookups}
                    value={selectedAssignedUserId}
                    onChange={(event) => setSelectedAssignedUserId(event.target.value)}
                  >
                    <option value="">{isLoadingLookups ? "Loading users..." : "Select user"}</option>
                    {users.map((user) => (
                      <option key={getUserId(user)} value={getUserId(user)}>
                        {getUserDisplayName(user)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Action</span>
                  <select value={assignedAction} onChange={(event) => setAssignedAction(event.target.value)}>
                    <option value="add">add</option>
                    <option value="delete">delete</option>
                  </select>
                </label>
                <button className="secondary-button" disabled={isUpdating || !selectedAssignedUserId} type="submit">
                  Update users
                </button>
              </form>

              <form className="inline-workflow-form" onSubmit={handleClientSubmit}>
                <label>
                  <span>Client email</span>
                  <select
                    disabled={isLoadingLookups}
                    value={selectedClientId}
                    onChange={(event) => setSelectedClientId(event.target.value)}
                  >
                    <option value="">{isLoadingLookups ? "Loading clients..." : "Select client email"}</option>
                    {clients.map((clientItem) => (
                      <option key={getClientId(clientItem)} value={getClientId(clientItem)}>
                        {getClientEmail(clientItem) || `${getClientFullName(clientItem)} - no email`}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="secondary-button" disabled={isUpdating || !selectedClientId} type="submit">
                  Reassign client
                </button>
              </form>
            </div>
          </section>
        </>
      )}

      {isDeleteModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-labelledby="delete-case-title" role="dialog" aria-modal="true">
            <div className="modal-icon">
              <Trash2 size={22} />
            </div>
            <h2 id="delete-case-title">Delete this case?</h2>
            <p>
              This is a dangerous action. Deleting a case can hide it from normal workflows and may affect audit history
              or reporting. Only continue if you are sure this case should be removed.
            </p>
            <div className="modal-actions">
              <button className="secondary-button" disabled={isDeleting} onClick={() => setIsDeleteModalOpen(false)} type="button">
                Cancel
              </button>
              <button className="danger-button" disabled={isDeleting} onClick={handleDelete} type="button">
                <Trash2 size={16} />
                {isDeleting ? "Deleting..." : "Delete case"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
