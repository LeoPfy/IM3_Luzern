<?php
declare(strict_types=1);

/**
 * Holt die Sensor-Daten als Array.
 * Gibt bei Fehlern ein leeres Array zurück (keine Ausgabe!).
 */
function fetchMetheData(): array
{
    $url = "https://portal.alfons.io/app/devicecounter/api/sensors?api_key=3ad08d9e67919877e4c9f364974ce07e36cbdc9e";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    ]);
    $raw     = curl_exec($ch);
    $err     = curl_error($ch);
    $http    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false || $http >= 400) {
        error_log("extract.php fetch error: " . ($err ?: 'HTTP ' . $http));
        return []; // niemals echo/print!
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        error_log("extract.php json decode failed: " . json_last_error_msg());
        return [];
    }

    // API liefert direkt eine Liste von Items
    return $data;
}

return fetchMetheData();
