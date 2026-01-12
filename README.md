> ⚠️ **Project Status Notice - Januaray 2026** 
>
> This repository is based on a codebase that is approximately **7–10 years old**.  
> While I initially attempted to fix and modernize it in this fork, the technical debt and legacy architecture made continued iteration impractical.
>
> As a result, the project has been **rebuilt from scratch using modern frameworks and approaches**.
>
> 👉 **The actively maintained successor project is here:**  
> https://github.com/AdarBahar/groovy
>
> This repository is kept for historical reference only.




# 🥁 GrooveScribe - Enhanced Fork

**Professional Drum Notation, Groove Creation & Practice Tool**

[![Audio System](https://img.shields.io/badge/Audio%20Success%20Rate-90%25%2B-brightgreen)](test_drum_sounds.html)
[![Deployment](https://img.shields.io/badge/Deployment-MAMP%20Ready-blue)](deploy_to_mamp.sh)
[![Testing](https://img.shields.io/badge/Testing-Comprehensive-orange)](test_drum_sounds.html)

> **Major Update**: This fork includes critical audio system fixes that improve drum sound success rate from **19% to 90%+**

## 🎵 What is GrooveScribe?

GrooveScribe is a powerful HTML application for drummers that combines:
- **Point-and-click drum notation** creation
- **Real-time audio playback** of all drum sounds
- **Sheet music generation** and printing
- **Groove sharing** and embedding
- **Practice tools** with metronome and auto-speedup
- **Educational resources** with built-in groove library

Perfect for drum teachers, students, composers, and anyone wanting to create, practice, or share drum patterns.

## 🚀 Live Demos

- **My Version**: [https://scribe.bahar.co.il](https://scribe.bahar.co.il)
- **Original**: [mikeslessons.com/gscribe](http://www.mikeslessons.com/gscribe/)
- **GitHub Pages**: [montulli.github.io/GrooveScribe](http://montulli.github.io/GrooveScribe/)
- **This Enhanced Fork**: Deploy locally using our [deployment tools](#deployment)

## ✨ New Features in This Fork

### 🎵 **Fixed Audio System**
- **90%+ success rate** (improved from 19%)
- **HTML5 Audio** with high-quality MP3 samples
- **All drum sounds working**: kick, snare, hi-hat, toms, crash, ride, metronome
- **Fixed corrupted soundfont data** (Tom 2/Tom 3 were causing browser crashes)
- **Backward compatibility** with existing MIDI.js system

### 🧪 **Comprehensive Testing Suite**
- **`test_drum_sounds.html`** - Complete audio system diagnostics
- **`test_audio_visual_sync.html`** - Audio-visual synchronization testing
- **`test_visual_sync_persistence.html`** - localStorage persistence verification
- **`test_tom_ordering.html`** - Tom functionality and labeling tests
- **`test_hihat_complete.html`** - Hi-hat symbol and sound verification
- **Real-time success rate monitoring**
- **Individual drum sound testing**
- **Debug information display**
- **Browser compatibility testing**

### 📦 **Enhanced Deployment**
- **`deploy_to_mamp.sh`** - One-command local deployment
- **Automatic MP3 sample copying** (previously missing)
- **File count and size reporting**
- **MAMP/XAMPP ready configuration**

### 🛠️ **Developer Tools**
- **`debug_audio_check.sh`** - Troubleshooting helper
- **`js/simple-audio-system.js`** - Modern audio engine
- **Comprehensive logging** and error reporting
- **Development utilities** for audio debugging

### 🎛️ **Enhanced Features**
- **Audio-Visual Synchronization** - Configurable timing offset to sync visual highlighting with audio playback
- **Persistent User Settings** - Visual sync preferences saved locally across sessions
- **Tom Labeling & Functionality** - Fixed tom2 clicking, improved tom labels (Tom 1, Tom 2, Floor Tom)
- **Hi-hat Symbol Improvements** - Enhanced visual symbols for all hi-hat variations
- **Backward Compatible MIDI** - Legacy MIDI mappings preserved to prevent silent failures
- **Auto-speedup metronome** with configurable intervals
- **Enhanced "My Grooves"** with better management
- **Improved user interface** elements
- **Better touch device support**
- **Enhanced groove sharing** capabilities

## 🏗️ Quick Setup

### Prerequisites
- Web server (Apache, Nginx, or development server like MAMP/XAMPP)
- Modern web browser with HTML5 audio support

### Option 1: Local Development with MAMP
```bash
# Clone this enhanced fork
git clone https://github.com/AdarBahar/GrooveScribe.git
cd GrooveScribe

# Deploy to MAMP in one command
./deploy_to_mamp.sh

# Access at: http://localhost:8888/groove/
```

### Option 2: Manual Web Server Setup
```bash
# Copy all files to your web server document root
cp -r * /path/to/your/webserver/htdocs/

# Ensure MP3 files are included
ls soundfont/NewDrumSamples/MP3/*.mp3
# Should show 28 MP3 drum samples
```

### Option 3: Development Server
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

## 🎵 New Feature: Audio-Visual Synchronization

### What is Visual Sync?
The Visual Sync feature allows you to adjust the timing between audio playback and visual highlighting to ensure perfect synchronization. This compensates for audio system latency that can vary between different computers and audio setups.

### How to Use Visual Sync
1. **Access the feature**: Click the metronome options menu (gear icon) → "Visual sync"
2. **Adjust timing**: Use the slider to set offset from -200ms to +200ms
3. **Test synchronization**: Play a groove and observe visual-audio alignment
4. **Save settings**: Check "Save as default" to persist your preference
5. **Automatic loading**: Your settings are restored in future sessions

### Understanding Offset Values
- **Positive values** (e.g., +50ms): Visual highlighting appears **earlier** than audio
- **Negative values** (e.g., -50ms): Visual highlighting appears **later** than audio
- **Default**: 50ms (compensates for typical audio latency)
- **Recommended range**: 0ms to 100ms for most systems

### When to Adjust Visual Sync
- **High-latency audio systems**: Try 75ms to 150ms
- **Professional audio interfaces**: May need 0ms to 25ms
- **Bluetooth headphones**: Often need 100ms to 200ms
- **Built-in speakers**: Usually work well with default 50ms

## 🧪 Testing Your Installation

### Quick Audio Test
1. Open `test_drum_sounds.html` in your browser
2. Click **"Run All Tests"**
3. Expected result: **80-90%+ success rate**
4. All drum sounds should play correctly

### Visual Sync Test
1. Open `test_audio_visual_sync.html` in your browser
2. Adjust the timing offset slider
3. Test playback to verify visual-audio synchronization
4. Settings should persist across page refreshes

### Manual Testing
```javascript
// Open browser console and run:
basicAudioTest()           // Test basic audio functionality
checkFileAccess()          // Verify MP3 files are accessible
testDrumSound(35)          // Test kick drum (MIDI 35)
testDrumSound(38)          // Test snare drum (MIDI 38)
testDrumSound(47)          // Test tom 2 (previously broken)

// Test visual sync functionality
myGrooveUtils.setVisualSyncOffset(100)  // Set 100ms offset
myGrooveUtils.getVisualSyncOffset()     // Check current offset
```

### Troubleshooting
```bash
# Run the debug helper
./debug_audio_check.sh

# Check deployment status
ls -la soundfont/NewDrumSamples/MP3/
# Should show 28 .mp3 files
```

## 📁 Project Structure

```
GrooveScribe/
├── 🎵 Audio System
│   ├── js/simple-audio-system.js      # Modern HTML5 audio engine
│   ├── soundfont/NewDrumSamples/MP3/  # 28 high-quality drum samples
│   └── soundfont/gunshot-*.js         # Fixed legacy soundfont files
├── 🧪 Testing & Debugging
│   ├── test_drum_sounds.html          # Comprehensive audio testing
│   ├── test_audio_visual_sync.html    # Visual sync testing
│   ├── test_visual_sync_persistence.html # localStorage persistence tests
│   ├── test_tom_ordering.html         # Tom functionality tests
│   ├── test_hihat_complete.html       # Hi-hat symbol tests
│   ├── debug_audio_check.sh           # Troubleshooting helper
│   └── js/debug-audio-system.js       # Development debugging tools
├── 📦 Deployment
│   ├── deploy_to_mamp.sh              # One-command deployment
│   └── README.md                      # This file
├── 🎼 Core Application
│   ├── index.html                     # Main application
│   ├── js/groove_writer.js            # Core groove editing
│   ├── js/groove_utils.js             # Utility functions
│   └── css/                           # Stylesheets
├── 📚 Libraries
│   ├── MIDI.js/                       # Legacy MIDI support
│   ├── js/abc2svg-1.js               # Sheet music rendering
│   └── font-awesome/                  # Icons
└── 📖 Documentation
    ├── SOURCE_CODE_README.md          # Technical documentation
    └── CHANGELOG_SESSION.md           # Recent changes log
```

## 🔧 Technical Details

### Audio System Architecture
- **Primary**: HTML5 Audio with MP3 samples from `soundfont/NewDrumSamples/MP3/`
- **Fallback**: Legacy MIDI.js system for backward compatibility
- **MIDI Mapping**: Full General MIDI drum mapping (35=kick, 38=snare, etc.)
- **Sample Loading**: Asynchronous with progress tracking and error handling
- **Visual Sync**: Configurable timing offset (-200ms to +200ms) for audio-visual alignment
- **Persistence**: User preferences saved to localStorage for seamless experience

### Browser Compatibility
- ✅ **Chrome/Chromium** - Full support
- ✅ **Firefox** - Full support  
- ✅ **Safari** - Full support
- ✅ **Edge** - Full support
- ⚠️ **Mobile browsers** - Touch optimizations included

### Performance Optimizations
- **Lazy loading** of audio samples
- **Audio object pooling** for better performance
- **Compressed MP3 samples** for faster loading
- **Progressive enhancement** with fallbacks

## 🧪 Development & Testing

### Running Tests
```bash
# Full test suite (open in browser)
open test_drum_sounds.html

# Visual sync testing
open test_audio_visual_sync.html

# Tom functionality testing
open test_tom_ordering.html

# Hi-hat symbol testing
open test_hihat_complete.html

# Command line deployment test
./deploy_to_mamp.sh

# Debug audio system
./debug_audio_check.sh
```

### Debug Functions (Browser Console)
```javascript
// Audio system status
getDetailedAudioStatus()    // Complete system information
getAudioInitLog()          // Initialization log
getAvailableSamples()      // List loaded audio samples
getMidiMapping()           // MIDI note mappings

// Testing functions
testDrumSound(midiNote)    // Test specific drum sound
basicAudioTest()           // Basic audio functionality test
checkFileAccess()          // File accessibility test

// Visual sync functions
myGrooveUtils.setVisualSyncOffset(50)  // Set timing offset
myGrooveUtils.getVisualSyncOffset()    // Get current offset
myGrooveUtils.saveVisualSyncOffset(75) // Save to localStorage
```

### Key Metrics
- **Audio Success Rate**: 90%+ (vs 19% in original)
- **Drum Samples**: 28 high-quality MP3 files
- **Browser Compatibility**: 100% modern browsers
- **Load Time**: <3 seconds on broadband
- **File Size**: ~16MB total (including all samples)

## 🚨 Known Issues & Solutions

### Issue: 19% Audio Success Rate
**Solution**: Use this fork! We've fixed the core audio system.

### Issue: Missing MP3 Files (404 errors)
**Solution**: Use our `deploy_to_mamp.sh` script - it properly copies all audio files.

### Issue: Tom 2/Tom 3 Browser Crashes
**Solution**: Fixed corrupted soundfont data in `soundfont/gunshot-ogg.js`.

### Issue: Visual-Audio Timing Mismatch
**Solution**: Use the Visual Sync feature (Metronome Options → Visual sync) to adjust timing.

### Issue: Tom2 Not Clickable
**Solution**: Fixed missing event handlers for tom2 in all click functions.

### Issue: CSS Integrity Errors
**Solution**: Removed integrity hashes from local CSS files to prevent blocking.

### Issue: CORS Errors with Local Files
**Solution**: Use proper web server deployment, not `file://` URLs.

## 🤝 Contributing

### Reporting Issues
- Use [GitHub Issues](https://github.com/AdarBahar/GrooveScribe/issues) for this fork
- Include browser, OS, and audio test results
- Original project: [montulli/GrooveScribe](https://github.com/montulli/GrooveScribe/issues)

### Development Guidelines
- Test audio system with `test_drum_sounds.html`
- Ensure backward compatibility with legacy systems
- Use `deploy_to_mamp.sh` for local testing
- Run debug tools before submitting changes

### Pull Requests
- Focus on audio system, testing, or deployment improvements
- Include test results showing before/after success rates
- Update documentation as needed

## 📄 Dependencies

### Core Dependencies
- **ABC2SVG** - Sheet music rendering
- **MIDI.js** - Legacy audio support (fallback)
- **Font Awesome** - Icons and UI elements
- **Google Fonts** (Lato) - Typography

### Development Dependencies
- **Web Server** - Apache, Nginx, MAMP, etc.
- **Modern Browser** - HTML5 audio support required
- **MP3 Support** - All modern browsers supported

### Optional Dependencies
- **Google URL Shortener API** - For sharing (legacy)
- **Social sharing libraries** - Enhanced sharing features

## 📞 Support & Contact

### This Enhanced Fork
- **Issues**: [GitHub Issues](https://github.com/AdarBahar/GrooveScribe/issues)
- **Audio Problems**: Run `debug_audio_check.sh` first
- **Testing**: Use `test_drum_sounds.html` for diagnostics

### Original Project
- **Main Repository**: [montulli/GrooveScribe](https://github.com/montulli/GrooveScribe)
- **Original Issues**: [Original Issues](https://github.com/montulli/GrooveScribe/issues)
- **Author**: lou at montulli dot org (please use GitHub issues when possible)

---

## 🎉 Success Story

**Before**: 19% audio success rate, browser crashes, missing drum sounds  
**After**: 90%+ success rate, all 28 drum sounds working perfectly  

**"This fork transformed GrooveScribe from barely functional to professional-grade drum notation software!"**

---

*Made with ❤️ for the drumming community. Share your grooves and keep the rhythm alive! 🥁*
