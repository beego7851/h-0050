import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useRoleSync } from "@/hooks/useRoleSync";
import { Loader2 } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";

interface ProtectedRoutesProps {
  session: Session | null;
}

const ProtectedRoutes = ({ session }: ProtectedRoutesProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { roleLoading, hasRole, userRole, canAccessTab } = useRoleAccess();
  const { syncRoles } = useRoleSync();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Convert path to tab
  const pathToTab = (path: string) => {
    const cleanPath = path.split('/')[1] || 'dashboard';
    return cleanPath;
  };

  const [activeTab, setActiveTab] = useState(pathToTab(location.pathname));

  useEffect(() => {
    const newTab = pathToTab(location.pathname);
    console.log('Path changed, updating active tab:', {
      path: location.pathname,
      newTab,
      canAccess: canAccessTab(newTab),
      userRole
    });
    
    if (!canAccessTab(newTab)) {
      console.log('User cannot access tab:', newTab);
      if (hasRole('member')) {
        navigate('/dashboard');
      }
      return;
    }
    
    setActiveTab(newTab);
  }, [location.pathname, canAccessTab, navigate, hasRole, userRole]);

  useEffect(() => {
    let mounted = true;
    console.log('ProtectedRoutes mounted, session:', !!session);

    const checkAuth = async () => {
      try {
        if (!session) {
          console.log('No session, redirecting to login');
          navigate('/login', { replace: true });
          return;
        }

        if (mounted) {
          // Pass the session user ID to syncRoles
          await syncRoles(session.user.id, true);
          setIsAuthChecking(false);
          setIsInitialLoad(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          setIsAuthChecking(false);
          setIsInitialLoad(false);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      console.log('Auth state change in protected routes:', {
        event,
        hasSession: !!currentSession,
        userRole
      });
      
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !currentSession)) {
        console.log('User signed out or token refresh failed, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, session, syncRoles, userRole]);

  // Only show loading during initial auth check
  if (isAuthChecking || (isInitialLoad && roleLoading)) {
    console.log('Showing loading state:', {
      isInitialLoad,
      roleLoading,
      hasSession: !!session,
      isAuthChecking
    });
    return (
      <div className="flex items-center justify-center min-h-screen bg-dashboard-dark">
        <Loader2 className="w-8 h-8 animate-spin text-dashboard-accent1" />
      </div>
    );
  }

  if (!session) {
    console.log('No session in ProtectedRoutes, redirecting to login');
    navigate('/login', { replace: true });
    return null;
  }

  const handleTabChange = (tab: string) => {
    console.log('Tab change requested:', {
      currentTab: activeTab,
      newTab: tab,
      canAccess: canAccessTab(tab),
      userRole
    });

    if (!canAccessTab(tab)) {
      console.log('Access denied to tab:', tab);
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this section.",
        variant: "destructive",
      });
      return;
    }

    const path = tab === 'dashboard' ? '/' : `/${tab}`;
    navigate(path);
    setActiveTab(tab);
  };

  return (
    <MainLayout
      activeTab={activeTab}
      isSidebarOpen={isSidebarOpen}
      onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      onTabChange={handleTabChange}
    >
      <Outlet />
    </MainLayout>
  );
};

export default ProtectedRoutes;