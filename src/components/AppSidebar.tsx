import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import adsLogo from "@/assets/ads-logo.png";
import {
  LayoutDashboard,
  Users,
  FileText,
  Truck,
  AlertCircle,
  Tag,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: FileText },
  { title: "Buyers", url: "/buyers", icon: Users },
  { title: "Deliveries", url: "/deliveries", icon: Truck },
  { title: "Refunds", url: "/refunds", icon: AlertCircle },
  { title: "Campaigns", url: "/campaigns", icon: Tag },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-3 px-4 py-6 border-b">
            <img src={adsLogo} alt="ADS Logo" className="h-12 w-12" />
            <div>
              <h2 className="text-xl font-bold text-primary">ADS</h2>
              <p className="text-xs text-muted-foreground">RouteHub</p>
            </div>
          </div>
          <SidebarGroupLabel className="text-base font-semibold px-4 py-3 mt-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="mt-auto p-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-2">Logout</span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}