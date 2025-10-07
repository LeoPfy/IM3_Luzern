<?php

// Rohdaten aus extract.php holen
$rawData = include("extract.php");

// Prüfen, ob $rawData ein Array ist
if (!is_array($rawData)) {
    throw new Exception("Keine gültigen Rohdaten vorhanden.");
}

$transformedData = [];

foreach ($rawData as $entry) {
    print_r($entry);    
    // Prüfen, ob $entry ein Array mit den erwarteten Schlüsseln ist
    // if (!is_array($entry) || !isset($entry['name'], $entry['counter'])) {
    //     // Optional: Loggen oder ignorieren
    //     continue;
    // }
    $location = $entry['name'];
    echo $location;
    $counter = (int) $entry['counter'];

    // Flaches Array mit den gewünschten Feldern anfügen
    $transformedData[] = [
        "location" => $location,
        "counter"  => $counter,
    ];
}

print_r($transformedData);
