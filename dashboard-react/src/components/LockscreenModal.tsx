import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Eye, EyeOff, Lock, ArrowRight, Server } from 'lucide-react';

interface LockscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (apiKey: string) => void;
  currentApiKey: string;
}

export function LockscreenModal({ isOpen, onClose, onAuthenticate, currentApiKey }: LockscreenModalProps) {
  const [inputKey, setInputKey] = useState(currentApiKey);
  const [showKey, setShowKey] = useState(false);
  const [environment, setEnvironment] = useState<'production' | 'staging' | 'local'>('production');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuthenticate(inputKey.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#201E1E]/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#FDFBFC] border border-[#A68B78]/30 p-8 shadow-2xl relative overflow-hidden font-sans"
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#164A40]" />

        <div className="flex items-center space-x-4 mb-6">
          <div className="w-10 h-10 bg-[#164A40] flex items-center justify-center text-[#F7D3CC]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#164A40]">Console Lockscreen</h3>
            <p className="text-xs text-[#634F43] font-editorial italic">SentinAI Session Security Gate</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 font-sans">
          {/* Target Environment Selector */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#634F43] mb-2 flex items-center justify-between font-medium">
              <span>Target Environment</span>
              <Server className="w-3.5 h-3.5 text-[#164A40]" />
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              {(['production', 'staging', 'local'] as const).map((env) => (
                <button
                  type="button"
                  key={env}
                  onClick={() => setEnvironment(env)}
                  className={`py-2 px-3 border transition-colors text-center capitalize ${
                    environment === env
                      ? 'bg-[#164A40] border-[#164A40] text-[#F7D3CC] font-bold'
                      : 'bg-[#F4EFEB] border-[#A68B78]/30 text-[#634F43] hover:border-[#164A40]'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          {/* Client API Key Input */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#634F43] mb-2 flex items-center justify-between font-medium">
              <span>Client API Key</span>
              <Key className="w-3.5 h-3.5 text-[#164A40]" />
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="sentin_live_xxxxxxxxxxxxxxxx"
                className="w-full bg-[#F4EFEB] border border-[#A68B78]/30 px-4 py-2.5 text-xs font-mono text-[#201E1E] placeholder-[#A68B78]/70 focus:outline-none focus:border-[#164A40] transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A68B78] hover:text-[#164A40] transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#634F43] mt-1.5 font-sans">
              Keys are encrypted locally and injected into HTTP header <code className="text-[#164A40] font-mono font-bold">X-API-Key</code>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-between space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#F4EFEB] border border-[#A68B78]/30 text-xs font-sans font-semibold text-[#634F43] hover:text-[#164A40] hover:border-[#164A40] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-[#164A40] hover:bg-[#0f362e] text-[#FDFBFC] font-sans font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <span>Unlock Session</span>
              <ArrowRight className="w-4 h-4 text-[#F7D3CC]" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
