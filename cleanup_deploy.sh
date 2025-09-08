#!/bin/bash

# GrooveScribe Cleanup and Deployment Script
# This script removes GrooveScribe files from root and deploys everything to Scribe folder

# Load environment variables
if [ -f ".env.deploy" ]; then
    source .env.deploy
else
    echo "❌ Error: .env.deploy file not found"
    echo "Please create .env.deploy with FTP credentials"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Remote directory
REMOTE_DIR="Scribe"

# Files that should be REMOVED from root directory (GrooveScribe-related files)
ROOT_FILES_TO_REMOVE=(
    "index.html"
    "js"
    "MIDI.js"
    "test_webaudio.html"
    "version_check.html"
    "server_info.php"
    "directory_test.html"
    "css"
    "images"
    "font-awesome"
    "soundfont"
    "gscribe.manifest"
    "gscribe_about.html"
    "gscribe_help.html"
)

# Files to deploy to Scribe directory
FILES_TO_DEPLOY=(
    "js/groove_writer.js"
    "js/groove_utils.js"
    "MIDI.js/js/MIDI/WebAudio.js"
    "MIDI.js/js/MIDI/Plugin.js"
    "index.html"
    "test_webaudio.html"
    "version_check.html"
    "server_info.php"
)

echo -e "${BLUE}🧹 Starting GrooveScribe cleanup and deployment...${NC}"
echo "=================================================="

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo -e "${RED}❌ Error: lftp is not installed${NC}"
    echo "Install it with:"
    echo "  macOS: brew install lftp"
    echo "  Ubuntu/Debian: sudo apt-get install lftp"
    echo "  CentOS/RHEL: sudo yum install lftp"
    exit 1
fi

# Check if all local files exist
echo -e "${YELLOW}📋 Checking local files...${NC}"
missing_files=()
for file in "${FILES_TO_DEPLOY[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing local files:${NC}"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    exit 1
fi

echo -e "${GREEN}✅ All local files found${NC}"

# Create lftp script for cleanup and deployment
LFTP_SCRIPT=$(cat << EOF
set ftp:ssl-allow no
set ssl:verify-certificate no
open ftp://$FTP_USER:$FTP_PASS@$FTP_HOST

# First, clean up root directory - remove GrooveScribe files
echo "🧹 Cleaning up root directory..."
EOF
)

# Add removal commands for root directory
for file in "${ROOT_FILES_TO_REMOVE[@]}"; do
    LFTP_SCRIPT+="
rm -rf \"$file\" || echo \"File/folder $file not found in root (OK)\""
done

LFTP_SCRIPT+="

# Now deploy to Scribe directory
echo \"📁 Deploying to Scribe directory...\"
cd $REMOTE_DIR || mkdir $REMOTE_DIR; cd $REMOTE_DIR

# Create all necessary directories first
mkdir -p js
mkdir -p MIDI.js/js/MIDI
mkdir -p css
mkdir -p images
mkdir -p font-awesome
mkdir -p soundfont

# Upload files with proper paths
"

# Add upload commands for each file
for file in "${FILES_TO_DEPLOY[@]}"; do
    LFTP_SCRIPT+="
put \"$file\" -o \"$file\""
done

LFTP_SCRIPT+="

# Create a test file to verify correct deployment
echo \"✅ Deployment completed to Scribe directory\" > deployment_success.txt
put deployment_success.txt

quit
"

echo -e "${YELLOW}🔗 Connecting to $FTP_HOST...${NC}"
echo -e "${YELLOW}🧹 Removing GrooveScribe files from root directory...${NC}"
echo -e "${YELLOW}📁 Deploying all files to Scribe directory...${NC}"

# Execute lftp script
if echo "$LFTP_SCRIPT" | lftp; then
    echo ""
    echo "=================================================="
    echo -e "${GREEN}🎉 Cleanup and deployment completed successfully!${NC}"
    echo -e "${BLUE}📊 Actions performed:${NC}"
    echo -e "${YELLOW}   🧹 Removed GrooveScribe files from root directory${NC}"
    echo -e "${GREEN}   📁 Deployed files to Scribe directory:${NC}"
    for file in "${FILES_TO_DEPLOY[@]}"; do
        echo -e "      ✅ $file"
    done
    echo ""
    echo -e "${BLUE}🌐 Site should now be properly contained in: https://scribe.bahar.co.il/${NC}"
    echo -e "${BLUE}📋 Current version: $(grep "const VERSION = " index.html | sed "s/.*const VERSION = '\([^']*\)'.*/\1/")${NC}"
else
    echo -e "${RED}❌ Cleanup and deployment failed${NC}"
    exit 1
fi

# Clean up temporary file
rm -f deployment_success.txt

echo ""
echo -e "${GREEN}✅ GrooveScribe is now properly contained in the Scribe directory!${NC}"
echo -e "${YELLOW}⚠️  Please verify that scribe.bahar.co.il points to the Scribe folder${NC}"
