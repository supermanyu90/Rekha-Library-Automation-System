import type { UserRole } from './database.types';

export const roleHierarchy: Record<UserRole, number> = {
  member: 1,
  librarian: 2,
  head_librarian: 3,
  admin: 4,
  superadmin: 5,
};

export function hasPermission(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case 'superadmin':
      return 'bg-red-100 text-red-800';
    case 'admin':
      return 'bg-orange-100 text-orange-800';
    case 'head_librarian':
      return 'bg-blue-100 text-blue-800';
    case 'librarian':
      return 'bg-green-100 text-green-800';
    case 'member':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    results.push(row);
  }

  return results;
}

export function logActivity(
  actorId: string,
  actionType: string,
  details: Record<string, any>
) {
  import('./supabase').then(({ supabase }) => {
    supabase.from('activity_logs').insert({
      actor_id: actorId,
      action_type: actionType,
      details,
    }).then();
  });
}
