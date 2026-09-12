import { apiRequest, expectJson } from "./client.js";

export async function listCases(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });

  const response = await apiRequest(`/cases?${search.toString()}`);
  return expectJson(response, "Unable to load cases");
}

export async function getCase(caseId) {
  const response = await apiRequest(`/cases/${caseId}`);
  return expectJson(response, "Unable to load case");
}

export async function createCase(payload) {
  const response = await apiRequest("/cases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return expectJson(response, "Unable to create case");
}

export async function updateCaseStage(caseId, caseStage) {
  const response = await apiRequest(`/cases/${caseId}/stage`, {
    method: "PATCH",
    body: JSON.stringify({ case_stage: caseStage }),
  });
  return expectJson(response, "Unable to update stage");
}

export async function updateCaseStatus(caseId, caseStatus) {
  const response = await apiRequest(`/cases/${caseId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ case_status: caseStatus }),
  });
  return expectJson(response, "Unable to update status");
}

export async function updateCaseType(caseId, caseType) {
  const response = await apiRequest(`/cases/${caseId}/type`, {
    method: "PATCH",
    body: JSON.stringify({ case_type: caseType }),
  });
  return expectJson(response, "Unable to update type");
}

export async function updateAssignedUsers(caseId, action, userAssignedIds) {
  const response = await apiRequest(`/cases/${caseId}/users`, {
    method: "PATCH",
    body: JSON.stringify({
      action,
      user_assigned_ids: userAssignedIds,
    }),
  });
  return expectJson(response, "Unable to update assigned users");
}

export async function reassignCaseClient(caseId, clientId) {
  const response = await apiRequest(`/cases/${caseId}/client`, {
    method: "PATCH",
    body: JSON.stringify({ client_id: Number(clientId) }),
  });
  return expectJson(response, "Unable to reassign client");
}

export async function deleteCase(caseId) {
  const response = await apiRequest(`/cases/${caseId}`, {
    method: "DELETE",
  });
  return expectJson(response, "Unable to delete case");
}
