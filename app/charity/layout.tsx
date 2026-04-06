import { CharityProvider } from "@/context/CharityContext";
import ProtectedCharityRoute from "@/components/charity/ProtectedCharityRoute";
import CharitySidebar from "@/components/charity/CharitySidebar";
import CharityNavbar from "@/components/charity/CharityNavbar";

export default function CharityLayout({ children }: { children: React.ReactNode }) {
  return (
    <CharityProvider>
      <ProtectedCharityRoute>
        <div className="flex flex-col h-screen overflow-hidden">
          <CharityNavbar />
          <div className="flex flex-1 overflow-hidden">
            <CharitySidebar />
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
              {children}
            </main>
          </div>
        </div>
      </ProtectedCharityRoute>
    </CharityProvider>
  );
}
