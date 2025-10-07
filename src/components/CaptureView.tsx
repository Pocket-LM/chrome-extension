import { FileText, Database, Bookmark, Plus, Mouse, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * CaptureView Component
 *
 * This is the "Capture" tab view that allows users to:
 * 1. Capture text or URLs to their knowledge base
 * 2. Select which knowledge base to save to (via dropdown)
 * 3. Use /select or /url commands to capture content
 *
 * The layout includes:
 * - Empty state with icon and instructions
 * - Quick action buttons (/select and /url)
 * - Input field for entering text or URLs
 * - Knowledge base selector dropdown
 * - Add new knowledge base button
 * - Save button (changed from Send button)
 */
export function CaptureView() {
  /**
   * STATE: Store the captured text in React state
   * This will be displayed in the input field
   */
  const [capturedText, setCapturedText] = useState("");

  /**
   * STATE: Store the selected knowledge base
   * Default is "general"
   */
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState("general");

  /**
   * STATE: Store list of knowledge bases
   * Starts with 3 default options, users can add more
   */
  const [knowledgeBases, setKnowledgeBases] = useState([
    { id: "general", name: "General Knowledge" },
    { id: "work", name: "Work Notes" },
    { id: "research", name: "Research" },
  ]);

  /**
   * STATE: New knowledge base name input
   * Used in the add dialog
   */
  const [newKnowledgeBaseName, setNewKnowledgeBaseName] = useState("");

  /**
   * STATE: Dialog open/close state
   */
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /**
   * HOOK: Toast for showing success notifications
   */
  const { toast } = useToast();

  /**
   * EFFECT: Request captured text from background script when component mounts
   *
   * This runs once when the CaptureView component is first displayed.
   * It asks the background script "do you have any captured text for me?"
   */
  useEffect(() => {
    /**
     * Send a message to the background script
     *
     * browser.runtime.sendMessage() sends a message to background.ts
     * - First parameter: The message object { type: 'GET_CAPTURED_TEXT' }
     * - Second parameter: Callback function that receives the response
     */
    browser.runtime.sendMessage(
      { type: 'GET_CAPTURED_TEXT' },
      (response: { text: string }) => {
        if (response && response.text) {
          console.log('Received captured text:', response.text);
          // Update the state with the captured text
          setCapturedText(response.text);
        }
      }
    );
  }, []); // Empty array means this runs only once when component mounts

  /**
   * HANDLER: Save captured content to knowledge base
   *
   * This function handles the save button click:
   * 1. Validates that there's text to save
   * 2. Saves to the selected knowledge base (placeholder for now)
   * 3. Shows a success toast notification
   * 4. Clears the input field
   */
  const handleSave = () => {
    // Check if there's any text to save
    if (!capturedText.trim()) {
      toast({
        title: "Nothing to save",
        description: "Please enter some text or URL to capture.",
      });
      return;
    }

    // Find the knowledge base name from the list
    const selectedKB = knowledgeBases.find(kb => kb.id === selectedKnowledgeBase);
    const knowledgeBaseName = selectedKB?.name || selectedKnowledgeBase;

    // TODO: Actually save to storage/backend
    console.log("Saving to knowledge base:", selectedKnowledgeBase);
    console.log("Content:", capturedText);

    // Show success toast
    toast({
      title: "✓ Knowledge captured successfully!",
      description: `Saved to ${knowledgeBaseName}`,
    });

    // Clear the input field
    setCapturedText("");
  };

  /**
   * HANDLER: Add new knowledge base
   *
   * This function handles adding a new knowledge base:
   * 1. Validates the name is not empty
   * 2. Creates a new knowledge base entry
   * 3. Adds it to the list
   * 4. Selects it automatically
   * 5. Closes the dialog
   * 6. Shows success toast
   */
  const handleAddKnowledgeBase = () => {
    // Validate name
    if (!newKnowledgeBaseName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the knowledge base.",
      });
      return;
    }

    // Create ID from name (lowercase, replace spaces with hyphens)
    const newId = newKnowledgeBaseName.toLowerCase().replace(/\s+/g, '-');

    // Check if already exists
    if (knowledgeBases.some(kb => kb.id === newId)) {
      toast({
        title: "Already exists",
        description: "A knowledge base with this name already exists.",
      });
      return;
    }

    // Add to list
    const newKB = { id: newId, name: newKnowledgeBaseName };
    setKnowledgeBases([...knowledgeBases, newKB]);

    // Select the new knowledge base
    setSelectedKnowledgeBase(newId);

    // Show success toast
    toast({
      title: "✓ Knowledge base created!",
      description: `"${newKnowledgeBaseName}" has been added.`,
    });

    // Clear input and close dialog
    setNewKnowledgeBaseName("");
    setIsDialogOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main content area - Empty state */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Icon display - file and database icons in dashed circle */}
        <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-gray-400" />
          <Database className="w-8 h-8 text-gray-400" />
        </div>

        {/* Instructions */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Start capturing knowledge
        </h2>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          Use <code className="bg-gray-100 px-2 py-0.5 rounded">/select</code>{" "}
          to capture text or{" "}
          <code className="bg-gray-100 px-2 py-0.5 rounded">/url</code> to add
          a webpage
        </p>
      </div>

      {/* Quick action buttons */}
      {/* <div className="flex items-center justify-center gap-3 mb-4 px-6">
        <Button
          variant="outline"
          className="rounded-full gap-2"
          onClick={() => {
            // TODO: Implement text selection functionality
            console.log("/select command clicked");
          }}
        >
          <Mouse className="w-4 h-4" />
          /select
        </Button>
        <Button
          variant="outline"
          className="rounded-full gap-2"
          onClick={() => {
            // TODO: Implement URL capture functionality
            console.log("/url command clicked");
          }}
        >
          <Link className="w-4 h-4" />
          /url
        </Button>
      </div> */}

      {/* Input area */}
      <div className="px-6 pb-3">
        <Input
          placeholder="Use /select or /url to capture content..."
          className="mb-2"
          value={capturedText}
          onChange={(e) => setCapturedText(e.target.value)}
        />
        <div className="flex items-center justify-between">
        {/* Bottom bar: Knowledge base selector + Save button */}
        <div className="flex items-center gap-2">
          {/* Knowledge base dropdown selector - dynamically populated */}
          <Select
            value={selectedKnowledgeBase}
            onValueChange={setSelectedKnowledgeBase}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select knowledge base" />
            </SelectTrigger>
            <SelectContent>
              {knowledgeBases.map((kb) => (
                <SelectItem key={kb.id} value={kb.id}>
                  {kb.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Add new knowledge base button with tooltip and dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full w-12 h-12 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create new knowledge base</p>
              </TooltipContent>
            </Tooltip>

            {/* Dialog for adding new knowledge base */}
            <DialogContent className="max-w-[340px] flex-col justify-center items-center">
              <DialogHeader>
                <DialogTitle>Create Knowledge Base</DialogTitle>
                <DialogDescription>
                  Add a new knowledge base to organize your captured content.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-2">
                <div className="grid gap-2 w-full">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    placeholder="e.g., Personal Notes"
                    value={newKnowledgeBaseName}
                    onChange={(e) => setNewKnowledgeBaseName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddKnowledgeBase();
                      }
                    }}
                    
                  />
                </div>
              </div>
              <DialogFooter className="flex flex-row gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNewKnowledgeBaseName("");
                    setIsDialogOpen(false);
                  }}
                  className="w-[150px]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddKnowledgeBase}
                  className="bg-blue-500 hover:bg-blue-600 w-[150px]"
                  
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Save button with tooltip */}
        <div className="flex items-center justify-end">
          {/**
           * Save Button with Tooltip
           *
           * When clicked:
           * 1. Saves the captured text to the selected knowledge base
           * 2. Shows a success toast notification
           * 3. Clears the input field
           *
           * The Bookmark icon represents "saving to knowledge base"
           * Cursor changes to pointer on hover
           */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="rounded-full w-12 h-12 shrink-0 bg-blue-500 hover:bg-blue-600 cursor-pointer"
                onClick={handleSave}
              >
                <Bookmark className="w-5 h-5 text-white" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save to knowledge base</p>
            </TooltipContent>
          </Tooltip>
        </div>
        </div>
      </div>
    </div>
  );
}
