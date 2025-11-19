import { FileText, Database, Bookmark, Plus, Mouse, Link, Loader2, Upload } from "lucide-react";
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
import { captureKnowledge, listCollections, createCollection } from "@/services/api";

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
   * Loaded from backend API
   */
  const [knowledgeBases, setKnowledgeBases] = useState<string[]>([]);

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
   * STATE: Command dropdown visibility
   */
  const [showCommandDropdown, setShowCommandDropdown] = useState(false);

  /**
   * STATE: Available commands based on context
   */
  const [availableCommands, setAvailableCommands] = useState<{
    command: string;
    description: string;
    available: boolean;
  }[]>([]);

  /**
   * STATE: Context from current page
   */
  const [pageContext, setPageContext] = useState<{
    hasSelection: boolean;
    isPdf: boolean;
    currentUrl: string;
  }>({
    hasSelection: false,
    isPdf: false,
    currentUrl: '',
  });

  /**
   * HOOK: Toast for showing success notifications
   */
  const { toast } = useToast();

  /**
   * STATE: Loading state for capture operations
   */
  const [isCapturing, setIsCapturing] = useState(false);

  /**
   * STATE: Selected PDF file from local upload
   */
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);

  /**
   * EFFECT: Request captured text, page context, and load knowledge bases on mount
   */
  useEffect(() => {
    // Request captured text
    browser.runtime.sendMessage(
      { type: 'GET_CAPTURED_TEXT' },
      (response: { text: string }) => {
        if (response && response.text) {
          console.log('Received captured text:', response.text);
          setCapturedText(response.text);
        }
      }
    );

    // Request fresh page context
    browser.runtime.sendMessage(
      { type: 'GET_FRESH_CONTEXT' },
      (context: any) => {
        if (context) {
          console.log('Received page context:', context);
          setPageContext({
            hasSelection: !!context.selectedText,
            isPdf: context.isPdf,
            currentUrl: context.currentUrl,
          });
          updateAvailableCommands(!!context.selectedText, context.isPdf);
        }
      }
    );

    // Load knowledge bases from API
    loadKnowledgeBases();
  }, []);

  /**
   * Load knowledge bases from backend
   */
  async function loadKnowledgeBases() {
    try {
      const response = await listCollections();
      if (response.status === 'success' && response.data) {
        setKnowledgeBases(response.data);
        // Set first collection as default if available
        if (response.data.length > 0) {
          setSelectedKnowledgeBase(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
      toast({
        title: "Failed to load knowledge bases",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  /**
   * Update available commands based on page context
   */
  function updateAvailableCommands(hasSelection: boolean, isPdf: boolean) {
    const commands = [
      {
        command: '/select',
        description: 'Capture selected text',
        available: hasSelection,
      },
      {
        command: '/url',
        description: 'Capture current page URL',
        available: true,
      },
      {
        command: '/pdf',
        description: 'Capture PDF document',
        available: isPdf,
      },
    ];
    setAvailableCommands(commands);
  }

  /**
   * HANDLER: Save captured content to knowledge base
   */
  const handleSave = async () => {
    console.log('=== HANDLE SAVE CALLED ===');
    console.log('Selected PDF file:', selectedPdfFile);
    console.log('Captured text:', capturedText);

    // Check if we have a PDF file uploaded
    if (selectedPdfFile) {
      console.log('Handling local PDF file upload');
      // Handle PDF file upload
      await handlePdfFileUpload();
      return;
    }

    // Validate input
    if (!capturedText.trim()) {
      console.log('No text to save');
      toast({
        title: "Nothing to save",
        description: "Please enter some text or URL to capture.",
      });
      return;
    }

    // Validate knowledge base is selected
    if (!selectedKnowledgeBase) {
      console.log('No knowledge base selected');
      toast({
        title: "No knowledge base selected",
        description: "Please select a knowledge base first.",
      });
      return;
    }

    setIsCapturing(true);

    try {
      // Try to parse as JSON (for structured data like PDFs)
      let captureData;
      try {
        console.log('Attempting to parse captured text as JSON...');
        captureData = JSON.parse(capturedText);
        console.log('Parsed JSON data:', captureData);
      } catch {
        console.log('Not JSON, treating as plain text');
        // Plain text - determine if it's a URL or selection
        captureData = {
          type: isUrl(capturedText) ? 'url' : 'selection',
          content: capturedText,
        };
        console.log('Plain text data:', captureData);
      }

      // Route to appropriate API call based on type
      console.log('Routing to handler based on type:', captureData.type);
      if (captureData.type === 'pdf') {
        console.log('Routing to PDF handler');
        await handlePdfCapture(captureData);
      } else if (captureData.type === 'url' || isUrl(captureData.content)) {
        console.log('Routing to URL handler');
        await handleUrlCapture(captureData.content);
      } else {
        console.log('Routing to selection handler');
        await handleSelectionCapture(captureData.content);
      }

      // Clear input on success
      setCapturedText("");
      console.log('Save completed successfully');

    } catch (error) {
      console.error('=== SAVE ERROR ===');
      console.error('Error details:', error);
      toast({
        title: "Error saving",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsCapturing(false);
      console.log('=== HANDLE SAVE COMPLETE ===');
    }
  };

  /**
   * Helper: Check if string is a URL
   */
  function isUrl(text: string): boolean {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Handle URL capture
   */
  async function handleUrlCapture(url: string) {
    const response = await captureKnowledge({
      type: 'url',
      knowledge_base: selectedKnowledgeBase,
      url: url,
    });

    toast({
      title: "✓ URL captured!",
      description: response.message,
    });
  }

  /**
   * Handle text selection capture
   */
  async function handleSelectionCapture(selection: string) {
    // For selection, we need the current page URL as well
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tabs[0]?.url || '';

    const response = await captureKnowledge({
      type: 'selection',
      knowledge_base: selectedKnowledgeBase,
      url: currentUrl,
      selection: selection,
    });

    toast({
      title: "✓ Text captured!",
      description: response.message,
    });
  }

  /**
   * Handle PDF capture
   */
  async function handlePdfCapture(captureData: any) {
    console.log('=== PDF CAPTURE START ===');
    console.log('Capture data:', captureData);
    console.log('Source:', captureData.source);
    console.log('URL:', captureData.url);
    console.log('Knowledge base:', selectedKnowledgeBase);

    // For both local and online PDFs, fetch the PDF and send as file
    if (captureData.url) {
      try {
        // Show downloading toast for online PDFs
        if (captureData.source === 'online') {
          console.log('Online PDF detected - showing download toast');
          toast({
            title: "Downloading PDF...",
            description: "Fetching PDF from URL",
          });
        }

        // Fetch PDF file (works for both local file:// and online https:// URLs)
        console.log('Fetching PDF from URL...');
        const fileResponse = await fetch(captureData.url);
        console.log('Fetch response status:', fileResponse.status, fileResponse.statusText);
        console.log('Response headers:', Object.fromEntries(fileResponse.headers.entries()));

        if (!fileResponse.ok) {
          throw new Error(`Failed to fetch PDF: ${fileResponse.statusText}`);
        }

        console.log('Converting response to blob...');
        const blob = await fileResponse.blob();
        console.log('Blob created - size:', blob.size, 'bytes, type:', blob.type);

        const fileName = captureData.title || captureData.url.split('/').pop() || 'document.pdf';
        console.log('File name:', fileName);

        const file = new File([blob], fileName, { type: 'application/pdf' });
        console.log('File object created:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });

        // Send PDF as file to backend
        console.log('Sending PDF to backend...');
        console.log('Request params:', {
          type: 'pdf',
          knowledge_base: selectedKnowledgeBase,
          pdf_name: file.name,
          pdf_size: file.size
        });

        const response = await captureKnowledge({
          type: 'pdf',
          knowledge_base: selectedKnowledgeBase,
          pdf: file,
        });

        console.log('Backend response:', response);

        toast({
          title: "✓ PDF captured!",
          description: response.message,
        });
        console.log('=== PDF CAPTURE SUCCESS ===');
      } catch (error) {
        console.error('=== PDF CAPTURE ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');
        throw new Error(
          error instanceof Error
            ? error.message
            : 'Failed to download PDF. Please try uploading the file directly.'
        );
      }
    } else {
      console.error('No PDF URL provided in capture data');
      throw new Error('No PDF URL provided');
    }
  }

  /**
   * HANDLER: Input change - detect "/" for command dropdown
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCapturedText(value);

    // Show command dropdown if user types "/"
    if (value === '/') {
      setShowCommandDropdown(true);
    } else {
      setShowCommandDropdown(false);
    }
  };

  /**
   * HANDLER: Command selection
   */
  const handleCommandSelect = async (command: string) => {
    setShowCommandDropdown(false);

    if (command === '/select') {
      // Request fresh context to get selected text
      browser.runtime.sendMessage(
        { type: 'GET_FRESH_CONTEXT' },
        (context: any) => {
          if (context && context.selectedText) {
            setCapturedText(context.selectedText);
            toast({
              title: "Text selected",
              description: "Selected text loaded into capture field",
            });
          }
        }
      );
    } else if (command === '/url') {
      // Get current tab URL
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.url) {
        setCapturedText(tabs[0].url);
        toast({
          title: "URL captured",
          description: "Current page URL loaded",
        });
      }
    } else if (command === '/pdf') {
      // Get PDF info from context
      browser.runtime.sendMessage(
        { type: 'GET_FRESH_CONTEXT' },
        (context: any) => {
          if (context && context.isPdf) {
            const pdfData = JSON.stringify({
              type: 'pdf',
              source: context.pdfSource,
              url: context.currentUrl,
              title: context.pageTitle,
              timestamp: new Date().toISOString()
            });
            setCapturedText(pdfData);
            toast({
              title: "PDF captured",
              description: `${context.pdfSource === 'local' ? 'Local' : 'Online'} PDF ready to save`,
            });
          }
        }
      );
    }
  };

  /**
   * HANDLER: Add new knowledge base
   */
  const handleAddKnowledgeBase = async () => {
    // Validate name
    if (!newKnowledgeBaseName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the knowledge base.",
      });
      return;
    }

    try {
      // Create collection via API
      const response = await createCollection(newKnowledgeBaseName);

      // Reload collections list
      await loadKnowledgeBases();

      // Select the new knowledge base
      setSelectedKnowledgeBase(newKnowledgeBaseName);

      // Show success toast
      toast({
        title: "✓ Knowledge base created!",
        description: response.message,
      });

      // Clear input and close dialog
      setNewKnowledgeBaseName("");
      setIsDialogOpen(false);

    } catch (error) {
      console.error('Failed to create knowledge base:', error);
      toast({
        title: "Error creating knowledge base",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  /**
   * HANDLER: Handle PDF file selection
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file.",
      });
      return;
    }

    setSelectedPdfFile(file);
    setCapturedText(`📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    toast({
      title: "PDF file selected",
      description: `${file.name} ready to upload`,
    });
  };

  /**
   * HANDLER: Upload PDF file to knowledge base
   */
  const handlePdfFileUpload = async () => {
    if (!selectedPdfFile) return;

    // Validate knowledge base is selected
    if (!selectedKnowledgeBase) {
      toast({
        title: "No knowledge base selected",
        description: "Please select a knowledge base first.",
      });
      return;
    }

    setIsCapturing(true);

    try {
      const response = await captureKnowledge({
        type: 'pdf',
        knowledge_base: selectedKnowledgeBase,
        pdf: selectedPdfFile,
      });

      toast({
        title: "✓ PDF uploaded!",
        description: response.message,
      });

      // Clear selection
      setSelectedPdfFile(null);
      setCapturedText("");

    } catch (error) {
      console.error('PDF upload error:', error);
      toast({
        title: "Error uploading PDF",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main content area - Empty state */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Icon display - file and database icons in dashed circle */}
        <div className="w-32 h-32 rounded-full border-2 border-dashed border-border flex items-center justify-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-muted-foreground" />
          <Database className="w-8 h-8 text-muted-foreground" />
        </div>

        {/* Instructions */}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Start capturing knowledge
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Use <code className="bg-muted px-2 py-0.5 rounded">/select</code>{" "}
          to capture text or{" "}
          <code className="bg-muted px-2 py-0.5 rounded">/url</code> to add
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
        <div className="relative mb-2 flex items-center gap-2">
          <Input
            placeholder="Type / for commands or paste content..."
            value={capturedText}
            onChange={handleInputChange}
            className="flex-1"
          />

          {/* PDF Upload Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <label htmlFor="pdf-upload">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full w-12 h-12 shrink-0 cursor-pointer"
                  onClick={() => document.getElementById('pdf-upload')?.click()}
                >
                  <Upload className="w-5 h-5" />
                </Button>
              </label>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload PDF file</p>
            </TooltipContent>
          </Tooltip>

          {/* Hidden file input */}
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Command dropdown */}
          {showCommandDropdown && (
            <div className="absolute bottom-full left-0 right-[60px] mb-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              {availableCommands
                .filter(cmd => cmd.available)
                .map((cmd) => (
                  <button
                    key={cmd.command}
                    className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-3 transition-colors"
                    onClick={() => handleCommandSelect(cmd.command)}
                  >
                    <code className="text-blue-600 font-semibold">{cmd.command}</code>
                    <span className="text-sm text-muted-foreground">{cmd.description}</span>
                  </button>
                ))}
              {availableCommands.filter(cmd => cmd.available).length === 0 && (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  No commands available
                </div>
              )}
            </div>
          )}
        </div>
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
                <SelectItem key={kb} value={kb}>
                  {kb}
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
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Bookmark className="w-5 h-5 text-white" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isCapturing ? "Capturing..." : "Save to knowledge base"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        </div>
      </div>
    </div>
  );
}
