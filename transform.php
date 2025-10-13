<?php
// transform.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

// --- Rohdaten holen (direkt aus der API oder via extract.php) ---
// Entweder direkt:
$apiUrl = "https://portal.alfons.io/app/devicecounter/api/sensors?api_key=3ad08d9e67919877e4c9f364974ce07e36cbdc9e";
$ch = curl_init($apiUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => ['Accept: application/json'],
]);
$raw = curl_exec($ch);
$curlErr = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($raw === false || $httpCode >= 400) {
    echo json_encode(['ok' => false, 'error' => 'Fetch failed', 'detail' => $curlErr ?: ('HTTP '.$httpCode)]);
    exit;
}

$payload = json_decode($raw, true);
if (!is_array($payload)) {
    echo json_encode(['ok' => false, 'error' => 'JSON decode error']);
    exit;
}

// Die API liefert bei dir ein flaches Array von Items:
$items = $payload;

// --- Mapping & Utils ---
$nameMap = [
    // alle Kapell... Varianten -> gewünschter Anzeigename
    'Kapellbruecke'  => 'Kappelbrücke',
    'Kapellbrücke'   => 'Kappelbrücke',
    'Loewendenkmal'  => 'Löwendenkmal',
    'Löwendenkmal'   => 'Löwendenkmal',
    'Hertensteinstr' => 'Hertensteinstrasse',
    'Hertensteinstrasse' => 'Hertensteinstrasse',
    'Schwanenplatz'  => 'Schwanenplatz',
];

function norm(string $s): string {
    $s = trim($s);
    $s = strtr($s, ['ä'=>'ae','ö'=>'oe','ü'=>'ue','Ä'=>'Ae','Ö'=>'Oe','Ü'=>'Ue','ß'=>'ss']);
    return mb_strtolower($s, 'UTF-8');
}

function shouldExclude(?string $name): bool {
    if ($name === null || $name === '') return false;
    $n = norm($name);

    // Rathausquai vollständig raus
    if (strpos($n, 'rathausquai') !== false) return true;

    // Kapell... + wifi/wlan raus
    $isKapell = (strpos($n, 'kapellbruecke') !== false) || (strpos($n, 'kapellbr') !== false);
    $isWifi   = (strpos($n, 'wifi') !== false) || (strpos($n, 'wlan') !== false);
    if ($isKapell && $isWifi) return true;

    return false;
}

function mapDisplay(string $raw, array $map): string {
    // exakte & teilweise Matches (robust gegen Varianten)
    foreach ($map as $key => $disp) {
        if (norm($raw) === norm($key) || strpos(norm($raw), norm($key)) !== false) {
            return $disp;
        }
    }
    return $raw;
}

// --- Transformieren ---
$out = [];
foreach ($items as $row) {
    // Nur valide Rows zulassen
    if (!is_array($row)) continue;

    // Deine API hat z. B.:
    // [name] => Kapellbrücke, [counter] => 161, ...
    $name    = isset($row['name'])    && is_string($row['name']) ? $row['name'] : null;
    $counter = isset($row['counter']) && is_numeric($row['counter']) ? (int)$row['counter'] : null;

    // Wenn die Struktur mal abweicht, Eintrag überspringen statt warnen
    if ($name === null || $counter === null) continue;

    if (shouldExclude($name)) continue;

    $display = mapDisplay($name, $nameMap);

    // Ausgabeformat schlank halten – passe an, wenn du mehr Felder willst
    $out[] = [
        'location' => $display,
        'counter'  => $counter,
        // Optional nützlich:
        // 'raw_name' => $name,
        // 'nodeid'   => $row['nodeid'] ?? null,
        // 'time'     => $row['ISO_time'] ?? ($row['time'] ?? null),
    ];
}

// --- JSON ausgeben ---
echo json_encode([
    'ok' => true,
    'count' => count($out),
    'items' => $out,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
