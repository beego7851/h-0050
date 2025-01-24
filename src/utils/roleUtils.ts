import { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['app_role'];

export const isValidRole = (role: UserRole): boolean => {
  return ['admin', 'collector', 'member'].includes(role);
};

export const hasRole = (userRoles: UserRole[] | null, role: UserRole): boolean => {
  if (!userRoles) return false;
  console.log('[RoleUtils] Checking role:', {
    role,
    userRoles,
    timestamp: new Date().toISOString()
  });
  return userRoles.includes(role);
};

export const hasAnyRole = (userRoles: UserRole[] | null, roles: UserRole[]): boolean => {
  return roles.some(role => hasRole(userRoles, role));
};

export const canAccessTab = (userRoles: UserRole[] | null, tab: string): boolean => {
  if (!userRoles) return false;

  // Define tab access requirements
  const tabAccessMap: Record<string, UserRole[]> = {
    dashboard: ['admin', 'collector', 'member'],
    users: ['admin', 'collector'],
    financials: ['admin', 'collector'],
    system: ['admin']
  };

  const allowedRoles = tabAccessMap[tab];
  if (!allowedRoles) return false;

  const result = hasAnyRole(userRoles, allowedRoles as UserRole[]);

  console.log('[RoleUtils] Tab access check:', {
    tab,
    allowedRoles,
    hasAccess: result,
    userRoles,
    timestamp: new Date().toISOString()
  });

  return result;
};

export const getDefaultRoute = (userRoles: UserRole[] | null): string => {
  if (!userRoles?.length) return '/login';
  if (hasRole(userRoles, 'admin')) return '/system';
  if (hasRole(userRoles, 'collector')) return '/users';
  return '/dashboard';
};