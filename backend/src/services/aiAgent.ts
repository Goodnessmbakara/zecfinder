import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
})

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

export async function parseIntent(userMessage: string): Promise<ParsedIntent> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a Zcash wallet AI assistant. Parse user commands and extract:
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
}`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from AI")
    }

    const parsed = JSON.parse(content) as ParsedIntent
    return parsed
  } catch (error) {
    console.error("Error parsing intent:", error)
    return {
      action: "unknown",
      originalCommand: userMessage
    }
  }
}

export async function generateResponse(
  intent: ParsedIntent,
  context?: { balance?: number; address?: string; error?: string }
): Promise<string> {
  try {
    const systemPrompt = `You are a Zcash wallet AI assistant. Provide helpful, concise responses about wallet operations.
Always emphasize privacy when transactions are private/shielded.
Use the Electric Emerald color (#16D99B) as a visual indicator for private transactions.`

    let userPrompt = `User command: "${intent.originalCommand}"
Parsed intent: ${JSON.stringify(intent, null, 2)}`

    if (context) {
      userPrompt += `\nContext: ${JSON.stringify(context, null, 2)}`
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    })

    return completion.choices[0]?.message?.content || "I'm here to help with your Zcash wallet operations."
  } catch (error) {
    console.error("Error generating response:", error)
    return "I encountered an error processing your request. Please try again."
  }
}

