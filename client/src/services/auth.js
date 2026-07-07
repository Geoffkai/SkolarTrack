export function getRoleFromToken(token) {
  const payload = JSON.parse(atob(token.split(".")[1]));
  return payload.role;
}
