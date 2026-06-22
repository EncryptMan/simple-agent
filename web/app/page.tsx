"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createThread, generateResponse, getAssistant } from "@/lib/action";
import { Bot, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";

// Use the schema returned by langchain agent to define the Message type
type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export default function Home() {
  
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Fetch the assistant when the component mounts
    async function fetchAssistant() {
      try {
        const id = await getAssistant("agent");
        setAssistantId(id);
      } catch (error) {
        console.error("Error fetching assistant:", error);
      }
    }

    fetchAssistant();
  }, []);

  useEffect(() => {
    // scroll to bottom when messages change
    const el = containerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !assistantId) {
      console.warn("Input is empty or assistant not ready");
      return;
    }

    if (!threadId) {
      const newThreadId = await createThread();
      console.log("New thread created with ID:", newThreadId);
      setThreadId(newThreadId);
    }

    if (!threadId) {
      console.error("Failed to create thread");
      return;
    }

    // Add user message to the conversation
    const newMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    setLoading(true);

    const assistantResponse = await generateResponse(assistantId, threadId, input);
    const assistantMessage: Message = { role: "assistant", content: assistantResponse };
    setMessages((prev) => [...prev, assistantMessage]);
    setLoading(false);
  }

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-4 flex flex-col">
      <div ref={containerRef} className="chat-scrollbar flex-1 overflow-auto pb-4 max-h-[87vh]">
        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`mb-4 flex items-start gap-2 ${msg.role === "user" ? "justify-end text-right" : "justify-start text-left"}`}
          >
            {msg.role !== "user" && <Bot className="mt-1 h-5 w-5 shrink-0" />}
            <div>
              <p
                className={`font-semibold flex items-center gap-1 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? "You" : "Agent"}
              </p>
              <p>{msg.content}</p>
            </div>
            {msg.role === "user" && <User className="mt-1 h-5 w-5 shrink-0" />}
          </div>
        ))}
        { loading && (
          <div className="mb-4 flex items-start gap-2 justify-start text-left">
            <Bot className="mt-1 h-5 w-5 shrink-0 animate-pulse" />
            <div>
              <p className="font-semibold flex items-center gap-1 justify-start">
                Agent
              </p>
              <p>Typing...</p>
            </div>
          </div>
        )}
      </div>
      <div className="mt-auto flex flex-col gap-2 ">
        <Input
          type="text"
          placeholder="Type your message here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button variant={"default"} className="w-full" onClick={handleSend}>
          Send
        </Button>
      </div>
      <style jsx global>{`
        .chat-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.5) transparent;
        }

        .chat-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .chat-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.45);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: content-box;
        }

        .chat-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(100, 116, 139, 0.65);
          background-clip: content-box;
        }
      `}</style>
    </main>
  );
}
