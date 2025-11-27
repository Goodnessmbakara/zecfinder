import { GoogleGenerativeAI } from "@google/generative-ai"

// API Key validation
function validateApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY is not set. Please configure your Gemini API key in the environment variables.")
  }
  if (apiKey.length < 20) {
    throw new Error("GEMINI_API_KEY appears to be invalid. Please check your API key configuration.")
  }
  return apiKey
}

// Lazy initialization - only initialize when first needed (after .env is loaded)
let genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    try {
      const apiKey = validateApiKey()
      genAI = new GoogleGenerativeAI(apiKey)
      console.log("Gemini API initialized successfully (API key validated)")
    } catch (error) {
      console.error("Failed to initialize Gemini API:", error instanceof Error ? error.message : "Unknown error")
      // Create a dummy instance to prevent crashes, but functions will throw proper errors
      genAI = new GoogleGenerativeAI("")
    }
  }
  return genAI
}

export interface ParsedIntent {
  action: "send" | "receive" | "balance" | "shield" | "unshield" | "swap" | "query" | "unknown"
  amount?: number
  recipient?: string
  currency?: string
  isPrivate?: boolean
  swapFrom?: string // e.g., "BTC", "SOL", "USDC"
  swapTo?: string // e.g., "ZEC"
  originalCommand: string
}

// Error types for better error handling
export class AIAgentError extends Error {
  constructor(
    message: string,
    public type: "api_key" | "network" | "rate_limit" | "parsing" | "invalid_response" | "unknown"
  ) {
    super(message)
    this.name = "AIAgentError"
  }
}

export async function parseIntent(userMessage: string): Promise<ParsedIntent> {
  try {
    // Validate API key before making request
    validateApiKey()
    
    // Try models in order of preference
    // Using -latest suffix ensures we always use the latest available version
    const modelsToTry = ["gemini-flash-latest", "gemini-pro-latest", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
    let lastError: Error | null = null
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`[parseIntent] Trying model: ${modelName}`)
        const model = getGenAI().getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json"
          }
        })
    
        const prompt = `You are a Zcash wallet AI assistant. Parse user commands and extract:
- action: send, receive, balance, shield, unshield, swap, query, or unknown
- amount: numeric value if mentioned
- recipient: address or identifier if mentioned
- currency: ZEC, BTC, etc. (default: ZEC)
- isPrivate: true if user wants private/shielded transaction
- swapFrom: source asset for swaps (e.g., "BTC", "SOL", "USDC")
- swapTo: destination asset for swaps (e.g., "ZEC")

Return ONLY valid JSON in this format:
{
  "action": "send|receive|balance|shield|unshield|swap|query|unknown",
  "amount": number or null,
  "recipient": "address" or null,
  "currency": "ZEC" or other,
  "isPrivate": true/false,
  "swapFrom": "asset name" or null,
  "swapTo": "asset name" or null,
  "originalCommand": "user's original message"
}

User command: ${userMessage}`

        const result = await model.generateContent(prompt)
        const response = result.response
        const content = response.text()
        console.log(`[parseIntent] Model ${modelName} response length: ${content?.length || 0}`)
        if (!content) {
          console.error(`[parseIntent] Model ${modelName} returned empty response. Full result:`, JSON.stringify(result, null, 2))
          throw new AIAgentError("No response content from Gemini API", "invalid_response")
        }

        try {
          const parsed = JSON.parse(content) as ParsedIntent
          // Validate parsed intent structure
          if (!parsed.action || !parsed.originalCommand) {
            throw new AIAgentError("Invalid intent structure from AI response", "invalid_response")
          }
          return parsed
        } catch (parseError) {
          console.error("JSON parsing error. Raw content:", content.substring(0, 200))
          throw new AIAgentError(
            `Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : "Unknown parsing error"}`,
            "parsing"
          )
        }
      } catch (modelError) {
        // If model not found, try next model
        if (modelError instanceof Error && 
            (modelError.message.includes("not found") || 
             modelError.message.includes("404") ||
             modelError.message.includes("is not found"))) {
          console.warn(`[parseIntent] Model ${modelName} not available (404), trying next model...`)
          lastError = modelError
          continue
        }
        // Log other errors but continue to next model
        console.error(`[parseIntent] Model ${modelName} error:`, modelError instanceof Error ? modelError.message : String(modelError))
        lastError = modelError instanceof Error ? modelError : new Error(String(modelError))
        continue
      }
    }
    
    // If all models failed, throw the last error
    if (lastError) {
      throw new AIAgentError(
        `No available Gemini models found. Please check your API key and model availability. Last error: ${lastError.message}`,
        "api_key"
      )
    }
    
    throw new AIAgentError("Failed to find a working Gemini model", "unknown")
  } catch (error) {
    // Log detailed error information
    if (error instanceof AIAgentError) {
      console.error(`[parseIntent] ${error.type} error:`, error.message)
      throw error
    }
    
    // Handle specific error types
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      if (errorMessage.includes("api key") || errorMessage.includes("api_key") || errorMessage.includes("authentication")) {
        throw new AIAgentError(
          "Invalid or missing Gemini API key. Please check your GEMINI_API_KEY environment variable.",
          "api_key"
        )
      }
      
      if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("connection")) {
        throw new AIAgentError(
          "Network error connecting to Gemini API. Please check your internet connection and try again.",
          "network"
        )
      }
      
      if (errorMessage.includes("rate limit") || errorMessage.includes("quota") || errorMessage.includes("429")) {
        throw new AIAgentError(
          "Rate limit exceeded. Please wait a moment and try again.",
          "rate_limit"
        )
      }
      
      // Re-throw as AIAgentError if it's already one
      throw new AIAgentError(
        `Failed to parse intent: ${error.message}`,
        "unknown"
      )
    }
    
    throw new AIAgentError(
      "An unknown error occurred while parsing your intent.",
      "unknown"
    )
  }
}

