#!/usr/bin/env tsx
/**
 * Test script for local Zcash node (Docker)
 * This should have 100% success rate since it's your own node
 */

interface TestResult {
  method: string
  success: boolean
  responseTime: number
  error?: string
  result?: any
}

async function testRPCCall(
  rpcUrl: string,
  rpcUser: string,
  rpcPassword: string,
  method: string,
  params: any[] = []
): Promise<TestResult> {
  const startTime = Date.now()
  
  try {
    const auth = Buffer.from(`${rpcUser}:${rpcPassword}`).toString("base64")
    
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params
      }),
      signal: AbortSignal.timeout(10000)
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      return {
        method,
        success: false,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json() as { error?: { message?: string; code?: number }; result?: any }
    
    if (data.error) {
      return {
        method,
        success: false,
        responseTime,
        error: data.error.message || `RPC error code: ${data.error.code}`
      }
    }

    return {
      method,
      success: true,
      responseTime,
      result: data.result
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      method,
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

async function main() {
  const rpcUrl = process.env.ZCASH_RPC_URL || "http://localhost:18232"
  const rpcUser = process.env.ZCASH_RPC_USER || "zcash"
  const rpcPassword = process.env.ZCASH_RPC_PASSWORD || "zcash123"

  console.log("🧪 Testing Local Zcash Node")
  console.log("=".repeat(60))
  console.log(`RPC URL: ${rpcUrl}`)
  console.log(`User: ${rpcUser}`)
  console.log("=".repeat(60))

  const testMethods = [
    { method: "getblockchaininfo", params: [] },
    { method: "getinfo", params: [] },
    { method: "getblockcount", params: [] },
    { method: "getbestblockhash", params: [] },
    { method: "getbalance", params: [] },
    { method: "listunspent", params: [] },
    { method: "z_gettotalbalance", params: [] },
    { method: "getnewaddress", params: [] },
    { method: "z_listaddresses", params: [] }
  ]

  const results: TestResult[] = []
  let successCount = 0

  for (const test of testMethods) {
    const result = await testRPCCall(rpcUrl, rpcUser, rpcPassword, test.method, test.params)
    results.push(result)

    if (result.success) {
      successCount++
      console.log(`✅ ${test.method}: OK (${result.responseTime}ms)`)
      if (test.method === "getblockchaininfo" && result.result) {
        console.log(`   Chain: ${result.result.chain || "N/A"}`)
        console.log(`   Blocks: ${result.result.blocks || "N/A"}`)
        console.log(`   Verification Progress: ${((result.result.verificationprogress || 0) * 100).toFixed(2)}%`)
      }
      if (test.method === "getblockcount" && result.result) {
        console.log(`   Block count: ${result.result}`)
      }
      if (test.method === "getbalance" && result.result !== undefined) {
        console.log(`   Balance: ${result.result} ZEC`)
      }
    } else {
      console.log(`❌ ${test.method}: FAILED`)
      console.log(`   Error: ${result.error}`)
    }

    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log("\n" + "=".repeat(60))
  console.log("📊 RESULTS")
  console.log("=".repeat(60))
  console.log(`Success Rate: ${successCount}/${testMethods.length} (${((successCount / testMethods.length) * 100).toFixed(1)}%)`)

  if (successCount === testMethods.length) {
    console.log("\n🎉 Perfect! Your local node is working correctly!")
    console.log("This is why self-hosting is better than public endpoints.")
  } else if (successCount > testMethods.length * 0.8) {
    console.log("\n✅ Good! Most methods work. Some may require wallet initialization.")
  } else {
    console.log("\n⚠️  Some issues detected. Check your node configuration.")
  }
}

main().catch(console.error)


