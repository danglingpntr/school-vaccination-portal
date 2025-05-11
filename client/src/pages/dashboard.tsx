import { useQuery } from "@tanstack/react-query";
import { Users, Syringe, Calendar, AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import type { DashboardStats, GradeProgress, VaccinationDrive, ActivityLog } from "@/types";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [, setLocation] = useLocation();

  // Fetch dashboard stats
  const { 
    data: stats, 
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/dashboard/stats', { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      return response.json();
    },
  });
  
  // Fetch vaccination progress by grade
  const {
    data: progressData,
    isLoading: isLoadingProgress,
    error: progressError
  } = useQuery<GradeProgress[]>({
    queryKey: ["/api/dashboard/vaccination-progress"],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/dashboard/vaccination-progress', { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vaccination progress');
      }
      
      return response.json();
    },
  });
  
  // Fetch upcoming vaccination drives
  const {
    data: drivesData,
    isLoading: isLoadingDrives,
    error: drivesError
  } = useQuery<VaccinationDrive[]>({
    queryKey: ["/api/dashboard/upcoming-drives"],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/dashboard/upcoming-drives', { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming drives');
      }
      
      return response.json();
    },
  });
  
  // Fetch activity logs
  const {
    data: logsData,
    isLoading: isLoadingLogs,
    error: logsError
  } = useQuery<ActivityLog[]>({
    queryKey: ["/api/dashboard/activity-logs"],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/dashboard/activity-logs', { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      
      return response.json();
    },
  });
  
  // Calculate overall vaccination percentage
  const [overallPercentage, setOverallPercentage] = useState(0);
  
  useEffect(() => {
    if (stats && stats.totalStudents > 0) {
      setOverallPercentage(Math.round((stats.vaccinated / stats.totalStudents) * 100));
    }
  }, [stats]);
  
  const getProgressColorClass = (percentage: number) => {
    if (percentage >= 90) return "bg-green-600";
    if (percentage >= 70) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  if (isLoadingStats || isLoadingProgress || isLoadingDrives || isLoadingLogs) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }
  
  if (statsError || progressError || drivesError || logsError) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-700 mb-2">Error Loading Dashboard</h3>
        <p className="text-red-600 mb-4">
          There was an error loading the dashboard data. Please try again later.
        </p>
        <button 
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome to the School Vaccination Management System</p>
      </header>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-gray-500 text-sm uppercase font-medium mb-2">Total Students</h2>
              <p className="text-4xl font-bold text-gray-800">{stats?.totalStudents || 0}</p>
            </div>
            <Users className="h-10 w-10 text-blue-500 bg-blue-50 rounded-full p-2" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-gray-500 text-sm uppercase font-medium mb-2">Vaccinated</h2>
              <p className="text-4xl font-bold text-gray-800">{stats?.vaccinated || 0}</p>
              {stats && stats.totalStudents > 0 && (
                <p className="text-sm text-green-600">{overallPercentage}% of students</p>
              )}
            </div>
            <Syringe className="h-10 w-10 text-green-500 bg-green-50 rounded-full p-2" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-gray-500 text-sm uppercase font-medium mb-2">Upcoming Drives</h2>
              <p className="text-4xl font-bold text-gray-800">{stats?.upcomingDrives || 0}</p>
              {drivesData && drivesData.length > 0 && (
                <p className="text-sm">
                  Next: {formatDate(drivesData[0].driveDate, 'MMM d, yyyy')}
                </p>
              )}
            </div>
            <Calendar className="h-10 w-10 text-orange-500 bg-orange-50 rounded-full p-2" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-gray-500 text-sm uppercase font-medium mb-2">Pending</h2>
              <p className="text-4xl font-bold text-gray-800">{stats?.pending || 0}</p>
              {stats && stats.totalStudents > 0 && (
                <p className="text-sm text-red-600">
                  {100 - overallPercentage}% of students
                </p>
              )}
            </div>
            <AlertTriangle className="h-10 w-10 text-red-500 bg-red-50 rounded-full p-2" />
          </div>
        </div>
      </div>
      
      {/* Progress by Grade */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Vaccination Progress by Grade</h2>
        {progressData && progressData.length > 0 ? (
          <div className="space-y-4">
            {progressData.map(grade => (
              <div key={grade.grade}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Grade {grade.grade}</span>
                  <span className="text-sm font-medium">{grade.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`${getProgressColorClass(grade.percentage)} h-2.5 rounded-full`} 
                    style={{ width: `${grade.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No grade progress data available</p>
        )}
      </div>
      
      {/* Upcoming Drives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Upcoming Vaccination Drives</h2>
          {drivesData && drivesData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccine</th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grades</th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drivesData.map(drive => (
                    <tr 
                      key={drive.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setLocation(`/vaccination-drives?id=${drive.id}`)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">{drive.vaccineName}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {formatDate(drive.driveDate, 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{drive.applicableGrades}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          drive.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          drive.status === 'completed' ? 'bg-green-100 text-green-800' :
                          drive.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No upcoming vaccination drives</p>
          )}
        </div>
        
        {/* Activity Logs */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          {logsData && logsData.length > 0 ? (
            <div className="space-y-3">
              {logsData.map(log => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="text-xs text-gray-500">{log.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(log.timestamp, 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}