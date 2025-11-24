#!/usr/bin/env tsx
/**
 * Test script for public Zcash testnet RPC endpoints
 * Tests various publicly available endpoints to find working ones
 */

interface RPCEndpoint {
  name: string
  url: string
  requiresAuth: boolean
  username?: string
  password?: string
}

const endpoints: RPCEndpoint[] = [
  {
    name: "Tatum Gateway",
    url: "https://zcash-testnet.gateway.tatum.io",
    requiresAuth: false
  },
  {
    name: "Chain49",
    url: "https://rpc.chain49.com/zcash-testnet",
    requiresAuth: false
  },
  {
    name: "Lightwalletd (gRPC - may not work)",
    url: "https://testnet.lightwalletd.com:9067",
    requiresAuth: false
  }
]

interface TestResult {
  endpoint: string
  method: string
  success: boolean
  responseTime: number
  error?: string
  result?: any
}

async function testRPCCall(
  endpoint: RPCEndpoint,
  method: string,
  params: any[] = []
): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    }

    // Add auth if required
    if (endpoint.requiresAuth && endpoint.username && endpoint.password) {
      const auth = Buffer.from(`${endpoint.username}:${endpoint.password}`).toString("base64")
      headers["Authorization"] = `Basic ${auth}`
    }

    const response = await fetch(endpoint.url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      return {
        endpoint: endpoint.name,
        method,
        success: false,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json() as { error?: { message?: string; code?: number }; result?: any }
    
    if (data.error) {
      return {
        endpoint: endpoint.name,
        method,
        success: false,
        responseTime,
        error: data.error.message || `RPC error code: ${data.error.code}`
      }
    }

    return {
      endpoint: endpoint.name,
      method,
      success: true,
      responseTime,
      result: data.result
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      endpoint: endpoint.name,
      method,
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

async function testEndpoint(endpoint: RPCEndpoint): Promise<TestResult[]> {
  console.log(`\n🔍 Testing ${endpoint.name} (${endpoint.url})...`)
  console.log("─".repeat(60))

  const testMethods = [
    { method: "getblockchaininfo", params: [] },
    { method: "getinfo", params: [] },
    { method: "getblockcount", params: [] },
    { method: "getbestblockhash", params: [] },
    { method: "getbalance", params: [] },
    { method: "listunspent", params: [] },
    { method: "z_gettotalbalance", params: [] }
  ]

  const results: TestResult[] = []

  for (const test of testMethods) {
    const result = await testRPCCall(endpoint, test.method, test.params)
    results.push(result)

    if (result.success) {
      console.log(`✅ ${test.method}: OK (${result.responseTime}ms)`)
      if (test.method === "getblockchaininfo" && result.result) {
        console.log(`   Chain: ${result.result.chain || "N/A"}`)
        console.log(`   Blocks: ${result.result.blocks || "N/A"}`)
      }
      if (test.method === "getblockcount" && result.result) {
        console.log(`   Block count: ${result.result}`)
      }
    } else {
      console.log(`❌ ${test.method}: FAILED`)
      console.log(`   Error: ${result.error}`)
    }

    // Small delay between requests (longer for Tatum to avoid rate limits)
    const delay = endpoint.name === "Tatum Gateway" ? 2000 : 500
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  return results
}

async function main() {
  console.log("🚀 Testing Public Zcash Testnet RPC Endpoints")
  console.log("=".repeat(60))

  const allResults: TestResult[] = []

  for (const endpoint of endpoints) {
    const results = await testEndpoint(endpoint)
    allResults.push(...results)
    
    // Delay between endpoints
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Summary
  console.log("\n" + "=".repeat(60))
  console.log("📊 SUMMARY")
  console.log("=".repeat(60))

  const endpointStats = new Map<string, { total: number; success: number }>()

  for (const result of allResults) {
    const stats = endpointStats.get(result.endpoint) || { total: 0, success: 0 }
    stats.total++
    if (result.success) stats.success++
    endpointStats.set(result.endpoint, stats)
  }

  for (const [endpoint, stats] of endpointStats.entries()) {
    const successRate = ((stats.success / stats.total) * 100).toFixed(1)
    const status = stats.success === stats.total ? "✅" : stats.success > 0 ? "⚠️" : "❌"
    console.log(`${status} ${endpoint}: ${stats.success}/${stats.total} tests passed (${successRate}%)`)
  }

  // Find best endpoint
  const bestEndpoint = Array.from(endpointStats.entries())
    .filter(([_, stats]) => stats.success > 0)
    .sort(([_, a], [__, b]) => b.success - a.success)[0]

  if (bestEndpoint) {
    console.log(`\n🏆 Best endpoint: ${bestEndpoint[0]} (${bestEndpoint[1].success}/${bestEndpoint[1].total} tests passed)`)
    
    // Find the endpoint URL
    const endpoint = endpoints.find(e => e.name === bestEndpoint[0])
    if (endpoint) {
      console.log(`\n💡 Recommended configuration:`)
      console.log(`   ZCASH_RPC_URL=${endpoint.url}`)
      if (endpoint.requiresAuth) {
        console.log(`   ZCASH_RPC_USER=${endpoint.username || "your_username"}`)
        console.log(`   ZCASH_RPC_PASSWORD=${endpoint.password || "your_password"}`)
      } else {
        console.log(`   ZCASH_RPC_USER=""`)
        console.log(`   ZCASH_RPC_PASSWORD=""`)
      }
    }
  } else {
    console.log("\n❌ No working endpoints found. You may need to run your own testnet node.")
  }
}

main().catch(console.error)

