import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import ReportsPage from "@/pages/reports";
import StudentsPage from "@/pages/students";
import VaccinationDrivesPage from "@/pages/vaccination-drives";
import DashboardPage from "@/pages/dashboard";
import { useEffect } from "react";
import { Users, Syringe, Calendar, BarChart3, UserCircle2, LogOut, FileText } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

// Dashboard Layout with Sidebar
function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-blue-600">Vaccination Portal</h2>
        </div>
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <UserCircle2 className="h-8 w-8 text-blue-500" />
            <div>
              <p className="font-medium">{user?.name || "Administrator"}</p>
              <p className="text-sm text-gray-500">{user?.role || "Admin"}</p>
            </div>
          </div>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <div className="flex items-center">
                <Link href="/dashboard" className="flex items-center space-x-2 p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors w-full">
                  <BarChart3 className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <Link href="/students" className="flex items-center space-x-2 p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors w-full">
                  <Users className="h-5 w-5" />
                  <span>Students</span>
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <Link href="/vaccination-drives" className="flex items-center space-x-2 p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors w-full">
                  <Calendar className="h-5 w-5" />
                  <span>Vaccination Drives</span>
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <Link href="/reports" className="flex items-center space-x-2 p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors w-full">
                  <FileText className="h-5 w-5" />
                  <span>Reports</span>
                </Link>
              </div>
            </li>
            <li className="pt-6">
              <button 
                onClick={logout}
                className="flex items-center space-x-2 p-2 w-full text-left rounded-md text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}

// Protected Route
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : null;
}

// App Component with Auth Provider and Routing
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Switch>
            <Route path="/dashboard">
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/students">
              <ProtectedRoute>
                <DashboardLayout>
                  <StudentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/vaccination-drives">
              <ProtectedRoute>
                <DashboardLayout>
                  <VaccinationDrivesPage />
                </DashboardLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/reports">
              <ProtectedRoute>
                <DashboardLayout>
                  <ReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/">
              <LoginPage />
            </Route>
            
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
