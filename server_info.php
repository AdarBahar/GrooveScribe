<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Get server information
$serverInfo = [
    'timestamp' => date('Y-m-d H:i:s T'),
    'server_name' => $_SERVER['SERVER_NAME'] ?? 'Unknown',
    'server_addr' => $_SERVER['SERVER_ADDR'] ?? 'Unknown',
    'server_port' => $_SERVER['SERVER_PORT'] ?? 'Unknown',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
    'http_host' => $_SERVER['HTTP_HOST'] ?? 'Unknown',
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
    'request_id' => uniqid('req_', true),
    'php_version' => phpversion(),
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown',
];

// Check file information
$filesToCheck = [
    'index.html',
    'js/groove_writer.js',
    'js/groove_utils.js',
    'MIDI.js/js/MIDI/WebAudio.js',
    'MIDI.js/js/MIDI/Plugin.js'
];

$fileInfo = [];
foreach ($filesToCheck as $file) {
    $fullPath = __DIR__ . '/' . $file;
    if (file_exists($fullPath)) {
        $fileInfo[$file] = [
            'exists' => true,
            'size' => filesize($fullPath),
            'modified' => date('Y-m-d H:i:s T', filemtime($fullPath)),
            'permissions' => substr(sprintf('%o', fileperms($fullPath)), -4),
            'md5' => md5_file($fullPath)
        ];
        
        // For index.html, extract version info
        if ($file === 'index.html') {
            $content = file_get_contents($fullPath);
            if (preg_match("/const VERSION = '([^']+)'/", $content, $matches)) {
                $fileInfo[$file]['version'] = $matches[1];
            }
            $fileInfo[$file]['has_my_grooves'] = strpos($content, 'My Grooves') !== false;
            $fileInfo[$file]['has_my_beats'] = strpos($content, 'My Beats') !== false;
            $fileInfo[$file]['play_button_count'] = substr_count($content, 'midiPlayImage');
            $fileInfo[$file]['play_plus_count'] = substr_count($content, 'midiPlayPlusImage');
        }
    } else {
        $fileInfo[$file] = [
            'exists' => false,
            'error' => 'File not found'
        ];
    }
}

// Check directory listing
$directoryInfo = [];
if (is_dir(__DIR__)) {
    $files = scandir(__DIR__);
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..') {
            $fullPath = __DIR__ . '/' . $file;
            $directoryInfo[$file] = [
                'type' => is_dir($fullPath) ? 'directory' : 'file',
                'size' => is_file($fullPath) ? filesize($fullPath) : null,
                'modified' => date('Y-m-d H:i:s T', filemtime($fullPath))
            ];
        }
    }
}

// Check for potential duplicate directories
$potentialDuplicates = [];
$searchPaths = [
    '../',
    '../../',
    '../public_html/',
    '../htdocs/',
    './old/',
    './backup/',
    './scribe_old/',
    './GrooveScribe/'
];

foreach ($searchPaths as $path) {
    $checkPath = __DIR__ . '/' . $path;
    if (is_dir($checkPath) && file_exists($checkPath . 'index.html')) {
        $potentialDuplicates[] = [
            'path' => $path,
            'index_exists' => true,
            'modified' => date('Y-m-d H:i:s T', filemtime($checkPath . 'index.html'))
        ];
    }
}

$response = [
    'status' => 'success',
    'server_info' => $serverInfo,
    'file_info' => $fileInfo,
    'directory_info' => $directoryInfo,
    'potential_duplicates' => $potentialDuplicates,
    'current_directory' => __DIR__,
    'working_directory' => getcwd()
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>
