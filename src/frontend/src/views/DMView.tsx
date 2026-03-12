import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, MessageSquare, MessagesSquare, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { View } from "../App";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatContext {
  taskId: bigint | string;
  taskTitle: string;
  creatorId: string;
  viewerId: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

interface ConversationMeta {
  storageKey: string;
  taskId: string;
  taskTitle: string;
  creatorId: string;
  viewerId: string;
  currentUserId: string;
  lastMessage?: string;
  lastTimestamp?: number;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function buildStorageKey(
  taskId: bigint | string,
  creatorId: string,
  viewerId: string,
) {
  const sorted = [creatorId, viewerId].sort().join("_");
  return `proxiis_chat_${taskId.toString()}_${sorted}`;
}

function loadMessages(storageKey: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveMessages(storageKey: string, messages: ChatMessage[]) {
  localStorage.setItem(storageKey, JSON.stringify(messages));
}

function loadAllConversationKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("proxiis_chat_")) {
      keys.push(k);
    }
  }
  return keys;
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 30) return "just now";
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Conversation metadata stored alongside chat key ─────────────────────────

const META_PREFIX = "proxiis_chatmeta_";

function saveMeta(
  storageKey: string,
  meta: Omit<ConversationMeta, "storageKey">,
) {
  localStorage.setItem(META_PREFIX + storageKey, JSON.stringify(meta));
}

