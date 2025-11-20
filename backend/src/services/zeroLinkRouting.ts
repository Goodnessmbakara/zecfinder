import { UTXO } from "@mayaprotocol/zcash-js"

export interface UTXOScore {
  utxo: UTXO
  score: number
  reasons: string[]
}

// Extended UTXO interface to handle properties that may not be in the base type
interface ExtendedUTXO extends UTXO {
  confirmations?: number
  amount?: number
  vout?: number
}

/**
 * Score a UTXO based on privacy characteristics for zero-link routing
 */
function scoreUTXO(utxo: UTXO, allUTXOs: UTXO[], recentlyUsed: Set<string>): UTXOScore {
  const reasons: string[] = []
  let score = 0
  const extUtxo = utxo as ExtendedUTXO
  const extAllUtxos = allUTXOs as ExtendedUTXO[]

  // Age diversity: Prefer UTXOs with varying confirmation counts
  // Mix of old (high confirmations) and new (low confirmations) is better
  const confirmations = extUtxo.confirmations || 0
  const avgConfirmations = extAllUtxos.reduce((sum, u) => sum + (u.confirmations || 0), 0) / extAllUtxos.length
  const ageDiff = Math.abs(confirmations - avgConfirmations)
  if (ageDiff > avgConfirmations * 0.3) {
    score += 20
    reasons.push("age-diversity")
  }

  // Avoid recently used UTXOs (they create linkability)
  const vout = extUtxo.vout || 0
  const utxoKey = `${utxo.txid}:${vout}`
  if (!recentlyUsed.has(utxoKey)) {
    score += 30
    reasons.push("not-recently-used")
  } else {
    score -= 50
    reasons.push("recently-used")
  }

  // Amount diversity: Avoid common round numbers
  const amount = extUtxo.amount || 0
  const isRoundNumber = amount % 1000000 === 0 // Common round amounts
  if (!isRoundNumber) {
    score += 15
    reasons.push("non-round-amount")
  } else {
    score -= 10
    reasons.push("round-amount")
  }

  // Prefer UTXOs with more confirmations (more mature)
  if (confirmations > 6) {
    score += 10
    reasons.push("well-confirmed")
  }

  // Prefer smaller UTXOs when possible (allows more mixing)
  if (amount < 100000000) { // Less than 1 ZEC
    score += 5
    reasons.push("small-utxo")
  }

  return { utxo, score, reasons }
}

/**
 * Select UTXOs for zero-link routing to minimize traceability
 */
export function selectUTXOsForZeroLink(
  requiredAmount: number,
  availableUTXOs: UTXO[],
  recentlyUsed: Set<string> = new Set()
): UTXO[] {
  if (availableUTXOs.length === 0) {
    throw new Error("No UTXOs available")
  }

  // Convert required amount to zatoshi
  const requiredZatoshi = Math.floor(requiredAmount * 100000000)
  
  // Add estimated fee (0.0001 ZEC = 10000 zatoshi as minimum)
  const estimatedFee = 10000
  const totalNeeded = requiredZatoshi + estimatedFee

  // Score all UTXOs
  const scoredUTXOs = availableUTXOs.map(utxo => 
    scoreUTXO(utxo, availableUTXOs, recentlyUsed)
  )

  // Sort by score (highest first)
  scoredUTXOs.sort((a, b) => b.score - a.score)

  // Strategy: Select diverse UTXOs that sum to required amount
  const selected: UTXO[] = []
  let totalSelected = 0
  const selectedIndices = new Set<number>()
  const extUtxos = availableUTXOs as ExtendedUTXO[]

  // First pass: Select high-scoring UTXOs
  for (const scored of scoredUTXOs) {
    if (totalSelected >= totalNeeded) break
    
    const index = availableUTXOs.indexOf(scored.utxo)
    if (selectedIndices.has(index)) continue

    const utxoAmount = (scored.utxo as ExtendedUTXO).amount || 0
    // Check if adding this UTXO would help us reach the target
    if (totalSelected + utxoAmount <= totalNeeded * 1.5) { // Allow some overage
      selected.push(scored.utxo)
      totalSelected += utxoAmount
      selectedIndices.add(index)
    }
  }

  // If we don't have enough, add more UTXOs (even lower scoring ones)
  if (totalSelected < totalNeeded) {
    for (const scored of scoredUTXOs) {
      if (totalSelected >= totalNeeded) break
      
      const index = availableUTXOs.indexOf(scored.utxo)
      if (selectedIndices.has(index)) continue

      const utxoAmount = (scored.utxo as ExtendedUTXO).amount || 0
      selected.push(scored.utxo)
      totalSelected += utxoAmount
      selectedIndices.add(index)
    }
  }

  // If still not enough, we need to use all available UTXOs
  if (totalSelected < totalNeeded && selected.length < availableUTXOs.length) {
    for (const utxo of availableUTXOs) {
      const index = availableUTXOs.indexOf(utxo)
      if (!selectedIndices.has(index)) {
        const utxoAmount = (utxo as ExtendedUTXO).amount || 0
        selected.push(utxo)
        totalSelected += utxoAmount
        selectedIndices.add(index)
      }
    }
  }

  if (totalSelected < totalNeeded) {
    throw new Error(`Insufficient funds. Need ${totalNeeded} zatoshi, have ${totalSelected} zatoshi`)
  }

  // Randomize the order of selected UTXOs to prevent pattern analysis
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]]
  }

  return selected
}

/**
 * Check if an address is a shielded address (z-address)
 */
export function isShieldedAddress(address: string): boolean {
  return address.startsWith("zs1") || address.startsWith("zreg") || address.startsWith("ztest")
}

/**
 * Check if an address is a transparent address (t-address)
 */
export function isTransparentAddress(address: string): boolean {
  return address.startsWith("t1") || address.startsWith("tm")
}

