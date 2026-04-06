'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import charityApi from "@/lib/charityAxios";

interface Charity {
  id: number;
  email: string;
  name: string;
  logoUrl?: string;
  category?: string;
  city?: string;
}

interface CharityContextType {
  charity: Charity | null;
  loading: boolean;
  refreshCharity: () => void;
}

const CharityContext = createContext<CharityContextType | undefined>(undefined);

export function CharityProvider({ children }: { children: ReactNode }) {
  const [charity, setCharity] = useState<Charity | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCharity = async () => {
    setLoading(true);
    try {
      const res = await charityApi.get("/api/charity/profile");
      setCharity(res.data?.data || res.data);
    } catch {
      setCharity(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharity();
  }, []);

  return (
    <CharityContext.Provider value={{ charity, loading, refreshCharity: fetchCharity }}>
      {children}
    </CharityContext.Provider>
  );
}

export function useCharity() {
  const context = useContext(CharityContext);
  if (!context) throw new Error("useCharity must be used within a CharityProvider");
  return context;
}
