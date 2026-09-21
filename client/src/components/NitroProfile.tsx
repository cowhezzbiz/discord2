import { useState } from 'react';
import { Palette, Image, Sparkles, X } from 'lucide-react';

interface ProfileCustomization {
  profileGif?: string;
  bannerUrl?: string;
  accentColor: string;
  bio?: string;
}

interface NitroProfileProps {
  username: string;
  customization: ProfileCustomization;
  onUpdateCustomization: (updates: Partial<ProfileCustomization>) => void;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#7c5cff', '#57f287', '#fee75c', '#eb459e', '#f87171',
  '#4ade80', '#fbbf24', '#f47b67', '#9b59b6', '#1abc9c',
  '#e91e63', '#ff9800', '#795548', '#607d8b', '#00bcd4',
  '#8bc34a', '#ffeb3b', '#ffc107', '#ff5722', '#673ab7',
];

export function NitroProfile({
  username,
  customization,
  onUpdateCustomization,
  isOpen,
  onClose,
}: NitroProfileProps) {
  const [gifUrl, setGifUrl] = useState(customization.profileGif || '');
  const [bannerUrl, setBannerUrl] = useState(customization.bannerUrl || '');

  if (!isOpen) return null;

  const handleSaveGif = () => {
    if (gifUrl.trim()) {
      onUpdateCustomization({ profileGif: gifUrl.trim() });
    }
  };

  const handleSaveBanner = () => {
    if (bannerUrl.trim()) {
      onUpdateCustomization({ bannerUrl: bannerUrl.trim() });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-[#0f1014] rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-[#fbbf24]" />
            Profile Customization
          </h2>
          <button onClick={onClose} className="text-[#888c96] hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Preview */}
          <div className="rounded-2xl overflow-hidden bg-[#0a0b0e] border border-white/5">
            {/* Banner */}
            <div
              className="h-24 bg-cover bg-center"
              style={{
                backgroundColor: customization.accentColor,
                backgroundImage: customization.bannerUrl ? `url(${customization.bannerUrl})` : 'none',
              }}
            />
            
            {/* Avatar */}
            <div className="px-4 pb-4">
              <div className="-mt-10 mb-3">
                {customization.profileGif ? (
                  <img
                    src={customization.profileGif}
                    alt="Profile"
                    className="w-20 h-20 rounded-full border-4 border-[#0f1014] object-cover shadow-lg"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-[#0f1014] shadow-lg"
                    style={{ backgroundColor: customization.accentColor }}
                  >
                    {username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h3 className="text-white font-semibold text-lg">{username}</h3>
              {customization.bio && (
                <p className="text-[#888c96] text-sm mt-1">{customization.bio}</p>
              )}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-[#e8eaed] text-sm font-medium mb-2 flex items-center gap-2">
              <Palette size={16} />
              Accent Color
            </label>
            <div className="grid grid-cols-10 gap-2 mb-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateCustomization({ accentColor: color })}
                  className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                    customization.accentColor === color ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              type="color"
              value={customization.accentColor}
              onChange={(e) => onUpdateCustomization({ accentColor: e.target.value })}
              className="w-full h-10 rounded-xl cursor-pointer border border-white/10"
            />
          </div>

          {/* Profile GIF */}
          <div>
            <label className="block text-[#e8eaed] text-sm font-medium mb-2 flex items-center gap-2">
              <Image size={16} className="text-[#fbbf24]" />
              Profile Picture GIF (Nitro)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={gifUrl}
                onChange={(e) => setGifUrl(e.target.value)}
                placeholder="Paste GIF URL (e.g., from Tenor or Giphy)"
                className="flex-1 bg-[#13141a] text-[#e8eaed] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7c5cff]/30 border border-white/5"
              />
              <button
                onClick={handleSaveGif}
                className="px-4 py-2 bg-[#7c5cff] text-white rounded-xl font-medium hover:bg-[#6a4de0] transition-all"
              >
                Save
              </button>
            </div>
            {customization.profileGif && (
              <button
                onClick={() => {
                  onUpdateCustomization({ profileGif: undefined });
                  setGifUrl('');
                }}
                className="mt-2 text-[#f87171] text-sm hover:underline"
              >
                Remove GIF
              </button>
            )}
          </div>

          {/* Banner URL */}
          <div>
            <label className="block text-[#e8eaed] text-sm font-medium mb-2 flex items-center gap-2">
              <Image size={16} className="text-[#fbbf24]" />
              Banner Image (Nitro)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="Paste banner image URL"
                className="flex-1 bg-[#13141a] text-[#e8eaed] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7c5cff]/30 border border-white/5"
              />
              <button
                onClick={handleSaveBanner}
                className="px-4 py-2 bg-[#7c5cff] text-white rounded-xl font-medium hover:bg-[#6a4de0] transition-all"
              >
                Save
              </button>
            </div>
            {customization.bannerUrl && (
              <button
                onClick={() => {
                  onUpdateCustomization({ bannerUrl: undefined });
                  setBannerUrl('');
                }}
                className="mt-2 text-[#f87171] text-sm hover:underline"
              >
                Remove Banner
              </button>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[#e8eaed] text-sm font-medium mb-2">About Me</label>
            <textarea
              value={customization.bio || ''}
              onChange={(e) => onUpdateCustomization({ bio: e.target.value.slice(0, 190) })}
              placeholder="Tell people about yourself..."
              className="w-full bg-[#13141a] text-[#e8eaed] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7c5cff]/30 resize-none h-20 border border-white/5"
            />
            <p className="text-[#888c96] text-xs mt-1">
              {(customization.bio || '').length}/190
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
