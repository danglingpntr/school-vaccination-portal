import { cn } from "@/lib/utils";
import {
  Users,
  Syringe,
  Calendar,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Info,
  Clock,
} from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: "users" | "syringe" | "calendar" | "alert-triangle";
  color: "primary" | "success" | "warning" | "danger";
  info?: string;
  trend?: "up" | "down";
}

export default function StatsCard({
  title,
  value,
  icon,
  color,
  info,
  trend,
}: StatsCardProps) {
  // Define color classes based on color prop
  const colorClasses = {
    primary: {
      border: "border-primary-500",
      bg: "bg-primary-100",
      text: "text-primary-500",
      trend: "text-primary-500",
    },
    success: {
      border: "border-success-500",
      bg: "bg-success-100",
      text: "text-success-500",
      trend: "text-success-500",
    },
    warning: {
      border: "border-warning-500",
      bg: "bg-warning-100",
      text: "text-warning-500",
      trend: "text-warning-500",
    },
    danger: {
      border: "border-danger-500",
      bg: "bg-danger-100",
      text: "text-danger-500",
      trend: "text-danger-500",
    },
  };

  // Get the appropriate icon component
  const IconComponent = {
    users: Users,
    syringe: Syringe,
    calendar: Calendar,
    "alert-triangle": AlertTriangle,
  }[icon];

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm p-4 border-l-4",
        colorClasses[color].border
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={cn("p-2 rounded-lg", colorClasses[color].bg)}>
          <IconComponent className={cn("text-xl", colorClasses[color].text)} />
        </div>
      </div>
      {info && (
        <div
          className={cn(
            "mt-2 text-xs font-medium flex items-center",
            trend
              ? colorClasses[color].trend
              : "text-gray-500"
          )}
        >
          {trend ? (
            trend === "up" ? (
              <ArrowUp className="mr-1 h-3 w-3" />
            ) : (
              <ArrowDown className="mr-1 h-3 w-3" />
            )
          ) : info.includes("Next:") ? (
            <Clock className="mr-1 h-3 w-3" />
          ) : (
            <Info className="mr-1 h-3 w-3" />
          )}
          <span>{info}</span>
        </div>
      )}
    </div>
  );
}
