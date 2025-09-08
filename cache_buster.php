<?php
// Cache Buster Script for GrooveScribe
// This script forces cache invalidation by redirecting with timestamp

// Prevent caching of this script
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Get current timestamp for cache busting
$cacheBuster = date('YmdHi'); // Format: 202508201800

// Check if cache buster is already present
$queryString = $_SERVER['QUERY_STRING'] ?? '';
$hasCacheBuster = strpos($queryString, 'cb=') !== false;

if (!$hasCacheBuster) {
    // Build the redirect URL with cache buster
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $uri = $_SERVER['REQUEST_URI'];
    
    // Remove this script from the URI
    $uri = str_replace('/cache_buster.php', '/', $uri);
    
    // Add cache buster to query string
    $separator = empty($queryString) ? '?' : '&';
    $redirectUrl = $protocol . '://' . $host . $uri . $separator . 'cb=' . $cacheBuster;
    
    // Perform redirect
    header('Location: ' . $redirectUrl, true, 302);
    exit;
} else {
    // Cache buster already present, redirect to main page
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    
    // Redirect to index.html with existing query string
    header('Location: ' . $protocol . '://' . $host . '/index.html?' . $queryString, true, 302);
    exit;
}
?>
