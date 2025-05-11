import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { generateGradeOptions } from "@/lib/utils";
import { Student } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Upload, UserPlus, Search, FileUp, X, Check, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// We'll use actual data from the database instead of mock data
import { InsertStudent } from "@shared/schema";

// Grade options for the form
const GRADES = generateGradeOptions();

export default function StudentsPage() {
  // Get auth context
  const { isAuthenticated } = useAuth();
  // State for the new student form
  const [newStudent, setNewStudent] = useState<Omit<InsertStudent, 'dateOfBirth'> & {dateOfBirth: string | null}>({
    studentId: "",
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    grade: "",
    address: "",
    parentContact: "",
  });

  // State for the file upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // State for the search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Initialize toast
  const { toast } = useToast();

  // Fetch students from the API
  const { data: studentsData, isLoading, refetch } = useQuery({
    queryKey: [`/api/students?search=${searchTerm}&grade=${gradeFilter}&status=${statusFilter}&page=${currentPage}&limit=${itemsPerPage}`],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found for students API request');
        return { students: [], total: 0 };
      }

      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      
      console.log('Fetching students with token:', token.substring(0, 15) + '...');
      
      try {
        const response = await fetch(`/api/students?search=${searchTerm}&grade=${gradeFilter}&status=${statusFilter}&page=${currentPage}&limit=${itemsPerPage}`, { 
          method: 'GET',
          headers 
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Students API response:', data);
        return data;
      } catch (error) {
        console.error('Error fetching students:', error);
        return { students: [], total: 0 };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });
  
  // Fetch vaccination records
  const { data: vaccinationRecords } = useQuery({
    queryKey: ['/api/vaccination-records'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found for vaccination records API request');
        return [];
      }

      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      
      try {
        const response = await fetch('/api/vaccination-records', { 
          method: 'GET',
          headers 
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Vaccination records:', data);
        return data;
      } catch (error) {
        console.error('Error fetching vaccination records:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Mutation for adding a new student
  const addStudentMutation = useMutation({
    mutationFn: (studentData: typeof newStudent) => 
      apiRequest('POST', '/api/students', studentData)
        .then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student added successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/students?search=${searchTerm}&grade=${gradeFilter}&status=${statusFilter}&page=${currentPage}&limit=${itemsPerPage}`] 
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      });
    },
  });

  // Mutation for bulk uploading students
  const bulkUploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // For FormData, we need a special handling because apiRequest doesn't directly support FormData
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/students/import', {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setIsUploading(false);
      setUploadSuccess(true);
      setUploadMessage(`File uploaded successfully. ${data.count || 0} students imported.`);
      
      // Reset after a few seconds
      setTimeout(() => {
        setUploadedFile(null);
        setUploadSuccess(false);
        setUploadMessage("");
        setIsUploadDialogOpen(false);
        queryClient.invalidateQueries({ 
        queryKey: [`/api/students?search=${searchTerm}&grade=${gradeFilter}&status=${statusFilter}&page=${currentPage}&limit=${itemsPerPage}`]
      });
      }, 2000);
    },
    onError: (error: any) => {
      setIsUploading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to upload students",
        variant: "destructive",
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStudent({ ...newStudent, [name]: value });
  };

  // Handle grade selection
  const handleGradeChange = (value: string) => {
    setNewStudent({ ...newStudent, grade: value });
  };

  // Reset form
  const resetForm = () => {
    setNewStudent({
      studentId: "",
      firstName: "",
      lastName: "",
      email: "",
      dateOfBirth: "", 
      grade: "",
      address: "",
      parentContact: "",
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newStudent.studentId || !newStudent.firstName || !newStudent.lastName || !newStudent.grade) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields: Student ID, First Name, Last Name, and Grade",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare the student data
    const studentData = { ...newStudent };
    
    // Handle date formatting
    if (studentData.dateOfBirth) {
      // Keep the date as is - the database expects YYYY-MM-DD format from the date input
    } else {
      // If dateOfBirth is empty, set it to null for the database
      studentData.dateOfBirth = null;
    }
    
    addStudentMutation.mutate(studentData);
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  // Handle file upload submission
  const handleFileUpload = () => {
    if (!uploadedFile) return;
    
    setIsUploading(true);
    
    // Create a FormData object and append the file
    const formData = new FormData();
    formData.append('file', uploadedFile);
    
    // Upload the file
    bulkUploadMutation.mutate(formData);
  };

  // Get the students and pagination data from the API
  const students = (studentsData as any)?.students || [];
  const totalStudents = (studentsData as any)?.total || 0;
  const totalPages = Math.ceil(totalStudents / itemsPerPage);
  
  // Get vaccination status for each student
  const getVaccinationStatus = (studentId: number) => {
    if (!vaccinationRecords || !Array.isArray(vaccinationRecords)) return false;
    return vaccinationRecords.some((record: any) => record.studentId === studentId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Student Management</h1>
          <p className="text-gray-600">Add, edit, and manage student information</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Enter the student's details below to add them to the system
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    name="studentId"
                    value={newStudent.studentId}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter a unique student ID (e.g., S12345)"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={newStudent.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={newStudent.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newStudent.email || ""}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={newStudent.dateOfBirth || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Select
                      value={newStudent.grade}
                      onValueChange={handleGradeChange}
                    >
                      <SelectTrigger id="grade">
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES.map(grade => (
                          <SelectItem key={grade.value} value={grade.value}>
                            {grade.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={newStudent.address || ""}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parentContact">Parent Contact</Label>
                  <Input
                    id="parentContact"
                    name="parentContact"
                    value={newStudent.parentContact || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Student</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Bulk Upload Students</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with student information to add multiple students at once
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {!uploadSuccess ? (
                  <>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      {uploadedFile ? (
                        <div className="flex flex-col items-center">
                          <div className="bg-blue-50 p-2 rounded-full">
                            <FileUp className="h-8 w-8 text-blue-500" />
                          </div>
                          <p className="mt-2 font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(uploadedFile.size / 1024).toFixed(2)} KB
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2"
                            onClick={() => setUploadedFile(null)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <>
                          <FileUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 mb-2">
                            Drag and drop a CSV file here, or click to browse
                          </p>
                          <Input
                            id="file-upload"
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById("file-upload")?.click()}
                          >
                            Browse Files
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      <p className="font-semibold">CSV Format:</p>
                      <p>First Name, Last Name, Email, Date of Birth, Grade, Address, Parent Contact</p>
                      <p className="text-xs mt-1">Example: John,Doe,john.doe@example.com,2015-05-15,1,123 Main St,555-123-4567</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="mt-4 text-lg font-semibold">{uploadMessage}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsUploadDialogOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleFileUpload} 
                  disabled={!uploadedFile || isUploading || uploadSuccess}
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Search & Filter Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name or ID..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {GRADES.map(grade => (
                  <SelectItem key={grade.value} value={grade.value}>
                    {grade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Vaccinated">Vaccinated</SelectItem>
                <SelectItem value="Not Vaccinated">Not Vaccinated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4 text-right">
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setGradeFilter("all");
                setStatusFilter("all");
              }}
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Student List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Student List</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : `${totalStudents} student${totalStudents !== 1 ? 's' : ''} found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Grade</TableHead>
                  <TableHead className="hidden md:table-cell">Parent Contact</TableHead>
                  <TableHead>Vaccination Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Loading student data...
                    </TableCell>
                  </TableRow>
                ) : students.length > 0 ? (
                  students.map((student: Student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.studentId}</TableCell>
                      <TableCell>{student.firstName} {student.lastName}</TableCell>
                      <TableCell className="hidden md:table-cell">{student.grade}</TableCell>
                      <TableCell className="hidden md:table-cell">{student.parentContact || "—"}</TableCell>
                      <TableCell>
                        {getVaccinationStatus(student.id) ? (
                          <Badge className="bg-green-100 text-green-800">
                            Vaccinated
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Not Vaccinated
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No students found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                          refetch();
                        }
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
                          refetch();
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
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1);
                          refetch();
                        }
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
    </div>
  );
}