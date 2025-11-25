import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, RefreshCw, Copy, Check, Wallet, AlertCircle } from 'lucide-react';
import { WalletBackupAcknowledgment } from './WalletBackupAcknowledgment';

interface WalletInfo {
  address: string;
  balance: number;
  shieldedBalance: number;
  shieldedAddress: string;
}

interface UserInfo {
  username: string;
  address: string;
  shieldedAddress: string;
}

interface InitializationStatus {
  initialized: boolean;
  error?: string;
}

export function WalletManager() {
  const [username, setUsername] = useState('');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [shielding, setShielding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [initStatus, setInitStatus] = useState<InitializationStatus | null>(null);
  const [checkingInit, setCheckingInit] = useState(true);
  const [backupRequired, setBackupRequired] = useState(false);
  const [showInteractiveBackup, setShowInteractiveBackup] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Check initialization status on mount
  useEffect(() => {
    checkInitializationStatus();
  }, []);

  const checkInitializationStatus = async () => {
    setCheckingInit(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/initialization-status`);
      const data = await res.json();
      setInitStatus(data);
      setBackupRequired(!data.initialized);
    } catch (error) {
      console.error('Failed to check initialization status:', error);
      setInitStatus({ initialized: false, error: 'Failed to check wallet status' });
      setBackupRequired(true);
    } finally {
      setCheckingInit(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        fetchBalance(data.username);
        setBackupRequired(false);
      } else {
        console.error('Login failed:', data);
        if (data.requiresInitialization || (data.details && (
          data.details.includes('Please acknowledge') || 
          data.details.includes('backed up') ||
          data.details.includes('exportdir') ||
          data.details.includes('initialization')
        ))) {
          setBackupRequired(true);
          setInitStatus({ initialized: false, error: data.details || data.error });
        } else {
          alert('Login failed: ' + (data.error || data.details || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Connection error. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async (userToFetch: string) => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/balance?username=${userToFetch}`);
      const data = await res.json();
      if (res.ok) {
        setWalletInfo(data);
      }
    } catch (error) {
      console.error('Fetch balance error:', error);
    }
  };

  const handleShield = async () => {
    if (!user || !walletInfo || walletInfo.balance <= 0) return;

    setShielding(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/shield`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, amount: walletInfo.balance }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Shielding started! Operation ID: ${data.operationId}`);
        // Poll for updates or just refresh after a delay
        setTimeout(() => fetchBalance(user.username), 5000);
      } else {
        alert('Shielding failed: ' + data.error);
      }
    } catch (error) {
      console.error('Shield error:', error);
    } finally {
      setShielding(false);
    }
  };

  const handleAirdrop = async () => {
    try {
        const res = await fetch(`${API_URL}/api/wallet/airdrop`, { method: 'POST' });
        const data = await res.json();
        if (data.faucetUrl) {
            window.open(data.faucetUrl, '_blank');
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Airdrop error", error);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleBackup = async () => {
    // Show interactive backup acknowledgment UI
    setShowInteractiveBackup(true);
  };

  const handleBackupComplete = async () => {
    setShowInteractiveBackup(false);
    // Update initialization status
    await checkInitializationStatus();
    setBackupRequired(false);
  };

  // Show interactive backup acknowledgment if needed
  if (showInteractiveBackup) {
    return (
      <WalletBackupAcknowledgment
        onComplete={handleBackupComplete}
        onCancel={() => setShowInteractiveBackup(false)}
      />
    );
  }

  // Show initialization check loading state
  if (checkingInit) {
    return (
      <Card className="w-full max-w-md mx-auto mt-10 bg-midnight-graphite border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="h-6 w-6 text-zec-indigo" />
            Connect Agent Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 text-zec-indigo animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Checking wallet status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto mt-10 bg-midnight-graphite border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="h-6 w-6 text-zec-indigo" />
            Connect Agent Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backupRequired ? (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg text-yellow-200 text-sm">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">First-time Setup Required</p>
                    <p className="text-yellow-300/90 text-xs">
                      The Zcash node requires a one-time wallet initialization (backup acknowledgment) before it can be used.
                    </p>
                  </div>
                </div>
                {initStatus?.error && (
                  <div className="mt-3 pt-3 border-t border-yellow-700/50 text-xs text-yellow-200/80">
                    <p className="font-mono break-all">{initStatus.error}</p>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleBackup} 
                className="w-full bg-electric-emerald hover:bg-dark-emerald text-midnight-graphite font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  'Initialize Wallet'
                )}
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  onClick={checkInitializationStatus}
                  className="flex-1 text-gray-400 hover:text-white"
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Status
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setBackupRequired(false)}
                  className="flex-1 text-gray-400 hover:text-white"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter a username to create/access wallet"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-obsidian border-neutral-700 text-white"
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full bg-zec-indigo hover:bg-deep-indigo text-white" disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect / Create Wallet'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-midnight-graphite border-neutral-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="h-6 w-6 text-zec-indigo" />
            Wallet: {user.username}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => fetchBalance(user.username)} className="text-gray-400 hover:text-white">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Balances */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-obsidian border border-neutral-700">
              <div className="text-sm text-gray-400 mb-1">Transparent Balance</div>
              <div className="text-2xl font-bold text-white">{walletInfo?.balance || 0} ZEC</div>
            </div>
            <div className="p-4 rounded-lg bg-obsidian border border-neutral-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Shield className="h-16 w-16 text-electric-emerald" />
              </div>
              <div className="text-sm text-electric-emerald mb-1">Shielded Balance</div>
              <div className="text-2xl font-bold text-white">{walletInfo?.shieldedBalance || 0} ZEC</div>
            </div>
          </div>

          {/* Addresses */}
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400 text-xs uppercase tracking-wider">Transparent Address (Deposit Here)</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-obsidian rounded text-xs text-gray-300 break-all border border-neutral-700">
                  {user.address}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-gray-400 hover:text-white"
                  onClick={() => copyToClipboard(user.address, 't-addr')}
                >
                  {copied === 't-addr' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-gray-400 text-xs uppercase tracking-wider">Shielded Address</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-obsidian rounded text-xs text-gray-300 break-all border border-neutral-700">
                  {user.shieldedAddress}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-gray-400 hover:text-white"
                  onClick={() => copyToClipboard(user.shieldedAddress, 'z-addr')}
                >
                  {copied === 'z-addr' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
                onClick={handleShield} 
                disabled={shielding || !walletInfo || walletInfo.balance <= 0}
                className="flex-1 bg-electric-emerald hover:bg-dark-emerald text-midnight-graphite font-semibold"
            >
              {shielding ? 'Shielding...' : 'Shield Funds (Auto-Privacy)'}
            </Button>
            <Button 
                variant="outline" 
                onClick={handleAirdrop}
                className="flex-1 border-neutral-600 text-gray-300 hover:text-white hover:bg-neutral-800"
            >
              Get Testnet ZEC
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
