import Sidebar from "../../components/layout/Sidebar";
import Navbar from "../../components/layout/Navbar";
import { UserProvider } from "@/context/UserContext";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <ProtectedRoute>
        <div className="flex flex-col h-screen overflow-hidden">
          <Navbar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
              {children}
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </UserProvider>
  );
}