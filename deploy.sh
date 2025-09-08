#!/bin/bash

# GrooveScribe Deployment Script
# Uploads files to production FTP server using lftp
# Supports --dry-run to preview what will be uploaded

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load FTP credentials from .env.deploy
if [ ! -f ".env.deploy" ]; then
    echo -e "${RED}❌ Error: .env.deploy file not found${NC}"
    exit 1
fi

# Source the .env file
source .env.deploy

# Validate credentials
if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ]; then
    echo -e "${RED}❌ Error: Missing FTP credentials in .env.deploy${NC}"
    echo "Required: FTP_HOST, FTP_USER, FTP_PASS"
    exit 1
fi

# Remote directory (deploy ONLY inside this dir)
REMOTE_DIR="Scribe"

# Global options
DRY_RUN=0
for arg in "$@"; do
  if [ "$arg" = "--dry-run" ] || [ "$arg" = "-n" ]; then
    DRY_RUN=1
  fi
done

# Files to deploy (based on our fixes)
FILES_TO_DEPLOY=(
    "js/groove_writer.js"
    "js/groove_utils.js"
    "js/simple-audio-system.js"
    "js/handlers.js"

    "index.html"
    "index.php"
    "sw.js"
    "test_webaudio.html"
    "version_check.html"
    "server_info.php"
    "directory_test.html"
    "play_button_test.html"
    ".htaccess"
)

