import { parseIntent, generateResponse, ParsedIntent, AIAgentError } from "./aiAgent.js";
import { executeIntent } from "./executionEngine.js";
import { getUser, createConversation, addMessage, getMessages } from "../db/database.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy initialization for title generation
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY is not set");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function generateTitle(message: string): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      return "New Conversation";
    }
    
    const model = getGenAI().getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `Generate a short, concise title (3-5 words) for a chat conversation that starts with this message: "${message.substring(0, 100)}"
    
Return ONLY the title text. No quotes, no markdown, just the title.`;
    
    const result = await model.generateContent(prompt);
    const title = result.response.text().trim();
    // Clean up any markdown or quotes
    return title.replace(/^["']|["']$/g, "").replace(/\*\*/g, "").trim() || "New Conversation";
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Conversation";
  }
}

export async function* processRequestStream(username: string, message: string, conversationId?: number): AsyncGenerator<string, void, unknown> {
  let currentConvId = conversationId;
  let fullResponse = "";

  try {
    // 1. Get User & Conversation
    const user = await getUser(username);
    if (!user) {
      yield "❌ Error: User not found. Please make sure you're logged in.\n";
      return;
    }

    if (!currentConvId) {
      // Create new conversation
      try {
        const title = await generateTitle(message);
        const conv = await createConversation(user.id, title);
        currentConvId = conv.id;
      } catch (error) {
        console.error("Error creating conversation:", error);
        // Continue anyway, we can still process the message
      }
    }

    // Save User Message
    if (currentConvId) {
      try {
        await addMessage(currentConvId, 'user', message);
      } catch (error) {
        console.error("Error saving user message:", error);
        // Continue anyway
      }
    }

    // 2. Get conversation history for context
    let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (currentConvId) {
      try {
        const messages = await getMessages(currentConvId);
        conversationHistory = messages.map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content
        }));
      } catch (error) {
        console.error("Error fetching conversation history:", error);
        // Continue without history
      }
    }

    // 3. Parse Intent using robust implementation
    yield "🤔 Thinking...\n";
    let parsedIntent: ParsedIntent;
    try {
      parsedIntent = await parseIntent(message);
      console.log("[processRequestStream] Parsed intent:", parsedIntent);
    } catch (error) {
      console.error("[processRequestStream] Error parsing intent:", error);
      
      if (error instanceof AIAgentError) {
        if (error.type === "api_key") {
          yield `❌ Configuration Error: ${error.message}\n\nPlease check your GEMINI_API_KEY environment variable.\n`;
          return;
        } else if (error.type === "network") {
          yield `⚠️ Network Error: ${error.message}\n\nPlease check your internet connection and try again.\n`;
          return;
        }
      }
      
      // Fallback: treat as query/chat
      parsedIntent = {
        action: "query",
        originalCommand: message
      };
      yield "⚠️ Could not parse intent, treating as general query...\n";
    }

    // 4. Execute Action (if not just a query/chat)
    let executionResult = null;
    if (parsedIntent.action !== "query" && parsedIntent.action !== "unknown" && parsedIntent.action !== "receive") {
      try {
        // Map parsed intent action to execution context
        if (parsedIntent.action === "balance") {
          yield "📊 Checking your wallet balance...\n";
        } else if (parsedIntent.action === "shield") {
          yield "🔒 Initiating shielding operation...\n";
        } else if (parsedIntent.action === "unshield") {
          yield "🔓 Initiating unshielding operation...\n";
        } else if (parsedIntent.action === "send") {
          yield `💸 Processing send transaction...\n`;
        } else if (parsedIntent.action === "swap") {
          yield `🔄 Processing swap transaction...\n`;
        }

        executionResult = await executeIntent(parsedIntent, username);
        console.log("[processRequestStream] Execution result:", executionResult);
      } catch (error) {
        console.error("[processRequestStream] Execution error:", error);
        executionResult = {
          success: false,
          status: "failed" as const,
          privacyLevel: "transparent" as const,
          message: `Error executing action: ${error instanceof Error ? error.message : String(error)}`,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    }

    // 5. Build context for AI response
    const context: { balance?: number; address?: string; error?: string; executionResult?: any } = {};
    
    if (executionResult) {
      if (executionResult.success) {
        context.executionResult = {
          status: executionResult.status,
          message: executionResult.message,
          txid: executionResult.txid,
          operationId: executionResult.operationId,
          privacyLevel: executionResult.privacyLevel
        };
      } else {
        context.error = executionResult.error || executionResult.message;
      }
    }

    // 6. Generate Natural Language Response using robust implementation
    try {
      yield "\n";
      const response = await generateResponse(parsedIntent, context, conversationHistory);
      fullResponse = response;
      
      // Stream the response character by character for better UX
      for (let i = 0; i < response.length; i++) {
        yield response[i];
        // Small delay to simulate streaming (optional, can be removed for faster response)
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
    } catch (error) {
      console.error("[processRequestStream] Error generating response:", error);
      
      if (error instanceof AIAgentError) {
        if (error.type === "api_key") {
          yield `\n❌ Configuration Error: ${error.message}\n\nPlease check your GEMINI_API_KEY environment variable.\n`;
          return;
        } else if (error.type === "network") {
          yield `\n⚠️ Network Error: ${error.message}\n\nPlease check your internet connection and try again.\n`;
          return;
        } else if (error.type === "rate_limit") {
          yield `\n⏱️ Rate Limit: ${error.message}\n\nPlease wait a moment and try again.\n`;
          return;
        }
      }
      
      // Fallback response
      const fallbackResponse = executionResult 
        ? `I've processed your request. ${executionResult.message}`
        : "I apologize, but I encountered an error while processing your request. Please try again.";
      
      fullResponse = fallbackResponse;
      yield `\n${fallbackResponse}\n`;
    }

    // 7. Save Assistant Message
    if (currentConvId && fullResponse) {
      try {
        await addMessage(currentConvId, 'assistant', fullResponse);
      } catch (error) {
        console.error("Error saving assistant message:", error);
        // Non-critical, continue
      }
    }

  } catch (error) {
    console.error("[processRequestStream] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    yield `\n❌ Error: ${errorMessage}\n\nPlease try again or contact support if the issue persists.\n`;
  }
}
