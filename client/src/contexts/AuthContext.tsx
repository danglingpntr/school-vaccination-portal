import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Load auth state from localStorage on initial render
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        setAuthState({
          user,
          token,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error('Failed to parse user data from localStorage', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await response.json();
      
      // Save to state
      setAuthState({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
      });
      
      // Save to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.name}!`,
      });
    } catch (error) {
      console.error('Login failed', error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    // Clear state
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
