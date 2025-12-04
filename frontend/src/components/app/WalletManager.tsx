import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, RefreshCw, Copy, Check, Wallet, AlertCircle } from 'lucide-react';
import { WalletBackupAcknowledgment } from './WalletBackupAcknowledgment';
import { useWalletStore } from '@/lib/walletStore';
import { cn } from '@/lib/utils';
import { isDemoMode, mockLogin, setDemoMode, DEMO_MODE } from '@/lib/demoMode';

interface WalletInfo {
  address: string;
  balance: number;
  shieldedBalance: number;
  shieldedAddress?: string;
  network?: 'testnet' | 'mainnet';
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
  const [usernameInput, setUsernameInput] = useState('');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [shielding, setShielding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [initStatus, setInitStatus] = useState<InitializationStatus | null>(null);
  const [checkingInit, setCheckingInit] = useState(true);
  const [backupRequired, setBackupRequired] = useState(false);
  const [showInteractiveBackup, setShowInteractiveBackup] = useState(false);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Use shared wallet store for username
  const { username, setUsername, setAddress, setShieldedAddress } = useWalletStore();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  // Load username from store on mount
  useEffect(() => {
    if (username && !user) {
      // User was logged in before, restore their session
      handleLoginFromStore(username);
    }
  }, [username]);

  // Check initialization status on mount (skip in demo mode)
  useEffect(() => {
    if (!isDemoMode()) {
      checkInitializationStatus();
    } else {
      setCheckingInit(false);
      setBackendConnected(true);
      setInitStatus({ initialized: true });
    }
  }, []);

  // Check backend connection
  const checkBackendConnection = async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) {
        setBackendConnected(true);
        setConnectionError(null);
        return true;
      } else {
        setBackendConnected(false);
        setConnectionError(`Backend returned status ${res.status}`);
        return false;
      }
    } catch (error) {
      setBackendConnected(false);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setConnectionError(`Cannot connect to backend at ${API_URL}. ${errorMsg}`);
      return false;
    }
  };

  const checkInitializationStatus = async (retry = false) => {
    setCheckingInit(true);
    setConnectionError(null);
    
    try {
      // First check if backend is reachable
      const isConnected = await checkBackendConnection();
      if (!isConnected && !retry) {
        setInitStatus({ 
          initialized: false, 
          error: connectionError || 'Backend server is not reachable'
        });
        setBackupRequired(true);
        setCheckingInit(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/wallet/initialization-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      // Check if response is ok and has content
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      // Check if response has content
      const text = await res.text();
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from server');
      }
      
      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response text:', text);
        throw new Error('Invalid JSON response from server. Is the backend running?');
      }
      
      setBackendConnected(true);
      setInitStatus(data);
      setBackupRequired(!data.initialized);
    } catch (error) {
      console.error('Failed to check initialization status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to check wallet status';
      
      // Check if it's a network/connection error
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
        setBackendConnected(false);
        setConnectionError(`Cannot connect to backend server at ${API_URL}. Please ensure the backend is running.`);
        setInitStatus({ 
          initialized: false, 
          error: connectionError || 'Backend connection failed'
        });
      } else if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
        setBackendConnected(false);
        setConnectionError('Backend request timed out. The server may be slow or unresponsive.');
        setInitStatus({ 
          initialized: false, 
          error: 'Request timed out'
        });
      } else {
        setInitStatus({ 
          initialized: false, 
          error: errorMessage
        });
      }
      setBackupRequired(true);
    } finally {
      setCheckingInit(false);
    }
  };

  const handleLoginFromStore = async (storedUsername: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: storedUsername }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setAddress(data.address);
        setShieldedAddress(data.shieldedAddress || null);
        fetchBalance(data.username);
        setBackupRequired(false);
      }
    } catch (error) {
      console.error('Auto-login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !usernameInput.trim()) {
      alert('Please enter a username');
      return;
    }

    setLoading(true);
    setConnectionError(null);
    
    // Demo mode - use mock login
    if (isDemoMode()) {
      try {
        const demoUser = await mockLogin(usernameInput.trim());
        setUser(demoUser);
        setUsername(demoUser.username);
        setAddress(demoUser.address);
        setShieldedAddress(demoUser.shieldedAddress);
        setWalletInfo({
          address: demoUser.address,
          balance: demoUser.balance,
          shieldedBalance: demoUser.shieldedBalance,
          shieldedAddress: demoUser.shieldedAddress,
          network: 'testnet'
        });
        setBackupRequired(false);
        setConnectionError(null);
        return;
      } catch (error) {
        console.error('Demo login error:', error);
        alert(`Demo login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      } finally {
        setLoading(false);
      }
    }
    
    try {
      const res = await fetch(`${API_URL}/api/wallet/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.trim() }),
      });

      // Check if response is ok
      if (!res.ok) {
        // Try to parse error response
        let errorData;
        try {
          const text = await res.text();
          errorData = text ? JSON.parse(text) : { error: `HTTP ${res.status}: ${res.statusText}` };
        } catch (parseError) {
          errorData = { error: `HTTP ${res.status}: ${res.statusText}` };
        }

        console.error('Login failed:', errorData);
        
        if (errorData.requiresInitialization || (errorData.details && (
          errorData.details.includes('Please acknowledge') || 
          errorData.details.includes('backed up') ||
          errorData.details.includes('exportdir') ||
          errorData.details.includes('initialization')
        ))) {
          setBackupRequired(true);
          setInitStatus({ initialized: false, error: errorData.details || errorData.error });
          // Still show the form, but with warning
          alert(`Wallet initialization required: ${errorData.details || errorData.error}\n\nPlease click "Initialize Wallet" if the button appears, or contact support.`);
        } else {
          const errorMsg = errorData.error || errorData.details || `HTTP ${res.status}: ${res.statusText}`;
          alert(`Login failed: ${errorMsg}\n\nPlease check:\n• Backend is running at ${API_URL}\n• Backend is accessible\n• Check browser console for details`);
          setConnectionError(errorMsg);
        }
        return;
      }

      // Parse successful response
      let data;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse login response:', parseError);
        alert('Received invalid response from server. Please try again.');
        return;
      }

      // Success - set user data
      if (data.username && data.address) {
        setUser(data);
        // Store username in shared store - this is critical for enabling chat
        setUsername(data.username);
        setAddress(data.address);
        setShieldedAddress(data.shieldedAddress || null);
        setBackupRequired(false);
        setConnectionError(null);
        
        // Fetch balance in background
        fetchBalance(data.username).catch(err => {
          console.error('Failed to fetch balance:', err);
          // Don't block login if balance fetch fails
        });
      } else {
        alert('Invalid response from server. Missing username or address.');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('Failed to fetch')) {
        setConnectionError(`Cannot connect to backend at ${API_URL}. Please ensure the backend is running.`);
        alert(`Connection error: Cannot reach backend server at ${API_URL}\n\nPlease check:\n• Backend is running (npm run dev in backend directory)\n• Backend URL is correct\n• No firewall blocking the connection`);
      } else {
        setConnectionError(errorMsg);
        alert(`Login error: ${errorMsg}`);
      }
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
        // Update shielded address if it's in the response and not already set
        if (data.shieldedAddress && !user?.shieldedAddress) {
          setShieldedAddress(data.shieldedAddress);
          // Update user state with shielded address
          if (user) {
            setUser({ ...user, shieldedAddress: data.shieldedAddress });
          }
        }
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
          <div className="space-y-4">
            {/* Show warning if backup required, but don't hide the form */}
            {backupRequired && (
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
                    {connectionError && (
                      <div className="mt-2 p-2 bg-red-900/20 border border-red-700/50 rounded text-red-200">
                        <p className="font-semibold mb-1">Connection Issue:</p>
                        <p>{connectionError}</p>
                        <div className="mt-2 space-y-1 text-xs">
                          <p>• Check if backend is running: <code className="bg-red-900/30 px-1 rounded">npm run dev</code> in backend directory</p>
                          <p>• Verify backend URL: <code className="bg-red-900/30 px-1 rounded">{API_URL}</code></p>
                          <p>• Check browser console for detailed errors</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Always show the login form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter a username to create/access wallet"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="bg-obsidian border-neutral-700 text-white"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-zec-indigo hover:bg-deep-indigo text-white" 
                disabled={loading || !usernameInput.trim()}
              >
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

            {/* Connection status and retry buttons */}
            <div className="flex gap-2 pt-2 border-t border-zinc-700">
              <Button 
                variant="ghost" 
                onClick={() => checkInitializationStatus(true)}
                className="flex-1 text-gray-400 hover:text-white text-xs"
                disabled={loading || checkingInit}
                size="sm"
              >
                <RefreshCw className={cn("h-3 w-3 mr-1", (loading || checkingInit) && "animate-spin")} />
                {checkingInit ? 'Checking...' : 'Retry'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={checkBackendConnection}
                className="flex-1 text-gray-400 hover:text-white text-xs"
                disabled={loading}
                size="sm"
              >
                Test Backend
              </Button>
            </div>
            {backendConnected !== null && (
              <div className={cn(
                "p-2 rounded text-xs flex items-center gap-2",
                backendConnected 
                  ? "bg-green-900/20 border border-green-700/50 text-green-200"
                  : "bg-red-900/20 border border-red-700/50 text-red-200"
              )}>
                {backendConnected ? (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>{isDemoMode() ? 'Demo Mode Active' : 'Backend connected'}</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Backend disconnected</span>
                  </>
                )}
              </div>
            )}
            {/* Demo Mode Toggle */}
            <div className="pt-2 border-t border-zinc-700">
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDemoMode()}
                  onChange={(e) => {
                    setDemoMode(e.target.checked);
                    if (e.target.checked) {
                      setBackendConnected(true);
                      setInitStatus({ initialized: true });
                      setBackupRequired(false);
                    } else {
                      checkInitializationStatus();
                    }
                  }}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-green-500 focus:ring-green-500"
                />
                <span>Enable Demo Mode (simulate without backend)</span>
              </label>
            </div>
          </div>
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
              <div className="text-2xl font-bold text-white">{walletInfo?.balance || 0} {walletInfo?.network === 'testnet' ? 'TAZ' : 'ZEC'}</div>
            </div>
            <div className="p-4 rounded-lg bg-obsidian border border-neutral-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Shield className="h-16 w-16 text-electric-emerald" />
              </div>
              <div className="text-sm text-electric-emerald mb-1">Shielded Balance</div>
              <div className="text-2xl font-bold text-white">{walletInfo?.shieldedBalance || 0} {walletInfo?.network === 'testnet' ? 'TAZ' : 'ZEC'}</div>
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
                  {user.shieldedAddress || walletInfo?.shieldedAddress || 'Not available'}
                </code>
                {(user.shieldedAddress || walletInfo?.shieldedAddress) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-gray-400 hover:text-white"
                    onClick={() => copyToClipboard(user.shieldedAddress || walletInfo?.shieldedAddress || '', 'z-addr')}
                  >
                    {copied === 'z-addr' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
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
