import { MessageCircle, Bot, Send, Plus, Mouse, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * ChatView Component
 *
 * This is the "Chat" tab view that allows users to:
 * 1. Ask questions about their captured knowledge
 * 2. Have conversations with the AI about their knowledge base
 * 3. Select which knowledge base to query from (via dropdown)
 *
 * The layout includes:
 * - Empty state with icon and instructions
 * - Quick action buttons (/select and /url) - same as Capture view
 * - Input field for asking questions
 * - Knowledge base selector dropdown
 * - Add new knowledge base button
 * - Send/submit button
 */
export function ChatView() {
  return (
    <div className="flex flex-col h-full">
      {/* Main content area - Empty state */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Icon display - message and bot icons in dashed circle */}
        <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center gap-3 mb-6">
          <MessageCircle className="w-8 h-8 text-gray-400" />
          <Bot className="w-8 h-8 text-gray-400" />
        </div>

        {/* Instructions */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Start a conversation
        </h2>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          Ask questions about your captured knowledge
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
          placeholder="Ask a question about your knowledge..."
          className="mb-2"
        />

        <div className="flex items-center justify-between">
        {/* Bottom bar: Knowledge base selector + Send button */}
        <div className="flex items-center gap-2">
          {/* Knowledge base dropdown selector */}
          <Select defaultValue="general">
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select knowledge base" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Knowledge</SelectItem>
              <SelectItem value="work">Work Notes</SelectItem>
              <SelectItem value="research">Research</SelectItem>
            </SelectContent>
          </Select>

          {/* Add new knowledge base button */}
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-12 h-12 shrink-0"
            onClick={() => {
              // TODO: Implement add new knowledge base
              console.log("Add new knowledge base clicked");
            }}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Send/submit button */}
        <div className="flex items-center justify-end">

          {/* Send/submit button */}
          <Button
            size="icon"
            className="rounded-full w-12 h-12 shrink-0 bg-blue-500 hover:bg-blue-600"
            onClick={() => {
              // TODO: Implement submit/capture functionality
              console.log("Submit capture clicked");
            }}
          >
            <Send className="w-5 h-5 text-white" />
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