function loadMeta(storageKey: string): ConversationMeta | null {
  try {
    const raw = localStorage.getItem(META_PREFIX + storageKey);
    if (!raw) return null;
    return { storageKey, ...JSON.parse(raw) } as ConversationMeta;
  } catch {
    return null;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DMViewProps {
  chatContext: ChatContext | null;
  onNavigate: (view: View) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DMView({ chatContext, onNavigate }: DMViewProps) {
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ConversationMeta | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [, setTick] = useState(0); // force re-render for relative timestamps
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Load all conversations from localStorage ──────────────────────────────
  const refreshConversations = useCallback(() => {
    const keys = loadAllConversationKeys();
    const metas: ConversationMeta[] = keys
      .map((key) => loadMeta(key))
      .filter((m): m is ConversationMeta => m !== null)
      .sort((a, b) => (b.lastTimestamp ?? 0) - (a.lastTimestamp ?? 0));
    setConversations(metas);
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // ── Open a conversation thread ─────────────────────────────────────────────
  const openConversation = useCallback((conv: ConversationMeta) => {
    const msgs = loadMessages(conv.storageKey);
    setActiveConversation(conv);
    setMessages(msgs);
    setTimeout(() => {
      inputRef.current?.focus();
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  // ── Handle incoming chatContext (navigate from task details) ──────────────
  useEffect(() => {
    if (!chatContext) return;

    const storageKey = buildStorageKey(
      chatContext.taskId,
      chatContext.creatorId,
      chatContext.viewerId,
    );

    // Ensure meta exists
    const existingMeta = loadMeta(storageKey);
    if (!existingMeta) {
      const meta: Omit<ConversationMeta, "storageKey"> = {
        taskId: chatContext.taskId.toString(),
        taskTitle: chatContext.taskTitle,
        creatorId: chatContext.creatorId,
        viewerId: chatContext.viewerId,
        currentUserId: chatContext.viewerId,
      };
      saveMeta(storageKey, meta);
    }

    const meta = loadMeta(storageKey);
    if (meta) {
      refreshConversations();
      openConversation(meta);
    }
  }, [chatContext, openConversation, refreshConversations]);

  // ── Auto-scroll on new messages ────────────────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: bottomRef is a stable ref object, no need in deps
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Relative time tick every 30 s ─────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // ── Send a message ─────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!inputText.trim() || !activeConversation) return;

    const newMsg: ChatMessage = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      senderId: activeConversation.currentUserId,
      text: inputText.trim(),
      timestamp: Date.now(),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    saveMessages(activeConversation.storageKey, updated);

    // Update meta with last message preview
    const updatedMeta: Omit<ConversationMeta, "storageKey"> = {
      ...activeConversation,
      lastMessage: newMsg.text,
      lastTimestamp: newMsg.timestamp,
    };
    saveMeta(activeConversation.storageKey, updatedMeta);
    setActiveConversation({ ...activeConversation, ...updatedMeta });

    setInputText("");
    refreshConversations();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Layout logic ──────────────────────────────────────────────────────────
  // Mobile: show thread if activeConversation, else show list
  // Desktop: always show both panels side by side

  const renderEmptyConversations = () => (
    <div
      data-ocid="chat.empty_state"
      className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[oklch(0.8_0.25_150)]/20 to-[oklch(0.7_0.2_270)]/20 border border-[oklch(0.8_0.25_150)]/30 flex items-center justify-center">
        <MessagesSquare className="w-7 h-7 text-[oklch(0.8_0.25_150)]" />
      </div>
      <div>
        <p className="font-semibold text-foreground text-base">
          No conversations yet
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Click "Discuss on Chat" on any task post to start chatting.
        </p>
      </div>
    </div>
  );

  const renderConversationList = () => (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border/50 flex-shrink-0">
        <Button
          data-ocid="chat.back_button"
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("hub")}
          className="hover:bg-primary/10 hover:text-primary transition-colors rounded-full flex-shrink-0"
          aria-label="Back to hub"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-black bg-gradient-to-r from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] bg-clip-text text-transparent flex-1">
          Messages
        </h2>
        <MessageSquare className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Conversation list */}
      {conversations.length === 0 ? (
        renderEmptyConversations()
      ) : (
        <ScrollArea className="flex-1">
          <div className="py-2">
            {conversations.map((conv, idx) => {
              const isActive =
                activeConversation?.storageKey === conv.storageKey;
              const ocid = `chat.conversation.item.${idx + 1}` as const;
              const otherUserId =
                conv.currentUserId === conv.creatorId
                  ? conv.viewerId
                  : conv.creatorId;
              const initials = otherUserId.slice(0, 2).toUpperCase();

              return (
                <button
                  type="button"
                  key={conv.storageKey}
                  data-ocid={ocid}
                  onClick={() => openConversation(conv)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-muted/40 ${
                    isActive
                      ? "bg-[oklch(0.8_0.25_150)]/10 border-r-2 border-[oklch(0.8_0.25_150)]"
                      : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[oklch(0.8_0.25_150)]/40 to-[oklch(0.7_0.2_270)]/40 border border-[oklch(0.8_0.25_150)]/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[oklch(0.8_0.25_150)]">
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-foreground truncate leading-tight">
                        {conv.taskTitle}
                      </p>
                      {conv.lastTimestamp && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {relativeTime(conv.lastTimestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {conv.lastMessage ?? "No messages yet — say hi!"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  const renderThread = () => {
    if (!activeConversation) {
      // Desktop empty thread state
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[oklch(0.8_0.25_150)]/20 to-[oklch(0.7_0.2_270)]/20 border border-border/50 flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              Select a conversation
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Choose from the left to start chatting
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Thread header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border/50 flex-shrink-0 backdrop-blur-xl bg-card/30">
          {/* Mobile back button */}
          <Button
            data-ocid="chat.thread_back_button"
            variant="ghost"
            size="icon"
            onClick={() => setActiveConversation(null)}
            className="md:hidden hover:bg-primary/10 hover:text-primary transition-colors rounded-full flex-shrink-0"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[oklch(0.8_0.25_150)]/40 to-[oklch(0.7_0.2_270)]/40 border border-[oklch(0.8_0.25_150)]/30 flex items-center justify-center text-xs font-bold text-[oklch(0.8_0.25_150)] flex-shrink-0">
            {(activeConversation.currentUserId === activeConversation.creatorId
              ? activeConversation.viewerId
              : activeConversation.creatorId
            )
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground truncate leading-tight">
              {activeConversation.taskTitle}
            </p>
            <p className="text-xs text-muted-foreground truncate">Task chat</p>
          </div>
        </div>

        {/* Message bubbles */}
        <ScrollArea className="flex-1 px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
              <p className="text-sm text-muted-foreground">No messages yet.</p>
              <p className="text-xs text-muted-foreground/70">
                Send the first message to start the conversation!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((msg) => {
                const isSelf =
                  msg.senderId === activeConversation.currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] ${isSelf ? "items-end" : "items-start"} flex flex-col gap-1`}
                    >
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                          isSelf
                            ? "bg-gradient-to-br from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] text-black font-medium rounded-br-md"
                            : "bg-muted/60 backdrop-blur-sm text-foreground border border-border/50 rounded-bl-md"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-muted-foreground px-1">
                        {relativeTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input area */}
        <div className="px-4 py-3 border-t border-border/50 backdrop-blur-xl bg-card/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              data-ocid="chat.message_input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 backdrop-blur-xl bg-background/60 border-border/80 focus-visible:ring-[oklch(0.8_0.25_150)] rounded-full px-4"
              autoComplete="off"
            />
            <Button
              data-ocid="chat.send_button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              size="icon"
              className="bg-gradient-to-br from-[oklch(0.8_0.25_150)] to-[oklch(0.7_0.2_270)] hover:opacity-90 text-black rounded-full h-10 w-10 flex-shrink-0 disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Desktop: two-panel layout. Mobile: single panel with toggle */}
      <div className="flex flex-1 h-screen max-h-screen overflow-hidden">
        {/* ── Left: Conversation list ───────────────────────────────────────── */}
        {/* On mobile: hide list when a thread is open */}
        <aside
          className={`
            ${activeConversation ? "hidden md:flex" : "flex"}
            flex-col w-full md:w-80 lg:w-96
            border-r border-border/50
            backdrop-blur-xl bg-card/30
            flex-shrink-0
          `}
        >
          {renderConversationList()}
        </aside>

        {/* ── Right: Message thread ─────────────────────────────────────────── */}
        <main
          className={`
            ${activeConversation ? "flex" : "hidden md:flex"}
            flex-col flex-1
            backdrop-blur-xl bg-background/60
            min-w-0
          `}
        >
          {renderThread()}
        </main>
      </div>
    </div>
  );
}
