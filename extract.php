<?php
function fetchMetheData()
{
    $url = "https://portal.alfons.io/app/devicecounter/api/sensors?api_key=3ad08d9e67919877e4c9f364974ce07e36cbdc9e";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    if ($response === false) {
        echo "Fehler beim Abrufen der API-Daten: ".curl_error($ch);
        curl_close($ch);
        return null;
    }
    curl_close($ch);
    return json_decode($response, true);
    echo <pre>$response</pre>;
}

return fetchMetheData();