# Function to deploy files
deploy_files() {
    echo -e "${BLUE}🚀 Starting GrooveScribe deployment...${NC}"
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

    # Create/update version.json (static-host friendly)
    echo -e "${YELLOW}📝 Generating version.json...${NC}"
    build_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    version_number=$(grep -oE "const VERSION = '[^']+'" index.html | sed -E "s/const VERSION = '([^']+)';/\1/")
    printf '{\n  "version": "%s",\n  "buildTime": "%s"\n}\n' "${version_number:-0.0.0}" "$build_time" > version.json


    # Prepare hashed asset filenames (content-hash) for CSS and core JS
    echo -e "${YELLOW}🔢 Computing content hashes...${NC}"
    mkdir -p .deploy_build

    # Short 8-char hashes for readability
    GW_CSS_HASH=$(shasum -a 256 css/groove_writer_orange.css | awk '{print $1}' | cut -c1-8)
    GD_CSS_HASH=$(shasum -a 256 css/groove_display_orange.css | awk '{print $1}' | cut -c1-8)
    GW_HASH=$(shasum -a 256 js/groove_writer.js | awk '{print $1}' | cut -c1-8)
    GU_HASH=$(shasum -a 256 js/groove_utils.js | awk '{print $1}' | cut -c1-8)
    GRS_HASH=$(shasum -a 256 js/grooves.js | awk '{print $1}' | cut -c1-8)

    # (Deprecated) initial sed rewrite removed in favor of generic hashing of all HTML files


    # Build hashed mapping from all local CSS/JS references in root HTML files
    echo -e "${YELLOW}🧩 Scanning HTML for asset references...${NC}"
    : > .deploy_build/hash_map.txt

    # Iterate HTML files robustly (handles spaces in filenames)
    for html in *.html; do
      [ -e "$html" ] || continue
      rel="$html"
      # Prepare working copy
      cp -f "$html" ".deploy_build/$rel"

      # Extract local CSS/JS refs (ignore http/https and protocol-relative)
      assets=$(grep -oE 'href="[^"]+\.(css)(\?[^\"]*)?"|src="[^"]+\.(js)(\?[^\"]*)?"' "$html" \
        | sed -E 's/^(href|src)="([^"]+)".*/\2/' \
        | sed -E 's/\?[^\"]*$//' \
        | grep -vE '^(https?:)?//' \
        | sort -u || true)

      for orig in $assets; do

        # Skip if file does not exist locally
        if [ ! -f "$orig" ]; then
          continue
        fi
        # Compute hash
        HASH=$(shasum -a 256 "$orig" | awk '{print $1}' | cut -c1-8)
        base="${orig%.*}"; ext="${orig##*.}"
        hashed="${base}.${HASH}.${ext}"

        # Record mapping if new
        if ! grep -q "^$orig "$ .deploy_build/hash_map.txt 2>/dev/null; then
          echo "$orig $hashed" >> .deploy_build/hash_map.txt
        fi

        # Escape paths for sed
        ESC_ORIG=$(printf '%s' "$orig" | sed 's/[\/\&]/\\&/g')
        ESC_HASHED=$(printf '%s' "$hashed" | sed 's/[\/\&]/\\&/g')


        # Replace occurrences in the working HTML (handles with or without query params)
        sed -i.bak -E 's#(href|src)="'$ESC_ORIG'"#\1="'$ESC_HASHED'"#g' ".deploy_build/$html" || true
        sed -i.bak -E 's#(href|src)="'$ESC_ORIG'\?[^\"]*"#\1="'$ESC_HASHED'"#g' ".deploy_build/$html" || true
        rm -f ".deploy_build/$html.bak"
      done
    done

    echo -e "${GREEN}✅ Finished preparing hashed HTML copies in .deploy_build/${NC}"


	    # Create hashed asset copies in .deploy_build according to map
	    echo -e "${YELLOW}🧱 Preparing hashed asset files...${NC}"
	    while read -r orig hashed; do
	      [ -n "$orig" ] || continue
	      [ -n "$hashed" ] || continue
	      mkdir -p ".deploy_build/$(dirname "$hashed")"
	      cp -f "$orig" ".deploy_build/$hashed"
	    done < .deploy_build/hash_map.txt






    echo -e "${GREEN}✅ Prepared hashed asset mapping:${NC}"
    echo "  groove_writer_orange.css -> groove_writer_orange.${GW_CSS_HASH}.css"
    echo "  groove_display_orange.css -> groove_display_orange.${GD_CSS_HASH}.css"
    echo "  groove_writer.js -> groove_writer.${GW_HASH}.js"
    echo "  groove_utils.js -> groove_utils.${GU_HASH}.js"
    echo "  grooves.js -> grooves.${GRS_HASH}.js"

    # Create lftp script with better directory handling
    LFTP_SCRIPT=$(cat << EOF
set ftp:ssl-allow no
set ssl:verify-certificate no
set cmd:fail-exit yes
open ftp://$FTP_USER:$FTP_PASS@$FTP_HOST

# Ensure remote tree exists under Scribe
mkdir -p $REMOTE_DIR
mkdir -p $REMOTE_DIR/js
mkdir -p $REMOTE_DIR/css
mkdir -p $REMOTE_DIR/font-awesome/4.7.0/css



# Upload files with proper paths to Scribe directory
EOF
)

    # Add upload commands for each file
    for file in "${FILES_TO_DEPLOY[@]}"; do
        LFTP_SCRIPT+="
put \"$file\" -o \"$REMOTE_DIR/$file\""
    done

    LFTP_SCRIPT+="

# Upload scribe-specific test file only to Scribe directory
put \"scribe_directory_test.html\" -o \"$REMOTE_DIR/scribe_directory_test.html\" 

# Upload transformed HTML files to Scribe directory
# Upload transformed HTML files
mput -O \"$REMOTE_DIR/\" .deploy_build/*.html
put \"version.json\" -o \"$REMOTE_DIR/version.json\" 

	# Upload hashed copies for all discovered assets (already included in upload section)
	# Note: This block remains outside of the lftp heredoc and is no-op.

put \"directory_test.html\" -o \"$REMOTE_DIR/directory_test.html\" 

quit
"

    echo -e "${YELLOW}🔗 Connecting to $FTP_HOST...${NC}"

    # Execute lftp script

        # Upload hashed assets directories (js, css, font-awesome)
        ASSET_SCRIPT=$(cat << EOF
set ftp:ssl-allow no
set ssl:verify-certificate no
set cmd:fail-exit yes
open ftp://$FTP_USER:$FTP_PASS@$FTP_HOST

mkdir -p $REMOTE_DIR/js
mkdir -p $REMOTE_DIR/css
mkdir -p $REMOTE_DIR/font-awesome

mirror -R -X ".." .deploy_build/js \"$REMOTE_DIR/js\"
mirror -R -X ".." .deploy_build/css \"$REMOTE_DIR/css\"
mirror -R -X ".." .deploy_build/font-awesome \"$REMOTE_DIR/font-awesome\"

quit
EOF
)

        if [ "$DRY_RUN" = "1" ]; then
            echo "--- DRY RUN: ASSET SCRIPT (no connection) ---"
            echo "$ASSET_SCRIPT"
        else
            echo "$ASSET_SCRIPT" | lftp
        fi

        # Upload audio samples (MP3) to server
        AUDIO_SCRIPT=$(cat << EOF
set ftp:ssl-allow no
set ssl:verify-certificate no
set cmd:fail-exit yes
open ftp://$FTP_USER:$FTP_PASS@$FTP_HOST

mkdir -p $REMOTE_DIR/soundfont/NewDrumSamples/MP3
mirror -R -X ".." soundfont/NewDrumSamples/MP3 \"$REMOTE_DIR/soundfont/NewDrumSamples/MP3\"
quit
EOF
)
        if [ "$DRY_RUN" = "1" ]; then
            echo "--- DRY RUN: AUDIO SCRIPT (no connection) ---"
            echo "$AUDIO_SCRIPT"
        else
            echo "$AUDIO_SCRIPT" | lftp
        fi


    if [ "$DRY_RUN" = "1" ]; then
        echo "--- DRY RUN: MAIN SCRIPT (no connection) ---"
        echo "$LFTP_SCRIPT"
        echo ""
        echo "=================================================="
        echo -e "${GREEN}✅ Dry-run completed. No files were uploaded.${NC}"
        return 0
    fi

    if echo "$LFTP_SCRIPT" | lftp; then
        echo ""
        echo "=================================================="
        echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
        echo -e "${BLUE}📊 Deployed files:${NC}"
        for file in "${FILES_TO_DEPLOY[@]}"; do
            echo -e "   ${GREEN}✅${NC} $file"
        done
        echo ""
        echo -e "${BLUE}🌐 Site should be updated at: https://scribe.bahar.co.il/${NC}"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    fi
}

