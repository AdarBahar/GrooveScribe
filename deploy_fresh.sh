#!/bin/bash

# GrooveScribe Fresh Deployment Script
# This script uploads the entire project from scratch to the Scribe folder

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

# Remote directory - ONLY Scribe folder
REMOTE_DIR="Scribe"

# All files and directories to upload (complete project)
FILES_TO_DEPLOY=(
    # Main HTML files
    "index.html"
    "gscribe_about.html"
    "gscribe_help.html"
    "gscribe.manifest"

    # Additional HTML files
    "GScribeMusicImageOnly.html"
    "GrooveDBCreateGroove.html"
    "GrooveEmbed.html"
    "GrooveEmbedSingle.html"
    "GrooveEmbedTest.html"
    "GrooveMultiDisplay.html"
    "InterestingGrooves.html"
    "TestAllTimeSigs.html"
    "WeirdTimeSigsTest.html"
    "comprehensive_tom2_test.html"
    "debug_tom2.html"
    "grooveDBTest - Single.html"
    "grooveDBTest.html"

    # Test and utility files
    "test_webaudio.html"
    "version_check.html"
    "server_info.php"
    "test_audio_visual_sync.html"
    "test_backward_compatible_midi.html"
    "test_change_division_fix.html"
    "test_css_integrity_fix.html"
    "test_drum_sounds.html"
    "test_final_tom_labels.html"
    "test_fontawesome_icons.html"
    "test_hihat_complete.html"
    "test_hihat_display.html"
    "test_initialization_fix.html"
    "test_my_grooves.html"
    "test_sync_fix_complete.html"
    "test_tom2_clicking.html"
    "test_tom2_file.html"
    "test_tom2_leftclick_fix.html"
    "test_tom_ordering.html"
    "test_tom_sounds.html"
    "test_visual_sync_persistence.html"
    "test_visual_sync_popup.html"

    # JavaScript files
    "js/groove_writer.js"
    "js/groove_utils.js"
    "js/groove_display.js"
    "js/grooves.js"
    "js/abc2svg-1.js"
    "js/jsmidgen.js"
    "js/main.js"
    "js/modern-audio-system.js"
    "js/pablo.js"
    "js/pablo.min.js"
    "js/share-button.min.js"
    "js/simple-audio-system.js"

    # CSS files
    "css/grooveDB_authoring.css"
    "css/groove_debug.css"
    "css/groove_display.css"
    "css/groove_display_grey.css"
    "css/groove_display_orange.css"
    "css/groove_writer.css"
    "css/groove_writer_orange.css"
    "css/modern-styles.css"
    "css/share-button.min.css"

    # MIDI.js library files
    "MIDI.js/js/MIDI/AudioDetect.js"
    "MIDI.js/js/MIDI/Plugin.js"
    "MIDI.js/js/MIDI/WebAudio.js"
    "MIDI.js/js/MIDI/LoadPlugin.js"
    "MIDI.js/js/MIDI/Player.js"
    "MIDI.js/inc/DOMLoader.XMLHttp.js"
    "MIDI.js/inc/jasmid/stream.js"
    "MIDI.js/inc/jasmid/midifile.js"
    "MIDI.js/inc/jasmid/replayer.js"
    "MIDI.js/inc/Base64.js"

    # Font Awesome 4.7.0 (current version)
    "font-awesome/4.7.0/css/font-awesome.min.css"
    "font-awesome/4.7.0/fonts/fontawesome-webfont.eot"
    "font-awesome/4.7.0/fonts/fontawesome-webfont.svg"
    "font-awesome/4.7.0/fonts/fontawesome-webfont.ttf"
    "font-awesome/4.7.0/fonts/fontawesome-webfont.woff"
    "font-awesome/4.7.0/fonts/fontawesome-webfont.woff2"
    "font-awesome/4.7.0/fonts/FontAwesome.otf"

    # Images
    "images/FlamImage.svg"
    "images/GScribe_Icon.svg"
    "images/GScribe_Logo_lone_g.svg"
    "images/GScribe_Logo_on_black.svg"
    "images/GScribe_Logo_on_orange.png"
    "images/GScribe_Logo_on_white.png"
    "images/GScribe_Logo_on_white.svg"
    "images/GScribe_Logo_vertical.png"
    "images/GScribe_Logo_vertical_gradient.png"
    "images/GScribe_Logo_vertical_orange.png"
    "images/GScribe_Logo_white_text.svg"
    "images/GScribe_Logo_word_stack.svg"
    "images/GrooveScribeLogo.svg"
    "images/NotationKey.svg"
    "images/NotationKeySmall.svg"
    "images/apple-touch-icon.png"
    "images/gscribe-icon-192.png"
    "images/gscribe-icon-96.png"
    "images/metronome.svg"
    "images/ABCForNotationKey.abc"

    # Soundfont files
    "soundfont/acoustic_grand_piano-mp3.js"
    "soundfont/acoustic_grand_piano-ogg.js"
    "soundfont/gunshot-mp3.js"
    "soundfont/gunshot-ogg.js"

    # Service Worker
    "sw.js"

    # Apple touch icon
    "apple-touch-icon.png"
)

