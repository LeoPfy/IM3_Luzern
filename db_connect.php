<?php
// Database configuration
$host = 'localhost'; // or your database host
$username = 'your_username';
$password = 'your_password';
$database = 'your_database';

// Create connection
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}

// Connection successful
// You can now run SQL queries using $conn

// Example query:
// $result = $conn->query('SELECT * FROM your_table');
// while ($row = $result->fetch_assoc()) {
//     echo $row['column_name'];
// }

// Close connection when done
// $conn->close();
?>
