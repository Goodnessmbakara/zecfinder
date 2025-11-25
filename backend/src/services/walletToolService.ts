import { spawn, ChildProcess } from 'child_process';
import { Readable } from 'stream';

export interface WalletToolPrompt {
  type: 'message' | 'input' | 'phrase' | 'word_verification' | 'success' | 'error';
  content: string;
  data?: any; // For recovery phrase, word positions, etc.
}

interface WalletToolSession {
  process: ChildProcess;
  output: string;
  currentPrompt: WalletToolPrompt | null;
  isComplete: boolean;
  error: string | null;
  recoveryPhrase?: string[];
  exportFile?: string;
}

const sessions = new Map<string, WalletToolSession>();

/**
 * Start wallet tool acknowledgment process
 */
export function startWalletToolAcknowledgment(sessionId: string): WalletToolPrompt[] {
  // Check if session already exists
  if (sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    return session.currentPrompt ? [session.currentPrompt] : [];
  }

  const rpcUser: string = process.env.ZCASH_RPC_USER || 'zcash';
  const rpcPassword: string = process.env.ZCASH_RPC_PASSWORD || 'zcash123';
  const rpcPort: string = process.env.ZCASH_NETWORK === 'testnet' ? '18232' : '8232';
  const containerName: string = process.env.ZCASH_CONTAINER_NAME || 'zcash-testnet-node';
  
  // Spawn zcashd-wallet-tool process via docker exec
  // Note: This requires docker socket access or docker CLI available in the container
  const childProcess = spawn('docker', [
    'exec', '-i',
    containerName,
    'zcashd-wallet-tool',
    '--testnet',
    '--rpcuser', rpcUser,
    '--rpcpassword', rpcPassword,
    '--rpcport', rpcPort
  ], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  let recoveryPhrase: string[] = [];
  let exportFile: string | undefined;
  
  const session: WalletToolSession = {
    process: childProcess,
    output: '',
    currentPrompt: null,
    isComplete: false,
    error: null
  };

  sessions.set(sessionId, session);

  // Handle stdout
  childProcess.stdout?.on('data', (data: Buffer) => {
    const text = data.toString();
    output += text;
    session.output = output;
    
    // Parse output to detect prompts
    session.currentPrompt = parseOutput(text, output, recoveryPhrase);
    
    // Extract recovery phrase
    const phraseMatch = output.match(/(?:recovery phrase is:[\s\S]*?)(\d+:\s+(\w+)\s+\d+:\s+(\w+)[\s\S]*?)(?:Please write down)/);
    if (phraseMatch && recoveryPhrase.length === 0) {
      // Extract all 24 words
      const lines = output.split('\n');
      recoveryPhrase = [];
      let inPhrase = false;
      for (const line of lines) {
        if (line.includes('recovery phrase is:')) {
          inPhrase = true;
          continue;
        }
        if (line.includes('Please write down')) {
          break;
        }
        if (inPhrase) {
          // Parse line like " 1: dizzy      2: regret     3: ordinary"
          const matches = line.matchAll(/(\d+):\s+(\w+)/g);
          for (const match of matches) {
            const wordNum = parseInt(match[1]);
            const word = match[2];
            if (wordNum > 0 && wordNum <= 24) {
              recoveryPhrase[wordNum - 1] = word;
            }
          }
        }
      }
      if (recoveryPhrase.length === 24) {
        session.recoveryPhrase = recoveryPhrase;
      }
    }
    
    // Extract export file path
    const exportMatch = output.match(/Saved the export file to '([^']+)'/);
    if (exportMatch) {
      exportFile = exportMatch[1];
      session.exportFile = exportFile;
    }
  });

  // Handle stderr
  childProcess.stderr?.on('data', (data: Buffer) => {
    const text = data.toString();
    output += text;
    session.output = output;
    
    if (text.includes('error') || text.includes('Error') || text.includes('ERROR')) {
      session.error = text;
      session.currentPrompt = {
        type: 'error',
        content: text
      };
    }
  });

  // Handle process exit
  childProcess.on('exit', (code: number | null) => {
    session.isComplete = true;
    if (code === 0) {
      session.currentPrompt = {
        type: 'success',
        content: 'Wallet backup acknowledged successfully!',
        data: { exportFile }
      };
    } else {
      session.error = `Process exited with code ${code}`;
      session.currentPrompt = {
        type: 'error',
        content: session.error || 'Unknown error occurred'
      };
    }
  });

  // Parse initial output
  setTimeout(() => {
    session.currentPrompt = parseOutput(output, output, recoveryPhrase);
  }, 500);

  return session.currentPrompt ? [session.currentPrompt] : [];
}

