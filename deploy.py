#!/usr/bin/env python3
"""
GrooveScribe Deployment Script
Uploads files to production FTP server in the scribe folder.
"""

import os
import sys
import ftplib
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env.deploy
load_dotenv('.env.deploy')

# FTP Configuration
FTP_HOST = os.getenv('FTP_HOST')
FTP_USER = os.getenv('FTP_USER')
FTP_PASS = os.getenv('FTP_PASS')
FTP_REMOTE_DIR = 'Scribe'  # Target directory on server

# Files to deploy (based on our fixes)
FILES_TO_DEPLOY = [
    'js/groove_writer.js',
    'js/groove_utils.js', 
    'MIDI.js/js/MIDI/WebAudio.js',
    'MIDI.js/js/MIDI/Plugin.js',
    'index.html'
]

def validate_credentials():
    """Validate that all required FTP credentials are present."""
    if not all([FTP_HOST, FTP_USER, FTP_PASS]):
        print("❌ Error: Missing FTP credentials in .env.deploy file")
        print("Required: FTP_HOST, FTP_USER, FTP_PASS")
        return False
    return True

def connect_ftp():
    """Connect to FTP server and return connection object."""
    try:
        print(f"🔗 Connecting to {FTP_HOST}...")
        ftp = ftplib.FTP(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        print(f"✅ Connected successfully as {FTP_USER}")
        return ftp
    except ftplib.all_errors as e:
        print(f"❌ FTP connection failed: {e}")
        return None

def ensure_remote_directory(ftp, remote_path):
    """Ensure remote directory exists, create if it doesn't."""
    try:
        ftp.cwd(remote_path)
        print(f"📁 Changed to directory: {remote_path}")
    except ftplib.error_perm:
        try:
            ftp.mkd(remote_path)
            ftp.cwd(remote_path)
            print(f"📁 Created and changed to directory: {remote_path}")
        except ftplib.all_errors as e:
            print(f"❌ Failed to create directory {remote_path}: {e}")
            return False
    return True

def ensure_remote_subdirectory(ftp, subdir_path):
    """Ensure remote subdirectory exists within current directory."""
    if not subdir_path:
        return True
        
    parts = subdir_path.split('/')
    for part in parts:
        if part:
            try:
                ftp.cwd(part)
            except ftplib.error_perm:
                try:
                    ftp.mkd(part)
                    ftp.cwd(part)
                    print(f"📁 Created subdirectory: {part}")
                except ftplib.all_errors as e:
                    print(f"❌ Failed to create subdirectory {part}: {e}")
                    return False
    return True

def upload_file(ftp, local_file, remote_file):
    """Upload a single file to the FTP server."""
    try:
        # Get current directory to restore later
        current_dir = ftp.pwd()
        
        # Navigate to scribe directory
        ftp.cwd('/')
        if not ensure_remote_directory(ftp, FTP_REMOTE_DIR):
            return False
            
        # Handle subdirectories
        remote_dir = os.path.dirname(remote_file)
        if remote_dir:
            if not ensure_remote_subdirectory(ftp, remote_dir):
                return False
            
        # Get just the filename for upload
        remote_filename = os.path.basename(remote_file)
        
        # Upload the file
        with open(local_file, 'rb') as file:
            ftp.storbinary(f'STOR {remote_filename}', file)
        
        print(f"✅ Uploaded: {local_file} → {FTP_REMOTE_DIR}/{remote_file}")
        
        # Navigate back to scribe directory for next file
        ftp.cwd('/')
        ftp.cwd(FTP_REMOTE_DIR)
        
        return True
        
    except FileNotFoundError:
        print(f"❌ Local file not found: {local_file}")
        return False
    except ftplib.all_errors as e:
        print(f"❌ Upload failed for {local_file}: {e}")
        return False

def deploy_files():
    """Main deployment function."""
    print("🚀 Starting GrooveScribe deployment...")
    print("=" * 50)
    
    # Validate credentials
    if not validate_credentials():
        return False
    
    # Check if all local files exist
    missing_files = []
    for file_path in FILES_TO_DEPLOY:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ Missing local files:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        return False
    
    # Connect to FTP
    ftp = connect_ftp()
    if not ftp:
        return False
    
    try:
        # Upload each file
        success_count = 0
        total_files = len(FILES_TO_DEPLOY)
        
        for file_path in FILES_TO_DEPLOY:
            print(f"\n📤 Uploading {file_path}...")
            if upload_file(ftp, file_path, file_path):
                success_count += 1
            else:
                print(f"❌ Failed to upload {file_path}")
        
        print("\n" + "=" * 50)
        print(f"📊 Deployment Summary:")
        print(f"   ✅ Successful: {success_count}/{total_files}")
        print(f"   ❌ Failed: {total_files - success_count}/{total_files}")
        
        if success_count == total_files:
            print("🎉 All files deployed successfully!")
            print(f"🌐 Site should be updated at: https://scribe.bahar.co.il/")
            return True
        else:
            print("⚠️  Some files failed to deploy. Check errors above.")
            return False
            
    finally:
        ftp.quit()
        print("🔌 FTP connection closed")

def add_file_to_deploy(file_path):
    """Add a new file to the deployment list."""
    if file_path not in FILES_TO_DEPLOY:
        FILES_TO_DEPLOY.append(file_path)
        print(f"➕ Added {file_path} to deployment list")
        # Update this script with the new file list
        update_deployment_script()
    else:
        print(f"ℹ️  {file_path} is already in deployment list")

def update_deployment_script():
    """Update this script file with the current FILES_TO_DEPLOY list."""
    # This would require reading and modifying this script file
    # For now, just print the current list
    print("\n📋 Current deployment list:")
    for i, file_path in enumerate(FILES_TO_DEPLOY, 1):
        print(f"   {i}. {file_path}")

def main():
    """Main entry point."""
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "add" and len(sys.argv) > 2:
            file_path = sys.argv[2]
            add_file_to_deploy(file_path)
        elif command == "list":
            update_deployment_script()
        elif command == "deploy":
            deploy_files()
        else:
            print("Usage:")
            print("  python deploy.py deploy     - Deploy all files")
            print("  python deploy.py list       - List files to deploy")
            print("  python deploy.py add <file> - Add file to deploy list")
    else:
        # Default action is to deploy
        deploy_files()

if __name__ == "__main__":
    main()
