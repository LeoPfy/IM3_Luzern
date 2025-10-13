<?php
declare(strict_types=1);

// Keine Warnings in der Ausgabe (gehen ins error_log)
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// --- Daten via extract.php laden ---
$payload = @include __DIR__ . '/extract.php'; // dein extract.php gibt IMMER ein Array zurück

if (!is_array($payload)) {
    error_log('transform.php: extract.php did not return array');
    echo json_encode(['ok' => false, 'error' => 'upstream_not_array']);
    exit;
}

// Die API (bzw. extract.php) liefert direkt eine Liste von Items
$items = $payload;

// --- Mapping & Filter ---
$nameMap = [
    "Kapellbruecke"      => "Kappelbrücke",     // explizit mit "pp"
    "Kapellbrücke"       => "Kappelbrücke",
    "Loewendenkmal"      => "Löwendenkmal",
    "Löwendenkmal"       => "Löwendenkmal",
    "Hertensteinstr"     => "Hertensteinstrasse",
    "Hertensteinstrasse" => "Hertensteinstrasse",
    "Schwanenplatz"      => "Schwanenplatz",
];

// Hilfsfunktionen
function norm(string $s): string {
    $s = trim($s);
    $s = strtr($s, ['ä'=>'ae','ö'=>'oe','ü'=>'ue','Ä'=>'Ae','Ö'=>'Oe','Ü'=>'Ue','ß'=>'ss']);
    return mb_strtolower($s, 'UTF-8');
}

function shouldExclude(?string $name): bool {
    if ($name === null || $name === '') return false;
    $n = norm($name);

    // Rathausquai komplett entfernen
    if (strpos($n, 'rathausquai') !== false) return true;

    // Kapell... + wifi/wlan entfernen (verschiedene Varianten)
    $isKapell = (strpos($n, 'kapellbruecke') !== false) || (strpos($n, 'kapellbr') !== false);
    $isWifi   = (strpos($n, 'wifi') !== false) || (strpos($n, 'wlan') !== false);
    return $isKapell && $isWifi;
}

function mapDisplay(string $raw, array $map): string {
    $rawN = norm($raw);
    foreach ($map as $k => $disp) {
        $kN = norm($k);
        if ($rawN === $kN || strpos($rawN, $kN) !== false) {
            return $disp;
        }
    }
    return $raw; // Fallback: Originalname
}

// --- Transformieren (mit Guards) ---
$out = [];
foreach ($items as $row) {
    // Nur echte Arrays verarbeiten
    if (!is_array($row)) continue;

    // Erwartete Keys absichern
    $name    = array_key_exists('name', $row)    && is_string($row['name']) ? $row['name'] : null;
    $counter = array_key_exists('counter', $row) && is_numeric($row['counter']) ? (int)$row['counter'] : null;

    // Ungültige/inkomplette Einträge überspringen
    if ($name === null || $counter === null) continue;

    // Ausschlüsse
    if (shouldExclude($name)) continue;

    // Anzeigenamen mappen
    $display = mapDisplay($name, $nameMap);

    // Minimales, sauberes Output-Format
    $out[] = [
        'location' => $display,
        'counter'  => $counter,
        // Falls du mehr Felder brauchst, hier ergänzen:
        // 'nodeid'   => $row['nodeid'] ?? null,
        // 'time'     => $row['ISO_time'] ?? ($row['time'] ?? null),
    ];
}

// --- Ausgabe ---
echo json_encode([
    'ok'    => true,
    'count' => count($out),
    'items' => $out,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
