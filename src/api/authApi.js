import { apiRequest, clearToken, expectJson, storeToken } from "./client.js";

export async function login(email, password) {
  const response = await apiRequest("/login", {
    method: "POST",
    body: JSON.stringify({
      user_email: email,
      user_password: password,
    }),
  });

  const data = await expectJson(response, "Login failed");
  storeToken(data.access_token);
  return data.user;
}

export async function getCurrentUser() {
  const response = await apiRequest("/auth/me");
  return expectJson(response, "Unable to load current user");
}

export function logout() {
  clearToken();
}
