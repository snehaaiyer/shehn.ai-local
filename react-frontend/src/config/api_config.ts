export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

// Pre-auth role headers — read from Zustand/localStorage, enforced later when auth is built
export function getAuthHeaders(): Record<string, string> {
  const role = localStorage.getItem('shehnai_role') || 'couple';
  const userId = localStorage.getItem('shehnai_user_id') || '1';
  return {
    'X-User-Role': role,
    'X-User-Id': userId,
    'Content-Type': 'application/json'
  };
}
