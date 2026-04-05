// Superadmin has its own layout — bypasses dashboard middleware entirely
export default function SuperAdminLayout({ children }) {
  return children
}