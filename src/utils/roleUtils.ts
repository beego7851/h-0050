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

type TabAccessConfig = {
  [key: string]: UserRole[];
};

const tabAccessMap: TabAccessConfig = {
  dashboard: ['admin', 'collector', 'member'],
  users: ['admin', 'collector'],
  financials: ['admin', 'collector'],
  system: ['admin'],
  audit: ['admin']
};

export const canAccessTab = (tab: string, userRoles: UserRole[] | null): boolean => {
  if (!userRoles) return false;

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