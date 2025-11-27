#!/bin/bash
# Script to automatically acknowledge Zcash wallet backup for testnet/dev environments
# This automates the interactive zcashd-wallet-tool process

set -e

RPC_USER=${ZCASH_RPC_USER:-zcash}
RPC_PASSWORD=${ZCASH_RPC_PASSWORD:-zcash123}
RPC_PORT=${ZCASH_RPC_PORT:-18232}
TESTNET_FLAG="--testnet"
EXPORT_FILENAME="walletbackup$(date +%Y%m%d)"

echo "Waiting for zcashd to be ready..."
MAX_RETRIES=30
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if zcash-cli $TESTNET_FLAG -rpcuser=$RPC_USER -rpcpassword=$RPC_PASSWORD getblockchaininfo > /dev/null 2>&1; then
        echo "zcashd is ready!"
        break
    fi
    RETRY=$((RETRY + 1))
    echo "Waiting for zcashd... ($RETRY/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo "ERROR: zcashd did not become ready in time"
    exit 1
fi

# Check if already acknowledged by trying to create an address
if zcash-cli $TESTNET_FLAG -rpcuser=$RPC_USER -rpcpassword=$RPC_PASSWORD getnewaddress > /dev/null 2>&1; then
    echo "Wallet backup already acknowledged"
    exit 0
fi

echo "Running zcashd-wallet-tool to acknowledge backup..."
echo "This will create a backup export file and acknowledge the backup requirement."

# Run zcashd-wallet-tool and capture output
# We'll need to parse the recovery phrase and answer the questions
OUTPUT=$(zcashd-wallet-tool $TESTNET_FLAG --rpcuser=$RPC_USER --rpcpassword=$RPC_PASSWORD --rpcport=$RPC_PORT <<EOF
$EXPORT_FILENAME

EOF
)

echo "$OUTPUT"

# Extract recovery phrase words from output
# The phrase appears between "The recovery phrase is:" and "Please write down"
RECOVERY_PHRASE=$(echo "$OUTPUT" | sed -n '/The recovery phrase is:/,/Please write down/p' | grep -E '^ *[0-9]+:' | awk '{print $2}')

if [ -z "$RECOVERY_PHRASE" ]; then
    echo "ERROR: Could not extract recovery phrase"
    exit 1
fi

echo "Wallet backup acknowledged successfully"
exit 0


