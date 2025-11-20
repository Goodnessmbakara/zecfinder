# ZecFinder Architecture

## System Overview

ZecFinder is built as a full-stack application with a React frontend and Node.js/Express backend, integrating with Zcash nodes and NEAR Intents API.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Landing    │  │  Chat UI     │  │ Transaction  │     │
│  │    Page      │  │              │  │  Status      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Chat Route  │  │ Wallet Route │  │Transaction  │     │
│  │              │  │              │  │   Route     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  AI Agent    │  │  Execution   │  │  Zcash      │     │
│  │  (Parser)    │  │   Engine     │  │  Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Zero-Link    │  │ NEAR Intents │                        │
│  │  Routing     │  │   Service    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌──────────────────────┐            ┌──────────────────────┐
│   Zcash Node (RPC)   │            │  NEAR Intents API    │
│                      │            │                      │
│  - z_sendmany        │            │  - Create Intent     │
│  - z_getbalance      │            │  - Check Status      │
│  - z_listaddresses   │            │  - Get Result         │
│  - getUTXOS          │            │                      │
└──────────────────────┘            └──────────────────────┘
```

## Component Details

### Frontend Components

#### ChatInterface
- Natural language input
- Message display with privacy indicators
- Transaction status integration
- Confirmation dialogs

#### TransactionConfirm
- Transaction details display
- Privacy level indicators
- Zero-link routing status
- Confirm/Cancel actions

#### TransactionStatus
- Real-time status updates
- Transaction ID with explorer links
- Privacy badges
- Error handling

### Backend Services

#### AI Agent Service (`aiAgent.ts`)
- Intent parsing using OpenAI
- Natural language understanding
- Action extraction (send, shield, unshield, swap)
- Parameter extraction (amount, recipient, assets)

#### Execution Engine (`executionEngine.ts`)
- Intent routing to handlers
- Transaction execution coordination
- Privacy level determination
- Error handling and status reporting

#### Zcash Service (`zcashService.ts`)
- Wallet management
- Transparent transactions
- Shielded transactions (z_sendmany)
- Balance queries
- Address management

#### Zero-Link Routing (`zeroLinkRouting.ts`)
- UTXO scoring algorithm
- Diversity-based selection
- Pattern avoidance
- Randomization

#### NEAR Intents Service (`nearIntents.ts`)
- Swap intent creation
- Status polling
- Result retrieval
- Timeout handling

## Data Flow

### Send Transaction Flow

1. User types: "Send 0.1 ZEC to t1abc... privately"
2. Frontend sends to `/api/chat`
3. AI Agent parses intent (action: send, amount: 0.1, recipient: t1abc..., isPrivate: true)
4. Execution Engine routes to `handleSend()`
5. Zero-Link Routing selects optimal UTXOs
6. Zcash Service builds and signs transaction
7. Transaction sent to Zcash node
8. Status returned to frontend
9. UI displays transaction with privacy indicators

### Shield Transaction Flow

1. User types: "Shield 0.2 ZEC"
2. AI Agent parses intent (action: shield, amount: 0.2)
3. Execution Engine routes to `handleShield()`
4. Zcash Service calls `shieldTransaction()`
5. z_sendmany RPC called with z-address
6. Operation ID returned
7. Status polling begins
8. When complete, transaction ID available
9. UI updates with shielded status

### Cross-Chain Swap Flow

1. User types: "Swap 0.01 BTC to ZEC"
2. AI Agent parses intent (action: swap, swapFrom: BTC, swapTo: ZEC, amount: 0.01)
3. Execution Engine routes to `handleSwap()`
4. NEAR Intents Service creates swap intent
5. Intent ID returned
6. Status polling begins
7. When swap completes, result retrieved
8. Optionally auto-shield received ZEC
9. UI displays swap result

## Privacy Guarantees

### Zero-Link Routing
- UTXO selection avoids common patterns
- Age diversity prevents timing analysis
- Amount randomization prevents amount analysis
- Input count optimization reduces linkability

### Shielded Pool
- Complete privacy using z-addresses
- No transaction graph analysis possible
- Balance hidden from public view
- Full Zcash privacy guarantees

### Cross-Chain Privacy
- Intent-based execution hides user intent
- NEAR Intents handles routing privately
- Optional auto-shielding preserves privacy
- No direct chain correlation

## Security Considerations

- Private keys stored in memory only
- RPC authentication required
- Transaction confirmation before execution
- Error messages sanitized
- No sensitive data in logs

## Scalability

- Stateless backend design
- Horizontal scaling possible
- Async transaction processing
- Status polling with timeouts
- Efficient UTXO selection

## Future Enhancements

- MPC wallet signing
- Multi-signature support
- Advanced privacy scoring
- Transaction batching
- Recurring actions
- Multi-chain aggregation

