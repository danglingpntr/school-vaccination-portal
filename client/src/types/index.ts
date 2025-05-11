export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  dateOfBirth: string | null;
  grade: string;
  address: string | null;
  parentContact: string | null;
}

export interface VaccinationDrive {
  id: number;
  driveId: string;
  vaccineName: string;
  driveDate: string;
  applicableGrades: string;
  availableDoses: number;
  usedDoses: number;
  status: 'scheduled' | 'completed' | 'cancelled' | string;
  notes: string | null;
  createdAt: string;
}

export interface VaccinationRecord {
  id: number;
  studentId: number;
  driveId: number;
  vaccinationDate: string;
  notes: string | null;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  userId: number | null;
  action: string;
  description: string;
  timestamp: string;
}

export interface DashboardStats {
  totalStudents: number;
  vaccinated: number;
  upcomingDrives: number;
  pending: number;
}

export interface GradeProgress {
  grade: string;
  percentage: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
