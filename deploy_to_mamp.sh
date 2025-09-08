#!/bin/bash

# Deploy GrooveScribe into MAMP htdocs using a robust rsync include list.
# Usage:
#   ./deploy_to_mamp.sh [--clean] [DEST_FOLDER]
#   ./deploy_to_mamp.sh --help
#
# Options:
#   --clean, -c   Remove files in destination that don't exist locally
#   --help,  -h   Show help and examples
#
# Examples:
#   1) Default deploy (no delete):
#        ./deploy_to_mamp.sh
#   2) With cleanup (delete removed files):
#        ./deploy_to_mamp.sh --clean
#   3) Custom folder (optionally with cleanup):
#        ./deploy_to_mamp.sh MyFolder
#        ./deploy_to_mamp.sh --clean MyFolder

set -euo pipefail

print_help() {
  cat <<'EOF'
GrooveScribe local MAMP deployment

Usage:
  ./deploy_to_mamp.sh [--clean] [DEST_FOLDER]
  ./deploy_to_mamp.sh --help

Options:
  --clean, -c   Remove files in destination that don't exist locally
  --help,  -h   Show this help message and exit

Description:
  Syncs the current project into /Applications/MAMP/htdocs/<DEST_FOLDER>
  Defaults to DEST_FOLDER=Scribe. Uses rsync with include rules to copy
  only relevant files and directories.

Examples:
  # 1) Default deploy (no delete)
  ./deploy_to_mamp.sh

  # 2) With cleanup (delete stale files in destination)
  ./deploy_to_mamp.sh --clean

  # 3) Custom folder (optionally with cleanup)
  ./deploy_to_mamp.sh MyFolder
  ./deploy_to_mamp.sh --clean MyFolder
EOF
}

# Early help
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  print_help
  exit 0
fi

# Parse optional --clean flag (first argument only)
CLEAN=0
if [[ "${1:-}" == "--clean" || "${1:-}" == "-c" ]]; then
  CLEAN=1
  shift || true
fi

# Allow help after --clean
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  print_help
  exit 0
fi

# Default destination folder name is 'Scribe' (not 'groove')
DEST_FOLDER=${1:-Scribe}
MAMP_PATH="/Applications/MAMP/htdocs"
DEST_PATH="$MAMP_PATH/$DEST_FOLDER"

echo "Deploying GrooveScribe to $DEST_PATH..."

# Ensure rsync is available
if ! command -v rsync >/dev/null 2>&1; then
  echo "Error: rsync is not installed. Please install rsync and retry."
  exit 1
fi

# Create destination directory if it doesn't exist
mkdir -p "$DEST_PATH"

echo "Preparing include rules and running rsync..."

# Build rsync arguments
RSYNC_ARGS=(
  -av
  --human-readable
  --progress
  --prune-empty-dirs
  # Includes: recurse into dirs and pick needed files
  --include '*/'
  --include '*.html'
  --include '*.manifest'
  --include '*.php'
  --include '*.json'
  --include 'sw.js'
  --include '.htaccess'
  --include '*.js'
  --include '*.css'
  --include '*.png'
  --include '*.jpg'
  --include '*.jpeg'
  --include '*.gif'
  --include '*.svg'
  --include '*.ico'
  --include '*.wav'
  # Include entire asset directories
  --include 'js/***'
  --include 'css/***'
  --include 'images/***'
  --include 'MIDI.js/***'
  --include 'soundfont/***'
  --include 'font-awesome/***'
  --include 'jstools/***'
  --include '.deploy_build/***'
  # Exclude everything else
  --exclude '*'
)

if [[ "$CLEAN" == "1" ]]; then
  RSYNC_ARGS+=(--delete)
fi

rsync "${RSYNC_ARGS[@]}" ./ "$DEST_PATH/"

# If local .deploy_build exists, mirror hashed assets into live dirs
if [[ -d .deploy_build ]]; then
  echo "Mirroring hashed assets from .deploy_build to live asset folders..."
  RSYNC_HASH_ARGS=(-av --human-readable --progress)
  # Do NOT delete when syncing .deploy_build assets, to avoid removing
  # runtime-required files (e.g., font files not present in .deploy_build)
  # css/js/font-awesome hashed copies
  if [[ -d .deploy_build/css ]]; then
    rsync "${RSYNC_HASH_ARGS[@]}" ./.deploy_build/css/ "$DEST_PATH/css/"
  fi
  if [[ -d .deploy_build/js ]]; then
    rsync "${RSYNC_HASH_ARGS[@]}" ./.deploy_build/js/ "$DEST_PATH/js/"
  fi
  if [[ -d .deploy_build/font-awesome ]]; then
    rsync "${RSYNC_HASH_ARGS[@]}" ./.deploy_build/font-awesome/ "$DEST_PATH/font-awesome/"
  fi

  # Ensure Font Awesome fonts exist (not in .deploy_build by design)
  if [[ -d ./font-awesome/4.7.0/fonts ]]; then
    rsync -av --human-readable --progress ./font-awesome/4.7.0/fonts/ "$DEST_PATH/font-awesome/4.7.0/fonts/"
  fi
else
  # No local .deploy_build; if cleaning, remove any stale one at destination
  if [[ "$CLEAN" == "1" && -d "$DEST_PATH/.deploy_build" ]]; then
    echo "--clean specified and no local .deploy_build; removing stale destination .deploy_build"
    rm -rf "$DEST_PATH/.deploy_build"
  fi
fi

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Your application is now available at: http://localhost:8888/$DEST_FOLDER/"

# Optional: Show disk usage of deployed files
if command -v du &> /dev/null; then
  echo "💾 Deployed size: $(du -sh "$DEST_PATH" | cut -f1)"
fi
