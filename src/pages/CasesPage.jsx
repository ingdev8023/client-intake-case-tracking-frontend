import { RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listCases, updateCaseStage, updateCaseStatus } from "../api/casesApi.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { StateBlock } from "../components/StateBlock.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";

const STAGE_OPTIONS = ["intake", "document_collection", "review", "filed", "decision"];
const STATUS_OPTIONS = ["open", "pending", "closed"];

export function CasesPage() {
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total_pages: 1, total_items: 0 });
  const [filters, setFilters] = useState({ case_status: "", case_stage: "", case_type: "", client_id: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  async function loadCases(page = pagination.page) {
    setIsLoading(true);
    setError("");

    try {
      const data = await listCases({ ...filters, page, limit: pagination.limit });
      setCases(data.items || []);
      setPagination(data.pagination || { page, limit: pagination.limit, total_pages: 1, total_items: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCases(1);
  }, []);

  async function handleFilterSubmit(event) {
    event.preventDefault();
    await loadCases(1);
  }

  async function handleStageChange(caseId, value) {
    setUpdatingId(caseId);
    setError("");
    try {
      await updateCaseStage(caseId, value);
      await loadCases(pagination.page);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleStatusChange(caseId, value) {
    setUpdatingId(caseId);
    setError("");
    try {
      await updateCaseStatus(caseId, value);
      await loadCases(pagination.page);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  return (
    <>
      <PageHeader
        eyebrow="Case management"
        title="Cases"
        description="Browse active matters, filter the queue, and send workflow-specific updates to the API."
        actions={
          <button className="secondary-button" onClick={() => loadCases(pagination.page)} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        }
      />

      <form className="filter-bar" onSubmit={handleFilterSubmit}>
        <label>
          <span>Status</span>
          <select value={filters.case_status} onChange={(event) => updateFilter("case_status", event.target.value)}>
            <option value="">Any</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Stage</span>
          <select value={filters.case_stage} onChange={(event) => updateFilter("case_stage", event.target.value)}>
            <option value="">Any</option>
            {STAGE_OPTIONS.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Type</span>
          <input value={filters.case_type} onChange={(event) => updateFilter("case_type", event.target.value)} />
        </label>
        <label>
          <span>Client ID</span>
          <input value={filters.client_id} onChange={(event) => updateFilter("client_id", event.target.value)} />
        </label>
        <button className="primary-button" type="submit">
          <Search size={16} />
          Search
        </button>
      </form>

      {error && <StateBlock title="Case request failed" message={error} />}

      <section className="content-section">
        <div className="section-heading">
          <h2>Case queue</h2>
          <span>{pagination.total_items || 0} total</span>
        </div>

        {isLoading ? (
          <StateBlock title="Loading cases..." />
        ) : cases.length === 0 ? (
          <StateBlock title="No cases found" message="Try changing the filters or confirm the backend has data." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((caseItem) => (
                  <tr key={caseItem.case_id}>
                    <td>{caseItem.case_title || `Case #${caseItem.case_id}`}</td>
                    <td>{caseItem.client_name || caseItem.client?.client_name || "Unassigned"}</td>
                    <td>{caseItem.case_type || "Unassigned"}</td>
                    <td>
                      <select
                        disabled={updatingId === caseItem.case_id}
                        value={caseItem.case_stage || ""}
                        onChange={(event) => handleStageChange(caseItem.case_id, event.target.value)}
                      >
                        <option value="">Select stage</option>
                        {STAGE_OPTIONS.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        disabled={updatingId === caseItem.case_id}
                        value={caseItem.case_status || ""}
                        onChange={(event) => handleStatusChange(caseItem.case_id, event.target.value)}
                      >
                        <option value="">Select status</option>
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <StatusBadge tone={caseItem.case_status === "closed" ? "success" : "warning"}>
                        {caseItem.case_status || "open"}
                      </StatusBadge>
                    </td>
                    <td>
                      <Link className="text-link" to={`/cases/${caseItem.case_id}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination-row">
          <button
            className="secondary-button"
            disabled={pagination.page <= 1 || isLoading}
            onClick={() => loadCases(pagination.page - 1)}
            type="button"
          >
            Previous
          </button>
          <span>
            Page {pagination.page || 1} of {pagination.total_pages || 1}
          </span>
          <button
            className="secondary-button"
            disabled={pagination.page >= pagination.total_pages || isLoading}
            onClick={() => loadCases(pagination.page + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </section>
    </>
  );
}
