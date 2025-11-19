import { MessageCircle, Bot, Send, User, Trash2 } from "lucide-react";
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
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { getChatHistory, sendChatMessage, clearChatHistory, listCollections } from "@/services/api";
import ReactMarkdown from 'react-markdown';

/**
 * ChatView Component
 *
 * Features:
 * - Load chat history from backend on first visit
 * - Send messages to RAG based on selected knowledge base
 * - Global chat history (not per-collection)
 * - Auto-scroll to latest message
 * - Loading states and error handling
 */

interface Message {
  messageContent: string;
  type: 'human' | 'ai';
  knowledgeBase?: string; // Track which KB was used for this question
}

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState("");
  const [knowledgeBases, setKnowledgeBases] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  /**
   * Load chat history and knowledge bases on first mount
   */
  useEffect(() => {
    if (!hasLoadedHistory) {
      loadChatHistory();
      loadKnowledgeBases();
      setHasLoadedHistory(true);
    }
  }, [hasLoadedHistory]);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Load knowledge bases from backend
   */
  async function loadKnowledgeBases() {
    try {
      const response = await listCollections();
      if (response.status === 'success' && response.data) {
        setKnowledgeBases(response.data);
        // Set first collection as default
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
   * Load chat history from backend
   */
  async function loadChatHistory() {
    try {
      const response = await getChatHistory();
      if (response.status === 'success' && response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // Don't show error toast for empty history
      if (error instanceof Error && !error.message.includes('404')) {
        toast({
          title: "Failed to load chat history",
          description: error.message,
        });
      }
    }
  }

  /**
   * Handle sending a message
   */
  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Validate knowledge base is selected
    if (!selectedKnowledgeBase) {
      toast({
        title: "No knowledge base selected",
        description: "Please select a knowledge base first.",
      });
      return;
    }

    const userMessage: Message = {
      messageContent: inputText,
      type: 'human',
      knowledgeBase: selectedKnowledgeBase, // Store which KB was selected
    };

    // Add user message to UI
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Send to backend
      const response = await sendChatMessage(inputText, selectedKnowledgeBase);

      if (response.status === 'success' && response.data) {
        const aiMessage: Message = {
          messageContent: response.data.messageContent,
          type: 'ai',
        };

        // Add AI response to UI
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Please try again.",
      });

      // Remove the user message if sending failed
      setMessages(prev => prev.slice(0, -1));
      // Restore input text
      setInputText(userMessage.messageContent);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle clearing chat history
   */
  const handleClearHistory = async () => {
    try {
      await clearChatHistory();
      setMessages([]);
      toast({
        title: "✓ Chat history cleared",
        description: "Starting fresh conversation",
      });
    } catch (error) {
      console.error('Failed to clear chat history:', error);
      toast({
        title: "Error clearing history",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full border-2 border-dashed border-border flex items-center justify-center gap-3 mb-6">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
              <Bot className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Start a conversation
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Ask questions about your captured knowledge
            </p>
          </div>
        ) : (
          /* Chat messages */
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.type === 'human' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    message.type === 'human'
                      ? 'bg-blue-500 text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {message.type === 'human' ? (
                    <div className="relative">
                      {message.knowledgeBase && (
                        <div className="flex items-start mb-1">
                          <span className="text-xs opacity-70 bg-white/20 px-2 py-0.5 rounded-full">
                            {message.knowledgeBase}
                          </span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.messageContent}</p>
                    </div>
                  ) : (
                    <div className="text-sm markdown-content">
                      <ReactMarkdown>{message.messageContent}</ReactMarkdown>
                    </div>
                  )}
                </div>
                {message.type === 'human' && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-6 pb-3 border-t border-border pt-3">
        <div className="flex items-center gap-2 mb-2">
          <Input
            placeholder="Ask a question about your knowledge..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="rounded-full w-10 h-10 shrink-0 bg-blue-500 hover:bg-blue-600"
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>

        {/* Bottom bar: Knowledge base selector + Clear history button */}
        <div className="flex items-center justify-between gap-2">
          <Select value={selectedKnowledgeBase} onValueChange={setSelectedKnowledgeBase}>
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

          {/* Clear history button */}
          {messages.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full w-10 h-10 shrink-0"
                  onClick={handleClearHistory}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear chat history</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
