import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import VaccinationRecordDialog from "@/components/drives/vaccination-record-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { VaccinationDrive } from "@/types";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Calendar,
  CalendarPlus,
  Filter,
  MoreHorizontal,
  Syringe,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  CircleCheck,
  Edit,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

// We'll use actual data from the database instead of mock data

// Vaccine options for form
const VACCINES = [
  { value: "MMR Vaccine", label: "MMR Vaccine" },
  { value: "Tdap Booster", label: "Tdap Booster" },
  { value: "Influenza", label: "Influenza" },
  { value: "Hepatitis B", label: "Hepatitis B" },
  { value: "Chickenpox", label: "Chickenpox" },
  { value: "Polio Booster", label: "Polio Booster" },
];

// Grade options for form
const GRADES = [
  { value: "1", label: "Grade 1" },
  { value: "2", label: "Grade 2" },
  { value: "3", label: "Grade 3" },
  { value: "4", label: "Grade 4" },
  { value: "5", label: "Grade 5" },
  { value: "6", label: "Grade 6" },
  { value: "7", label: "Grade 7" },
  { value: "8", label: "Grade 8" },
  { value: "9", label: "Grade 9" },
  { value: "10", label: "Grade 10" },
  { value: "11", label: "Grade 11" },
  { value: "12", label: "Grade 12" },
];

