"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVolunteer } from "@/context/VolunteerContext";
import Loading from "@/app/loading";

export default function ProtectedUserRoute({ children }: { children: React.ReactNode }) {
  const { volunteer, loading } = useVolunteer();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !volunteer) {
      router.replace("/user/login");
    }
  }, [volunteer, loading, router]);

  if (loading) return <Loading />;
  if (!volunteer) return null;

  return <>{children}</>;
}