# Directories to create
DIRECTORIES_TO_CREATE=(
    "js"
    "css"
    "MIDI.js"
    "MIDI.js/js"
    "MIDI.js/js/MIDI"
    "MIDI.js/inc"
    "MIDI.js/inc/jasmid"
    "font-awesome"
    "font-awesome/4.7.0"
    "font-awesome/4.7.0/css"
    "font-awesome/4.7.0/fonts"
    "images"
    "soundfont"
)

echo -e "${BLUE}🚀 Starting fresh GrooveScribe deployment...${NC}"
echo "=================================================="
echo -e "${YELLOW}📁 Target: Scribe folder ONLY${NC}"
echo -e "${YELLOW}🔒 Root directory will NOT be touched${NC}"
echo ""

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
    echo ""
    echo -e "${YELLOW}⚠️  Some files are missing. Continuing with available files...${NC}"
fi

echo -e "${GREEN}✅ Found ${#FILES_TO_DEPLOY[@]} files to deploy${NC}"
echo ""

# Create lftp script for fresh deployment
LFTP_SCRIPT=$(cat << EOF
set ftp:ssl-allow no
set ssl:verify-certificate no
open ftp://$FTP_USER:$FTP_PASS@$FTP_HOST

# Navigate to Scribe directory (create if doesn't exist)
cd $REMOTE_DIR || mkdir $REMOTE_DIR; cd $REMOTE_DIR

# Create all necessary directories
echo "📁 Creating directory structure..."
EOF
)

# Add directory creation commands
for dir in "${DIRECTORIES_TO_CREATE[@]}"; do
    LFTP_SCRIPT+="
mkdir -p \"$dir\""
done

LFTP_SCRIPT+="

# Upload all files
echo \"📤 Uploading files...\"
"

# Add upload commands for each file
for file in "${FILES_TO_DEPLOY[@]}"; do
    if [ -f "$file" ]; then
        LFTP_SCRIPT+="
put \"$file\" -o \"$file\""
    fi
done

LFTP_SCRIPT+="

# Create deployment success marker
echo \"✅ Fresh deployment completed successfully on \$(date)\" > fresh_deployment_success.txt
put fresh_deployment_success.txt

# List contents to verify
echo \"📋 Deployment verification:\"
ls -la

quit
"

echo -e "${YELLOW}🔗 Connecting to $FTP_HOST...${NC}"
echo -e "${YELLOW}📁 Deploying to Scribe directory...${NC}"

# Execute lftp script
if echo "$LFTP_SCRIPT" | lftp; then
    echo ""
    echo "=================================================="
    echo -e "${GREEN}🎉 Fresh deployment completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📊 Deployment Summary:${NC}"
    echo -e "${GREEN}   ✅ Target directory: /$REMOTE_DIR/${NC}"
    echo -e "${GREEN}   ✅ Files deployed: ${#FILES_TO_DEPLOY[@]}${NC}"
    echo -e "${GREEN}   ✅ Directories created: ${#DIRECTORIES_TO_CREATE[@]}${NC}"
    echo -e "${GREEN}   ✅ Root directory: UNTOUCHED${NC}"
    echo ""
    echo -e "${BLUE}📁 Directory structure created:${NC}"
    for dir in "${DIRECTORIES_TO_CREATE[@]}"; do
        echo -e "   📂 $dir"
    done
    echo ""
    echo -e "${BLUE}🌐 Site URL: https://scribe.bahar.co.il/${NC}"
    echo -e "${BLUE}📋 Version: $(grep "const VERSION = " index.html | sed "s/.*const VERSION = '\([^']*\)'.*/\1/" 2>/dev/null || echo "Unknown")${NC}"
    echo ""
    echo -e "${GREEN}✅ GrooveScribe has been deployed fresh to the Scribe directory!${NC}"
else
    echo -e "${RED}❌ Fresh deployment failed${NC}"
    exit 1
fi

# Clean up temporary file
rm -f fresh_deployment_success.txt

echo ""
echo -e "${YELLOW}🔍 Next steps:${NC}"
echo -e "   1. Visit https://scribe.bahar.co.il/ to test the application"
echo -e "   2. Run diagnostics: https://scribe.bahar.co.il/version_check.html"
echo -e "   3. Verify server info: https://scribe.bahar.co.il/server_info.php"