export default function VaccinationDrivesPage() {
  // State for the new drive form
  const [newDrive, setNewDrive] = useState({
    vaccineName: "",
    driveDate: "",
    availableDoses: "",
    notes: "",
  });
  
  // State for selected grades
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  
  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isVaccinateDialogOpen, setIsVaccinateDialogOpen] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<any>(null);
  const [editDrive, setEditDrive] = useState<{
    driveDate: string;
    availableDoses: string;
    notes: string;
  }>({
    driveDate: "",
    availableDoses: "",
    notes: "",
  });
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vaccineFilter, setVaccineFilter] = useState("all");
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Initialize toast
  const { toast } = useToast();
  
  // Fetch vaccination drives from API
  const { data: drivesData, isLoading, refetch } = useQuery({
    queryKey: ['/api/vaccination-drives'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await fetch('/api/vaccination-drives', { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vaccination drives');
      }
      
      return response.json();
    },
    retry: false,
  });

  // Use the data from API
  const drives = drivesData?.drives || [];
  
  // Function to handle input changes in the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewDrive({ ...newDrive, [name]: value });
  };
  
  // Function to handle vaccine selection
  const handleVaccineChange = (value: string) => {
    setNewDrive({ ...newDrive, vaccineName: value });
  };
  
  // Function to handle grade selection
  const handleGradeToggle = (grade: string) => {
    setSelectedGrades(prev => 
      prev.includes(grade)
        ? prev.filter(g => g !== grade)
        : [...prev, grade]
    );
  };
  
  // Add new vaccination drive mutation
  const addDriveMutation = useMutation({
    mutationFn: async (newDriveData: any) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await fetch('/api/vaccination-drives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newDriveData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Vaccination drive error details:', errorData);
        throw new Error(`Failed to add vaccination drive: ${errorData.message || 'Unknown error'}`);
      }
      return response.json();
    },
    onSuccess: () => {
      // Reset form
      setNewDrive({
        vaccineName: "",
        driveDate: "",
        availableDoses: "",
        notes: "",
      });
      setSelectedGrades([]);
      // Close dialogs
      setIsAddDialogOpen(false);
      setIsSuccessDialogOpen(true);
      // Refetch data to update the list
      refetch();
    },
    onError: (error) => {
      console.error('Error adding vaccination drive:', error);
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to add vaccination drive. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update vaccination drive mutation
  const updateDriveMutation = useMutation({
    mutationFn: async (updateData: { 
      id: number; 
      driveDate: string; 
      availableDoses: number; 
      notes: string 
    }) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await fetch(`/api/vaccination-drives/${updateData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        throw new Error('Failed to update vaccination drive');
      }
      return response.json();
    },
    onSuccess: () => {
      // Close dialog
      setIsEditDialogOpen(false);
      // Show success toast
      toast({
        title: "Success",
        description: "Vaccination drive updated successfully.",
        variant: "default",
      });
      // Refetch data
      refetch();
    },
    onError: (error) => {
      console.error('Error updating vaccination drive:', error);
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to update vaccination drive. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (selectedGrades.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one applicable grade.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate required fields
    if (!newDrive.vaccineName || !newDrive.driveDate || !newDrive.availableDoses) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that driveDate is at least 15 days in the future (same as server validation)
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 15);
    
    const driveDate = new Date(newDrive.driveDate);
    if (driveDate < minDate) {
      toast({
        title: "Validation Error",
        description: "Vaccination drive must be scheduled at least 15 days in advance.",
        variant: "destructive",
      });
      return;
    }
    
    // Include all required fields from the schema
    const driveData = {
      vaccineName: newDrive.vaccineName,
      driveDate: newDrive.driveDate,
      applicableGrades: selectedGrades.join(','),
      availableDoses: parseInt(newDrive.availableDoses),
      status: "scheduled", // Set default status
      driveId: "" // Server will generate if empty
    };
    
    console.log("Submitting vaccination drive data:", driveData);
    
    // Use the mutation to add the drive
    addDriveMutation.mutate(driveData);
  };
  
  // Filter drives based on search and filters
  const filteredDrives = drives.filter((drive: VaccinationDrive) => {
    const matchesSearch = 
      drive.vaccineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drive.driveId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || drive.status === statusFilter;
    const matchesVaccine = vaccineFilter === "all" || drive.vaccineName === vaccineFilter;
    
    return matchesSearch && matchesStatus && matchesVaccine;
  });
  
  // Sort drives by date (most recent first)
  const sortedDrives = [...filteredDrives].sort((a, b) => 
    new Date(b.driveDate).getTime() - new Date(a.driveDate).getTime()
  );
  
  // Paginate results
  const totalPages = Math.ceil(sortedDrives.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedDrives.slice(indexOfFirstItem, indexOfLastItem);
  
  // Function to get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return { 
          icon: <CalendarDays className="h-4 w-4 mr-1" />,
          className: "bg-yellow-100 text-yellow-800" 
        };
      case "completed":
        return { 
          icon: <CheckCircle className="h-4 w-4 mr-1" />,
          className: "bg-green-100 text-green-800" 
        };
      case "planning":
        return { 
          icon: <AlertCircle className="h-4 w-4 mr-1" />,
          className: "bg-blue-100 text-blue-800" 
        };
      case "cancelled":
        return { 
          icon: <XCircle className="h-4 w-4 mr-1" />,
          className: "bg-red-100 text-red-800" 
        };
      default:
        return { 
          icon: null,
          className: "bg-gray-100 text-gray-800" 
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Vaccination Drives</h1>
          <p className="text-gray-600">Schedule and manage vaccination drives for your school</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <CalendarPlus className="h-4 w-4 mr-2" />
              Book New Drive
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Book a New Vaccination Drive</DialogTitle>
              <DialogDescription>
                Enter the details of the vaccination drive to be scheduled
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="vaccineName">Vaccine</Label>
                <Select
                  value={newDrive.vaccineName}
                  onValueChange={handleVaccineChange}
                  required
                >
                  <SelectTrigger id="vaccineName">
                    <SelectValue placeholder="Select vaccine" />
                  </SelectTrigger>
                  <SelectContent>
                    {VACCINES.map(vaccine => (
                      <SelectItem key={vaccine.value} value={vaccine.value}>
                        {vaccine.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="driveDate">Drive Date</Label>
                <Input
                  id="driveDate"
                  name="driveDate"
                  type="date"
                  value={newDrive.driveDate}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-sm text-gray-500">
                  Drive must be scheduled at least 2 weeks in advance
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Applicable Grades</Label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {GRADES.map(grade => (
                    <div key={grade.value} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`grade-${grade.value}`}
                        checked={selectedGrades.includes(grade.value)}
                        onCheckedChange={() => handleGradeToggle(grade.value)}
                      />
                      <label 
                        htmlFor={`grade-${grade.value}`}
                        className="text-sm"
                      >
                        {grade.label}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedGrades.length === 0 && (
                  <p className="text-xs text-red-500">
                    Please select at least one grade
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="availableDoses">Number of Available Doses</Label>
                <Input
                  id="availableDoses"
                  name="availableDoses"
                  type="number"
                  min="1"
                  value={newDrive.availableDoses}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Enter any additional information or instructions for this vaccination drive"
                  value={newDrive.notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={selectedGrades.length === 0}
                >
                  Book Drive
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        <AlertDialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center text-green-600">
                <CircleCheck className="h-6 w-6 mr-2" />
                Vaccination Drive Booked
              </AlertDialogTitle>
              <AlertDialogDescription>
                The vaccination drive has been successfully booked and is now awaiting approval from the health authorities. You will be notified once it is approved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>Okay</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter Vaccination Drives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search by vaccine name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={vaccineFilter} onValueChange={setVaccineFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Vaccine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vaccines</SelectItem>
                {VACCINES.map(vaccine => (
                  <SelectItem key={vaccine.value} value={vaccine.value}>
                    {vaccine.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4 text-right">
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setVaccineFilter("all");
              }}
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Drives List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Vaccination Drives</CardTitle>
          <CardDescription>
            {filteredDrives.length} drive{filteredDrives.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Drive ID</TableHead>
                  <TableHead>Vaccine</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Grades</TableHead>
                  <TableHead>Doses</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                        <span className="ml-2">Loading vaccination drives...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentItems.length > 0 ? (
                  currentItems.map((drive) => (
                    <TableRow 
                      key={drive.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedDrive(drive);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">{drive.driveId}</TableCell>
                      <TableCell>{drive.vaccineName}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(drive.driveDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{drive.applicableGrades}</TableCell>
                      <TableCell>
                        {drive.usedDoses}/{drive.availableDoses}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between">
                          <Badge
                            className={`flex items-center ${getStatusBadge(drive.status).className}`}
                            variant="outline"
                          >
                            {getStatusBadge(drive.status).icon}
                            <span className="capitalize">{drive.status}</span>
                          </Badge>
                          <div className="flex items-center">
                            {drive.status === "scheduled" && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 mr-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDrive(drive);
                                  setIsVaccinateDialogOpen(true);
                                }}
                              >
                                <Syringe className="h-3 w-3 mr-1" />
                                Record
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDrive(drive);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No vaccination drives found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {filteredDrives.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    
      {/* View Vaccination Drive Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        {selectedDrive && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                <Syringe className="h-5 w-5 mr-2" /> 
                {selectedDrive.driveId} - {selectedDrive.vaccineName}
              </DialogTitle>
              <DialogDescription>
                View vaccination drive details
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge
                      className={`${getStatusBadge(selectedDrive.status).className} mt-1`}
                      variant="outline"
                    >
                      {getStatusBadge(selectedDrive.status).icon}
                      <span className="capitalize ml-1">{selectedDrive.status}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Drive Date</Label>
                  <div className="font-medium mt-1 flex items-center">
                    <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
                    {new Date(selectedDrive.driveDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Applicable Grades</Label>
                <div className="font-medium mt-1">
                  {selectedDrive.applicableGrades}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Available Doses</Label>
                  <div className="font-medium mt-1">{selectedDrive.availableDoses}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Used Doses</Label>
                  <div className="font-medium mt-1">{selectedDrive.usedDoses}</div>
                </div>
              </div>
              
              {selectedDrive.notes && (
                <div>
                  <Label className="text-sm text-muted-foreground">Notes</Label>
                  <div className="mt-1 text-sm border rounded-md p-2 bg-gray-50">
                    {selectedDrive.notes}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex justify-between items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
              
              <div className="flex gap-2">
                {selectedDrive.status === "scheduled" && (
                  <Button
                    variant="default"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      setIsVaccinateDialogOpen(true);
                    }}
                  >
                    <Syringe className="h-4 w-4 mr-2" /> Record Vaccinations
                  </Button>
                )}
                
                {selectedDrive.status !== "completed" && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setEditDrive({
                        driveDate: selectedDrive.driveDate,
                        availableDoses: selectedDrive.availableDoses.toString(),
                        notes: selectedDrive.notes || ""
                      });
                      setIsViewDialogOpen(false);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" /> Edit Drive
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Edit Vaccination Drive Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {selectedDrive && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                <Edit className="h-5 w-5 mr-2" /> 
                Edit Vaccination Drive
              </DialogTitle>
              <DialogDescription>
                Update the details of vaccination drive {selectedDrive.driveId}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="edit-drive-date">Drive Date</Label>
                <Input
                  id="edit-drive-date"
                  type="date"
                  value={editDrive.driveDate}
                  onChange={(e) => setEditDrive({...editDrive, driveDate: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-available-doses">Available Doses</Label>
                <Input
                  id="edit-available-doses"
                  type="number"
                  min={selectedDrive.usedDoses}
                  value={editDrive.availableDoses}
                  onChange={(e) => setEditDrive({...editDrive, availableDoses: e.target.value})}
                  className="mt-1"
                />
                {parseInt(editDrive.availableDoses) < selectedDrive.usedDoses && (
                  <p className="text-xs text-red-500 mt-1">
                    Available doses cannot be less than already used doses ({selectedDrive.usedDoses})
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editDrive.notes}
                  onChange={(e) => setEditDrive({...editDrive, notes: e.target.value})}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={parseInt(editDrive.availableDoses) < selectedDrive.usedDoses}
                onClick={() => {
                  // Call the update API
                  updateDriveMutation.mutate({
                    id: selectedDrive.id,
                    driveDate: editDrive.driveDate,
                    availableDoses: parseInt(editDrive.availableDoses),
                    notes: editDrive.notes
                  });
                }}
                className={updateDriveMutation.isPending ? "opacity-70" : ""}
              >
                {updateDriveMutation.isPending ? "Updating..." : "Update Drive"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Vaccination Record Dialog */}
      {selectedDrive && (
        <VaccinationRecordDialog
          open={isVaccinateDialogOpen}
          onOpenChange={setIsVaccinateDialogOpen}
          drive={selectedDrive}
          refreshDrives={() => refetch()}
        />
      )}
    </div>
  );
}