import { useState } from 'react';
import { Users, LogIn } from 'lucide-react';

interface LobbyProps {
  onJoin: (username: string, roomId: string) => void;
}

export function Lobby({ onJoin }: LobbyProps) {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && roomId.trim()) {
      onJoin(username.trim(), roomId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#050608] via-[#0a0b0e] to-[#0d0e12]" />
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-[#7c5cff]/10 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-[#b388ff]/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#5865f2]/5 rounded-full blur-3xl" />
      
      <div className="bg-[#0f1014]/90 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10 border border-white/10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 gradient-premium rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#7c5cff]/40 animate-glow">
            <Users size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Discord 2</h1>
          <p className="text-[#888c96] text-sm">Premium voice & video calls</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[#e8eaed] text-sm font-medium mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your nickname"
              className="w-full bg-[#13141a] border border-white/10 text-white rounded-xl px-4 py-3.5 focus:border-[#7c5cff] focus:ring-2 focus:ring-[#7c5cff]/20 transition-all placeholder:text-[#6b7280]"
              required
            />
          </div>

          <div>
            <label className="block text-[#e8eaed] text-sm font-medium mb-1.5">Room ID</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="e.g., barbershop, gaming"
              className="w-full bg-[#13141a] border border-white/10 text-white rounded-xl px-4 py-3.5 focus:border-[#7c5cff] focus:ring-2 focus:ring-[#7c5cff]/20 transition-all placeholder:text-[#6b7280]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!username.trim() || !roomId.trim()}
            className="w-full gradient-premium text-white font-semibold py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-[#7c5cff]/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-base"
          >
            <LogIn size={20} />
            Join Call
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-[#13141a]/60 rounded-xl border border-white/5">
          <p className="text-[#888c96] text-sm">
            <strong className="text-[#e8eaed]">Tip:</strong> Share the Room ID with friends so they can join the same call!
          </p>
        </div>
      </div>
    </div>
  );
}
