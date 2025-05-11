import { useState, useEffect } from "react";
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
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
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
import { Download, FileSpreadsheet, FileText, Filter, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Student, VaccinationRecord } from "@/types";

// Define a type for combined vaccination records and student info
interface VaccinationReportItem {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  grade: string;
  vaccinationStatus: string;
  vaccinationDate: string | null;
  vaccineName: string | null;
}

// Vaccines for filtering
const VACCINES = [
  { value: "all", label: "All Vaccines" },
  { value: "MMR Vaccine", label: "MMR Vaccine" },
  { value: "Tdap Booster", label: "Tdap Booster" },
  { value: "Influenza", label: "Influenza" },
  { value: "Hepatitis B", label: "Hepatitis B" },
  { value: "Chickenpox", label: "Chickenpox" },
  { value: "Polio Booster", label: "Polio Booster" },
];

// Grades for filtering
const GRADES = [
  { value: "all", label: "All Grades" },
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

// Status for filtering
const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "Vaccinated", label: "Vaccinated" },
  { value: "Not Vaccinated", label: "Not Vaccinated" },
];

export default function ReportsPage() {
  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [vaccineFilter, setVaccineFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch students data
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students'],
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
  });

  // Fetch vaccination records
  const { data: vaccinationRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ['/api/vaccination-records'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/vaccination-records', { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vaccination records');
      }
      
      console.log("Vaccination records:", await response.clone().json());
      return response.json();
    },
  });

  // Fetch vaccination drives for vaccine names
  const { data: drivesData, isLoading: drivesLoading } = useQuery({
    queryKey: ['/api/vaccination-drives'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/vaccination-drives', { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vaccination drives');
      }
      
      return response.json();
    },
  });

  // Combine data to create the report items
  const [reportItems, setReportItems] = useState<VaccinationReportItem[]>([]);
  
  useEffect(() => {
    if (studentsData?.students && vaccinationRecords && drivesData?.drives) {
      const newReportItems: VaccinationReportItem[] = [];
      
      console.log("Students API response:", studentsData);
      
      // Process students and their vaccination records
      studentsData.students.forEach((student: Student) => {
        // Find vaccination record for this student
        const record = vaccinationRecords.find((rec: VaccinationRecord) => rec.studentId === student.id);
        
        // Find drive info if record exists
        let driveName: string | null = null;
        let driveDate: string | null = null;
        
        if (record) {
          const drive = drivesData.drives.find((d: any) => d.id === record.driveId);
          if (drive) {
            driveName = drive.vaccineName;
            driveDate = record.vaccinationDate;
          }
        }
        
        // Add to report items
        newReportItems.push({
          id: student.id,
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          grade: student.grade,
          vaccinationStatus: record ? "Vaccinated" : "Not Vaccinated",
          vaccinationDate: driveDate,
          vaccineName: driveName
        });
      });
      
      // Update the state with the new report items
      setReportItems(newReportItems);
    }
  }, [studentsData, vaccinationRecords, drivesData]);

  // Apply filters
  const filteredStudents = reportItems.filter(student => {
    // Filter by name (first or last)
    const nameMatch = 
      student.firstName.toLowerCase().includes(nameFilter.toLowerCase()) ||
      student.lastName.toLowerCase().includes(nameFilter.toLowerCase());
    
    // Filter by vaccine
    const vaccineMatch = 
      vaccineFilter === "all" || 
      student.vaccineName === vaccineFilter;
    
    // Filter by grade
    const gradeMatch = 
      gradeFilter === "all" || 
      student.grade === gradeFilter;
    
    // Filter by vaccination status
    const statusMatch = 
      statusFilter === "all" || 
      student.vaccinationStatus === statusFilter;
    
    return nameMatch && vaccineMatch && gradeMatch && statusMatch;
  });

  // Paginate results
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  
  // Determine if data is loading
  const isLoading = studentsLoading || recordsLoading || drivesLoading;

  // Handle CSV download
  const handleDownloadCSV = () => {
    if (isLoading) return; // Don't download if data is still loading
    
    // Create header row
    const headers = ["Student ID", "Name", "Grade", "Vaccination Status", "Vaccination Date", "Vaccine Name"];
    
    // Create data rows
    const rows = filteredStudents.map(student => [
      student.studentId,
      `${student.firstName} ${student.lastName}`,
      student.grade,
      student.vaccinationStatus,
      student.vaccinationDate || "N/A",
      student.vaccineName || "N/A"
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "vaccination_report.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Vaccination Reports</h1>
        <p className="text-gray-600">Generate and download reports for student vaccination records</p>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter Options
          </CardTitle>
          <CardDescription>
            Filter the report data by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name-filter">Student Name</Label>
              <Input
                id="name-filter"
                placeholder="Search by name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vaccine-filter">Vaccine</Label>
              <Select
                value={vaccineFilter}
                onValueChange={setVaccineFilter}
              >
                <SelectTrigger id="vaccine-filter">
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
              <Label htmlFor="grade-filter">Grade</Label>
              <Select
                value={gradeFilter}
                onValueChange={setGradeFilter}
              >
                <SelectTrigger id="grade-filter">
                  <SelectValue placeholder="Select grade" />
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
            
            <div className="space-y-2">
              <Label htmlFor="status-filter">Vaccination Status</Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              className="mr-2"
              onClick={() => {
                setNameFilter("");
                setVaccineFilter("all");
                setGradeFilter("all");
                setStatusFilter("all");
              }}
            >
              Reset Filters
            </Button>
            <Button>Generate Report</Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Results & Export */}
      <Card>
        <CardHeader className="flex-row justify-between items-center">
          <div>
            <CardTitle>Vaccination Records</CardTitle>
            <CardDescription>
              {isLoading ? "Loading data..." : `Showing ${filteredStudents.length} records`}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center"
              onClick={handleDownloadCSV}
              disabled={isLoading}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center"
              disabled={isLoading}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Vaccination Status</TableHead>
                  <TableHead>Date of Vaccination</TableHead>
                  <TableHead>Vaccine</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        <span>Loading vaccination records...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedStudents.length > 0 ? (
                  paginatedStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>{student.firstName} {student.lastName}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          student.vaccinationStatus === "Vaccinated" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {student.vaccinationStatus}
                        </span>
                      </TableCell>
                      <TableCell>{student.vaccinationDate ? formatDate(student.vaccinationDate) : "N/A"}</TableCell>
                      <TableCell>{student.vaccineName || "N/A"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No records found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {!isLoading && filteredStudents.length > 0 && (
            <div className="mt-4">
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
    </div>
  );
}