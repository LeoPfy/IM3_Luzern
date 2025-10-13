<?php
// transform.php

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

// --- Daten laden über extract.php ---
$payload = @include __DIR__ . '/extract.php'; // extract.php: return fetchMetheData();

if ($payload === false) {
    echo json_encode(['ok' => false, 'error' => 'extract.php not found or include failed']);
    exit;
}
if (!is_array($payload)) {
    echo json_encode(['ok' => false, 'error' => 'Upstream returned non-array (API/JSON error)']);
    exit;
}

// Falls die API die Liste unter "data" liefert, sonst direkt das Array nehmen
$items = (isset($payload['data']) && is_array($payload['data'])) ? $payload['data'] : $payload;
if (!is_array($items)) {
    echo json_encode(['ok' => false, 'error' => 'Unexpected payload format']);
    exit;
}

// --- Mapping der Locationnamen -> Anzeigenamen ---
$nameMap = [
    'Kapellbruecke'  => 'Kappelbrücke',
    'Loewendenkmal'  => 'Löwendenkmal',
    'Hertensteinstr' => 'Hertensteinstrasse',
    'Schwanenplatz'  => 'Schwanenplatz',
];

// Hilfsfunktionen
function norm(string $s): string {
    $s = trim($s);
    $s = strtr($s, ['ä'=>'ae','ö'=>'oe','ü'=>'ue','Ä'=>'Ae','Ö'=>'Oe','Ü'=>'Ue','ß'=>'ss']);
    return mb_strtolower($s, 'UTF-8');
}
function extractLocation(array $item): ?string {
    foreach (['location','location_name','locationName','site','place','name','sensor_location','sensorName'] as $k) {
        if (isset($item[$k]) && is_string($item[$k]) && $item[$k] !== '') return $item[$k];
    }
    return null;
}
function shouldExclude(?string $loc): bool {
    if ($loc === null) return false;
    $n = norm($loc);
    if (strpos($n, 'rathausquai') !== false) return true;               // Rathausquai
    $isKapell = (strpos($n, 'kapellbruecke') !== false) || (strpos($n, 'kapellbr') !== false);
    $isWifi   = (strpos($n, 'wifi') !== false) || (strpos($n, 'wlan') !== false);
    return $isKapell && $isWifi;                                        // Kapellbrücke WiFi
}
function mapDisplayName(string $raw, array $map): string {
    $n = norm($raw);
    foreach ($map as $k => $disp) {
        if (strpos($n, norm($k)) !== false) return $disp;
    }
    return $raw;
}

// --- Transformieren ---
$out = [];
foreach ($items as $it) {
    if (!is_array($it)) continue;
    $loc = extractLocation($it);

    if (shouldExclude($loc)) continue;

    $it['display_name'] = $loc !== null ? mapDisplayName($loc, $nameMap) : null;
    $out[] = $it;
}

// --- Ausgabe ---
echo json_encode([
    'ok' => true,
    'count' => count($out),
    'items' => $out,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
