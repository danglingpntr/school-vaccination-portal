import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  LogOut,
  Menu,
  Syringe,
} from "lucide-react";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="mr-3 text-lg" />,
    },
    {
      href: "/students",
      label: "Students",
      icon: <Users className="mr-3 text-lg" />,
    },
    {
      href: "/vaccination-drives",
      label: "Vaccination Drives",
      icon: <Calendar className="mr-3 text-lg" />,
    },
    {
      href: "/reports",
      label: "Reports",
      icon: <FileText className="mr-3 text-lg" />,
    },
  ];

  return (
    <aside className="bg-primary-700 text-white w-full md:w-64 md:min-h-screen md:flex-shrink-0">
      <div className="p-4 flex items-center justify-between md:justify-center border-b border-primary-600">
        <div className="flex items-center space-x-2">
          <Syringe className="text-2xl" />
          <h1 className="text-xl font-bold font-heading">Vax Portal</h1>
        </div>
        <Button
          variant="ghost"
          className="md:hidden text-white hover:bg-primary-600 focus:outline-none"
          onClick={toggleMobileMenu}
        >
          <Menu className="text-2xl" />
        </Button>
      </div>

      <nav className={cn("md:block", isMobileMenuOpen ? "block" : "hidden")}>
        <div className="px-2 py-4">
          <div className="flex items-center space-x-2 px-4 py-2 mb-4">
            <Avatar>
              <AvatarFallback className="bg-primary-600 text-white">
                {user?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.name || "User"}</p>
              <p className="text-xs text-primary-200">
                {user?.role === "admin"
                  ? "School Administrator"
                  : "School Coordinator"}
              </p>
            </div>
          </div>

          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={closeMobileMenu}>
                  <a
                    className={cn(
                      "flex items-center px-4 py-2 text-primary-100 rounded hover:bg-primary-600 transition-colors",
                      isActive(item.href) && "bg-primary-800"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto hidden md:block p-4 border-t border-primary-600">
          <Button
            variant="ghost"
            className="flex items-center text-primary-100 hover:text-white hover:bg-primary-600 w-full justify-start"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>

        <div className="block md:hidden p-4 border-t border-primary-600">
          <Button
            variant="ghost"
            className="flex items-center text-primary-100 hover:text-white hover:bg-primary-600 w-full justify-start"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </nav>
    </aside>
  );
}
