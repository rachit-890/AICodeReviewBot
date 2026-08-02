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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09100e]/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#161d1b] border border-[#3c4a46] p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Top hairline indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2dd4bf] via-[#57f1db] to-[#00574d]" />

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-[#1a211f] border border-[#3c4a46] flex items-center justify-center text-[#2dd4bf]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-[#dde4e1] tracking-wide">CONSOLE LOCKSCREEN</h3>
            <p className="text-xs text-[#bacac5] font-mono">SentinAI Session Security Gate</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Target Environment Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#bacac5] font-mono uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Target Environment</span>
              <Server className="w-3.5 h-3.5 text-[#2dd4bf]" />
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              {(['production', 'staging', 'local'] as const).map((env) => (
                <button
                  type="button"
                  key={env}
                  onClick={() => setEnvironment(env)}
                  className={`py-2 px-3 border transition-colors text-center capitalize ${
                    environment === env
                      ? 'bg-[#00574d]/30 border-[#2dd4bf] text-[#57f1db] font-bold'
                      : 'bg-[#1a211f] border-[#3c4a46] text-[#bacac5] hover:border-[#859490]'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          {/* Client API Key Input */}
          <div>
            <label className="block text-xs font-semibold text-[#bacac5] font-mono uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Client API Key</span>
              <Key className="w-3.5 h-3.5 text-[#2dd4bf]" />
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="sentin_live_xxxxxxxxxxxxxxxx"
                className="w-full bg-[#09100e] border border-[#3c4a46] px-4 py-2.5 text-sm font-mono text-[#dde4e1] placeholder-[#859490]/50 focus:outline-none focus:border-[#2dd4bf] transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bacac5] hover:text-[#2dd4bf] transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#bacac5]/70 mt-1.5 font-mono">
              Keys are encrypted locally and injected into HTTP header <code className="text-[#2dd4bf]">X-API-Key</code>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1a211f] border border-[#3c4a46] text-xs font-mono text-[#bacac5] hover:text-[#dde4e1] hover:border-[#859490] transition-colors"
            >
              CANCEL
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-[#2dd4bf] hover:bg-[#57f1db] text-[#0e1513] font-bold text-xs font-mono tracking-wider transition-colors flex items-center justify-center space-x-2"
            >
              <span>UNLOCK SESSION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
