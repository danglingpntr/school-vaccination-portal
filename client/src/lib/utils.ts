import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, formatDistance } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatString: string = "PPP"): string {
  if (!date) return "N/A";
  return format(new Date(date), formatString);
}

export function formatDateToNow(date: string | Date): string {
  if (!date) return "N/A";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (error) {
    return "Invalid date";
  }
}

export function formatTimeAgo(date: string | Date): string {
  if (!date) return "N/A";
  const now = new Date();
  const targetDate = new Date(date);
  return formatDistance(targetDate, now, { addSuffix: true });
}

export function generateGradesFromRange(gradeRange: string): string[] {
  if (!gradeRange) return [];
  
  // Handle "All Grades" case
  if (gradeRange.toLowerCase() === "all grades") {
    return Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);
  }
  
  // Parse ranges like "Grades 5-7"
  const match = gradeRange.match(/Grades? (\d+)-(\d+)/i);
  if (match) {
    const start = parseInt(match[1]);
    const end = parseInt(match[2]);
    return Array.from({ length: end - start + 1 }, (_, i) => `Grade ${start + i}`);
  }
  
  // Handle single grade like "Grade 5"
  const singleMatch = gradeRange.match(/Grade (\d+)/i);
  if (singleMatch) {
    return [`Grade ${singleMatch[1]}`];
  }
  
  // If no pattern matches, return the original string as a single item
  return [gradeRange];
}

export function getVaccinationStatusColor(status: string): { bg: string; text: string } {
  switch (status.toLowerCase()) {
    case "fully vaccinated":
      return { bg: "bg-success-100", text: "text-success-800" };
    case "partially vaccinated":
      return { bg: "bg-warning-100", text: "text-warning-800" };
    case "not vaccinated":
      return { bg: "bg-danger-100", text: "text-danger-800" };
    case "scheduled":
      return { bg: "bg-primary-100", text: "text-primary-800" };
    case "completed":
      return { bg: "bg-success-100", text: "text-success-800" };
    case "cancelled":
      return { bg: "bg-danger-100", text: "text-danger-800" };
    case "planning":
      return { bg: "bg-gray-100", text: "text-gray-800" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-700" };
  }
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function generateStudentInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function generateGradeOptions(): { value: string; label: string }[] {
  const options = [{ value: "All Grades", label: "All Grades" }];
  
  // Add "Grade 1" through "Grade 12"
  for (let i = 1; i <= 12; i++) {
    options.push({ value: `${i}`, label: `${i}` });
  }
  
  return options;
}

export function generateVaccinationStatusOptions(): { value: string; label: string }[] {
  return [
    { value: "All Status", label: "All Status" },
    { value: "Fully Vaccinated", label: "Fully Vaccinated" },
    { value: "Partially Vaccinated", label: "Partially Vaccinated" },
    { value: "Not Vaccinated", label: "Not Vaccinated" },
  ];
}

export function generateDriveStatusOptions(): { value: string; label: string }[] {
  return [
    { value: "All Status", label: "All Status" },
    { value: "scheduled", label: "Scheduled" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "planning", label: "Planning" },
  ];
}
