import { Upload, MessageCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { CaptureView } from "@/components/CaptureView";
import { ChatView } from "@/components/ChatView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Main App Component
 *
 * This is the root component of the Pocket LM extension popup.
 * It manages the main navigation between two views:
 *
 * 1. Capture Tab - For storing texts and URLs to knowledge bases
 * 2. Chat Tab - For asking questions about captured knowledge
 *
 * The component structure:
 * - TooltipProvider: Enables tooltips throughout the app
 * - Header: Shows logo, branding, and theme toggle
 * - Tabs: Allows switching between Capture and Chat views
 *   - TabsList: The navigation buttons (Capture/Chat)
 *   - TabsContent: The actual content for each tab
 * - Toaster: Displays toast notifications (success messages, etc.)
 */
function App() {
  return (
    <TooltipProvider>
      <div className="w-[400px] h-[600px] flex flex-col overflow-hidden bg-background text-foreground">
      {/* Top header with logo and controls */}
      <Header />

      {/* Main content area with tabs */}
      <Tabs defaultValue="capture" className="flex-1 h-full flex flex-col">
        {/* Tab navigation buttons */}
        <div className="px-6 pt-2">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="capture" className="gap-2">
              <Upload className="w-4 h-4" />
              Capture
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Capture tab content */}
        <TabsContent value="capture" className="flex-1 mt-0 overflow-hidden">
          <CaptureView />
        </TabsContent>

        {/* Chat tab content */}
        <TabsContent value="chat" className="flex-1 mt-0 overflow-hidden">
          <ChatView />
        </TabsContent>
      </Tabs>

      {/* Toast notification system */}
      <Toaster />
      </div>
    </TooltipProvider>
  );
}

export default App;
