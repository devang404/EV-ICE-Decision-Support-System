import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, Bot, User, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ScenarioContext {
  petrolPrice: number;
  electricityRate: number;
  chargingCost: number;
  gridCO2Factor: number;
  evSubsidy: number;
  evPriceReduction: number;
  showGreenGrid: boolean;
  evTCO?: number;
  iceTCO?: number;
  savings?: number;
  breakEven?: string;
  co2Savings?: number;
  evRecommended?: boolean;
}

interface ScenarioChatbotProps {
  scenarioContext: ScenarioContext;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scenario-chat`;

export const ScenarioChatbot = ({ scenarioContext }: ScenarioChatbotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages, scenarioContext }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment and try again.");
      }
      if (resp.status === 402) {
        throw new Error("AI credits exhausted. Please add more credits.");
      }
      throw new Error(errorData.error || "Failed to get response");
    }

    if (!resp.body) {
      throw new Error("No response body");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });
      
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat(newMessages);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "How do these parameters affect my decision?",
    "When will EVs become more economical?",
    "What's the environmental impact?",
  ];

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 transition-all",
          "bg-gradient-to-r from-ev to-ev/80 hover:from-ev/90 hover:to-ev/70",
          isOpen && "scale-0 opacity-0"
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Panel */}
      <Card
        className={cn(
          "fixed bottom-6 right-6 w-[380px] max-h-[600px] z-50 shadow-2xl transition-all duration-300 flex flex-col",
          "border-ev/20 bg-card/95 backdrop-blur-sm",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <CardHeader className="pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-ev to-ev/70 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              Scenario Advisor
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ask questions about your EV vs ICE scenario
          </p>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg rounded-tl-none p-3 text-sm">
                    Hi! I'm your EV scenario advisor. I can help you understand how your current parameters affect the EV vs ICE decision. What would you like to know?
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Try asking:</p>
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q)}
                      className="block w-full text-left text-xs p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn("flex items-start gap-3", msg.role === "user" && "flex-row-reverse")}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                        msg.role === "user" ? "bg-primary" : "bg-muted"
                      )}
                    >
                      {msg.role === "user" ? (
                        <User className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "rounded-lg p-3 text-sm max-w-[80%]",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted rounded-tl-none"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted rounded-lg rounded-tl-none p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your scenario..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
