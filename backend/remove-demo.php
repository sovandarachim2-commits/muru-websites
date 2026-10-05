<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/src/Cms.php';
$backup = dirname(cms_file()) . '/cms.before-demo-removal.' . date('Ymd-His') . '.json';
cms_store(function (array &$data) use ($backup) {
    if (!isset($data['state'])) return;
    if (!copy(cms_file(), $backup)) throw new RuntimeException('Backup failed.');
    $ids = ['muru001', 'muru002', 'night-cream', 'serum', 'cushion', 'sun-serum', 'body-lotion', 'body-wash', 'hair-mist', 'lip-tint', 'routine-set', 'travel-set'];
    $data['state']['products'] = array_values(array_filter($data['state']['products'], fn($item) => !in_array($item['id'], $ids, true)));
    $used = array_column($data['state']['products'], 'category');
    $data['state']['categories'] = array_values(array_filter($data['state']['categories'], fn($item) => !in_array($item['title'], ['Skincare', 'Makeup', 'Body Care', 'Hair Care', 'Sets'], true) || in_array($item['title'], $used, true)));
    foreach ($data['state']['social'] as &$url) {
        if (in_array($url, ['https://www.facebook.com', 'https://www.instagram.com', 'https://www.tiktok.com', 'https://t.me'], true)) $url = '';
    }
    unset($url);
    $samples = [
        'tagline' => 'Beauty for every day.', 'heroEyebrow' => 'NEW COLLECTION', 'heroTitle' => 'Beauty Made', 'heroAccent' => 'for Every Day',
        'heroDescription' => 'Discover skincare and beauty products made to bring out your natural beauty.',
        'catalogDescription' => 'Explore our collection of skincare, body care and beauty essentials designed for your everyday routine.',
        'storyTitle' => "More Than Beauty, It's Your Confidence.", 'storyDescription' => "We believe beauty is more than skin deep. It's about how you feel every day.",
        'promotionTitle' => 'The Everyday Glow Edit', 'promotionDescription' => 'Cleanser, serum, and cream, chosen for a simple daily routine. Browse the new collection and build the ritual that fits you.',
        'contactDescription' => 'Feel free to contact us anytime. Our team is here to help you.',
        'heroImage' => '/images/hero.jpg', 'storyImage' => '/images/banner.jpg', 'promotionImage' => '/images/cluster.jpg',
    ];
    foreach ($samples as $key => $value) if (($data['state']['settings'][$key] ?? '') === $value) $data['state']['settings'][$key] = '';
    if (($data['state']['settings']['catalogTitle'] ?? '') === 'Discover MURU Products') $data['state']['settings']['catalogTitle'] = 'Products';
    if (($data['state']['settings']['contactTitle'] ?? '') === 'Have Questions About Our Products?') $data['state']['settings']['contactTitle'] = 'Contact';
    $data['state']['settings']['showReviews'] = false;
    if (empty($data['state']['settings']['promotionTitle'])) $data['state']['settings']['showPromotion'] = false;
    ++$data['revision'];
}, true);
echo "Demo cleanup complete. Private backup: " . basename($backup) . PHP_EOL;
