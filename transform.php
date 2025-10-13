<?php
declare(strict_types=1);

// Keine Warnings im Response-Body
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin', '*');

// ---------- 1) extract.php einbinden und AUSGABE abfangen ----------
ob_start();
$included = @include __DIR__ . '/extract.php';  // soll idealerweise ein ARRAY returnen
$noise = ob_get_clean(); // alles, was extract.php echo't, verwerfen

// Falls extract.php nichts/kein Array returned hat: $included bleibt evtl. bool/int
$payload = is_array($included) ? $included : [];

// ---------- 2) Sicherstellen, dass wir eine LISTE von ARRAYS haben ----------
if (!is_array($payload)) {
    $payload = [];
}

// Manchmal landen versehentlich Skalare im Array -> rausfiltern
$items = array_values(array_filter($payload, 'is_array'));

// Optional: wenn die API statt Liste ein Objekt mit "data" liefert
if (isset($payload['data']) && is_array($payload['data'])) {
    $items = array_values(array_filter($payload['data'], 'is_array'));
}

// ---------- 3) Mapping & Filter ----------
$nameMap = [
    "Kapellbruecke"      => "Kapellbrücke",   // mit "pp" wie gewünscht
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
    if (!$name) return false;
    $n = norm($name);
    if (strpos($n, 'rathausquai') !== false) return true;
    $isKapell = (strpos($n, 'kapellbruecke') !== false) || (strpos($n, 'kapellbr') !== false);
    $isWifi   = (strpos($n, 'wifi') !== false) || (strpos($n, 'wlan') !== false);
    return $isKapell && $isWifi;
}

function mapDisplay(string $raw, array $map): string {
    $rawN = norm($raw);
    foreach ($map as $k => $disp) {
        $kN = norm($k);
        if ($rawN === $kN || strpos($rawN, $kN) !== false) return $disp;
    }
    return $raw;
}

// ---------- 4) Transformieren (nur gültige Einträge) ----------
$out = [];
foreach ($items as $row) {
    // harte Guards
    if (!isset($row['name'], $row['counter'])) continue;
    if (!is_string($row['name']) || !is_numeric($row['counter'])) continue;

    $name = $row['name'];
    if (shouldExclude($name)) continue;

    $display = mapDisplay($name, $nameMap);

    $out[] = [
        'location' => $display,
        'counter'  => (int)$row['counter'],
        // bei Bedarf weitere Felder:
        // 'nodeid'   => $row['nodeid'] ?? null,
        // 'time'     => $row['ISO_time'] ?? ($row['time'] ?? null),
    ];
}

// ---------- 5) Ausgabe ----------
echo json_encode([
    'ok'    => true,
    'count' => count($out),
    'items' => $out,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