/**
 * Send response to wallet tool process
 */
export function sendWalletToolResponse(sessionId: string, response: string): WalletToolPrompt | null {
  const session = sessions.get(sessionId);
  if (!session || session.isComplete) {
    return null;
  }

  // Write response to process stdin
  if (session.process.stdin && !session.process.stdin.destroyed) {
    session.process.stdin.write(response + '\n');
  }

  // Wait a bit for output, then parse
  setTimeout(() => {
    session.currentPrompt = parseOutput(session.output, session.output, session.recoveryPhrase || []);
  }, 300);

  return session.currentPrompt || null;
}

/**
 * Get current prompt for session
 */
export function getCurrentPrompt(sessionId: string): WalletToolPrompt | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  
  return session.currentPrompt;
}

/**
 * Get session status
 */
export function getSessionStatus(sessionId: string): { isComplete: boolean; error: string | null; exportFile?: string } {
  const session = sessions.get(sessionId);
  if (!session) {
    return { isComplete: true, error: 'Session not found' };
  }
  
  return {
    isComplete: session.isComplete,
    error: session.error,
    exportFile: session.exportFile
  };
}

/**
 * Cleanup session
 */
export function cleanupSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (session && session.process) {
    session.process.kill();
  }
  sessions.delete(sessionId);
}

/**
 * Parse output to extract current prompt
 */
function parseOutput(newText: string, fullOutput: string, recoveryPhrase: string[]): WalletToolPrompt | null {
  // Check for filename prompt
  if (newText.includes('Enter the filename') || newText.includes('default')) {
    return {
      type: 'input',
      content: 'Enter a filename for the wallet export (alphanumeric only, or press Enter for default):'
    };
  }

  // Check for recovery phrase display
  if (newText.includes('recovery phrase is:') || newText.includes('1:') && newText.includes('2:')) {
    // Extract phrase words if available
    const phrase: string[] = [];
    const lines = fullOutput.split('\n');
    let inPhrase = false;
    for (const line of lines) {
      if (line.includes('recovery phrase is:')) {
        inPhrase = true;
        continue;
      }
      if (line.includes('Please write down')) {
        break;
      }
      if (inPhrase) {
        const matches = line.matchAll(/(\d+):\s+(\w+)/g);
        for (const match of matches) {
          const wordNum = parseInt(match[1]);
          const word = match[2];
          if (wordNum > 0 && wordNum <= 24) {
            phrase[wordNum - 1] = word;
          }
        }
      }
    }
    
    return {
      type: 'phrase',
      content: 'Please write down this recovery phrase. Press Enter when finished.',
      data: { phrase: phrase.length === 24 ? phrase : recoveryPhrase }
    };
  }

  // Check for "Press Enter when finished"
  if (newText.includes('Press Enter when finished')) {
    return {
      type: 'input',
      content: 'Press Enter when you have written down the recovery phrase:'
    };
  }

  // Check for word verification
  const wordMatch = newText.match(/Please enter the (\d+)(?:st|nd|rd|th) word:/);
  if (wordMatch) {
    const wordNum = parseInt(wordMatch[1]);
    return {
      type: 'word_verification',
      content: `Please enter word #${wordNum} from your recovery phrase:`,
      data: { wordNumber: wordNum }
    };
  }

  // Check for success
  if (newText.includes('acknowledged') || newText.includes('successfully') || newText.includes('backup')) {
    const exportMatch = fullOutput.match(/Saved the export file to '([^']+)'/);
    return {
      type: 'success',
      content: 'Wallet backup acknowledged successfully!',
      data: { exportFile: exportMatch ? exportMatch[1] : undefined }
    };
  }

  // Check for errors
  if (newText.includes('error') || newText.includes('Error') || newText.includes('ERROR')) {
    return {
      type: 'error',
      content: newText
    };
  }

  // Generic message
  if (newText.trim().length > 0) {
    return {
      type: 'message',
      content: newText
    };
  }

  return null;
}

