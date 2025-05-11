import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VaccinationDrive } from "@/types";
import { formatDate, formatTimeAgo, getVaccinationStatusColor } from "@/lib/utils";
import { ArrowRight, Plus } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface UpcomingDrivesProps {
  drives: VaccinationDrive[];
  isLoading: boolean;
}

export default function UpcomingDrives({ drives, isLoading }: UpcomingDrivesProps) {
  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold font-heading text-gray-800">
            Upcoming Vaccination Drives
          </CardTitle>
          <Button
            variant="link"
            className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center p-0"
            asChild
          >
            <Link href="/vaccination-drives">
              <span>View All</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 py-0">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
            </div>
          ) : drives.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-gray-500 mb-4">No upcoming vaccination drives scheduled</p>
              <Button
                variant="outline"
                className="text-primary-600 hover:text-primary-800"
                asChild
              >
                <Link href="/vaccination-drives">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule New Drive
                </Link>
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vaccine
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grades
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doses
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drives.map((drive) => {
                  const statusColor = getVaccinationStatusColor(drive.status);
                  return (
                    <tr key={drive.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {drive.vaccineName}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(drive.driveDate, "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTimeAgo(drive.driveDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {drive.applicableGrades}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {drive.availableDoses - drive.usedDoses} Available
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}
                        >
                          {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <Button
          variant="link"
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800 font-medium p-0"
          asChild
        >
          <Link href="/vaccination-drives?action=new">
            <Plus className="mr-1 h-4 w-4" />
            Schedule New Drive
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
