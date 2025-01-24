import { useCallback, useMemo, memo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuthSession } from "@/hooks/useAuthSession";
import NavItem from "./navigation/NavItem";

interface SidePanelProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const SidePanel = memo(({ currentTab, onTabChange }: SidePanelProps) => {
  const { session, handleSignOut } = useAuthSession();
  const { userRole, userRoles, roleLoading } = useRoleAccess();
  const { toast } = useToast();

  const prevUserRoleRef = useRef(userRole);
  const prevUserRolesRef = useRef(userRoles);
  const prevTabRef = useRef(currentTab);

  const hasSession = !!session;

  useEffect(() => {
    if (!hasSession) {
      console.log('[SidePanel] No active session, access will be restricted');
      return;
    }

    if (prevUserRoleRef.current !== userRole || 
        prevUserRolesRef.current !== userRoles || 
        prevTabRef.current !== currentTab) {
      console.log('[SidePanel] Session state:', {
        hasSession,
        userRole,
        userRoles,
        currentTab,
        timestamp: new Date().toISOString()
      });

      prevUserRoleRef.current = userRole;
      prevUserRolesRef.current = userRoles;
      prevTabRef.current = currentTab;
    }
  }, [hasSession, userRole, userRoles, currentTab]);

  const navigationItems = useMemo(() => [
    {
      name: 'Overview',
      tab: 'dashboard',
      alwaysShow: true
    },
    {
      name: 'Users',
      tab: 'users',
      requiresRole: ['admin', 'collector'] as const
    },
    {
      name: 'Financials',
      tab: 'financials',
      requiresRole: ['admin', 'collector'] as const
    },
    {
      name: 'System',
      tab: 'system',
      requiresRole: ['admin'] as const
    }
  ], []);

  const visibleNavigationItems = useMemo(() => {
    if (!hasSession || roleLoading) {
      console.log('[SidePanel] Session or roles not ready:', {
        hasSession,
        roleLoading,
        userRoles
      });
      return navigationItems.filter(item => item.alwaysShow);
    }

    return navigationItems.filter(item => {
      if (item.alwaysShow) return true;
      if (!item.requiresRole) return true;
      return item.requiresRole.some(role => userRoles?.includes(role));
    });
  }, [navigationItems, roleLoading, userRoles, hasSession]);

  const handleTabChange = useCallback((tab: string) => {
    console.log('[SidePanel] Tab change requested:', {
      currentTab,
      newTab: tab,
      userRoles,
      timestamp: new Date().toISOString()
    });

    if (!userRoles?.length) {
      toast({
        title: "Access Denied",
        description: "Please wait while your permissions are being loaded.",
        variant: "destructive",
      });
      return;
    }

    onTabChange(tab);
  }, [onTabChange, userRoles, currentTab, toast]);

  const handleLogoutClick = useCallback(async () => {
    console.log('[SidePanel] Logout initiated');
    try {
      await handleSignOut(false);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('[SidePanel] Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  }, [handleSignOut, toast]);

  return (
    <div className="flex flex-col h-full bg-dashboard-card border-r border-dashboard-cardBorder">
      <ScrollArea className="flex-1">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold text-dashboard-highlight">
              Navigation
            </h2>
            <div className="space-y-1">
              {visibleNavigationItems.map((item) => (
                <NavItem
                  key={item.tab}
                  name={item.name}
                  tab={item.tab}
                  isActive={currentTab === item.tab}
                  onClick={() => handleTabChange(item.tab)}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-dashboard-cardBorder space-y-4">
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start",
            "bg-[#9b87f5] hover:bg-[#7E69AB]",
            "text-white transition-colors"
          )}
          onClick={handleLogoutClick}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
});

SidePanel.displayName = "SidePanel";

export default SidePanel;