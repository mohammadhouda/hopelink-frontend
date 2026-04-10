"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import userApi from "@/lib/userAxios";

interface Volunteer {
  id: number;
  name: string;
  email: string;
  role: string;
  baseProfile?: {
    avatarUrl?: string;
    city?: string;
    country?: string;
    bio?: string;
  } | null;
}

interface VolunteerContextType {
  volunteer: Volunteer | null;
  loading: boolean;
  refreshVolunteer: () => void;
}

const VolunteerContext = createContext<VolunteerContextType | undefined>(undefined);

export function VolunteerProvider({ children }: { children: ReactNode }) {
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVolunteer = async () => {
    setLoading(true);
    try {
      const res = await userApi.get("/api/user/profile");
      setVolunteer(res.data?.data || null);
    } catch {
      setVolunteer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteer();
  }, []);

  return (
    <VolunteerContext.Provider value={{ volunteer, loading, refreshVolunteer: fetchVolunteer }}>
      {children}
    </VolunteerContext.Provider>
  );
}

export function useVolunteer() {
  const context = useContext(VolunteerContext);
  if (!context) throw new Error("useVolunteer must be used within a VolunteerProvider");
  return context;
}
