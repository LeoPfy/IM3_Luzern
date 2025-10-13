<?php
declare(strict_types=1);

// Keine Warnings im Response-Body (gehen ins error_log)
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// -------------------------------
// 1) extract.php einbinden, aber ALLES, was es echo't, wegpuffern
// -------------------------------
$payload = null;
ob_start();
$included = @include __DIR__ . '/extract.php';
$outputNoise = ob_get_clean(); // z.B. "1\n200\n..." -> wird ignoriert

if (is_array($included)) {
    // extract.php hat ein Array zurückgegeben (optimal)
    $payload = $included;
} elseif (is_array($payload)) {
    // falls du vorher irgendwo $payload = include ... benutzt hast
} elseif (is_array($included ?? null)) {
    $payload = $included;
}

// -------------------------------
// 2) Fallback: Wenn extract.php kein Array geliefert hat, direkt zur API greifen
// -------------------------------
if (!is_array($payload)) {
    $apiUrl = "https://portal.alfons.io/app/devicecounter/api/sensors?api_key=3ad08d9e67919877e4c9f364974ce07e36cbdc9e";
    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    ]);
    $raw = curl_exec($ch);
    $err = curl_error($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false || $http >= 400) {
        error_log("transform.php fallback fetch error: " . ($err ?: ('HTTP '.$http)));
        echo json_encode(['ok' => false, 'error' => 'fetch_failed']);
        exit;
    }

    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        $payload = $decoded;
    } else {
        error_log("transform.php fallback JSON decode failed");
        echo json_encode(['ok' => false, 'error' => 'json_decode_failed']);
        exit;
    }
}

// Jetzt sollten wir ein flaches Array von Items haben
$items = $payload;
if (!is_array($items)) {
    echo json_encode(['ok' => false, 'error' => 'unexpected_payload']);
    exit;
}

// -------------------------------
// 3) Mapping & Filter-Helfer
// -------------------------------
$nameMap = [
    "Kapellbruecke"      => "Kappelbrücke",     // explizit mit "pp"
    "Kapellbrücke"       => "Kappelbrücke",
    "Loewendenkmal"      => "Löwendenkmal",
    "Löwendenkmal"       => "Löwendenkmal",
    "Hertensteinstr"     => "Hertensteinstrasse",
    "Hertensteinstrasse" => "Hertensteinstrasse",
    "Schwanenplatz"      => "Schwanenplatz",
];

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

// -------------------------------
// 4) Transformieren (mit harten Guards)
// -------------------------------
$out = [];
foreach ($items as $row) {
    // Überspringe alles, was kein Array ist (falls durch Output-Mix Skalarwerte drin sind)
    if (!is_array($row)) continue;

    // Erwartete Keys absichern
    $name    = array_key_exists('name', $row)    && is_string($row['name']) ? $row['name'] : null;
    $counter = array_key_exists('counter', $row) && is_numeric($row['counter']) ? (int)$row['counter'] : null;

    if ($name === null || $counter === null) continue;
    if (shouldExclude($name)) continue;

    $display = mapDisplay($name, $nameMap);

    $out[] = [
        'location' => $display,
        'counter'  => $counter,
        // Optional weitere Felder:
        // 'nodeid'   => $row['nodeid'] ?? null,
        // 'time'     => $row['ISO_time'] ?? ($row['time'] ?? null),
    ];
}

// -------------------------------
// 5) Ausgabe
// -------------------------------
echo json_encode([
    'ok'    => true,
    'count' => count($out),
    'items' => $out,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
