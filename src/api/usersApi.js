import { apiRequest, expectJson } from "./client.js";

export async function listUsers() {
  const response = await apiRequest("/users");
  return expectJson(response, "Unable to load users");
}

export async function createUser(payload) {
  const response = await apiRequest("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return expectJson(response, "Unable to create user");
}

export async function activateUser(userId) {
  const response = await apiRequest(`/users/${userId}/activate`, {
    method: "PATCH",
  });
  return expectJson(response, "Unable to activate user");
}

export async function deactivateUser(userId) {
  const response = await apiRequest(`/users/${userId}/deactivate`, {
    method: "PATCH",
  });
  return expectJson(response, "Unable to deactivate user");
}
