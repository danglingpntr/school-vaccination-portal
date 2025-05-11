import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityLog } from "@/types";
import { formatTimeAgo } from "@/lib/utils";
import {
  UserPlus,
  Syringe,
  CalendarPlus,
  AlertTriangle,
} from "lucide-react";

interface RecentActivityProps {
  activities: ActivityLog[];
  isLoading: boolean;
}

export default function RecentActivity({
  activities,
  isLoading,
}: RecentActivityProps) {
  // Function to get icon and background color based on activity action
  const getActivityIcon = (action: string): { icon: React.ReactNode; bgColor: string } => {
    switch (action) {
      case "CREATE_STUDENT":
      case "IMPORT_STUDENTS":
      case "UPDATE_STUDENT":
        return {
          icon: <UserPlus className="text-primary-600" />,
          bgColor: "bg-primary-100",
        };
      case "CREATE_VACCINATION_RECORD":
      case "DELETE_VACCINATION_RECORD":
        return {
          icon: <Syringe className="text-success-600" />,
          bgColor: "bg-success-100",
        };
      case "CREATE_VACCINATION_DRIVE":
      case "UPDATE_VACCINATION_DRIVE":
        return {
          icon: <CalendarPlus className="text-warning-600" />,
          bgColor: "bg-warning-100",
        };
      default:
        return {
          icon: <AlertTriangle className="text-danger-600" />,
          bgColor: "bg-danger-100",
        };
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold font-heading text-gray-800">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            No recent activity to display
          </p>
        ) : (
          <ul className="space-y-4">
            {activities.map((activity) => {
              const { icon, bgColor } = getActivityIcon(activity.action);
              return (
                <li key={activity.id} className="flex items-start space-x-3">
                  <div className={`${bgColor} p-2 rounded-full`}>{icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTimeAgo(activity.timestamp)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
