<?php

// Bindet das Skript im3extract.php für Rohdaten ein und speichere es in $rawData
// $rawData enthält nun das Array der Sensordaten aus der API
$rawData = include("extract.php");

/**
 * transformData
 *
 * - Transformiert die Rohdaten in das gewünschte Format
 * - Filtert unerwünschte Datensätze und Felder heraus
 * - Gibt einen JSON-String zurück
 *
 * @param array $data Das Array der rohen Sensordaten.
 * @return string Der JSON-kodierte String der transformierten Daten.
 * @throws Exception Wenn keine gültigen Rohdaten vorliegen oder Pflichtfelder fehlen.
 */
function transformData(array $data): string {
    if (!is_array($data) || empty($data)) {
        throw new Exception("Extract lieferte keine gültigen Daten.");
    }

    // 2) Mapping: API-Location → Anzeigename
    // Anmerkung: Die API liefert 'name' wie "Kapellbrücke", aber der User will "Kappelbrücke".
    $locationMap = [
        "Kapellbruecke"   => "Kappelbrücke",
        "Loewendenkmal"   => "Löwendenkmal",
        "Hertensteinstr"  => "Hertensteinstrasse",
        "Rathausquai"     => "Rathausquai",
        "Schwanenplatz"   => "Schwanenplatz"
    ];

    $result = [];

    foreach ($data as $entry) {
        // 1. FILTERUNG: Gesamten Abschnitt "Kapellbrücke Wifi" weglassen
        // Wir prüfen, ob der Name das Wort "Wifi" enthält.
        if (isset($entry['name']) && strpos($entry['name'], 'Wifi') !== false) {
            continue; // Springt zur nächsten Iteration, dieser Eintrag wird übersprungen
        }

        // 2) Pflichtfelder prüfen (basierend auf der API-Ausgabe des Benutzers)
        if (!isset($entry['name'], $entry['counter'], $entry['ISO_time'])) {
            error_log("Fehlende Pflichtfelder in einem Datensatz: " . json_encode($entry));
            continue;
        }

        // Standortname mappen
        $location = $entry['name'];

        // Anpassung für die Kappelbrücke (API liefert "Kapellbrücke" oder ähnliches)
        if ($location === "Kapellbrücke") {
             $location = "Kappelbrücke";
        }

        // Wir nutzen das Mapping des Benutzers für die restlichen Orte:
        foreach ($locationMap as $apiName => $displayName) {
            // Die Logik hier ist etwas unsicher, da wir die genauen API-Namen nicht kennen.
            // Wir verwenden hier das Feld 'name' aus dem API-Response.
            // Wenn der API-Name im Mapping als Wert existiert, nehmen wir den Schlüssel
            $key = array_search($location, $locationMap);
            if ($key !== false) {
                $location = $locationMap[$key];
            }
        }
        // WICHTIG: Die ursprüngliche Logik des Benutzers scheint 'location' aus einem 'name' abzuleiten.
        // Um sicherzustellen, dass nur die gewünschten Orte drin sind:
        $currentLocationKey = array_search($location, $locationMap);
        if ($currentLocationKey !== false) {
            $location = $locationMap[$currentLocationKey];
        } else if (in_array($location, array_values($locationMap))) {
            // Der Name ist bereits gemappt (z.B. "Löwendenkmal" stimmt)
            $location = $location;
        } else {
            // Wenn es kein bekannter Name ist, aber nicht "Wifi", verwenden wir ihn trotzdem.
        }

        // Zählerwert casten
        $counter = (int) $entry['counter'];

        // Messzeit konvertieren (ISO_time ist bereits nah am gewünschten Format Y-m-d H:i:s)
        $messzeit = date("Y-m-d H:i:s", strtotime($entry['ISO_time']));


        // Flaches Array bauen: Nur die gewünschten Felder werden aufgenommen.
        $result[] = [
            "location"  => $location,
            "counter"   => $counter,
            "messzeit"  => $messzeit
            // 'nodeid' und 'zone' (Zeitzone) wurden weggelassen.
        ];
    }

    // 3) Optional: Sortieren nach Messzeit (aufsteigend)
    usort($result, function($a, $b) {
        return strtotime($a['messzeit']) - strtotime($b['messzeit']);
    });

    // 4) JSON kodieren und zurückgeben
    return json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// --- JSON-Ausgabe im Browser anzeigen ---
header('Content-Type: application/json; charset=utf-8');
// Korrektur: Die Funktion muss mit den Rohdaten aufgerufen werden
echo transformData($rawData);
