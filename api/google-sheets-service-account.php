<?php
/**
 * Vadiva Creative Labs - Google Sheets API v4 Client using Google Cloud Service Account
 * Standalone pure-PHP implementation (zero composer / zero external dependencies)
 * Generates JWT signed with RSA-SHA256, exchanges for Google OAuth2 Bearer token,
 * and calls Google Sheets API v4.
 */

class GoogleSheetsServiceAccountClient {
    private $credentials;
    private $accessToken;
    private $tokenExpiresAt = 0;

    public function __construct($credentialsPathOrJson = null) {
        if ($credentialsPathOrJson && file_exists($credentialsPathOrJson)) {
            $content = file_get_contents($credentialsPathOrJson);
            $this->credentials = json_decode($content, true);
        } elseif (is_string($credentialsPathOrJson) && strpos($credentialsPathOrJson, '{') !== false) {
            $this->credentials = json_decode($credentialsPathOrJson, true);
        } elseif (getenv('GOOGLE_SERVICE_ACCOUNT_JSON')) {
            $this->credentials = json_decode(getenv('GOOGLE_SERVICE_ACCOUNT_JSON'), true);
        }
    }

    public function isConfigured() {
        return !empty($this->credentials['client_email']) && !empty($this->credentials['private_key']);
    }

    private function base64UrlEncode($data) {
        return str_replace(array('+', '/', '='), array('-', '_', ''), base64_encode($data));
    }

    public function getAccessToken() {
        if ($this->accessToken && time() < ($this->tokenExpiresAt - 60)) {
            return $this->accessToken;
        }

        if (!$this->isConfigured()) {
            return null;
        }

        $now = time();
        $header = array(
            'alg' => 'RS256',
            'typ' => 'JWT'
        );

        $claim = array(
            'iss' => $this->credentials['client_email'],
            'scope' => 'https://www.googleapis.com/auth/spreadsheets',
            'aud' => 'https://oauth2.googleapis.com/token',
            'exp' => $now + 3600,
            'iat' => $now
        );

        $encodedHeader = $this->base64UrlEncode(json_encode($header));
        $encodedClaim = $this->base64UrlEncode(json_encode($claim));
        $signingInput = $encodedHeader . '.' . $encodedClaim;

        $privateKey = $this->credentials['private_key'];
        $signature = '';
        $success = openssl_sign($signingInput, $signature, $privateKey, 'SHA256');

        if (!$success) {
            throw new Exception("Unable to sign JWT assertion with service account private key: " . openssl_error_string());
        }

        $jwt = $signingInput . '.' . $this->base64UrlEncode($signature);

        // Exchange JWT for Bearer token
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(array(
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt
        )));
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/x-www-form-urlencoded'));
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $json = json_decode($response, true);
        if ($httpCode === 200 && !empty($json['access_token'])) {
            $this->accessToken = $json['access_token'];
            $this->tokenExpiresAt = $now + ($json['expires_in'] ?? 3600);
            return $this->accessToken;
        }

        throw new Exception("Google OAuth token exchange failed (" . $httpCode . "): " . ($json['error_description'] ?? $response));
    }

    public function appendRow($spreadsheetId, $tabName, $values) {
        $token = $this->getAccessToken();
        if (!$token) return false;

        $range = urlencode($tabName . '!A1');
        $url = "https://sheets.googleapis.com/v4/spreadsheets/{$spreadsheetId}/values/{$range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS";

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(array(
            'range' => $tabName . '!A1',
            'majorDimension' => 'ROWS',
            'values' => array($values)
        )));
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json'
        ));
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);

        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return ($code >= 200 && $code < 300);
    }

    public function getSheetData($spreadsheetId, $range) {
        $token = $this->getAccessToken();
        if (!$token) return null;

        $url = "https://sheets.googleapis.com/v4/spreadsheets/{$spreadsheetId}/values/" . urlencode($range);
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Authorization: Bearer ' . $token));
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);

        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code === 200) {
            $data = json_decode($res, true);
            return $data['values'] ?? array();
        }
        return null;
    }
}
