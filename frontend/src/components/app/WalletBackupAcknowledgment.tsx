import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Copy } from 'lucide-react';

interface WalletBackupAcknowledgmentProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface Prompt {
  type: 'message' | 'input' | 'phrase' | 'word_verification' | 'success' | 'error';
  content: string;
  data?: any;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function WalletBackupAcknowledgment({ onComplete, onCancel }: WalletBackupAcknowledgmentProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Start the acknowledgment process
  useEffect(() => {
    startAcknowledgment();
    return () => {
      // Cleanup on unmount
      if (sessionId) {
        fetch(`${API_URL}/api/wallet/backup/session/${sessionId}`, { method: 'DELETE' }).catch(console.error);
      }
    };
  }, []);

  const startAcknowledgment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/wallet/backup/start`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.sessionId) {
        setSessionId(data.sessionId);
        if (data.prompts && data.prompts.length > 0) {
          setCurrentPrompt(data.prompts[0]);
        }
        // Start polling for updates
        pollStatus(data.sessionId);
      } else {
        setError(data.error || 'Failed to start backup acknowledgment');
      }
    } catch (err) {
      console.error('Failed to start acknowledgment:', err);
      setError('Failed to start backup acknowledgment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pollStatus = async (sid: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/wallet/backup/status/${sid}`);
        const data = await res.json();
        if (data.prompt) {
          setCurrentPrompt(data.prompt);
          if (data.prompt.type === 'success') {
            clearInterval(interval);
            setTimeout(() => onComplete(), 2000);
          } else if (data.prompt.type === 'error') {
            clearInterval(interval);
            setError(data.prompt.content);
          }
        }
        if (data.status?.isComplete) {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Failed to poll status:', err);
      }
    }, 1000); // Poll every second

    // Cleanup after 10 minutes
    setTimeout(() => clearInterval(interval), 600000);
  };

  const sendResponse = async (response: string) => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/wallet/backup/respond/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response })
      });
      const data = await res.json();
      if (data.prompt) {
        setCurrentPrompt(data.prompt);
        if (data.prompt.type === 'success') {
          setTimeout(() => onComplete(), 2000);
        } else if (data.prompt.type === 'error') {
          setError(data.prompt.content);
        }
      }
    } catch (err) {
      console.error('Failed to send response:', err);
      setError('Failed to send response. Please try again.');
    } finally {
      setIsLoading(false);
      setInputValue('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && currentPrompt?.type !== 'input') return;
    
    if (currentPrompt?.type === 'word_verification') {
      sendResponse(inputValue.trim().toLowerCase());
    } else if (currentPrompt?.type === 'input') {
      sendResponse(inputValue.trim() || ''); // Empty string for default/Enter
    }
  };

  const handlePhraseComplete = () => {
    sendResponse(''); // Send Enter key
  };

  const copyPhrase = () => {
    if (recoveryPhrase.length === 24) {
      const phraseText = recoveryPhrase.map((w, i) => `${i + 1}: ${w}`).join('\n');
      navigator.clipboard.writeText(phraseText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Extract recovery phrase from prompt data
  useEffect(() => {
    if (currentPrompt?.type === 'phrase' && currentPrompt.data?.phrase) {
      setRecoveryPhrase(currentPrompt.data.phrase);
    }
  }, [currentPrompt]);

  if (error && !currentPrompt) {
    return (
      <Card className="w-full max-w-md mx-auto mt-10 bg-midnight-graphite border-neutral-800">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-red-400">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={startAcknowledgment} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={onCancel} variant="ghost">
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentPrompt?.type === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto mt-10 bg-midnight-graphite border-neutral-800">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-green-400 font-semibold">{currentPrompt.content}</p>
            <p className="text-sm text-gray-400">Redirecting...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10 bg-midnight-graphite border-neutral-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-yellow-500" />
          Wallet Backup Acknowledgment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recovery Phrase Display */}
        {currentPrompt?.type === 'phrase' && recoveryPhrase.length === 24 && (
          <div className="space-y-3">
            <div className="p-4 bg-obsidian border border-yellow-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-yellow-200 font-semibold text-sm">Recovery Phrase (24 words)</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyPhrase}
                  className="text-yellow-400 hover:text-yellow-300"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                {recoveryPhrase.map((word, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="text-gray-500 w-6">{idx + 1}:</span>
                    <span className="text-white">{word}</span>
                  </div>
                ))}
              </div>
              <p className="text-yellow-300/80 text-xs mt-3">
                ⚠️ Write this down securely! You'll need it to restore your wallet.
              </p>
            </div>
            <Button
              onClick={handlePhraseComplete}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              disabled={isLoading}
            >
              I've Written It Down - Continue
            </Button>
          </div>
        )}

        {/* Word Verification */}
        {currentPrompt?.type === 'word_verification' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-gray-300 text-sm">{currentPrompt.content}</p>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter the word"
              className="bg-obsidian border-neutral-700 text-white"
              disabled={isLoading}
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isLoading || !inputValue.trim()}>
                {isLoading ? 'Verifying...' : 'Submit'}
              </Button>
              <Button type="button" onClick={onCancel} variant="ghost" disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Text Input (filename) */}
        {currentPrompt?.type === 'input' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-gray-300 text-sm">{currentPrompt.content}</p>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Filename (or press Enter for default)"
              className="bg-obsidian border-neutral-700 text-white"
              disabled={isLoading}
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Continue'}
              </Button>
              <Button type="button" onClick={onCancel} variant="ghost" disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* General Message */}
        {currentPrompt?.type === 'message' && (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{currentPrompt.content}</p>
            {isLoading && (
              <div className="flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-zec-indigo animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

