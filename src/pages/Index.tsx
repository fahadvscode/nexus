import { useState } from "react";
import { ClientTable } from "@/components/ClientTable";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardStats } from "@/components/DashboardStats";
import { QuickDialer } from "@/components/QuickDialer";
import { CallTestButton } from "@/components/CallTestButton";
import { AddClientModal } from "@/components/AddClientModal";
import { BulkUploadModal } from "@/components/BulkUploadModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTwilioStore } from "@/hooks/useTwilioStore";

const Index = () => {
  const [showAddClient, setShowAddClient] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const { audioUnlocked, unlockAudio, initializeDevice, isReady, isInitializing, error } = useTwilioStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        onAddClient={() => setShowAddClient(true)}
        onBulkUpload={() => setShowBulkUpload(true)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Debug Section */}
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <h3 className="font-semibold mb-2">🔧 Debug Panel</h3>
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <span>Audio Unlocked: {audioUnlocked ? '✅' : '❌'}</span>
              <span>Device Ready: {isReady ? '✅' : '❌'}</span>
              <span>Initializing: {isInitializing ? '🔄' : '❌'}</span>
              {error && <span className="text-red-600">Error: {error}</span>}
              
              <Button 
                onClick={unlockAudio} 
                size="sm" 
                variant="outline"
                disabled={audioUnlocked}
              >
                {audioUnlocked ? 'Audio Unlocked ✅' : 'Unlock Audio 🔓'}
              </Button>
              
              <Button 
                onClick={initializeDevice} 
                size="sm" 
                variant="outline"
                disabled={!audioUnlocked || isReady || isInitializing}
              >
                {isInitializing ? 'Initializing...' : 'Initialize Device'}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <DashboardStats />
            </div>
            <div className="lg:col-span-1 space-y-4">
              <QuickDialer />
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
