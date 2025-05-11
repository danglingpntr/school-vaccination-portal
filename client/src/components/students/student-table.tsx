import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Student } from "@/types";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { generateStudentInitials, formatDate, getVaccinationStatusColor } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Pencil } from "lucide-react";

interface StudentTableProps {
  students: Student[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onRefetch: () => void;
}

export default function StudentTable({
  students,
  total,
  page,
  limit,
  isLoading,
  onPageChange,
  onRefetch,
}: StudentTableProps) {
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(startIndex + limit - 1, total);

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      await apiRequest("DELETE", `/api/students/${studentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Student deleted",
        description: "The student record has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsDeleteDialogOpen(false);
      onRefetch();
    },
    onError: (error) => {
      toast({
        title: "Failed to delete student",
        description: error.message || "There was an error deleting the student",
        variant: "destructive",
      });
    },
  });

  const confirmDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedStudent) {
      deleteStudentMutation.mutate(selectedStudent.id);
    }
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are fewer than maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Always show first page
      items.push(1);

      // Calculate range around current page
      let startPage = Math.max(2, page - 1);
      let endPage = Math.min(totalPages - 1, page + 1);

      // Adjust if we're at the start
      if (page <= 2) {
        endPage = 4;
      }

      // Adjust if we're at the end
      if (page >= totalPages - 1) {
        startPage = totalPages - 3;
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        items.push("ellipsis1");
      }

      // Add pages in the middle
      for (let i = startPage; i <= endPage; i++) {
        items.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        items.push("ellipsis2");
      }

      // Always show last page
      if (totalPages > 1) {
        items.push(totalPages);
      }
    }

    return items;
  };

  // Function to determine vaccination status based on student info
  // Note: This is a placeholder and should be replaced with actual logic
  // based on your application's rules for determining vaccination status
  const getVaccinationStatus = (student: Student): string => {
    // In a real app, this would be determined by checking vaccination records
    // For demo purposes, use a random status
    const statuses = ["Fully Vaccinated", "Partially Vaccinated", "Not Vaccinated"];
    const pseudoRandomIndex = (student.id % 3);
    return statuses[pseudoRandomIndex];
  };

  // Function to get the last vaccine for a student
  // Note: This is a placeholder and should be replaced with actual logic
  const getLastVaccine = (student: Student): string => {
    // In a real app, this would be determined by checking vaccination records
    if (student.id % 3 === 0) {
      return "None";
    }
    const vaccines = ["MMR", "Hepatitis B", "Polio", "DTaP"];
    const dates = ["Sep 5, 2023", "Aug 12, 2023", "Jul 23, 2023"];
    const vaccineIndex = student.id % vaccines.length;
    const dateIndex = student.id % dates.length;
    return `${vaccines[vaccineIndex]} (${dates[dateIndex]})`;
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student ID
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vaccination Status
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Vaccine
              </th>
              <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              Array(limit)
                .fill(0)
                .map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="ml-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32 mt-1" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </td>
                  </tr>
                ))
            ) : students.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  No students found. Add students or adjust your search filters.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const status = getVaccinationStatus(student);
                const statusColor = getVaccinationStatusColor(status);
                return (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-medium">
                            {generateStudentInitials(student.firstName, student.lastName)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.email || "No email provided"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor.bg} ${statusColor.text}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getLastVaccine(student)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary-600 hover:text-primary-900 mr-2"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages || isLoading}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex}</span> to{" "}
                <span className="font-medium">{endIndex}</span> of{" "}
                <span className="font-medium">{total}</span> students
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <Button
                  variant="outline"
                  size="icon"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 1 || isLoading}
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
                {getPaginationItems().map((item, index) => {
                  if (item === "ellipsis1" || item === "ellipsis2") {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  return (
                    <Button
                      key={`page-${item}`}
                      variant="outline"
                      size="icon"
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        page === item
                          ? "bg-primary-50 text-primary-600 border-primary-500 z-10"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => onPageChange(item as number)}
                      disabled={isLoading}
                    >
                      {item}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page === totalPages || isLoading}
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedStudent?.firstName}{" "}
              {selectedStudent?.lastName}'s record? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
