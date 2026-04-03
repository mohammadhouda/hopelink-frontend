'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "@/lib/axios";

interface User {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    setLoading(true);
    try {
        
      // API call with HttpOnly cookie automatically sent
      const res = await api.get("/api/admin/profile");
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
}