<?php
declare(strict_types=1);
ini_set('display_errors','1'); // hier ausnahmsweise sichtbar machen

ob_start();
$ret = @include __DIR__ . '/extract.php';
$noise = ob_get_clean(); // Alles, was extract.php ECHOT, landet hier

header('Content-Type: text/plain; charset=utf-8');

echo "=== extract.php Rückgabewert ===\n";
echo "Type: " . gettype($ret) . "\n";
if (is_array($ret)) {
  echo "Array count: " . count($ret) . "\n";
  if (count($ret)>0) {
    echo "Keys erstes Element: " . implode(',', array_keys((array)$ret[0])) . "\n";
  }
}

echo "\n=== Ausgabe (noise) von extract.php ===\n";
echo "Länge: " . strlen($noise) . "\n";
echo "Inhalt (erste 200 Zeichen):\n";
echo substr($noise, 0, 200) . "\n";

echo "\n=== headers_sent? ===\n";
$hs_file = $hs_line = null;
if (headers_sent($hs_file, $hs_line)) {
  echo "Ja, schon gesendet in $hs_file:$hs_line\n";
} else {
  echo "Nein\n";
}
