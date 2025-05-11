import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { VaccinationDrive } from "@/types";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, getVaccinationStatusColor } from "@/lib/utils";
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
import DriveDetailsDialog from "./drive-details-dialog";
import EditDriveDialog from "./edit-drive-dialog";

interface DrivesTableProps {
  drives: VaccinationDrive[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onRefetch: () => void;
}

export default function DrivesTable({
  drives,
  total,
  page,
  limit,
  isLoading,
  onPageChange,
  onRefetch,
}: DrivesTableProps) {
  const { toast } = useToast();
  const [selectedDrive, setSelectedDrive] = useState<VaccinationDrive | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(startIndex + limit - 1, total);

  // Delete drive mutation
  const deleteDriveMutation = useMutation({
    mutationFn: async (driveId: number) => {
      await apiRequest("DELETE", `/api/vaccination-drives/${driveId}`);
    },
    onSuccess: () => {
      toast({
        title: "Drive deleted",
        description: "The vaccination drive has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vaccination-drives"] });
      setIsDeleteDialogOpen(false);
      onRefetch();
    },
    onError: (error) => {
      toast({
        title: "Failed to delete drive",
        description: error.message || "There was an error deleting the drive",
        variant: "destructive",
      });
    },
  });

  const confirmDelete = (drive: VaccinationDrive) => {
    setSelectedDrive(drive);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedDrive) {
      deleteDriveMutation.mutate(selectedDrive.id);
    }
  };

  const openDetailsDialog = (drive: VaccinationDrive) => {
    setSelectedDrive(drive);
    setIsDetailsDialogOpen(true);
  };

  const openEditDialog = (drive: VaccinationDrive) => {
    setSelectedDrive(drive);
    setIsEditDialogOpen(true);
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

  // Check if a drive is in the past
  const isDrivePast = (driveDate: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(driveDate);
    return date < today;
  };

  // Check if a drive can be edited (not in the past and not cancelled)
  const canEditDrive = (drive: VaccinationDrive): boolean => {
    return !isDrivePast(drive.driveDate) && drive.status !== "completed";
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Drive ID
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vaccine
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grades
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doses
              </th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
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
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </td>
                  </tr>
                ))
            ) : drives.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  No vaccination drives found. Schedule a new drive or adjust your search filters.
                </td>
              </tr>
            ) : (
              drives.map((drive) => {
                const statusColor = getVaccinationStatusColor(drive.status);
                const isPast = isDrivePast(drive.driveDate);
                const canEdit = canEditDrive(drive);
                
                return (
                  <tr key={drive.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {drive.driveId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {drive.vaccineName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(drive.driveDate, "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {drive.applicableGrades}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span>
                        {drive.status === 'completed' 
                          ? `${drive.usedDoses}/${drive.availableDoses} Used` 
                          : `${drive.availableDoses - drive.usedDoses} Available`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor.bg} ${statusColor.text}`}
                      >
                        {drive.status.charAt(0).toUpperCase() + drive.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary-600 hover:text-primary-900 mr-2"
                        onClick={() => openDetailsDialog(drive)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {isPast ? "View Report" : "Manage"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`${
                          canEdit 
                            ? "text-gray-600 hover:text-gray-900" 
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                        onClick={() => canEdit && openEditDialog(drive)}
                        disabled={!canEdit}
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
                <span className="font-medium">{total}</span> drives
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
              Are you sure you want to delete the vaccination drive for{" "}
              {selectedDrive?.vaccineName} scheduled on{" "}
              {selectedDrive?.driveDate
                ? formatDate(selectedDrive.driveDate, "MMMM d, yyyy")
                : ""}
              ? This action cannot be undone.
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

      {/* Drive Details Dialog */}
      {selectedDrive && (
        <DriveDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
          drive={selectedDrive}
          onRefetch={onRefetch}
        />
      )}

      {/* Edit Drive Dialog */}
      {selectedDrive && (
        <EditDriveDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          drive={selectedDrive}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            onRefetch();
          }}
        />
      )}
    </>
  );
}