export async function generateResponse(
  intent: ParsedIntent,
  context?: { balance?: number; address?: string; error?: string },
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  try {
    // Validate API key before making request
    validateApiKey()
    
    // Try models in order of preference
    // Using -latest suffix ensures we always use the latest available version
    const modelsToTry = ["gemini-flash-latest", "gemini-pro-latest", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
    let lastError: Error | null = null
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`[generateResponse] Trying model: ${modelName}`)
        const model = getGenAI().getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000  // Increased to handle longer responses and model reasoning tokens
          }
        })
    
        // Get network info from context or config
        const network = (context as any)?.network || process.env.ZCASH_NETWORK || "testnet"
        const currencySymbol = (context as any)?.currency || (network === "testnet" ? "TAZ" : "ZEC")
        
        const systemPrompt = `You are a Zcash wallet AI assistant. Provide helpful, concise responses about wallet operations.

IMPORTANT CONTEXT:
- You are currently on the Zcash ${network.toUpperCase()} network
- Currency symbol: ${currencySymbol} (${network === "testnet" ? "Testnet ZEC" : "Mainnet ZEC"})
- Always use ${currencySymbol} when referring to amounts, NOT ZEC

RESPONSE FORMATTING RULES:
- Use Markdown syntax ONLY (NOT HTML tags)
- For code/addresses: use backticks like \`address\` for inline code
- For code blocks: use triple backticks with language: \`\`\`javascript\ncode\n\`\`\`
- For emphasis: use **bold** or *italic* markdown syntax
- For colors: describe them in text (e.g., "green" or "Electric Emerald") but DO NOT use HTML <span> tags
- NEVER use HTML tags like <span>, <div>, <p>, etc. - only use Markdown

PRIVACY EMPHASIS:
- Always emphasize privacy when transactions are private/shielded
- Use descriptive text like "private (shielded) transaction" or "shielded pool"
- Mention the Electric Emerald color (#16D99B) in text when relevant, but don't use HTML tags

Remember previous conversation context and refer to it when relevant.`

        // Build conversation history into the prompt
        // Include recent history (last 10 messages) to maintain context while staying within token limits
        let conversationContext = ""
        if (conversationHistory && conversationHistory.length > 0) {
          const recentHistory = conversationHistory.slice(-10) // Last 10 messages
          conversationContext = "\n\n=== Previous Conversation Context ===\n"
          conversationContext += "The following is the recent conversation history. Use this context to provide relevant, coherent responses.\n\n"
          
          for (const msg of recentHistory) {
            const roleLabel = msg.role === "assistant" ? "Assistant" : "User"
            // Truncate very long messages to avoid token limits
            const content = msg.content.length > 500 
              ? msg.content.substring(0, 500) + "..."
              : msg.content
            conversationContext += `${roleLabel}: ${content}\n\n`
          }
          conversationContext += "=== End Previous Conversation ===\n"
          
          if (conversationHistory.length > 10) {
            conversationContext += `\nNote: Showing last 10 of ${conversationHistory.length} messages. Full context is available if needed.\n`
          }
        }

        // Build current user message with context
        let currentUserMessage = `User command: "${intent.originalCommand}"
Parsed intent: ${JSON.stringify(intent, null, 2)}`

        if (context) {
          currentUserMessage += `\nContext: ${JSON.stringify(context, null, 2)}`
        }

        // Combine system prompt, conversation history, and current message
        const fullPrompt = `${systemPrompt}${conversationContext}\n\n${currentUserMessage}`
        
        // Log conversation context for debugging (truncated)
        if (conversationHistory && conversationHistory.length > 0) {
          console.log(`[generateResponse] Including ${conversationHistory.length} messages in conversation history`)
        }

        const result = await model.generateContent(fullPrompt)

        const response = result.response
        const text = response.text()
        console.log(`[generateResponse] Model ${modelName} response length: ${text?.length || 0}`)
        
        // Check if response was truncated due to token limit
        const finishReason = result.response.candidates?.[0]?.finishReason
        if (finishReason === "MAX_TOKENS") {
          console.warn(`[generateResponse] Model ${modelName} hit token limit, but returning partial response`)
          // Still return the text if we have some content
          if (text && text.trim().length > 0) {
            return text + "\n\n(Response may be truncated due to length limits)"
          }
        }
        
        if (!text || text.trim() === "") {
          console.error(`[generateResponse] Model ${modelName} returned empty response. Full result:`, JSON.stringify(result, null, 2))
          throw new AIAgentError("Empty response from Gemini API", "invalid_response")
        }
        
        return text
      } catch (modelError) {
        // If model not found, try next model
        if (modelError instanceof Error && 
            (modelError.message.includes("not found") || 
             modelError.message.includes("404") ||
             modelError.message.includes("is not found"))) {
          console.warn(`[generateResponse] Model ${modelName} not available (404), trying next model...`)
          lastError = modelError
          continue
        }
        // Log other errors but continue to next model
        console.error(`[generateResponse] Model ${modelName} error:`, modelError instanceof Error ? modelError.message : String(modelError))
        lastError = modelError instanceof Error ? modelError : new Error(String(modelError))
        continue
      }
    }
    
    // If all models failed, throw the last error
    if (lastError) {
      throw new AIAgentError(
        `No available Gemini models found. Please check your API key and model availability. Last error: ${lastError.message}`,
        "api_key"
      )
    }
    
    throw new AIAgentError("Failed to find a working Gemini model", "unknown")
  } catch (error) {
    // Log detailed error information
    if (error instanceof AIAgentError) {
      console.error(`[generateResponse] ${error.type} error:`, error.message)
      throw error
    }
    
    // Handle specific error types
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      if (errorMessage.includes("api key") || errorMessage.includes("api_key") || errorMessage.includes("authentication")) {
        throw new AIAgentError(
          "Invalid or missing Gemini API key. Please check your GEMINI_API_KEY environment variable.",
          "api_key"
        )
      }
      
      if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("connection")) {
        throw new AIAgentError(
          "Network error connecting to Gemini API. Please check your internet connection and try again.",
          "network"
        )
      }
      
      if (errorMessage.includes("rate limit") || errorMessage.includes("quota") || errorMessage.includes("429")) {
        throw new AIAgentError(
          "Rate limit exceeded. Please wait a moment and try again.",
          "rate_limit"
        )
      }
      
      // Re-throw as AIAgentError
      throw new AIAgentError(
        `Failed to generate response: ${error.message}`,
        "unknown"
      )
    }
    
    throw new AIAgentError(
      "An unknown error occurred while generating the response.",
      "unknown"
    )
  }
}

