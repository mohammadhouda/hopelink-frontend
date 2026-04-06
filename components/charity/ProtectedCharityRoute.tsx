'use client';
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCharity } from "@/context/CharityContext";
import Loading from "@/app/loading";

export default function ProtectedCharityRoute({ children }: { children: React.ReactNode }) {
  const { charity, loading } = useCharity();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !charity) {
      router.replace("/charity/login");
    }
  }, [charity, loading, router]);

  if (loading) return <Loading />;
  if (!charity) return null;

  return <>{children}</>;
}
