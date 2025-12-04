/**
 * Demo/Simulation Mode
 * Allows the application to work without a real Zcash backend for demos
 */

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || 
                        localStorage.getItem('demo_mode') === 'true';

export interface DemoUser {
  username: string;
  address: string;
  shieldedAddress: string;
  balance: number;
  shieldedBalance: number;
}

// Mock user data for demo
const DEMO_USERS: Record<string, DemoUser> = {
  'mfoniso': {
    username: 'mfoniso',
    address: 't1Demo1234567890abcdefghijklmnopqrstuvwxyz',
    shieldedAddress: 'zs1Demo1234567890abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz',
    balance: 5.5,
    shieldedBalance: 2.3
  },
  'demo': {
    username: 'demo',
    address: 't1Demo9876543210zyxwvutsrqponmlkjihgfedcba',
    shieldedAddress: 'zs1Demo9876543210zyxwvutsrqponmlkjihgfedcba9876543210zyxwvutsrqponmlkjihgfedcba',
    balance: 10.0,
    shieldedBalance: 5.0
  }
};

/**
 * Mock wallet login for demo mode
 */
export async function mockLogin(username: string): Promise<DemoUser> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const user = DEMO_USERS[username.toLowerCase()];
  if (user) {
    return user;
  }
  
  // Create new demo user
  const newUser: DemoUser = {
    username: username.toLowerCase(),
    address: `t1Demo${Math.random().toString(36).substring(2, 15)}`,
    shieldedAddress: `zs1Demo${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    balance: 0,
    shieldedBalance: 0
  };
  
  DEMO_USERS[username.toLowerCase()] = newUser;
  return newUser;
}

/**
 * Mock transaction evaluation for demo mode
 */
export function mockTransactionEvaluation(intent: any) {
  return {
    success: true,
    requiresExecution: true,
    intent,
    transactionData: {
      fromAddress: DEMO_USERS[intent.username?.toLowerCase() || 'demo']?.address || 't1Demo...',
      toAddress: intent.recipient || 't1Recipient123...',
      amount: intent.amount || 0.1,
      currency: intent.currency || 'ZEC',
      fee: 0.0001,
      privacyLevel: intent.isPrivate ? 'shielded' : 'transparent' as const,
      estimatedFee: 0.0001,
      network: 'testnet' as const
    },
    unsignedTransaction: {
      method: 'z_sendmany',
      params: [
        DEMO_USERS[intent.username?.toLowerCase() || 'demo']?.address || 't1Demo...',
        [{ address: intent.recipient || 't1Recipient123...', amount: intent.amount || 0.1 }],
        1,
        0.0001
      ],
      rpcMethod: 'z_sendmany'
    },
    validation: {
      hasSufficientBalance: true,
      balance: DEMO_USERS[intent.username?.toLowerCase() || 'demo']?.balance || 5.5,
      requiredAmount: (intent.amount || 0.1) + 0.0001,
      errors: [],
      warnings: []
    },
    message: `Ready to send ${intent.amount || 0.1} ${intent.currency || 'ZEC'} to ${(intent.recipient || 't1Recipient123...').substring(0, 10)}...`
  };
}

/**
 * Mock transaction execution for demo mode
 */
export async function mockExecuteTransaction(intent: any): Promise<{ success: boolean; txid: string; message: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const txid = `tx${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
  
  return {
    success: true,
    txid,
    message: `Transaction sent successfully! TXID: ${txid.substring(0, 20)}...`
  };
}

/**
 * Mock chat response generator for demo mode
 */
export async function* mockChatResponse(username: string, message: string): AsyncGenerator<string, void, unknown> {
  const user = DEMO_USERS[username.toLowerCase()] || DEMO_USERS['demo'];
  
  // Simulate thinking delay
  yield "🤔 Thinking...\n";
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const lowerMessage = message.toLowerCase();
  
  // Handle balance queries
  if (lowerMessage.includes('balance') || lowerMessage.includes('how much')) {
    yield `\n📊 Your Wallet Balance:\n\n`;
    yield `• Transparent Balance: ${user.balance} ZEC\n`;
    yield `• Shielded Balance: ${user.shieldedBalance} ZEC\n`;
    yield `• Total: ${user.balance + user.shieldedBalance} ZEC\n\n`;
    yield `Your transparent address: ${user.address}\n`;
    yield `Your shielded address: ${user.shieldedAddress}\n`;
    return;
  }
  
  // Handle send/transfer transactions
  if (lowerMessage.includes('send') || lowerMessage.includes('transfer')) {
    const amountMatch = message.match(/(\d+\.?\d*)\s*(zec|sec|zecash)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0.1;
    const addressMatch = message.match(/to\s+([a-z0-9]+)/i);
    const recipient = addressMatch ? addressMatch[1] : 't1Recipient123...';
    
    yield `\n💸 Evaluating send transaction...\n\n`;
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const evaluation = mockTransactionEvaluation({
      action: 'send',
      amount,
      recipient,
      currency: 'ZEC',
      username
    });
    
    yield `Ready to send ${amount} ZEC to ${recipient.substring(0, 10)}...\n\n`;
    yield `Transaction Details:\n`;
    yield `• From: ${user.address.substring(0, 15)}...\n`;
    yield `• To: ${recipient.substring(0, 15)}...\n`;
    yield `• Amount: ${amount} ZEC\n`;
    yield `• Fee: 0.0001 ZEC\n`;
    yield `• Privacy Level: transparent\n\n`;
    
    // Include transaction evaluation JSON for frontend to parse
    const evaluationData = JSON.stringify({
      type: "transaction_evaluation",
      evaluation
    });
    yield `\n\`\`\`json\n${evaluationData}\n\`\`\``;
    return;
  }
  
  // Handle swap transactions
  if (lowerMessage.includes('swap')) {
    const swapMatch = message.match(/swap\s+(\d+\.?\d*)\s*(\w+)\s+to\s+(\w+)/i);
    if (swapMatch) {
      const amount = parseFloat(swapMatch[1]);
      const fromAsset = swapMatch[2].toUpperCase();
      const toAsset = swapMatch[3].toUpperCase();
      
      yield `\n🔄 Processing swap transaction...\n\n`;
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      yield `Swap Intent Created:\n`;
      yield `• From: ${amount} ${fromAsset}\n`;
      yield `• To: ${toAsset}\n`;
      yield `• Estimated Rate: 1 ${fromAsset} = 0.05 ${toAsset}\n`;
      yield `• You will receive: ~${(amount * 0.05).toFixed(4)} ${toAsset}\n\n`;
      yield `This swap will be processed via NEAR Intents protocol.\n`;
      yield `Transaction will be completed in a few minutes.\n`;
      return;
    }
  }
  
  // Handle shield transactions
  if (lowerMessage.includes('shield')) {
    const amountMatch = message.match(/(\d+\.?\d*)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : user.balance;
    
    yield `\n🔒 Evaluating shielding operation...\n\n`;
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const evaluation = mockTransactionEvaluation({
      action: 'shield',
      amount,
      currency: 'ZEC',
      username
    });
    
    yield `Ready to shield ${amount} ZEC to private pool\n\n`;
    yield `Transaction Details:\n`;
    yield `• From: ${user.address.substring(0, 15)}...\n`;
    yield `• To: ${user.shieldedAddress.substring(0, 15)}...\n`;
    yield `• Amount: ${amount} ZEC\n`;
    yield `• Privacy Level: shielded\n\n`;
    
    const evaluationData = JSON.stringify({
      type: "transaction_evaluation",
      evaluation
    });
    yield `\n\`\`\`json\n${evaluationData}\n\`\`\``;
    return;
  }
  
  // Handle greetings and casual conversation
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    yield `\n👋 Hello! I'm your friendly Zcash AI assistant. I'm here to help you manage your Zcash wallet and execute transactions.\n\n`;
    yield `I can help you with:\n`;
    yield `• Checking your wallet balance\n`;
    yield `• Sending ZEC to addresses\n`;
    yield `• Swapping assets (like BTC to ZEC)\n`;
    yield `• Shielding funds for privacy\n`;
    yield `• Answering questions about Zcash\n\n`;
    yield `What would you like to do today? 😊\n`;
    return;
  }

  if (lowerMessage.includes('how are you') || lowerMessage.includes('how\'s it going')) {
    yield `\n😊 I'm doing great, thanks for asking! I'm here and ready to help you with your Zcash wallet.\n\n`;
    yield `Is there anything you'd like to do with your wallet today?\n`;
    return;
  }

  if (lowerMessage.includes('good morning') || lowerMessage.includes('good afternoon') || lowerMessage.includes('good evening')) {
    yield `\n🌅 Good ${lowerMessage.includes('morning') ? 'morning' : lowerMessage.includes('afternoon') ? 'afternoon' : 'evening'}! Ready to help you with your Zcash transactions today.\n\n`;
    yield `What can I help you with?\n`;
    return;
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('what can you')) {
    yield `\n🤖 I'm your Zcash wallet assistant! Here's what I can help you with:\n\n`;
    yield `**Wallet Management:**\n`;
    yield `• Check your balance (transparent and shielded)\n`;
    yield `• View your wallet addresses\n\n`;
    yield `**Transactions:**\n`;
    yield `• Send ZEC to any address\n`;
    yield `• Shield funds (move to private pool)\n`;
    yield `• Unshield funds (move from private pool)\n`;
    yield `• Swap assets (BTC, ETH, etc. to ZEC)\n\n`;
    yield `**Privacy Features:**\n`;
    yield `• Explain shielded vs transparent addresses\n`;
    yield `• Help optimize transaction privacy\n`;
    yield `• Zero-link routing information\n\n`;
    yield `Just ask me naturally, like:\n`;
    yield `• "What's my balance?"\n`;
    yield `• "Send 0.5 ZEC to t1Recipient123..."\n`;
    yield `• "Swap 0.5 BTC to ZEC"\n`;
    yield `• "How does shielding work?"\n\n`;
    return;
  }

  if (lowerMessage.includes('how') && (lowerMessage.includes('shield') || lowerMessage.includes('privacy'))) {
    yield `\n🔒 **Shielding Explained:**\n\n`;
    yield `Shielding moves your ZEC from transparent addresses (public on blockchain) to shielded addresses (private).\n\n`;
    yield `**Benefits:**\n`;
    yield `• Complete privacy - amounts and addresses are hidden\n`;
    yield `• Untraceable transactions\n`;
    yield `• Enhanced security\n\n`;
    yield `**How to shield:**\n`;
    yield `Just say "Shield 1 ZEC" or "Shield my funds" and I'll help you move your transparent ZEC to your shielded address.\n\n`;
    yield `Your shielded address: ${user.shieldedAddress.substring(0, 20)}...\n`;
    return;
  }

  if (lowerMessage.includes('what is') || lowerMessage.includes('explain') || lowerMessage.includes('tell me about')) {
    if (lowerMessage.includes('zcash') || lowerMessage.includes('zec')) {
      yield `\n💰 **About Zcash:**\n\n`;
      yield `Zcash (ZEC) is a privacy-focused cryptocurrency that offers both transparent and shielded transactions.\n\n`;
      yield `**Key Features:**\n`;
      yield `• **Transparent transactions** - Like Bitcoin, visible on blockchain\n`;
      yield `• **Shielded transactions** - Private, amounts and addresses hidden\n`;
      yield `• **Zero-knowledge proofs** - Enable privacy without trusting third parties\n`;
      yield `• **Selective disclosure** - You choose what to reveal\n\n`;
      yield `I can help you use these features to maximize your privacy!\n`;
      return;
    }
  }

  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    yield `\n😊 You're welcome! I'm here whenever you need help with your Zcash wallet or transactions.\n\n`;
    yield `Is there anything else I can help you with?\n`;
    return;
  }

  // Handle questions about privacy
  if (lowerMessage.includes('privacy') || lowerMessage.includes('private')) {
    yield `\n🔒 **Privacy is at the heart of Zcash!**\n\n`;
    yield `Zcash offers two types of transactions:\n\n`;
    yield `**Transparent Transactions:**\n`;
    yield `• Similar to Bitcoin - visible on the blockchain\n`;
    yield `• Addresses and amounts are public\n`;
    yield `• Good for compatibility and transparency\n\n`;
    yield `**Shielded Transactions:**\n`;
    yield `• Completely private - amounts and addresses are hidden\n`;
    yield `• Uses zero-knowledge proofs for privacy\n`;
    yield `• Perfect for maximum privacy\n\n`;
    yield `I can help you shield your funds to maximize your privacy! Just say "Shield 1 ZEC" and I'll guide you through it.\n`;
    return;
  }

  // Handle questions about addresses
  if (lowerMessage.includes('address') && (lowerMessage.includes('what') || lowerMessage.includes('explain'))) {
    yield `\n📍 **Zcash Addresses Explained:**\n\n`;
    yield `You have two types of addresses:\n\n`;
    yield `**Transparent Address (t-address):**\n`;
    yield `• Starts with "t1" or "t3"\n`;
    yield `• Like Bitcoin addresses - public on blockchain\n`;
    yield `• Your address: ${user.address.substring(0, 15)}...\n\n`;
    yield `**Shielded Address (z-address):**\n`;
    yield `• Starts with "zs1" or "zaddr"\n`;
    yield `• Private - transactions are hidden\n`;
    yield `• Your address: ${user.shieldedAddress.substring(0, 15)}...\n\n`;
    yield `Want to move funds between them? Just ask!\n`;
    return;
  }

  // Default friendly response for unrecognized messages
  yield `\nI see you're asking about: "${message}"\n\n`;
  yield `I'm your friendly Zcash wallet assistant! 😊 I'm here to help with your wallet and answer questions.\n\n`;
  yield `**I can help you:**\n`;
  yield `• Check your balance\n`;
  yield `• Send ZEC to addresses\n`;
  yield `• Swap assets (BTC, ETH, etc. to ZEC)\n`;
  yield `• Shield funds for privacy\n`;
  yield `• Answer questions about Zcash\n\n`;
  yield `**Try asking:**\n`;
  yield `• "What's my balance?"\n`;
  yield `• "Send 0.5 ZEC to t1Recipient123..."\n`;
  yield `• "Swap 0.5 BTC to ZEC"\n`;
  yield `• "How does privacy work?"\n`;
  yield `• "Explain shielded addresses"\n\n`;
  yield `Or just chat with me! I'm here to help. 💚\n`;
}

/**
 * Check if demo mode is enabled
 */
export function isDemoMode(): boolean {
  return DEMO_MODE;
}

/**
 * Enable/disable demo mode
 */
export function setDemoMode(enabled: boolean) {
  if (enabled) {
    localStorage.setItem('demo_mode', 'true');
  } else {
    localStorage.removeItem('demo_mode');
  }
}

