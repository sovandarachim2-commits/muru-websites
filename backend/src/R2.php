<?php
declare(strict_types=1);

function r2_upload(string $image, string $folder = 'images'): string
{
    if (!in_array($folder, ['images', 'products', 'categories', 'website', 'profiles'], true)) throw new InvalidArgumentException('Invalid image folder.');
    $config = load_config()['r2'] ?? [];
    if (!($config['enabled'] ?? false)) Response::error('Cloudflare R2 uploads are not enabled in backend configuration.', 503);
    foreach (['account_id', 'access_key_id', 'secret_access_key', 'bucket', 'public_url'] as $key) {
        if (empty($config[$key]) || !is_string($config[$key])) Response::error('Cloudflare R2 configuration is incomplete.', 503);
    }
    if (!preg_match('/^[a-f0-9]{32}$/D', $config['account_id']) || !preg_match('/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/D', $config['bucket']) || !filter_var($config['public_url'], FILTER_VALIDATE_URL) || !str_starts_with($config['public_url'], 'https://')) Response::error('Cloudflare R2 configuration is invalid.', 503);
    if (!defined('CURLOPT_AWS_SIGV4')) Response::error('R2 uploads require PHP cURL with AWS Signature V4 support.', 503);
    $validated = cms_image($image);
    if (!preg_match('#^data:image/(jpeg|png|webp);base64,(.+)$#D', $validated, $matches)) throw new InvalidArgumentException('Upload a JPG, PNG or WebP image under 2 MB.');
    $bytes = base64_decode($matches[2], true);
    $extension = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
    $key = $folder . '/' . gmdate('Y/m') . '/' . bin2hex(random_bytes(16)) . '.' . $extension;
    $url = 'https://' . $config['account_id'] . '.r2.cloudflarestorage.com/' . $config['bucket'] . '/' . $key;
    $curl = curl_init($url);
    try {
        curl_setopt_array($curl, [
            CURLOPT_CUSTOMREQUEST => 'PUT',
            CURLOPT_POSTFIELDS => $bytes,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 45,
            CURLOPT_AWS_SIGV4 => 'aws:amz:auto:s3',
            CURLOPT_USERPWD => $config['access_key_id'] . ':' . $config['secret_access_key'],
            CURLOPT_HTTPHEADER => ['Content-Type: image/' . $matches[1], 'x-amz-content-sha256: ' . hash('sha256', $bytes)],
        ]);
        $response = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        if ($response === false || $status < 200 || $status >= 300) {
            error_log('R2 upload failed with HTTP status ' . $status . ', cURL code ' . curl_errno($curl));
            Response::error('Image upload failed. Check the R2 bucket and credentials.', 502);
        }
    } finally { curl_close($curl); }
    return rtrim($config['public_url'], '/') . '/' . $key;
}
