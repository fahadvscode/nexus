import { useState } from "react";
import { ClientTable } from "@/components/ClientTable";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardStats } from "@/components/DashboardStats";
import { QuickDialer } from "@/components/QuickDialer";
import { QuickSms } from "@/components/QuickSms";
import { CallTestButton } from "@/components/CallTestButton";
import { AddClientModal } from "@/components/AddClientModal";
import { BulkUploadModal } from "@/components/BulkUploadModal";
import ImpersonationBanner from "@/components/ImpersonationBanner";


const Index = () => {
  const [showAddClient, setShowAddClient] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        onAddClient={() => setShowAddClient(true)}
        onBulkUpload={() => setShowBulkUpload(true)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ImpersonationBanner />
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <DashboardStats />
            </div>
            <div className="lg:col-span-1 space-y-4">
              <QuickDialer />
              <QuickSms />
              <CallTestButton />
            </div>
          </div>
          <ClientTable />
        </div>
      </main>

      <AddClientModal 
        open={showAddClient} 
        onOpenChange={setShowAddClient}
      />
      
      <BulkUploadModal 
        open={showBulkUpload} 
        onOpenChange={setShowBulkUpload}
      />
    </div>
  );
};

export default Index;
