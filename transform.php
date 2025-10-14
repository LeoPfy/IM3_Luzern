<?php

// JSON-Daten als String aus extract.php holen
$data = include("extract.php");

// Debug: anzeigen, was zurückkommt
// echo "<pre>";
// print_r($data);
// echo "</pre>";

// JSON in Array umwandeln
$rawData = json_decode($data, true);

// Sicherstellen, dass Daten korrekt sind
if (!isset($rawData['data']) || !is_array($rawData['data'])) {
    throw new Exception("Unerwartetes Datenformat in extract.php");
}

// Neues Array mit nur den gewünschten Feldern erstellen
$transformedData = [];

foreach ($rawData['data'] as $entry) {

    if (in_array($entry['name'], ['Kapellbrücke Wifi', 'Rathausquai'])) {
    continue;
}

    $transformedData[] = [
        "location" => $entry['name'] ?? null,
        "counter"  => $entry['counter'] ?? null,
    ];
}

// Ausgabe zur Kontrolle
// echo "<pre>";
// print_r($transformedData);
// echo "</pre>";

$jsonOutput = json_encode($transformedData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
if ($jsonOutput === false) {
    throw new Exception("Fehler beim Kodieren der JSON-Daten: " . json_last_error_msg());
}
return $jsonOutput;
