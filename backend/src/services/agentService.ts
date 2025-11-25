import { GoogleGenerativeAI } from "@google/generative-ai";
import { getBalance, shieldTransaction, sendTransaction } from "./zcashService.js";
import { getUser, createConversation, addMessage } from "../db/database.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

interface Intent {
  action: "BALANCE" | "SHIELD" | "SEND" | "CHAT" | "UNKNOWN";
  params?: any;
}

export async function generateTitle(message: string): Promise<string> {
  const prompt = `
    Generate a short, concise title (3-5 words) for a chat conversation that starts with this message:
    "${message}"
    
    Return ONLY the title text. No quotes.
  `;
  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    return "New Conversation";
  }
}

export async function parseIntent(message: string): Promise<Intent> {
  const prompt = `
    You are an intent classifier for a Zcash wallet agent.
    Analyze the following user message and extract the intent.
    
    Available actions:
    - BALANCE: User wants to check their balance.
    - SHIELD: User wants to shield their transparent funds (t-addr to z-addr).
    - SEND: User wants to send funds. Params: amount (number), recipient (string).
    - CHAT: General conversation, questions about Zcash, or anything else.
    
    Return ONLY a JSON object with the following structure:
    {
      "action": "BALANCE" | "SHIELD" | "SEND" | "CHAT",
      "params": {
        "amount": number, // For SEND/SHIELD
        "recipient": string // For SEND
      } 
    }
    
    User Message: "${message}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error parsing intent:", error);
    return { action: "CHAT" };
  }
}

export async function* processRequestStream(username: string, message: string, conversationId?: number): AsyncGenerator<string, void, unknown> {
  // 1. Get User & Conversation
  const user = await getUser(username);
  if (!user) {
    yield "Error: User not found.";
    return;
  }

  let currentConvId = conversationId;
  if (!currentConvId) {
    // Create new conversation
    const title = await generateTitle(message);
    const conv = await createConversation(user.id, title);
    currentConvId = conv.id;
    // Send a special signal or just handle it. 
    // Ideally we'd return the new ID to the client, but this is a stream.
    // We can yield a JSON meta-chunk first? Or just let the client refresh history.
  }

  // Save User Message
  if (currentConvId) {
    await addMessage(currentConvId, 'user', message);
  }

  // 2. Parse Intent
  yield "Thinking...\n";
  const intent = await parseIntent(message);
  
  let contextData = "";
  
  // 3. Execute Action
  try {
      if (intent.action === "BALANCE") {
        yield "Checking your wallet...\n";
        const balance = await getBalance(user.wallet_address, user.shielded_address);
        contextData = `User Balance: Transparent: ${balance.balance} ZEC, Shielded: ${balance.shieldedBalance} ZEC. Address: ${balance.address}`;
      } else if (intent.action === "SHIELD") {
        yield "Initiating shielding operation...\n";
        const opId = await shieldTransaction(user.wallet_address, user.shielded_address, 0.0001);
        contextData = `Shielding started. Operation ID: ${opId}. This may take a few minutes to mine.`;
      } else if (intent.action === "SEND") {
        yield `Sending ${intent.params?.amount} ZEC to ${intent.params?.recipient}...\n`;
        if (intent.params?.amount && intent.params?.recipient) {
           const txid = await sendTransaction(user.wallet_address, intent.params.recipient, intent.params.amount);
           contextData = `Transaction Sent! TXID: ${txid}. \nView on Explorer: https://blockexplorer.one/zcash/testnet/tx/${txid}`;
        } else {
           contextData = "Missing amount or recipient for SEND action.";
        }
      }
  } catch (error) {
    console.error("Execution error:", error);
    contextData = `Error executing action: ${error instanceof Error ? error.message : String(error)}`;
  }

  // 4. Generate Natural Language Response
  const systemPrompt = `
    You are ZecFinder, an autonomous privacy-preserving Zcash agent.
    You have just executed an action based on the user's request.
    
    User Request: "${message}"
    Detected Intent: ${intent.action}
    Execution Result / Context: ${contextData}
    
    Provide a helpful, natural language response to the user. 
    - If it was a balance check, present the balance clearly.
    - If it was a shielding op, confirm it started.
    - If it was a SEND, confirm it and provide the Explorer Link if available.
    - If it was chat, just answer the user.
    - Use Markdown for formatting (bold for amounts, code for addresses/txids).
    - Be concise but friendly.
  `;

  const result = await model.generateContentStream(systemPrompt);
  
  let fullResponse = "";
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullResponse += chunkText;
    yield chunkText;
  }

  // Save Assistant Message
  if (currentConvId) {
    await addMessage(currentConvId, 'assistant', fullResponse);
  }
}
