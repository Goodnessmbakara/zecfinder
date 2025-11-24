# ZecFinder Learning Checklist

Quick reference checklist for implementing ZecFinder correctly.

## ✅ Immediate Actions (Today)

- [ ] Bookmark Zcash Developer Portal: https://z.cash/developers/
- [ ] Bookmark Zcash RPC Reference: https://zcash.github.io/rpc/
- [ ] Bookmark @mayaprotocol/zcash-js NPM: https://www.npmjs.com/package/@mayaprotocol/zcash-js
- [ ] Read Zcash Book - Shielded Transactions: https://book.z.cash/
- [ ] Set up local testnet node using Docker Compose
- [ ] Get testnet ZEC from faucet

## 📚 Core Zcash Knowledge (Week 1)

### Zcash Protocol
- [ ] Understand t-addresses vs z-addresses
- [ ] Learn Sapling shielded pool basics
- [ ] Understand shield/unshield operations
- [ ] Study transaction privacy guarantees

### RPC API
- [ ] Master `z_sendmany` method (CRITICAL for your shield/unshield)
- [ ] Understand `z_getoperationstatus` response format
- [ ] Learn `z_getnewaddress` and `z_listaddresses`
- [ ] Study `z_getbalance` for shielded balances
- [ ] Understand `listunspent` for UTXO management

### Library Usage
- [ ] Read @mayaprotocol/zcash-js README completely
- [ ] Understand `getUTXOS()` function
- [ ] Study `buildTx()` parameters and behavior
- [ ] Learn `signAndFinalize()` process
- [ ] Understand `sendRawTransaction()` error handling

## 🔒 Privacy & Zero-Link Routing (Week 2)

### Privacy Concepts
- [ ] Research UTXO linking attacks
- [ ] Understand Common Input Ownership Heuristic (CIOH)
- [ ] Learn change output detection
- [ ] Study timing analysis attacks
- [ ] Research amount correlation

### Implementation
- [ ] Review your current `zeroLinkRouting.ts` implementation
- [ ] Enhance UTXO scoring algorithm
- [ ] Add more privacy heuristics
- [ ] Test privacy effectiveness
- [ ] Document privacy guarantees

## 💰 Wallet & Key Management (Week 1-2)

### Proper Implementation
- [ ] Learn BIP39 mnemonic generation
- [ ] Study BIP32/BIP44 key derivation
- [ ] Implement proper key derivation from mnemonic
- [ ] Fix `createWallet()` to use proper libraries
- [ ] Fix `importWallet()` to derive from mnemonic correctly
- [ ] Understand Zcash address generation from keys

### Security
- [ ] Review private key storage (currently in-memory - good!)
- [ ] Understand key derivation security
- [ ] Study backup and recovery best practices
- [ ] Learn about HD wallet structure

## 🔄 Transaction Building (Week 1)

### Transaction Structure
- [ ] Understand Zcash transaction components
- [ ] Learn transparent vs shielded inputs/outputs
- [ ] Study fee calculation methods
- [ ] Understand confirmation requirements

### Error Handling
- [ ] Learn common RPC errors
- [ ] Understand insufficient funds scenarios
- [ ] Study network error handling
- [ ] Learn transaction rejection reasons

## 🌉 Cross-Chain Integration (Week 2-3)

### NEAR Intents
- [ ] Find official NEAR Intents API documentation
- [ ] Understand intent creation flow
- [ ] Learn status polling best practices
- [ ] Study error handling for cross-chain swaps
- [ ] Test swap functionality on testnet

## 🧪 Testing (Ongoing)

### Testnet Setup
- [ ] Verify Docker Compose Zcash node is running
- [ ] Test RPC connection
- [ ] Get testnet ZEC
- [ ] Test shield transaction
- [ ] Test unshield transaction
- [ ] Test zero-link routing
- [ ] Test cross-chain swap (if available)

### Test Cases
- [ ] Test wallet creation
- [ ] Test wallet import
- [ ] Test balance retrieval
- [ ] Test shield operation
- [ ] Test unshield operation
- [ ] Test send with zero-link routing
- [ ] Test error scenarios (insufficient funds, invalid addresses)
- [ ] Test NEAR Intents swap (if available)

## 📖 Documentation Review

### Must Read
- [ ] Zcash Book - Shielded Transactions chapter
- [ ] Zcash RPC API - z_sendmany method
- [ ] @mayaprotocol/zcash-js package documentation
- [ ] Your current implementation code review

### Recommended
- [ ] Bitcoin Privacy Wiki (concepts apply to Zcash)
- [ ] Privacy research papers
- [ ] Wasabi/Samourai wallet privacy techniques

## 🐛 Current Implementation Gaps

Based on code review, prioritize fixing:

### High Priority
- [ ] **Wallet Generation**: `createWallet()` uses simplified generation - implement BIP39
- [ ] **Wallet Import**: `importWallet()` doesn't derive from mnemonic - fix key derivation
- [ ] **Shielded Operation Status**: Understand `z_getoperationstatus` response fully
- [ ] **Error Handling**: Add comprehensive error handling for RPC calls

### Medium Priority
- [ ] **Zero-Link Routing**: Enhance UTXO scoring algorithm
- [ ] **Fee Estimation**: Implement accurate fee calculation
- [ ] **Transaction Confirmation**: Add confirmation tracking
- [ ] **UTXO Management**: Improve UTXO selection logic

### Low Priority
- [ ] **MPC Integration**: Research for future keyless signing
- [ ] **Advanced Privacy**: Study additional privacy techniques
- [ ] **Performance**: Optimize transaction building

## 🎯 Success Criteria

You'll know you're ready when:

- [ ] You can explain shielded vs transparent transactions
- [ ] You understand how `z_sendmany` works end-to-end
- [ ] You can build and send a shielded transaction manually
- [ ] You understand your zero-link routing algorithm
- [ ] You can handle all common RPC errors
- [ ] Your testnet transactions work reliably
- [ ] You can explain privacy guarantees of your system

## 📞 Resources Quick Access

### Official Docs
- Zcash Developers: https://z.cash/developers/
- Zcash RPC: https://zcash.github.io/rpc/
- Zcash Book: https://book.z.cash/

### Libraries
- @mayaprotocol/zcash-js: https://www.npmjs.com/package/@mayaprotocol/zcash-js

### Testing
- Testnet Faucet: Search "Zcash testnet faucet"
- Testnet Explorer: Search "Zcash testnet explorer"

### Privacy Research
- Bitcoin Privacy Wiki: https://en.bitcoin.it/wiki/Privacy

---

**Tip**: Check off items as you complete them. Focus on Core Zcash Knowledge first, then move to Privacy & Routing.



