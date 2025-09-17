import { usePageSEO } from "@/hooks/usePageSEO";
import { AdminSubnav } from "@/components/AdminSubnav";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";
import { VoicePromptManager } from "@/components/VoicePromptManager";
import { ImagePromptManager } from "@/components/ImagePromptManager";

export default function Functions() {
  usePageSEO({ 
    title: "Admin Functions",
    description: "Manage AI function prompts for food recognition"
  });

  return (
    <AdminHealthCheck>
      <div className="min-h-screen bg-background">
        <AdminSubnav />
        <div className="container mx-auto p-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Function Management</h1>
            <p className="text-muted-foreground">Configure AI prompts for food recognition functions</p>
          </div>
          
          <div className="grid gap-6">
            <VoicePromptManager />
            <ImagePromptManager />
          </div>
        </div>
      </div>
    </AdminHealthCheck>
  );
}