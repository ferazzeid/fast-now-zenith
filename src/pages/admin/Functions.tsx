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
      <div className="container mx-auto p-6 space-y-8 bg-background min-h-[calc(100vh-80px)]">
        <AdminSubnav />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">AI Functions</h1>
        </div>
        
        <div className="grid gap-6 pb-24">
          <VoicePromptManager />
          <ImagePromptManager />
        </div>
      </div>
    </AdminHealthCheck>
  );
}