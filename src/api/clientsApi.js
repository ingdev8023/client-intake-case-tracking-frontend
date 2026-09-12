import { apiRequest, expectJson } from "./client.js";

export async function listClients() {
  const response = await apiRequest("/clients");
  return expectJson(response, "Unable to load clients");
}

export async function getClient(clientId) {
  const response = await apiRequest(`/clients/${clientId}`);
  return expectJson(response, "Unable to load client");
}

export async function createClient(payload) {
  const response = await apiRequest("/clients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return expectJson(response, "Unable to create client");
}

export async function updateClient(clientId, payload) {
  const response = await apiRequest(`/clients/${clientId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return expectJson(response, "Unable to update client");
}
