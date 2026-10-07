// Only the links this role can actually reach (avoids ProtectedRoute bounces).
// One list, read by both the desktop Sidebar and the mobile menu, so they can't drift apart.
export function navLinksFor(role) {
  return role === "admin"
    ? [
        { to: "/admin/dashboard", label: "Dashboard" },
        { to: "/scholarships", label: "Browse" },
      ]
    : [
        { to: "/scholarships", label: "Browse" },
        { to: "/my-tracker", label: "My Tracker" },
      ];
}
