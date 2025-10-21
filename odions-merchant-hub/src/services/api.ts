const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  async signUp(data: SignUpData) {
    // Call backend to create user profile
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Signup failed');
    }
    return await response.json();
  },

  async signIn(data: SignInData) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Login failed');
    }
    return await response.json();
  },

  async signOut() {
    // Optionally call backend to invalidate session
    return Promise.resolve();
  },
};

export default authService;
