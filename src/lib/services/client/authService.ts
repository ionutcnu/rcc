interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

interface User {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin?: boolean;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
}

export class ClientAuthService {
  private baseUrl = '/api/auth';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  async logout(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Logout failed');
      }

      return data;
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/session`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Session check failed',
        };
      }

      return data;
    } catch (error) {
      console.error('Session check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session check failed',
      };
    }
  }

  async checkAdminStatus(): Promise<{ isAdmin: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/check-admin`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          isAdmin: false,
          error: data.error || 'Admin check failed',
        };
      }

      return { isAdmin: data.isAdmin || false };
    } catch (error) {
      console.error('Admin check error:', error);
      return {
        isAdmin: false,
        error: error instanceof Error ? error.message : 'Admin check failed',
      };
    }
  }

  async createSession(idToken: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Session creation failed');
      }

      return data;
    } catch (error) {
      console.error('Session creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session creation failed',
      };
    }
  }
}

// Export singleton instance
export const clientAuthService = new ClientAuthService();

// Export types for use in components
export type { LoginCredentials, RegisterData, User, AuthResponse };