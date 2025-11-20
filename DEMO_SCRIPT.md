# ZecFinder Demo Script

## Demo Flow for Hackathon Presentation

### Setup (Before Demo)
1. Ensure backend is running on port 3001
2. Ensure frontend is running on port 5173
3. Have Zcash testnet node connected
4. Have test wallet with some ZEC balance
5. Have NEAR Intents API configured

### Demo Script

#### 1. Introduction (30 seconds)
"ZecFinder is a privacy-preserving, autonomous agent wallet for Zcash. It allows users to execute cryptocurrency intents privately, efficiently, and with zero correlation risk using natural language commands."

#### 2. Wallet Overview (30 seconds)
- Show wallet dashboard
- Display transparent balance
- Display shielded balance
- Show wallet address

**Script**: "Here's my Zcash wallet. I have both transparent and shielded balances. The shielded balance is in the private pool, completely untraceable."

#### 3. Natural Language Intent - Send Transaction (1 minute)
**Action**: Type in chat: "Send 0.1 ZEC to t1abc123... privately"

**What to Show**:
- Chat interface parsing the command
- Intent recognition (send, amount, recipient, privacy flag)
- Zero-link routing proposal
- Transaction confirmation dialog
- Privacy level indicator (Electric Emerald badge)
- Zero-link routing status

**Script**: "I'll send 0.1 ZEC privately. Notice how the system proposes zero-link routing - this uses our UTXO selection algorithm to minimize traceability. The Electric Emerald badge indicates this is a private transaction."

#### 4. Execute Transaction (30 seconds)
**Action**: Confirm transaction

**What to Show**:
- Transaction execution
- Transaction status component
- Transaction ID with block explorer link
- Privacy level confirmation

**Script**: "Transaction confirmed. You can see the transaction ID here, and it's marked as zero-link routing for maximum privacy."

#### 5. Shield Transaction (1 minute)
**Action**: Type in chat: "Shield 0.2 ZEC"

**What to Show**:
- Intent parsing (shield action)
- Shielded transaction creation
- Operation ID
- Status polling (pending → success)

**Script**: "Now I'll shield 0.2 ZEC, moving it from transparent to the shielded pool. This makes it completely private and untraceable."

#### 6. Cross-Chain Swap (1.5 minutes)
**Action**: Type in chat: "Swap 0.01 BTC to ZEC"

**What to Show**:
- Intent parsing (swap action, from/to assets)
- NEAR Intent creation
- Intent status monitoring
- Swap execution
- Optional auto-shielding

**Script**: "Here's the cross-chain capability. I'm swapping 0.01 BTC to ZEC using NEAR Intents. The system creates an intent, monitors its execution, and can automatically shield the received ZEC for privacy."

#### 7. Privacy Indicators (30 seconds)
**What to Show**:
- Privacy level badges throughout UI
- Zero-link routing confirmation
- Shielded transaction indicators
- Privacy score (if implemented)

**Script**: "Throughout the interface, you can see privacy indicators. Green badges mean private transactions, and we show the privacy level for every operation."

#### 8. Architecture Overview (30 seconds)
**What to Show**:
- System architecture diagram
- Zero-link routing flow
- NEAR Intents integration
- Privacy guarantees

**Script**: "The architecture shows how intents flow through our system. We use zero-link routing for transparent transactions, shielded pools for maximum privacy, and NEAR Intents for cross-chain operations."

### Key Points to Emphasize

1. **Zero-Link Routing**: "Our UTXO selection algorithm minimizes traceability by selecting diverse UTXOs and avoiding patterns."

2. **Shielded Pool Integration**: "Full support for Zcash shielded pools, allowing users to move funds between transparent and private addresses."

3. **NEAR Intents**: "Seamless cross-chain swaps using NEAR Intents, with automatic privacy preservation."

4. **Natural Language**: "Users can interact with their wallet using plain English - no need to understand addresses, UTXOs, or transaction building."

5. **Privacy by Default**: "Every transaction shows its privacy level, and users can choose the level of privacy they need."

### Technical Highlights

- **Zero-Link Algorithm**: UTXO diversity scoring, pattern avoidance, randomization
- **Shielded Transactions**: Direct z_sendmany RPC integration
- **NEAR Intents**: Full API integration with status polling
- **Execution Engine**: Intent-based routing to appropriate handlers
- **Privacy Indicators**: Visual feedback using brand colors

### Demo Duration
Total: ~6 minutes

### Backup Plans

If testnet is unavailable:
- Use mock mode for transactions
- Show UI flows without actual execution
- Demonstrate intent parsing and routing logic

If NEAR Intents API is unavailable:
- Show intent creation flow
- Demonstrate status checking
- Use mock swap results

### Q&A Preparation

**Q: How does zero-link routing work?**
A: We score UTXOs based on age diversity, recent usage, and amount patterns, then select a diverse set that sums to the required amount while avoiding traceability patterns.

**Q: What's the difference between shielded and zero-link?**
A: Shielded uses Zcash's shielded pool (z-addresses) for complete privacy. Zero-link uses transparent addresses but with optimized UTXO selection to minimize linkability.

**Q: How does NEAR Intents integration work?**
A: We create swap intents via the NEAR Intents API, which handles the cross-chain orchestration. We monitor the intent status and can auto-shield received ZEC.

**Q: Is this production-ready?**
A: This is an MVP for the hackathon. Production would require additional security hardening, key management improvements, and more comprehensive testing.

