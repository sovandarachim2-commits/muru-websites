<?php
declare(strict_types=1);

require __DIR__ . '/src/Cms.php';

cms_store(function (array &$data): void {
    $backup = dirname(cms_file()) . '/cms.before-website-content.' . date('Ymd-His') . '.json';
    if (!copy(cms_file(), $backup)) throw new RuntimeException('Could not back up content.');

    $copy = [
        'tagline' => 'Skincare for your everyday routine.',
        'heroEyebrow' => 'MURU SKINCARE',
        'heroTitle' => 'MURU',
        'heroAccent' => 'Everyday Skincare',
        'heroDescription' => 'Explore skincare essentials and find your next everyday favorite. Discover the MURU collection and build a routine that feels like you.',
        'heroButton' => 'Explore Products',
        'catalogTitle' => 'Discover MURU Products',
        'catalogDescription' => 'Browse our skincare collection. Explore product details, ingredients, and how to use each item in your routine.',
        'storyTitle' => 'Meet MURU',
        'storyDescription' => 'MURU is about making room for everyday self-care. Explore our skincare collection, get to know each product, and choose the essentials that fit your routine.',
        'promotionTitle' => 'Find Your Next Favorite',
        'promotionDescription' => 'Explore the latest additions to our collection. Contact the MURU team for current offers and product availability.',
        'contactTitle' => 'Get in Touch with MURU',
        'contactDescription' => 'Have a question about a product or your order? Reach out to our team for product information, availability, and help choosing your next skincare essential.',
    ];
    foreach ($copy as $key => $value) {
        if (trim((string) ($data['state']['settings'][$key] ?? '')) === '' ||
            ($key === 'catalogTitle' && $data['state']['settings'][$key] === 'Products') ||
            ($key === 'contactTitle' && $data['state']['settings'][$key] === 'Contact')) {
            $data['state']['settings'][$key] = $value;
        }
    }
    $data['revision'] = ($data['revision'] ?? 0) + 1;
    echo "Website content saved. Backup: " . basename($backup) . PHP_EOL;
}, true);
