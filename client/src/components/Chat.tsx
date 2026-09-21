import { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import type { ChatMessage } from '../hooks/useSignaling';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Chat({ messages, onSendMessage, isOpen, onClose }: ChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-[#0a0b0e] border-l border-white/5 flex flex-col animate-slideIn">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-semibold text-[#e8eaed]">Chat</h3>
        <button onClick={onClose} className="text-[#888c96] hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-[#888c96] text-sm text-center">No messages yet. Say hello!</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-[#7c5cff] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {msg.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-[#e8eaed] text-sm">{msg.username}</span>
                <span className="text-[#888c96] text-xs">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[#e8eaed] text-sm mt-0.5">{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/5">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-[#13141a] text-[#e8eaed] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7c5cff]/30 border border-white/5"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 bg-[#7c5cff] text-white rounded-xl hover:bg-[#6a4de0] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
