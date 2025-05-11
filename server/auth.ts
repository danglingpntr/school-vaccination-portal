import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { insertUserSchema } from '@shared/schema';

// JWT secret key from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'school-vaccination-portal-secret-key';

// JWT expiration time (24 hours)
const JWT_EXPIRES_IN = '24h';

export const generateToken = (userId: number, username: string, role: string): string => {
  return jwt.sign(
    { id: userId, username, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const authenticate = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  try {
    // Validate input
    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    // Find user by username
    const user = await storage.getUserByUsername(username);
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Compare passwords
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = generateToken(user.id, user.username, user.role);

    // Return token and user data
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input using Zod schema
    const validationResult = insertUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ message: 'Invalid user data', errors: validationResult.error.errors });
      return;
    }

    const { username, password, name, role } = validationResult.data;

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      res.status(400).json({ message: 'Username already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const user = await storage.createUser({
      username,
      password: hashedPassword,
      name,
      role
    });

    // Generate JWT token
    const token = generateToken(user.id, user.username, user.role);

    // Return token and user data
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Get token from header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
    
    // Add user data to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token expired' });
    } else {
      res.status(401).json({ message: 'Invalid token' });
    }
  }
};

// Initialize default admin user
export const initializeDefaultUser = async (): Promise<void> => {
  try {
    const defaultUsername = 'admin';
    const existingUser = await storage.getUserByUsername(defaultUsername);
    
    if (!existingUser) {
      const hashedPassword = await hashPassword('admin123');
      
      await storage.createUser({
        username: defaultUsername,
        password: hashedPassword,
        name: 'School Admin',
        role: 'admin'
      });
      
      console.log('Created default admin user');
    }
  } catch (error) {
    console.error('Error creating default user:', error);
  }
};
