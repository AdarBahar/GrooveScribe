<?php
// GrooveScribe Cache-Busting Entry Point
// This PHP file forces cache invalidation and serves fresh content

// Prevent caching
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Get current timestamp for cache busting
$cacheBuster = date('Ymd-His'); // Auto-update per request to force fresh HTML

// Check if cache buster is present in URL
$queryString = $_SERVER['QUERY_STRING'] ?? '';
$hasCacheBuster = strpos($queryString, 'cb=' . $cacheBuster) !== false;

if (!$hasCacheBuster) {
    // Redirect with cache buster
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    
    // Build redirect URL preserving current path (works in subdirectories like /Scribe)
    $uri = $_SERVER['REQUEST_URI'] ?? '/';

    // Append cache buster to the current URI
    $separator = (strpos($uri, '?') === false) ? '?' : '&';
    $redirectUrl = $protocol . '://' . $host . $uri . $separator . 'cb=' . $cacheBuster;

    // Perform redirect
    header('Location: ' . $redirectUrl, true, 302);
    exit;
}

// Prefer plain index.html on localhost (MAMP dev), otherwise use transformed HTML if present
$host = $_SERVER['HTTP_HOST'] ?? '';
$isLocal = false;
if ($host) {
    $isLocal = (stripos($host, 'localhost') !== false) || (stripos($host, '127.0.0.1') !== false) || (strpos($host, ':8888') !== false);
}
// Allow explicit override via ?dev=1
$qs = $_SERVER['QUERY_STRING'] ?? '';
parse_str($qs, $qsArr);
if (isset($qsArr['dev']) && ($qsArr['dev'] === '1' || $qsArr['dev'] === 1)) {
    $isLocal = true;
}

if ($isLocal) {
    $sourceHtmlPath = __DIR__ . '/index.html';
} else {
    $buildHtmlPath = __DIR__ . '/.deploy_build/index.html';
    $sourceHtmlPath = file_exists($buildHtmlPath) ? $buildHtmlPath : (__DIR__ . '/index.html');
}
$htmlContent = file_get_contents($sourceHtmlPath) ?: '';

// Replace version parameters in the HTML with current timestamp (legacy pattern)
$htmlContent = preg_replace('/\?v=[\d\.]+/', '?v=' . $cacheBuster, $htmlContent);

// Append cache buster to local CSS/JS assets to defeat CDN/browser caching
$htmlContent = preg_replace_callback(
    '/(href|src)="((?:css|js|font\-awesome)\/[^"\?]+)(\?[^\"]*)?"/i',
    function ($m) use ($cacheBuster) {
        $attr = $m[1];
        $path = $m[2];
        $qs = isset($m[3]) ? $m[3] : '';
        if ($qs && strpos($qs, 'cb=') !== false) return $m[0];
        $sep = $qs ? '&' : '?';
        return $attr . '="' . $path . $qs . $sep . 'cb=' . $cacheBuster . '"';
    },
    $htmlContent
);

// Set headers to avoid caching of HTML shell
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
header('Expires: 0');

// Marker for diagnostics
$marker = "<!-- served-by index.php; cb=$cacheBuster; src=" . basename($sourceHtmlPath) . " -->\n";

// Output the modified HTML
echo $marker . $htmlContent;
?>
