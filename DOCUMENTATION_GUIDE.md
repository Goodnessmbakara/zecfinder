# ZecFinder Documentation Guide

This document outlines all the essential documentation you need to learn to correctly implement ZecFinder according to your PRD.

## 📚 Core Documentation Areas

### 1. Zcash Protocol & Privacy

#### 1.1 Official Zcash Documentation
- **Zcash Developer Documentation**: https://z.cash/developers/
- **Zcash Protocol Specification**: https://zips.z.cash/
- **Zcash Book** (Comprehensive Guide): https://book.z.cash/
  - Focus on: Shielded Transactions, Address Types, Privacy Features

#### 1.2 Shielded Transactions
- **Sapling Protocol**: https://z.cash/upgrade/sapling/
- **Orchard Protocol**: https://z.cash/upgrade/orchard/
- **Understanding Shielded Pools**: 
  - Transparent addresses (t-addresses): `t1...` (testnet) or `t1...` (mainnet)
  - Shielded addresses (z-addresses): `zs1...` (Sapling), `zreg...` (Regtest), `ztest...` (Testnet)
  - Privacy guarantees and limitations

#### 1.3 Address Types & Privacy
- **Address Format Guide**: https://z.cash/support/faq/
- **Privacy Best Practices**: 
  - When to use shielded vs transparent
  - Shield/unshield strategies
  - Transaction linking prevention

### 2. Zcash RPC API Reference

#### 2.1 Essential RPC Methods
You're currently using these methods - study their full documentation:

**Wallet Operations:**
- `z_getnewaddress` - Create new shielded address
- `z_listaddresses` - List all shielded addresses
- `z_getbalance` - Get shielded balance
- `z_sendmany` - Send shielded transactions (CRITICAL for your shield/unshield features)
- `z_getoperationstatus` - Check shielded transaction status
- `getreceivedbyaddress` - Get transparent balance
- `listunspent` - List UTXOs (for zero-link routing)

**Blockchain Operations:**
- `getblockchaininfo` - Network status
- `getblockcount` - Current block height
- `getblock` - Block details

**Transaction Operations:**
- `sendrawtransaction` - Broadcast signed transaction
- `gettransaction` - Transaction details

#### 2.2 RPC Documentation Sources
- **Official Zcash RPC Reference**: https://zcash.github.io/rpc/
- **Zcash Node RPC Docs**: Check your node's built-in help: `zcash-cli help`
- **RPC Method Examples**: 
  - https://zcash.readthedocs.io/en/latest/rpc/
  - Search GitHub for `zcash/zcash` RPC examples

#### 2.3 Critical RPC Method: `z_sendmany`
This is essential for your shield/unshield features. Study:
```json
{
  "method": "z_sendmany",
  "params": [
    "fromaddress",      // Source address (t-address or z-address)
    [                   // Array of outputs
      {
        "address": "zaddr...",
        "amount": 1000000  // in zatoshis
      }
    ],
    1,                  // minconf (minimum confirmations)
    0.0001              // fee (optional, in ZEC)
  ]
}
```

**Key Points:**
- Returns an operation ID (not transaction ID immediately)
- Must poll `z_getoperationstatus` to get final txid
- Different behavior for t-address vs z-address sources
- Fee calculation and minimum amounts

### 3. @mayaprotocol/zcash-js Library

#### 3.1 Library Documentation
- **NPM Package**: https://www.npmjs.com/package/@mayaprotocol/zcash-js
- **GitHub Repository**: Search for `mayaprotocol/zcash-js` (if public)
- **API Reference**: Check package README and TypeScript definitions

#### 3.2 Key Functions You're Using
Study these functions in detail:

```typescript
// UTXO Management
getUTXOS(address: string, config: Config): Promise<UTXO[]>

// Transaction Building
buildTx(
  height: number,
  fromAddress: string,
  toAddress: string,
  amount: number,  // in zatoshis
  utxos: UTXO[],
  isMemo: boolean,
  memo?: string
): Promise<Transaction>

// Transaction Signing
signAndFinalize(
  height: number,
  privateKey: string,
  inputs: Input[],
  outputs: Output[]
): Promise<string>

// Broadcasting
sendRawTransaction(signedTx: string, config: Config): Promise<string>
```

#### 3.3 What to Learn
- **UTXO Structure**: Understand the UTXO object properties
- **Transaction Building**: How inputs/outputs are structured
- **Fee Calculation**: How fees are computed
- **Error Handling**: Common errors and how to handle them
- **Network Compatibility**: Mainnet vs testnet differences

