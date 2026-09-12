function firstDefined(record, keys) {
  return keys.map((key) => record?.[key]).find((value) => value !== undefined && value !== null && value !== "");
}

export function getClientFirstName(client) {
  return firstDefined(client, ["client_firstname", "client_first_name", "first_name", "clientFirstName", "firstName"]) || "";
}

export function getClientLastName(client) {
  return firstDefined(client, ["client_lastname", "client_last_name", "last_name", "clientLastName", "lastName"]) || "";
}

export function getClientFullName(client) {
  const firstName = getClientFirstName(client);
  const lastName = getClientLastName(client);
  const splitName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return splitName || firstDefined(client, ["client_name", "name", "full_name", "clientFullName"]) || "";
}

export function getClientEmail(client) {
  return firstDefined(client, ["client_email", "email"]) || "";
}

export function getClientPhone(client) {
  return firstDefined(client, ["client_phone", "phone"]) || "";
}

export function getClientAddress(client) {
  return firstDefined(client, ["client_address", "address"]) || "";
}

export function getClientDateOfBirth(client) {
  return firstDefined(client, ["client_date_of_birth", "date_of_birth", "dob"]) || "";
}

export function getClientId(client) {
  return firstDefined(client, ["client_id", "id"]) || "";
}

export function getCaseClientId(caseItem) {
  return firstDefined(caseItem, ["client_id"]) || caseItem?.client?.client_id || "";
}

export function getCaseClientName(caseItem, clientLookup = {}) {
  const clientId = getCaseClientId(caseItem);
  const lookupName = getClientFullName(clientLookup[clientId]);
  const nestedName = getClientFullName(caseItem?.client);
  const directName = firstDefined(caseItem, ["client_full_name", "client_name"]) || "";

  return lookupName || nestedName || directName || "Unassigned";
}

export function getCaseNumber(caseItem) {
  const caseId = caseItem?.case_id ?? caseItem?.id;
  return caseId ? `#${caseId}` : "Unassigned";
}

export function getUserIsActive(user) {
  const value = firstDefined(user, ["is_active", "user_is_active", "active", "isActive"]);

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    return ["true", "1", "active", "yes"].includes(value.toLowerCase());
  }

  return true;
}

export function getUserId(user) {
  return firstDefined(user, ["user_id", "id"]) || "";
}

export function getUserDisplayName(user) {
  return firstDefined(user, ["user_name", "name", "full_name", "user_full_name"]) || user?.user_email || `User #${getUserId(user)}`;
}
