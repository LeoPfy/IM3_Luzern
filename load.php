<?php

$jsondata = include("transform.php");
$dataArray = json_decode($jsondata, true);

require_once 'config.php';

try {
    $pdo = new PDO($dsn, $username, $password, $options);

    $sql = "INSERT INTO Luzern_Data (location, counter) VALUES (?, ?)"; 

    // Daten einfügen
    $stmt = $pdo->prepare($sql);

    foreach ($dataArray as $item) {
        $stmt->execute([
            $item['location'],
            $item['counter'],
        ]);
    }

    echo "Daten erfolgreich in die Datenbank geladen.";
} catch (PDOException $e) {
    die("Datenbankfehler: " . $e->getMessage());
}