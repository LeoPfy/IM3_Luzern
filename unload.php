<?php
require_once 'config.php';
header('Content-Type: application/json');

try {
    // Verbindung zur Datenbank herstellen
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Datenbankverbindung fehlgeschlagen: " . $e->getMessage()]);
    exit;
}

$sql = '';
$params = [];
$messzeit = $_GET['messzeit'] ?? null;

// Fall 1: Eine spezifische `messzeit` wurde angefragt (vom JS-Filter)
if ($messzeit) {
    // Wir brauchen alle Locations und Counter für diesen einen Zeitstempel.
    $sql = "SELECT location, counter FROM Luzern_Data WHERE messzeit = ?";
    $params[] = $messzeit;
} 
// Fall 2 (Standard): Keine Parameter, aber das JS braucht initial Daten
else {
    // Finde die neueste Messzeit
    $latestTimeSql = "SELECT MAX(messzeit) FROM Luzern_Data";
    $latestTime = $pdo->query($latestTimeSql)->fetchColumn();
    
    // Hole alle Einträge für diese neueste Zeit
    $sql = "SELECT location, counter FROM Luzern_Data WHERE messzeit = ?";
    $params[] = $latestTime;
}

// Führe die passende SQL-Abfrage aus
try {
    if (!$sql) {
        // Dieser Fall sollte nicht eintreten, dient aber zur Sicherheit
        throw new Exception("Es konnten keine Abfrageparameter bestimmt werden.");
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($data);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Fehler bei der Datenbankabfrage: " . $e->getMessage()]);
}
?>