### 4. Zero-Link Routing & Privacy-Preserving Coin Selection

#### 4.1 Academic & Research Papers
- **CoinJoin Research**: https://bitcoin.org/en/developer-guide#term-coinjoin
- **UTXO Linking Analysis**: Search for "UTXO linking" and "transaction graph analysis"
- **Privacy-Preserving Coin Selection**: 
  - Academic papers on blockchain privacy
  - Bitcoin privacy research (applicable concepts)

#### 4.2 Implementation Best Practices
Your current implementation in `zeroLinkRouting.ts` needs these concepts:

**UTXO Scoring Factors:**
1. **Age Diversity**: Mix old and new UTXOs
2. **Amount Diversity**: Avoid round numbers
3. **Usage History**: Track recently used UTXOs
4. **Confirmation Count**: Prefer well-confirmed UTXOs
5. **Input Count**: Use multiple small UTXOs when possible

**Additional Concepts to Study:**
- **Common Input Ownership Heuristic (CIOH)**: How blockchain analysis links UTXOs
- **Change Output Detection**: How to avoid revealing change addresses
- **Timing Analysis**: How transaction timing can leak information
- **Amount Correlation**: How amounts can link transactions

#### 4.3 Resources
- **Bitcoin Privacy Wiki**: https://en.bitcoin.it/wiki/Privacy
- **Wasabi Wallet Documentation**: https://docs.wasabiwallet.io/ (privacy-focused wallet)
- **Samourai Wallet Research**: Privacy techniques documentation

### 5. NEAR Intents API (Cross-Chain Swaps)

#### 5.1 NEAR Intents Documentation
- **NEAR Protocol Docs**: https://docs.near.org/
- **NEAR Intents API**: 
  - Check if official docs exist at `https://api.near.org/intents/docs`
  - Search GitHub for NEAR Intents examples
  - Contact NEAR team for API documentation

#### 5.2 What You Need to Know
Your `nearIntents.ts` implementation needs:
- **Intent Creation**: POST `/intents` endpoint structure
- **Status Polling**: GET `/intents/:id` status checks
- **Result Retrieval**: GET `/intents/:id/result` for completion
- **Error Handling**: Timeout and failure scenarios
- **Supported Assets**: Which assets can be swapped (BTC, SOL, USDC → ZEC)

#### 5.3 Cross-Chain Bridge Concepts
- **Bridge Architecture**: How cross-chain swaps work
- **Atomic Swaps**: Understanding the swap mechanism
- **Settlement Times**: Expected completion times
- **Fee Structures**: Bridge fees and gas costs

### 6. Wallet & Key Management

#### 6.1 BIP39 Mnemonic Standards
- **BIP39 Specification**: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
- **BIP32/44 Derivation**: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
- **Zcash Key Derivation**: How Zcash derives keys from mnemonics

#### 6.2 Current Implementation Gaps
Your `zcashService.ts` has simplified wallet generation. Study:
- **Proper Mnemonic Generation**: Use `bip39` library correctly
- **Key Derivation**: Derive private keys from mnemonics properly
- **Address Generation**: Generate t-addresses and z-addresses from private keys
- **HD Wallets**: Hierarchical Deterministic wallet structure

#### 6.3 Security Best Practices
- **Private Key Storage**: Never store in plaintext
- **In-Memory Only**: Your current approach is good, but understand risks
- **Key Derivation**: Use proper cryptographic libraries
- **Backup & Recovery**: Mnemonic phrase handling

### 7. Transaction Building & Signing

#### 7.1 Zcash Transaction Structure
- **Transaction Components**:
  - Transparent inputs/outputs
  - Shielded inputs/outputs (JoinSplit/Spend/Output)
  - Signatures (transparent and shielded)
  - Proofs (zk-SNARKs for shielded)

#### 7.2 Signing Process
- **Transparent Signing**: ECDSA signatures
- **Shielded Signing**: Sapling/Orchard signing keys
- **Transaction Finalization**: How transactions are finalized

#### 7.3 Fee Calculation
- **Fee Structure**: Base fees, priority fees
- **Fee Estimation**: How to estimate transaction fees
- **Minimum Fees**: Network minimum requirements

### 8. Testing & Development

#### 8.1 Zcash Testnet
- **Testnet Faucet**: Get testnet ZEC for testing
- **Testnet Explorer**: View testnet transactions
- **Testnet RPC**: Connect to public testnet nodes (with limitations)

#### 8.2 Local Node Setup
- **Docker Setup**: Your `docker-compose.yml` setup
- **Node Configuration**: `zcash.conf` settings
- **RPC Security**: Authentication and access control
- **Sync Status**: Understanding node synchronization

