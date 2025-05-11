import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { Student, VaccinationDrive } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface VaccinationRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drive: VaccinationDrive;
  refreshDrives: () => void;
}

export default function VaccinationRecordDialog({
  open,
  onOpenChange,
  drive,
  refreshDrives,
}: VaccinationRecordDialogProps) {
  const { toast } = useToast();
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  // Split applicable grades into array
  const applicableGrades = drive?.applicableGrades?.split(',').map(grade => grade.trim()) || [];

  // Fetch students in applicable grades
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/students', drive?.id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/students', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      
      return response.json();
    },
    enabled: open && !!drive,
  });

  // Fetch existing vaccination records for this drive
  const { data: recordsData, isLoading: isLoadingRecords, refetch: refetchRecords } = useQuery({
    queryKey: ['/api/vaccination-records', drive?.id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/vaccination-records?driveId=${drive.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vaccination records');
      }
      
      return response.json();
    },
    enabled: open && !!drive,
  });

  // Filter students by applicable grades
  const eligibleStudents = studentsData?.students?.filter((student: Student) => 
    applicableGrades.includes(student.grade)
  ) || [];

  // Create vaccination record mutation
  const createRecordMutation = useMutation({
    mutationFn: async (data: { studentId: number; driveId: number }) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/vaccination-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          vaccinationDate: new Date().toISOString().split('T')[0], // Today's date
          notes: `Vaccination administered: ${drive.vaccineName}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create vaccination record');
      }

      return response.json();
    },
    onSuccess: () => {
      refetchRecords();
      refreshDrives();
    },
    onError: (error) => {
      console.error('Error creating vaccination record:', error);
      toast({
        title: "Error",
        description: `Failed to record vaccination: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Reset selected students when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedStudents([]);
    }
  }, [open]);

  // Check if a student is already vaccinated
  const isStudentVaccinated = (studentId: number) => {
    return recordsData?.some((record: any) => record.studentId === studentId);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one student to vaccinate.",
        variant: "destructive",
      });
      return;
    }

    // Check if we have enough doses
    const remainingDoses = drive.availableDoses - drive.usedDoses;
    if (selectedStudents.length > remainingDoses) {
      toast({
        title: "Validation Error",
        description: `Not enough doses available. You selected ${selectedStudents.length} students but only have ${remainingDoses} doses remaining.`,
        variant: "destructive",
      });
      return;
    }

    // Create vaccination records for each selected student
    for (const studentId of selectedStudents) {
      await createRecordMutation.mutate({ studentId, driveId: drive.id });
    }

    toast({
      title: "Success",
      description: `Vaccination records created for ${selectedStudents.length} students.`,
      variant: "default",
    });

    onOpenChange(false);
  };

  // Toggle student selection
  const toggleStudent = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Record Vaccinations</DialogTitle>
          <DialogDescription>
            {drive?.vaccineName} - {format(new Date(drive?.driveDate), "PPP")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-semibold">Available Doses</h4>
              <p className="text-sm text-muted-foreground">
                {drive.availableDoses - drive.usedDoses} remaining of {drive.availableDoses} total
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold">For Grades</h4>
              <div className="flex gap-1 mt-1">
                {applicableGrades.map((grade) => (
                  <Badge key={grade} variant="outline">
                    {grade}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-semibold mb-2">Select Students to Vaccinate</h4>
            {(isLoadingStudents || isLoadingRecords) ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : eligibleStudents.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                No eligible students found for the selected grades.
              </p>
            ) : (
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-4">
                  {eligibleStudents.map((student: Student) => {
                    const isVaccinated = isStudentVaccinated(student.id);
                    return (
                      <div key={student.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`student-${student.id}`} 
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleStudent(student.id)}
                          disabled={isVaccinated}
                        />
                        <Label 
                          htmlFor={`student-${student.id}`}
                          className={`flex-1 ${isVaccinated ? 'text-muted-foreground line-through' : ''}`}
                        >
                          <div className="flex justify-between">
                            <span>{student.firstName} {student.lastName} ({student.studentId})</span>
                            {isVaccinated && (
                              <Badge variant="outline" className="ml-2 text-green-500">
                                <Check className="h-3 w-3 mr-1" /> Vaccinated
                              </Badge>
                            )}
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={
              isLoadingStudents || 
              isLoadingRecords || 
              selectedStudents.length === 0 ||
              createRecordMutation.isPending
            }
          >
            {createRecordMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Record Vaccinations'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}