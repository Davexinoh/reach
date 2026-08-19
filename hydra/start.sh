#!/bin/sh
set -eu

TOKEN="${HYDRA_TOKEN:-local-development-token-32-bytes}"
mkdir -p /data/store /data/cache /tmp/graph
printf '%s\n' "$TOKEN" > /data/auth-token
chmod 600 /data/auth-token

export CLOUD_PROVIDER="${CLOUD_PROVIDER:-local}"
export LOCAL_PATH="${LOCAL_PATH:-/data/store}"
export GRAPH_NAMESPACE="${GRAPH_NAMESPACE:-default}"
export GRAPH_ID="${GRAPH_ID:-default}"
export GRAPH_CELL_ID="${GRAPH_CELL_ID:-cell-0}"
export GRAPH_CELLS="${GRAPH_CELLS:-cell-0}"
export GRAPH_NODE_ID="${GRAPH_NODE_ID:-node-0}"
export GRAPH_BOLT_NODE_ADDRESSES="${GRAPH_BOLT_NODE_ADDRESSES:-node-0=127.0.0.1:7687}"
export GRAPH_ADVERTISED_BOLT_ADDR="${GRAPH_ADVERTISED_BOLT_ADDR:-127.0.0.1:7687}"
export GRAPH_DATA_CACHE_DIR="${GRAPH_DATA_CACHE_DIR:-/data/cache}"
export GRAPH_AUTH_TOKEN_FILE="${GRAPH_AUTH_TOKEN_FILE:-/data/auth-token}"
export GRAPH_ALLOW_PLAINTEXT="${GRAPH_ALLOW_PLAINTEXT:-true}"
export RUST_MIN_STACK="${RUST_MIN_STACK:-33554432}"
export GRAPH_HTTP_ADDR="${GRAPH_HTTP_ADDR:-0.0.0.0:${PORT:-8443}}"
export GRAPH_ADMIN_ADDR="${GRAPH_ADMIN_ADDR:-0.0.0.0:9090}"
export GRAPH_BOLT_ADDR="${GRAPH_BOLT_ADDR:-0.0.0.0:7687}"
export GRAPH_DATA_CACHE_BYTES="${GRAPH_DATA_CACHE_BYTES:-134217728}"
export GRAPH_SPARSE_KERNEL="${GRAPH_SPARSE_KERNEL:-adjacency}"
export GRAPH_MAX_GRAPHBLAS_MATRICES="${GRAPH_MAX_GRAPHBLAS_MATRICES:-0}"
export GRAPH_MAX_GRAPHBLAS_BYTES="${GRAPH_MAX_GRAPHBLAS_BYTES:-0}"

exec /usr/local/bin/graph-node
