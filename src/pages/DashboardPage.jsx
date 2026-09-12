import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { listCases } from "../api/casesApi.js";
import { listClients } from "../api/clientsApi.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { StateBlock } from "../components/StateBlock.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";

export function DashboardPage() {
  const { currentUser } = useAuth();
  const [casesData, setCasesData] = useState(null);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadDashboard() {
    setIsLoading(true);
    setError("");

    try {
      const [caseResult, clientResult] = await Promise.all([
        listCases({ page: 1, limit: 5 }),
        listClients(),
      ]);
      setCasesData(caseResult);
      setClients(Array.isArray(clientResult) ? clientResult : clientResult.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const recentCases = casesData?.items || [];
  const metrics = useMemo(
    () => [
      {
        label: "Open cases",
        value: casesData?.pagination?.total_items ?? recentCases.length,
      },
      {
        label: "Clients",
        value: clients.length,
      },
      {
        label: "Role",
        value: currentUser?.user_role || "staff",
      },
    ],
    [casesData, clients.length, currentUser?.user_role, recentCases.length],
  );

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome${currentUser?.user_name ? `, ${currentUser.user_name}` : ""}`}
        description="Track active intake work and move cases through the backend workflow."
        actions={
          <button className="secondary-button" onClick={loadDashboard} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        }
      />

      {error && <StateBlock title="Dashboard could not load" message={error} />}

      <section className="metric-grid" aria-label="Dashboard metrics">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{isLoading ? "..." : metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="content-section">
        <div className="section-heading">
          <h2>Recent cases</h2>
        </div>

        {isLoading ? (
          <StateBlock title="Loading cases..." />
        ) : recentCases.length === 0 ? (
          <StateBlock title="No cases found" message="Cases will appear here after the backend returns them." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Type</th>
                  <th>Stage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((caseItem) => (
                  <tr key={caseItem.case_id}>
                    <td>{caseItem.case_title || `Case #${caseItem.case_id}`}</td>
                    <td>{caseItem.case_type || "Unassigned"}</td>
                    <td>{caseItem.case_stage || "intake"}</td>
                    <td>
                      <StatusBadge tone={caseItem.case_status === "closed" ? "success" : "warning"}>
                        {caseItem.case_status || "open"}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
