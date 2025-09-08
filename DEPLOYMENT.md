# GrooveScribe Deployment Guide

This repository includes deployment scripts to automatically upload files to the production server.

## Files

- **`deploy.sh`** - Shell script using `lftp` (recommended)
- **`deploy.py`** - Python script using `ftplib` (alternative)
- **`.env.deploy`** - FTP credentials (already configured)
- **`requirements.txt`** - Python dependencies (for deploy.py)

## Quick Start

### Option 1: Shell Script (Recommended)

```bash
# Install lftp if not already installed
brew install lftp  # macOS
# or
sudo apt-get install lftp  # Ubuntu/Debian

# Deploy all files
./deploy.sh

# List files to deploy
./deploy.sh list

# Show current version
./deploy.sh show-version

# Update version number
./deploy.sh version 1.4.0

# Add a new file (requires manual edit)
./deploy.sh add path/to/newfile.js
```

### Option 2: Python Script

```bash
# Install dependencies
pip install -r requirements.txt

# Deploy all files
python deploy.py

# List files to deploy
python deploy.py list

# Add a new file
python deploy.py add path/to/newfile.js
```

## Version Management

The application now includes a version display in the bottom-left corner of the page:

- **Version Number**: Shows current version (e.g., "v1.3.0")
- **Build Date**: Hover over version to see build timestamp
- **Auto-Update**: Version info updates automatically when files are deployed

### Version Commands

```bash
# Show current version
./deploy.sh show-version

# Update version number
./deploy.sh version 1.4.0

# Deploy with current version
./deploy.sh deploy
```

## Current Files Being Deployed

The following files are automatically deployed based on the recent fixes:

1. `js/groove_writer.js` - Initialization timing fix
2. `js/groove_utils.js` - MIDI callback enhancements
3. `MIDI.js/js/MIDI/WebAudio.js` - Complete WebAudio implementation
4. `MIDI.js/js/MIDI/Plugin.js` - Plugin registration fix
5. `index.html` - Script loading order, CSS integrity fixes, and version display

## Adding New Files

To add new files to the deployment:

1. **Shell script**: Edit `deploy.sh` and add the file path to the `FILES_TO_DEPLOY` array
2. **Python script**: Run `python deploy.py add <file_path>` or edit the `FILES_TO_DEPLOY` list

## FTP Configuration

The scripts read FTP credentials from `.env.deploy`:
- `FTP_HOST` - FTP server hostname
- `FTP_USER` - FTP username  
- `FTP_PASS` - FTP password

Files are uploaded to the `Scribe` folder on the server.

## Troubleshooting

### lftp not found
```bash
# macOS
brew install lftp

# Ubuntu/Debian
sudo apt-get install lftp

# CentOS/RHEL
sudo yum install lftp
```

### Python dependencies missing
```bash
pip install python-dotenv
```

### FTP connection issues
- Check that `.env.deploy` contains correct credentials
- Verify FTP server is accessible
- Check firewall settings

## Production URL

After successful deployment, changes will be live at:
**https://scribe.bahar.co.il/**

## Security Note

The `.env.deploy` file contains sensitive credentials and should not be committed to public repositories. It's already included in `.gitignore` for security.
