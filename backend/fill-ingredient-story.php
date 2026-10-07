<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/src/bootstrap.php';
require __DIR__ . '/src/Cms.php';

cms_store(function (array &$data): void {
    if (!isset($data['state']['settings'])) throw new RuntimeException('Set up the CMS first.');
    $backup = dirname(cms_file()) . '/cms.before-ingredient-story.' . date('Ymd-His') . '.json';
    if (file_put_contents($backup, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), LOCK_EX) === false) throw new RuntimeException('Could not back up content.');
    $copy = [
        'ingredientEyebrow' => ['OUR INGREDIENT STORY', 'រឿងរ៉ាវគ្រឿងផ្សំរបស់យើង'],
        'ingredientTitle' => ['Get to Know Your Skincare', 'ស្វែងយល់ពីផលិតផលថែរក្សាស្បែករបស់អ្នក'],
        'ingredientDescription' => ['Every skincare routine starts with understanding your products. Explore the ingredients and directions for each MURU product, and choose the care that fits your daily routine.', 'ទម្លាប់ថែរក្សាស្បែកចាប់ផ្ដើមពីការយល់ដឹងអំពីផលិតផលរបស់អ្នក។ ស្វែងយល់ពីគ្រឿងផ្សំ និងរបៀបប្រើផលិតផល MURU នីមួយៗ ហើយជ្រើសរើសការថែរក្សាដែលសមនឹងទម្លាប់ប្រចាំថ្ងៃរបស់អ្នក។'],
        'ingredientButton' => ['Explore Products', 'ស្វែងរកផលិតផល'],
        'ingredientPoint1Title' => ['Know the Ingredients', 'ស្វែងយល់ពីគ្រឿងផ្សំ'],
        'ingredientPoint1Text' => ['Read the ingredient list on each product before choosing.', 'អានបញ្ជីគ្រឿងផ្សំរបស់ផលិតផលនីមួយៗ មុនពេលជ្រើសរើស។'],
        'ingredientPoint2Title' => ['Follow the Directions', 'អនុវត្តតាមការណែនាំ'],
        'ingredientPoint2Text' => ['Check how to use each product in your everyday routine.', 'ពិនិត្យរបៀបប្រើផលិតផលនីមួយៗ ក្នុងទម្លាប់ប្រចាំថ្ងៃរបស់អ្នក។'],
        'ingredientPoint3Title' => ['Ask Our Team', 'សួរក្រុមការងាររបស់យើង'],
        'ingredientPoint3Text' => ['Contact MURU for product information and help with your questions.', 'ទាក់ទង MURU សម្រាប់ព័ត៌មានផលិតផល និងជំនួយឆ្លើយសំណួររបស់អ្នក។'],
    ];
    foreach ($copy as $key => [$en, $km]) {
        $data['state']['settings'][$key] = $en;
        $data['state']['settings']['km'][$key] = $km;
    }
    $data['revision'] = ($data['revision'] ?? 0) + 1;
    echo 'Ingredient story saved in English and Khmer. Backup: ' . basename($backup) . PHP_EOL;
}, true);
