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

  const result = (() => {
    switch (tab) {
      case 'dashboard':
        return true;
      case 'users':
        return hasRole(userRoles, 'admin') || hasRole(userRoles, 'collector');
      case 'financials':
        return hasRole(userRoles, 'admin') || hasRole(userRoles, 'collector');
      case 'system':
        return hasRole(userRoles, 'admin');
      default:
        return false;
    }
  })();

  console.log('[RoleUtils] Tab access check:', {
    tab,
    hasAccess: result,
    userRoles,
    timestamp: new Date().toISOString()
  });

  return result;
};