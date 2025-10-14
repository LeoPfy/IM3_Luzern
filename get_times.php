<?php
// Nur für das Debugging während der Entwicklung:
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

require_once 'config.php'; 
header('Content-Type: application/json');

try {
    // Verbindung zur Datenbank herstellen
    $pdo = new PDO($dsn, $username, $password, $options);

    // SQL-Abfrage: Wählt alle EINZIGARTIGEN Messzeiten aus (neueste zuerst)
    $sql = "SELECT DISTINCT messzeit FROM Luzern_Data ORDER BY messzeit DESC";
    $stmt = $pdo->query($sql);

    // FETCH_COLUMN, 0 liefert ein einfaches Array mit den Werten aus der ersten Spalte
    $times = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);

    // Erfolg: Daten als JSON ausgeben
    echo json_encode($times);

} catch (PDOException $e) {
    // Fehlerbehandlung
    http_response_code(500); // Internal Server Error
    
    // Gibt eine JSON-Antwort mit der Fehlermeldung zurück
    echo json_encode([
        "error" => "Datenbankverbindung oder Abfrage fehlgeschlagen.",
        "details" => $e->getMessage()
    ]);
}
?>