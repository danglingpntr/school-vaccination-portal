import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GradeProgress } from "@/types";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

interface VaccinationProgressProps {
  progress: GradeProgress[];
  overallPercentage: number;
  isLoading: boolean;
}

export default function VaccinationProgress({
  progress,
  overallPercentage,
  isLoading,
}: VaccinationProgressProps) {
  // Function to determine progress bar color based on percentage
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 75) return "bg-success-500";
    if (percentage >= 50) return "bg-primary-500";
    if (percentage >= 25) return "bg-warning-500";
    return "bg-danger-500";
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-semibold font-heading text-gray-800">
          Vaccination Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {isLoading ? (
          <>
            <div className="text-center mb-4">
              <Skeleton className="w-32 h-32 rounded-full mx-auto" />
              <Skeleton className="h-4 w-40 mt-2 mx-auto" />
            </div>
            <div>
              <Skeleton className="h-4 w-40 mb-2" />
              <div className="space-y-4">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="inline-block relative">
                {/* Circle chart showing vaccination progress */}
                <svg className="w-32 h-32" viewBox="0 0 36 36">
                  <path
                    className="stroke-current text-gray-200"
                    strokeWidth="3.8"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="stroke-current text-primary-500"
                    strokeWidth="3.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${overallPercentage}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text
                    x="18"
                    y="21"
                    className="text-3xl font-semibold"
                    textAnchor="middle"
                    fill="#2563EB"
                  >
                    {overallPercentage}%
                  </text>
                </svg>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Overall Vaccination Rate
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                By Grade Level
              </h3>
              <div className="space-y-4">
                {progress.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">
                    No data available
                  </p>
                ) : (
                  progress.map((grade, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {grade.grade}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {grade.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${getProgressColor(
                            grade.percentage
                          )} h-2 rounded-full`}
                          style={{ width: `${grade.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <Button
          variant="link"
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800 font-medium p-0"
          asChild
        >
          <Link href="/reports">
            <span>View Detailed Reports</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
