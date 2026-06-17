"use client";

import { useEffect, useCallback } from "react";
import { useAICommand } from "@/lib/ai-command-context";
import { AIInputWithSearch } from "@/components/ui/ai-input-with-search";
import { useChatBot } from "@/lib/use-chat-bot";
import { useGoogle } from "@/lib/google-context";
import { motion, AnimatePresence } from "framer-motion";
import { DataBubble } from "@/components/ui/data-bubble";
import ReactMarkdown from "react-markdown";

export function AICommandModal() {
  const { isOpen, close, open } = useAICommand();
  const { messages, isLoading, sendMessage } = useChatBot();
  const { googleAccessToken } = useGoogle();
  const hasMessages = messages.length > 0;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey) {
        e.preventDefault();
        if (isOpen) {
          close();
        } else {
          open();
        }
      }
      if (e.key === "Escape" && isOpen) {
        close();
      }
    },
    [open, close, isOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSubmit = (text: string, activeAction?: string | null) => {
    sendMessage(text, activeAction || null, googleAccessToken || undefined);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-40"
          />

          {/* Chat container - changes layout when messages exist */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed z-50 flex flex-col items-center px-4 ${
              hasMessages
                ? 'inset-0 top-0 w-full'
                : 'left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-full max-w-4xl'
            }`}
          >
            {/* Input bubble - goes to top when messages exist */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              layout
              className={`w-full bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-2xl shadow-lg overflow-hidden ${
                hasMessages ? 'max-w-4xl mt-4' : ''
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <AIInputWithSearch
                placeholder="What would you like to do?"
                minHeight={50}
                maxHeight={150}
                onSubmit={handleSubmit}
              />
            </motion.div>

            {/* Messages area - appears below input when exists */}
            {hasMessages && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex-1 w-full max-w-4xl mx-auto mt-4 overflow-y-auto pb-4"
              >
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col gap-2 w-full">
                      {msg.role === 'user' ? (
                        <div className="flex justify-end">
                          <div className="bg-[var(--color-accent)] text-[var(--color-text-primary)] rounded-lg px-4 py-2 max-w-2xl text-base">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <>
                          {msg.content && (
                            <div className="flex justify-start">
                              <div className="bg-[var(--color-bg-base)] text-[var(--color-text-primary)] rounded-lg px-4 py-2 max-w-2xl text-base">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p>{children}</p>,
                                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                                    em: ({ children }) => <em className="italic">{children}</em>,
                                    ul: ({ children }) => <ul className="list-disc ml-4">{children}</ul>,
                                    li: ({ children }) => <li>{children}</li>,
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                          {msg.bubbles && msg.bubbles.length > 0 && (
                            <div className="flex flex-col gap-3 justify-start">
                              {msg.bubbles.map((bubble, idx) => (
                                <DataBubble
                                  key={idx}
                                  type={bubble.type}
                                  title={bubble.title}
                                  subtitle={bubble.subtitle}
                                  description={bubble.description}
                                  metadata={bubble.metadata as any}
                                  badge={bubble.badge}
                                  actions={bubble.actions}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-lg px-4 py-2 text-base">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce delay-100" />
                          <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