# Function to add new files to deployment
add_file() {
    local new_file="$1"
    if [ -z "$new_file" ]; then
        echo -e "${RED}❌ Error: No file specified${NC}"
        echo "Usage: $0 add <file_path>"
        exit 1
    fi

    if [ ! -f "$new_file" ]; then
        echo -e "${RED}❌ Error: File not found: $new_file${NC}"
        exit 1
    fi

    # Check if file is already in the list
    for file in "${FILES_TO_DEPLOY[@]}"; do
        if [ "$file" = "$new_file" ]; then
            echo -e "${YELLOW}ℹ️  File $new_file is already in deployment list${NC}"
            exit 0
        fi
    done

    echo -e "${GREEN}➕ Adding $new_file to deployment list${NC}"
    echo "You need to manually add this file to the FILES_TO_DEPLOY array in this script:"
    echo "    \"$new_file\""
}

# Function to list files
list_files() {
    echo -e "${BLUE}📋 Current deployment list:${NC}"
    for i in "${!FILES_TO_DEPLOY[@]}"; do
        echo "   $((i+1)). ${FILES_TO_DEPLOY[$i]}"
    done
}

# Function to update version number
update_version() {
    local new_version="$1"
    if [ -z "$new_version" ]; then
        echo -e "${RED}❌ Error: No version specified${NC}"
        echo "Usage: $0 version <version_number>"
        echo "Example: $0 version 1.3.0"
        exit 1
    fi

    if [ ! -f "index.html" ]; then
        echo -e "${RED}❌ Error: index.html not found${NC}"
        exit 1
    fi

    # Update version in index.html JavaScript
    if sed -i.bak "s/const VERSION = '[^']*'/const VERSION = '$new_version'/" index.html; then
        echo -e "${GREEN}✅ Updated JavaScript version to $new_version in index.html${NC}"
        rm -f index.html.bak
    else
        echo -e "${RED}❌ Failed to update JavaScript version in index.html${NC}"
        exit 1
    fi

    # Update cache-busting version in script tags
    if sed -i.bak "s/\\.js?v=[^\"']*/\\.js?v=$new_version/g" index.html; then
        echo -e "${GREEN}✅ Updated cache-busting version to $new_version in script tags${NC}"
        rm -f index.html.bak

        # Show current version
        current_version=$(grep "const VERSION = " index.html | sed "s/.*const VERSION = '\([^']*\)'.*/\1/")
        echo -e "${BLUE}📋 Current version: $current_version${NC}"
    else
        echo -e "${RED}❌ Failed to update cache-busting version in index.html${NC}"
        exit 1
    fi
}

# Function to show current version
show_version() {
    if [ -f "index.html" ]; then
        current_version=$(grep "const VERSION = " index.html | sed "s/.*const VERSION = '\([^']*\)'.*/\1/")
        echo -e "${BLUE}📋 Current version: $current_version${NC}"
    else
        echo -e "${RED}❌ Error: index.html not found${NC}"
    fi
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        deploy_files
        ;;
    "dry-run")
        DRY_RUN=1
        deploy_files
        ;;
    "add")
        add_file "$2"
        ;;
    "list")
        list_files
        ;;
    "version")
        update_version "$2"
        ;;
    "show-version")
        show_version
        ;;
    *)
        echo "Usage:"
        echo "  $0 deploy              - Deploy all files (default)"
        echo "  $0 deploy --dry-run    - Print FTP scripts; do not upload"
        echo "  $0 dry-run             - Same as 'deploy --dry-run'"
        echo "  $0 list                - List files to deploy"
        echo "  $0 add <file>          - Add file to deploy list (manual edit required)"
        echo "  $0 version <number>    - Update version number (e.g., 1.3.0)"
        echo "  $0 show-version        - Show current version number"
        ;;
esac
