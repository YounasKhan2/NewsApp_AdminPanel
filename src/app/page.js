"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import NewsReport from "@/components/NewsReport";
import Analytics from "@/components/Analytics";
import AddNews from "@/components/AddNews";
import ManageContent from "@/components/ManageContent";
import Trending from "@/components/Trending";
import ProfileSettings from "@/components/ProfileSettings";

export default function MainApp() {
  const [activePage, setActivePage] = useState("dashboard");
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "analytics":
        return <Analytics />;
      case "trending-news":
        return <Trending />;
      case "add-news":
        return <AddNews />;
      case "news-report":
        return <NewsReport />;
      case "manage-content":
        return <ManageContent />;
      case "settings":
        return <ProfileSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar setActivePage={setActivePage} />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}