#### 8.3 Testing Strategies
- **Unit Tests**: Test individual functions
- **Integration Tests**: Test RPC interactions
- **End-to-End Tests**: Full transaction flows
- **Privacy Testing**: Verify zero-link routing effectiveness

### 9. Frontend Integration

#### 9.1 React/TypeScript
- **React Documentation**: https://react.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Vite Documentation**: https://vitejs.dev/

#### 9.2 UI Components
- **shadcn/ui**: Your component library
- **Tailwind CSS**: Styling framework
- **Design System**: Your brand colors and components

### 10. Optional: MPC & Keyless Signing

#### 10.1 Multi-Party Computation (MPC)
- **MPC Concepts**: Threshold signatures
- **MPC Libraries**: 
  - `tss-lib` (TypeScript)
  - `multi-party-ecdsa`
- **Keyless Wallets**: How MPC enables keyless signing

#### 10.2 Implementation Resources
- **MPC Research Papers**: Academic papers on threshold cryptography
- **MPC Wallet Examples**: GitHub repositories with MPC implementations

## 🎯 Priority Learning Path

### Phase 1: Core Zcash (Week 1)
1. ✅ Read Zcash Book chapters on shielded transactions
2. ✅ Study Zcash RPC API reference (focus on `z_sendmany`)
3. ✅ Understand address types (t-address vs z-address)
4. ✅ Test shield/unshield operations on testnet

### Phase 2: Library & Implementation (Week 1-2)
1. ✅ Deep dive into `@mayaprotocol/zcash-js` documentation
2. ✅ Understand UTXO structure and management
3. ✅ Study transaction building and signing process
4. ✅ Implement proper wallet generation (BIP39)

### Phase 3: Privacy & Routing (Week 2)
1. ✅ Research zero-link routing algorithms
2. ✅ Study UTXO linking prevention techniques
3. ✅ Enhance your `zeroLinkRouting.ts` implementation
4. ✅ Test privacy effectiveness

### Phase 4: Integration & Testing (Week 2-3)
1. ✅ NEAR Intents API integration (if docs available)
2. ✅ End-to-end testing
3. ✅ Error handling and edge cases
4. ✅ Performance optimization

## 📖 Recommended Reading Order

1. **Start Here**: Zcash Book - Shielded Transactions chapter
2. **Then**: Zcash RPC API Reference - `z_sendmany` method
3. **Next**: `@mayaprotocol/zcash-js` NPM package documentation
4. **Then**: Your current implementation code (understand what you have)
5. **Finally**: Privacy research papers and best practices

## 🔍 Quick Reference Links

### Official Zcash Resources
- Main Site: https://z.cash/
- Developer Portal: https://z.cash/developers/
- GitHub: https://github.com/zcash/zcash
- Community Forum: https://forum.zcashcommunity.com/

### RPC & API
- RPC Reference: https://zcash.github.io/rpc/
- Node Setup: https://zcash.readthedocs.io/

### Libraries
- @mayaprotocol/zcash-js: https://www.npmjs.com/package/@mayaprotocol/zcash-js

### Privacy Research
- Bitcoin Privacy Wiki: https://en.bitcoin.it/wiki/Privacy
- Academic Papers: Search "blockchain privacy" and "UTXO linking"

## ⚠️ Critical Knowledge Gaps to Address

Based on your current implementation, prioritize learning:

1. **Proper Wallet Generation**: Your `createWallet()` is simplified - learn BIP39/BIP44
2. **Shielded Transaction Status**: Understanding `z_getoperationstatus` response format
3. **UTXO Privacy Scoring**: Enhance your zero-link routing algorithm
4. **Error Handling**: RPC errors, network errors, insufficient funds
5. **Fee Estimation**: Accurate fee calculation for different transaction types
6. **Transaction Confirmation**: Understanding confirmation requirements

## 🚀 Next Steps

1. **Bookmark** all the official Zcash documentation links
2. **Set up** a testnet environment with your Docker setup
3. **Read** the Zcash Book chapters on shielded transactions
4. **Study** the `z_sendmany` RPC method in detail
5. **Review** your current implementation against best practices
6. **Test** each feature incrementally on testnet

## 📝 Documentation Maintenance

As you learn, update this guide with:
- New resources you discover
- Key insights from documentation
- Implementation notes
- Common pitfalls and solutions

---

**Remember**: Privacy in blockchain is complex. Take time to understand the fundamentals before optimizing. Your zero-link routing is a good start, but study the research to make it production-ready.



