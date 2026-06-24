<?php
/*
 * analysis.php —
 * GET analysis.php?encodeddata=<blob>   ->  JSON with decrypted plaintext + parsed fields.
 *
 *
 */
header('Content-Type: application/json; charset=utf-8');

const KEY = "syekhubmjbnpbtkvhyaxzorfklmczfft"; // 32-byte AES-256 transport key

function b64($s){ return base64_decode(strtr($s, '', ''), false); }

$blob = $_GET['encodeddata'] ?? '';
if ($blob === '') { echo json_encode(["error" => "no encodeddata param"]); exit; }

// allow pasting a full URL
if (preg_match('/encodeddata=([^&\s]+)/', $blob, $m)) $blob = urldecode($m[1]);
$blob = preg_replace('/\s+/', '', $blob);

if (strlen($blob) < 17) { echo json_encode(["error" => "blob too short"]); exit; }

$iv = substr($blob, 0, 16);                 // IV = first 16 chars (ASCII)
$ct = base64_decode(substr($blob, 16));     // ciphertext = rest, base64-decoded
if ($ct === false || strlen($ct) % 16 !== 0) {
    echo json_encode(["error" => "ciphertext not block-aligned (partial blob?)", "ct_len" => strlen($ct)]);
    exit;
}

$pt = openssl_decrypt($ct, 'AES-256-CBC', KEY, OPENSSL_RAW_DATA, $iv);
if ($pt === false) { echo json_encode(["error" => "decrypt failed (wrong key/iv or bad padding)"]); exit; }

$result = ["iv" => $iv, "plaintext" => $pt];

// pipe-delimited request? break out + base64-decode each field
if (strpos($pt, '|') !== false) {
    $fields = explode('|', $pt);
    $parsed = [];
    foreach ($fields as $i => $f) {
        $d1 = base64_decode($f, false);
        $d2 = ($d1 !== false) ? base64_decode($d1, false) : false; // fingerprint is double-b64
        $parsed[] = [
            "index" => $i,
            "raw"   => $f,
            "b64"   => ($d1 !== false && ctype_print($d1)) ? $d1 : bin2hex((string)$d1),
            "b64x2" => ($d2 !== false && $d2 !== '' && ctype_print($d2)) ? $d2 : null,
        ];
    }
    $result["fields"] = $parsed;
}

// JSON response? (e.g. {"success":false,"message":"Key not found."})
$j = json_decode($pt, true);
if ($j !== null) $result["json"] = $j;

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
