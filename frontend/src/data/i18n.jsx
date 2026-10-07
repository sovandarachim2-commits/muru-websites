import { createContext, useContext, useEffect, useState } from "react"
import { settings } from "./site"

const STORAGE_KEY = "muru-lang"

const phrases = {
  "Brand & appearance": "ម៉ាក និងរូបរាង",
  "Homepage hero": "ផ្នែកដើមទំព័រមុខ",
  "Product catalog": "បញ្ជីផលិតផល",
  "Brand story": "រឿងរ៉ាវម៉ាក",
  "Ingredient story": "រឿងរ៉ាវគ្រឿងផ្សំ",
  "Promotion": "ប្រូម៉ូសិន",
  "Contact section": "ផ្នែកទំនាក់ទំនង",
  "Website sections": "ផ្នែកគេហទំព័រ",
  "Brand name": "ឈ្មោះម៉ាក",
  "Footer tagline": "ពាក្យស្លោកខាងក្រោមទំព័រ",
  "English": "អង់គ្លេស",
  "Khmer": "ខ្មែរ",
  "Accent color": "ពណ៌ចម្បង",
  "Body font": "ពុម្ពអក្សរ",
  "Label": "ស្លាក",
  "Headline": "ចំណងជើងធំ",
  "Highlighted headline": "ចំណងជើងរំលេច",
  "Heading": "ចំណងជើង",
  "Button text": "អត្ថបទប៊ូតុង",
  "Show promotion": "បង្ហាញប្រូម៉ូសិន",
  "Show customer reviews": "បង្ហាញមតិអតិថិជន",
  "Save website": "រក្សាទុកគេហទំព័រ",
  "Point 1 heading": "ចំណងជើងចំណុចទី១",
  "Point 1 text": "អត្ថបទចំណុចទី១",
  "Point 2 heading": "ចំណងជើងចំណុចទី២",
  "Point 2 text": "អត្ថបទចំណុចទី២",
  "Point 3 heading": "ចំណងជើងចំណុចទី៣",
  "Point 3 text": "អត្ថបទចំណុចទី៣",
  "Save changes": "រក្សាទុកការផ្លាស់ប្ដូរ",
  "Save": "រក្សាទុក",
  "Add": "បន្ថែម",
  "Remove": "លុប",
  "Type": "ប្រភេទ",
  "Phone": "លេខទូរស័ព្ទ",
  "Address": "អាសយដ្ឋាន",
  "Primary image": "រូបភាពចម្បង",
  "Branding": "អត្តសញ្ញាណម៉ាក",
  "Branding saved.": "បានរក្សាទុកអត្តសញ្ញាណម៉ាក។",
  "Website logo": "ឡូហ្គោគេហទំព័រ",
  "Browser icon": "រូបតំណាងក្នុងកម្មវិធីរុករក",
  "Product Options": "ជម្រើសផលិតផល",
  "Product options saved.": "បានរក្សាទុកជម្រើសផលិតផល។",
  "Label EN": "ស្លាកជាភាសាអង់គ្លេស",
  "Khmer label": "ស្លាកជាភាសាខ្មែរ",
  "Value": "តម្លៃសម្គាល់",
  "Add new": "បន្ថែមថ្មី",
  "Apply": "អនុវត្ត",
  "Search options": "ស្វែងរកជម្រើស",
  "Filter type": "ត្រងតាមប្រភេទ",
  "All types": "គ្រប់ប្រភេទ",
  "options": "ជម្រើស",
  "No options": "មិនមានជម្រើស",
  "No options found": "រកមិនឃើញជម្រើស",
  "Used by a product": "កំពុងប្រើដោយផលិតផល",
  "Product images": "រូបភាពផលិតផល",
  "Product images saved.": "បានរក្សាទុករូបភាពផលិតផល។",
  "Manage images": "គ្រប់គ្រងរូបភាព",
  "Images": "រូបភាព",
  "Preview": "មើលរូបភាព",
  "Add image": "បន្ថែមរូបភាព",
  "No images": "មិនមានរូបភាព",
  "Set as primary": "កំណត់ជារូបភាពចម្បង",
  "Set as main photo": "កំណត់ជារូបភាពចម្បង",
  "Move earlier": "ផ្លាស់ទីឡើងលើ",
  "Move later": "ផ្លាស់ទីចុះក្រោម",
  "Telegram contact": "ទំនាក់ទំនងតាម Telegram",
  "Contact & social links": "ទំនាក់ទំនង និងបណ្ដាញសង្គម",
  "Social links": "តំណបណ្ដាញសង្គម",
  "Same details shown in the website footer.": "ព័ត៌មានទំនាក់ទំនងនៅផ្នែកខាងក្រោមគេហទំព័រ។",
  "Contact and social links saved.": "បានរក្សាទុកទំនាក់ទំនង និងតំណបណ្ដាញសង្គម។",
  "Enter both labels and a valid value.": "សូមបញ្ចូលស្លាកទាំងពីរ និងតម្លៃសម្គាល់ត្រឹមត្រូវ។",
  "That value is already in use.": "តម្លៃសម្គាល់នេះកំពុងប្រើរួចហើយ។",
  "Transparent PNG or WebP. SVG supported through an HTTPS image URL.": "រូបភាព PNG ឬ WebP ដែលមានផ្ទៃថ្លា។ សម្រាប់ SVG សូមប្រើតំណរូបភាព HTTPS។",
  Home: "ទំព័រដើម",
  Categories: "ប្រភេទ",
  Products: "ផលិតផល",
  "About Us": "អំពីយើង",
  Contact: "ទំនាក់ទំនង",
  Information: "ព័ត៌មាន",
  "Search products...": "ស្វែងរកផលិតផល...",
  "Search products": "ស្វែងរកផលិតផល",
  "No matching products.": "រកមិនឃើញផលិតផលទេ។",
  "Open menu": "បើកម៉ឺនុយ",
  "Close menu": "បិទម៉ឺនុយ",
  Primary: "ម៉ឺនុយចម្បង",
  Mobile: "ម៉ឺនុយទូរស័ព្ទ",
  Language: "ភាសា",
  "Authentic Products": "ផលិតផលពិត",
  "100% genuine and quality": "ផលិតផលពិត ១០០% និងមានគុណភាព",
  "Quality Ingredients": "គ្រឿងផ្សំមានគុណភាព",
  "Safe & effective for your skin": "សុវត្ថិភាព និងមានប្រសិទ្ធភាពសម្រាប់ស្បែក",
  "Trusted Brand": "ម៉ាកដែលទុកចិត្តបាន",
  "Loved by thousands of customers": "អតិថិជនរាប់ពាន់នាក់ចូលចិត្ត",
  "Customer Support": "សេវាអតិថិជន",
  "We're always here for you": "យើងនៅទីនេះជានិច្ចដើម្បីជួយអ្នក",
  "Glow Your Way": "ភ្លឺតាមរបៀបរបស់អ្នក",
  "Best Sellers": "លក់ដាច់បំផុត",
  "BEST SELLERS": "លក់ដាច់បំផុត",
  PROMOTION: "ប្រូម៉ូសិន",
  Promotions: "ប្រូម៉ូសិន",
  "View the Edit": "មើលបន្ថែម",
  "View All": "មើលទាំងអស់",
  "Our Most Loved": "ផលិតផលដែលគេចូលចិត្ត",
  "The MURU favorites made for a simple daily routine.": "ផលិតផល MURU ដែលពេញនិយមសម្រាប់ទម្លាប់ប្រចាំថ្ងៃ។",
  PRODUCTS: "ផលិតផល",
  "The MURU Collection": "បណ្តុំផលិតផល MURU",
  "View all products": "មើលផលិតផលទាំងអស់",
  "Browse By Categories": "រកមើលតាមប្រភេទ",
  "Explore handpicked collections for every part of your beauty routine.": "ស្វែងរកបណ្តុំផលិតផលដែលបានជ្រើសរើសសម្រាប់ទម្លាប់សម្រស់របស់អ្នក។",
  "BEAUTY BEYOND SKIN": "សម្រស់លើសពីស្បែក",
  "Discover Our Story": "ស្វែងយល់រឿងរ៉ាវរបស់យើង",
  "Our Most Loved Products": "ផលិតផលដែលគេស្រលាញ់បំផុត",
  "OUR INGREDIENT STORY": "រឿងរ៉ាវគ្រឿងផ្សំ",
  "Beauty You Can Trust": "សម្រស់ដែលអ្នកទុកចិត្តបាន",
  "We carefully select high-quality ingredients to create safe, effective, and gentle products for your skin.": "យើងជ្រើសរើសគ្រឿងផ្សំមានគុណភាពខ្ពស់ ដើម្បីបង្កើតផលិតផលដែលសុវត្ថិភាព មានប្រសិទ្ធភាព និងទន់ភ្លន់សម្រាប់ស្បែករបស់អ្នក។",
  "Learn More": "ស្វែងយល់បន្ថែម",
  "Natural Ingredients": "គ្រឿងផ្សំធម្មជាតិ",
  "Gentle and skin-friendly.": "ទន់ភ្លន់ និងសមស្របនឹងស្បែក។",
  "Safe Formulation": "រូបមន្តសុវត្ថិភាព",
  "Dermatologically tested.": "បានធ្វើតេស្តដោយគ្រូពេទ្យស្បែក។",
  "Real Results": "លទ្ធផលពិត",
  "Loved by our customers.": "អតិថិជនរបស់យើងចូលចិត្ត។",
  "CUSTOMER REVIEWS": "មតិអតិថិជន",
  "What Our Customers Say": "អតិថិជននិយាយអ្វីខ្លះ",
  "Contact Us": "ទាក់ទងមកយើង",
  "Message on Facebook": "ផ្ញើសារតាម Facebook",
  "Chat on Telegram": "ជជែកតាម Telegram",
  "Because you deserve to feel beautiful, inside and out.": "ព្រោះអ្នកសមនឹងមានអារម្មណ៍ស្រស់ស្អាត ទាំងខាងក្នុង និងខាងក្រៅ។",
  "Follow Us": "តាមដានយើង",
  "Follow us": "តាមដានយើង",
  "All rights reserved.": "រក្សាសិទ្ធិគ្រប់យ៉ាង។",
  Privacy: "ឯកជនភាព",
  "Privacy Policy": "គោលការណ៍ឯកជនភាព",
  "Terms & Conditions": "លក្ខខណ្ឌ",
  Sitemap: "ផែនទីគេហទំព័រ",
  FAQ: "សំណួរញឹកញាប់",
  "Phnom Penh, Cambodia": "ភ្នំពេញ កម្ពុជា",
  "New Arrivals": "ទំនិញថ្មី",
  "All Products": "ផលិតផលទាំងអស់",
  All: "ទាំងអស់",
  "OUR PRODUCTS": "ផលិតផលរបស់យើង",
  Newest: "ថ្មីបំផុត",
  "A-Z": "ក-អ",
  Sort: "តម្រៀប",
  Grid: "ក្រឡា",
  List: "បញ្ជី",
  "No products in this category.": "មិនមានផលិតផលក្នុងប្រភេទនេះទេ។",
  CONTACT: "ទំនាក់ទំនង",
  "Need Help Choosing the Right Product?": "ត្រូវការជំនួយក្នុងការជ្រើសរើសផលិតផលមែនទេ?",
  "Our team is here to help you find the MURU products that fit your beauty routine.": "ក្រុមការងាររបស់យើងនៅទីនេះ ដើម្បីជួយអ្នករកផលិតផល MURU ដែលសមនឹងទម្លាប់សម្រស់របស់អ្នក។",
  PRODUCT: "ផលិតផល",
  "Product Not Found": "រកមិនឃើញផលិតផល",
  "This product is not in the MURU collection.": "ផលិតផលនេះមិនមានក្នុងបណ្តុំ MURU ទេ។",
  "Back to Products": "ត្រឡប់ទៅផលិតផល",
  Back: "ត្រឡប់",
  Breadcrumb: "ផ្លូវទំព័រ",
  Size: "ទំហំ",
  "Skin type": "ប្រភេទស្បែក",
  Ingredients: "គ្រឿងផ្សំ",
  "How to use": "របៀបប្រើ",
  "Inquire About Product": "សាកសួរអំពីផលិតផល",
  Tags: "ស្លាក",
  Share: "ចែករំលែក",
  "Best Seller": "លក់ដាច់",
  New: "ថ្មី",
  Description: "ការពិពណ៌នា",
  "Additional Information": "ព័ត៌មានបន្ថែម",
  Reviews: "មតិ",
  "Product information": "ព័ត៌មានផលិតផល",
  "Ask our team for the size, ingredients, and how to use this product.": "សួរក្រុមការងាររបស់យើងអំពីទំហំ គ្រឿងផ្សំ និងរបៀបប្រើផលិតផលនេះ។",
  "Related Products": "ផលិតផលពាក់ព័ន្ធ",
  Previous: "មុន",
  Next: "បន្ទាប់",
  "Previous image": "រូបមុន",
  "Next image": "រូបបន្ទាប់",
  "Featured banners": "បដាពិសេស",
  "Explore Products": "រុករកផលិតផល",
  "MURU SKINCARE": "ថែស្បែក MURU",
  "Everyday Skincare": "ថែស្បែកប្រចាំថ្ងៃ",
  "Explore skincare essentials and find your next everyday favorite. Discover the MURU collection and build a routine that feels like you.": "ស្វែងរកផលិតផលថែស្បែកសំខាន់ៗ និងរកផលិតផលប្រចាំថ្ងៃដែលអ្នកចូលចិត្ត។ ស្វែងយល់បណ្តុំ MURU និងបង្កើតទម្លាប់ដែលសមនឹងអ្នក។",
  "Find Your Next Favorite": "រកផលិតផលបន្ទាប់ដែលអ្នកចូលចិត្ត",
  "Explore the latest additions to our collection. Contact the MURU team for current offers and product availability.": "ស្វែងរកផលិតផលថ្មីៗក្នុងបណ្តុំរបស់យើង។ ទាក់ទងក្រុម MURU សម្រាប់ការផ្តល់ជូន និងស្តុកផលិតផល។",
  "Discover MURU Products": "ស្វែងយល់ផលិតផល MURU",
  "Browse our skincare collection. Explore product details, ingredients, and how to use each item in your routine.": "រកមើលបណ្តុំថែស្បែករបស់យើង។ ស្វែងយល់ព័ត៌មានផលិតផល គ្រឿងផ្សំ និងរបៀបប្រើក្នុងទម្លាប់របស់អ្នក។",
  "Meet MURU": "ស្គាល់ MURU",
  "MURU is about making room for everyday self-care. Explore our skincare collection, get to know each product, and choose the essentials that fit your routine.": "MURU គឺជាការថែរក្សាខ្លួនឯងប្រចាំថ្ងៃ។ ស្វែងរកបណ្តុំថែស្បែក ស្គាល់ផលិតផលនីមួយៗ និងជ្រើសរើសអ្វីដែលសមនឹងទម្លាប់របស់អ្នក។",
  "Get in Touch with MURU": "ទាក់ទងមក MURU",
  "Have a question about a product or your order? Reach out to our team for product information, availability, and help choosing your next skincare essential.": "មានសំណួរអំពីផលិតផល ឬការកុម្ម៉ង់របស់អ្នក? ទាក់ទងក្រុមការងាររបស់យើង សម្រាប់ព័ត៌មានផលិតផល ស្តុក និងជំនួយក្នុងការជ្រើសរើស។",
  "Skincare for your everyday routine.": "ថែស្បែកសម្រាប់ទម្លាប់ប្រចាំថ្ងៃរបស់អ្នក។",
  "Share on Facebook": "ចែករំលែកតាម Facebook",
  "Share on Telegram": "ចែករំលែកតាម Telegram",
  Skincare: "ថែស្បែក",
  Makeup: "តុបតែងមុខ",
  "Body Care": "ថែរក្សារាងកាយ",
  "Hair Care": "ថែសក់",
  Sets: "ឈុត",
  "Facial Cleanser": "សាប៊ូលាងមុខ",
  Moisturizer: "ក្រែមផ្តល់សំណើម",
  Serum: "សេរ៉ូម",
  Complexion: "គ្របមុខ",
  "Sun Care": "ថែការពារកម្តៅថ្ងៃ",
  "Body Moisturizer": "ក្រែមខ្លួន",
  "Shower Care": "សាប៊ូងូត",
  "Hair Fragrance": "ទឹកអប់សក់",
  "Lip Color": "ពណ៌បបូរមាត់",
  "Skincare Set": "ឈុតថែស្បែក",
  "Mini Set": "ឈុតតូច",
  Overview: "ទិដ្ឋភាពទូទៅ",
  Website: "គេហទំព័រ",
  Settings: "ការកំណត់",
  "Change password": "ប្តូរពាក្យសម្ងាត់",
  "Current password": "ពាក្យសម្ងាត់បច្ចុប្បន្ន",
  "New password": "ពាក្យសម្ងាត់ថ្មី",
  "Confirm password": "បញ្ជាក់ពាក្យសម្ងាត់",
  "Update password": "ធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់",
  "Password updated.": "បានធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់។",
  "New passwords do not match.": "ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ។",
  Users: "អ្នកប្រើ",
  Roles: "តួនាទី",
  ADMINISTRATION: "រដ្ឋបាល",
  "Beauty, thoughtfully managed.": "សម្រស់ដែលគ្រប់គ្រងដោយយកចិត្តទុកដាក់។",
  "View website": "មើលគេហទំព័រ",
  "Open catalog": "បើកកាតាឡុក",
  "Open profile": "បើកប្រវត្តិ",
  "Toggle navigation": "បើកបិទម៉ឺនុយ",
  "Welcome back.": "សូមស្វាគមន៍មកវិញ។",
  "Show password": "បង្ហាញពាក្យសម្ងាត់",
  "Hide password": "លាក់ពាក្យសម្ងាត់",
  "CATALOG MANAGEMENT": "គ្រប់គ្រងកាតាឡុក",
  "+ Add product": "+ បន្ថែមផលិតផល",
  "New product": "ផលិតផលថ្មី",
  "Edit product": "កែផលិតផល",
  "Product name": "ឈ្មោះផលិតផល",
  "Product URL": "តំណផលិតផល",
  Category: "ប្រភេទ",
  "Price (USD)": "តម្លៃ (USD)",
  "Product story": "រឿងរ៉ាវផលិតផល",
  Packaging: "ការវេចខ្ចប់",
  Color: "ពណ៌",
  Status: "ស្ថានភាព",
  "New arrival": "ទំនិញថ្មី",
  "Best seller": "លក់ដាច់",
  Cancel: "បោះបង់",
  "Saving...": "កំពុងរក្សាទុក...",
  "Save product": "រក្សាទុកផលិតផល",
  "Close dialog": "បិទ",
  "Dismiss notification": "បិទការជូនដំណឹង",
  On: "បើក",
  Off: "បិទ",
  pump: "ដបបូម",
  jar: "ក្រឡ",
  dropper: "ដបដំណក់",
  compact: "ប្រអប់សង្កត់",
  tube: "បំពង់",
  bottle: "ដប",
  Pump: "ដបបូម",
  Jar: "ក្រឡ",
  Dropper: "ដបដំណក់",
  Compact: "ប្រអប់សង្កត់",
  Tube: "បំពង់",
  Bottle: "ដប",
  pink: "ផ្កាឈូក",
  blue: "ខៀវ",
  rose: "ផ្កាកុលាប",
  cream: "ពណ៌ក្រែម",
  Pink: "ផ្កាឈូក",
  Blue: "ខៀវ",
  Rose: "ផ្កាកុលាប",
  Cream: "ពណ៌ក្រែម",
  "e.g. MURU Foam Blue": "ឧ. MURU Foam Blue",
  "e.g. muru-foam-blue": "ឧ. muru-foam-blue",
  "e.g. Fresh daily cleanse for soft, balanced skin.": "ឧ. សម្អាតមុខរាល់ថ្ងៃ សម្រាប់ស្បែកទន់",
  "e.g. 8.50": "ឧ. 8.50",
  "e.g. 150ml": "ឧ. 150ml",
  "e.g. Normal, Oily": "ឧ. ធម្មតា, ស្បែកខ្លាញ់",
  "e.g. Water, Glycerin...": "ឧ. ទឹក, គ្លីសេរីន...",
  "e.g. Apply to face...": "ឧ. លាបលើមុខ...",
  "e.g. Why we created this...": "ឧ. ហេតុអ្វីយើងបង្កើតផលិតផលនេះ...",
  "Complete all required fields, enter a price, and use lowercase letters, numbers and hyphens for the URL.": "បំពេញវាលចាំបាច់ទាំងអស់ បញ្ចូលតម្លៃ និងប្រើអក្សរតូច លេខ និងសញ្ញា - សម្រាប់តំណ។",
  "That product URL is already in use.": "តំណផលិតផលនេះត្រូវបានប្រើរួចហើយ។",
  "Product updated.": "បានធ្វើបច្ចុប្បន្នភាពផលិតផល។",
  "Product created.": "បានបង្កើតផលិតផល។",
  "Product deleted.": "បានលុបផលិតផល។",
  "Your role does not have permission to edit products.": "តួនាទីរបស់អ្នកមិនមានសិទ្ធិកែផលិតផលទេ។",
  "No.": "ល.រ",
  "Product Name": "ឈ្មោះផលិតផល",
  URL: "តំណ",
  Price: "តម្លៃ",
  "Skin Type": "ប្រភេទស្បែក",
  "New Arrival": "ទំនិញថ្មី",
  Updated: "បានកែ",
  Actions: "សកម្មភាព",
  Edit: "កែ",
  Delete: "លុប",
  Yes: "បាទ/ចាស",
  No: "ទេ",
  "No products found": "រកមិនឃើញផលិតផល",
  "There are no products in this view.": "មិនមានផលិតផលក្នុងទិដ្ឋភាពនេះទេ។",
  "All categories": "ប្រភេទទាំងអស់",
  "All statuses": "ស្ថានភាពទាំងអស់",
  "Filter category": "ច្រោះប្រភេទ",
  "Filter status": "ច្រោះស្ថានភាព",
  products: "ផលិតផល",
  "Delete product?": "លុបផលិតផល?",
  "Delete product": "លុបផលិតផល",
  "will be removed from the catalog.": "នឹងត្រូវដកចេញពីកាតាឡុក។",
  "Sign out": "ចាកចេញ",
  Admin: "អ្នកគ្រប់គ្រង",
  "Team member": "សមាជិកក្រុម",
  Profile: "ប្រវត្តិ",
  "Display name": "ឈ្មោះបង្ហាញ",
  Username: "ឈ្មោះអ្នកប្រើ",
  Email: "អ៊ីមែល",
  "Save profile": "រក្សាទុកប្រវត្តិ",
  "Profile updated.": "បានធ្វើបច្ចុប្បន្នភាពប្រវត្តិ។",
  Owner: "ម្ចាស់",
  Photo: "រូបភាព",
  "Image URL": "តំណរូបភាព",
  "Remove photo": "លុបរូបភាព",
  "Change photo": "ប្តូររូបភាព",
  "At least 8 characters.": "យ៉ាងតិច ៨ តួអក្សរ។",
  "Uploading...": "កំពុងផ្ទុកឡើង...",
  "Recommended size: 1000 × 1000 px (square). JPG, PNG, or WebP. Larger photos are compressed automatically.": "ទំហំណែនាំ៖ 1000 × 1000 px (ការ៉េ)។ JPG, PNG ឬ WebP។ រូបធំជាង 2 MB នឹងត្រូវបង្រួមដោយស្វ័យប្រវត្តិ។",
  "Recommended size: 800 × 800 px (square). JPG, PNG, or WebP. Larger photos are compressed automatically.": "ទំហំណែនាំ៖ 800 × 800 px (ការ៉េ)។ JPG, PNG ឬ WebP។ រូបធំជាង 2 MB នឹងត្រូវបង្រួមដោយស្វ័យប្រវត្តិ។",
  "Recommended size: 1600 × 900 px. JPG, PNG, or WebP. Larger photos are compressed automatically.": "ទំហំណែនាំ៖ 1600 × 900 px។ JPG, PNG ឬ WebP។ រូបធំជាង 2 MB នឹងត្រូវបង្រួមដោយស្វ័យប្រវត្តិ។",
  "Recommended size: 1600 × 900 px (wide banner). JPG, PNG, or WebP. Larger photos are compressed automatically.": "ទំហំណែនាំ៖ 1600 × 900 px (បដាទទឹង)។ JPG, PNG ឬ WebP។ រូបធំជាង 2 MB នឹងត្រូវបង្រួមដោយស្វ័យប្រវត្តិ។",
  "Recommended size: 1200 × 800 px. JPG, PNG, or WebP. Larger photos are compressed automatically.": "ទំហំណែនាំ៖ 1200 × 800 px។ JPG, PNG ឬ WebP។ រូបធំជាង 2 MB នឹងត្រូវបង្រួមដោយស្វ័យប្រវត្តិ។",
  "Recommended size: 1200 × 1400 px. JPG, PNG, or WebP. Larger photos are compressed automatically.": "ទំហំណែនាំ៖ 1200 × 1400 px។ JPG, PNG ឬ WebP។ រូបធំជាង 2 MB នឹងត្រូវបង្រួមដោយស្វ័យប្រវត្តិ។",
  "Recommended size: 1600 × 800 px (wide banner). JPG, PNG, or WebP. Larger photos are compressed automatically.": "ទំហំណែនាំ៖ 1600 × 800 px (បដាទទឹង)។ JPG, PNG ឬ WebP។ រូបធំជាង 2 MB នឹងត្រូវបង្រួមដោយស្វ័យប្រវត្តិ។",
  "Recommended size: 400 × 400 px (square). JPG, PNG, or WebP. Larger photos are compressed automatically.": "ទំហំណែនាំ៖ 400 × 400 px (ការ៉េ)។ JPG, PNG ឬ WebP។ រូបធំជាង 2 MB នឹងត្រូវបង្រួមដោយស្វ័យប្រវត្តិ។",
  "Choose a JPG, PNG or WebP image.": "ជ្រើសរើសរូប JPG, PNG ឬ WebP។",
  "Choose an image under 25 MB.": "ជ្រើសរើសរូបក្រោម 25 MB។",
  "The image is still too large after compression.": "រូបនៅធំពេកបន្ទាប់ពីបង្រួម។",
  "The image could not be read.": "មិនអាចអានរូបបានទេ។",
  "Fresh daily cleanse for soft, balanced skin.": "សម្អាតមុខរាល់ថ្ងៃ ដើម្បីស្បែកទន់ និងមានតុល្យភាព។",
  "Creamy comfort cleanse for a brighter feel.": "សម្អាតមុខទន់ភ្លន់ ដើម្បីអារម្មណ៍ភ្លឺស្រស់។",
  "Cushions skin overnight with lasting moisture.": "ផ្តល់សំណើមយូរ ដើម្បីថែស្បែកពេញមួយយប់។",
  "Lightweight radiance for a smooth morning glow.": "ស្រាល និងផ្តល់ពន្លឺ ដើម្បីស្បែករលោងពេលព្រឹក។",
  "Soft-focus coverage with a natural finish.": "គ្របមុខស្រាលៗ ជាមួយរូបរាងធម្មជាតិ។",
  "Silky daytime care made for everyday routines.": "ថែរក្សាពេលថ្ងៃដ៏ទន់រលោង សម្រាប់ទម្លាប់ប្រចាំថ្ងៃ។",
  "Light body hydration with a clean soft scent.": "ផ្តល់សំណើមខ្លួនស្រាលៗ ជាមួយក្លិនស្អាតទន់ភ្លន់។",
  "Gentle lather for refreshed, comfortable skin.": "ពពុះទន់ភ្លន់ សម្រាប់ស្បែកស្រស់ស្រាយ និងមានផាសុកភាព។",
  "A soft finishing mist for smooth, fresh hair.": "ទឹកបាញ់ទន់ៗ សម្រាប់សក់រលោង និងស្រស់។",
  "A sheer rosy tint for effortless daily color.": "ពណ៌ផ្កាឈូកស្រាលៗ សម្រាប់ប្រើរាល់ថ្ងៃ។",
  "A simple curated routine for everyday beauty.": "ទម្លាប់សាមញ្ញដែលបានជ្រើសរើស សម្រាប់សម្រស់ប្រចាំថ្ងៃ។",
  "Compact favorites made for easy beauty on the go.": "ផលិតផលពេញនិយមទំហំតូច ងាយយកតាមខ្លួន។",
  "MURU001 - Foam Blue": "MURU001 - សាប៊ូពពុះខៀវ",
  "MURU002 - Foam Pink": "MURU002 - សាប៊ូពពុះផ្កាឈូក",
  "MURU Night Cream": "ក្រែមយប់ MURU",
  "MURU Glow Serum": "សេរ៉ូមភ្លឺ MURU",
  "MURU Skin Cushion": "គុយសិន MURU",
  "MURU Sun Serum": "សេរ៉ូមការពារកម្តៅថ្ងៃ MURU",
  "MURU Body Lotion": "ឡូសិនខ្លួន MURU",
  "MURU Body Wash": "សាប៊ូងូត MURU",
  "MURU Hair Mist": "ទឹកអប់សក់ MURU",
  "MURU Lip Tint": "លីបទិន MURU",
  "MURU Daily Routine Set": "ឈុតទម្លាប់ប្រចាំថ្ងៃ MURU",
  "MURU Travel Essentials": "ឈុតធ្វើដំណើរ MURU",
}

export function translate(lang, text) {
  if (text == null || text === "" || lang !== "km") return text ?? ""
  return phrases[text] ?? text
}

export function settingText(lang, key) {
  const value = settings[key] || ""
  if (lang === "km") {
    const custom = settings.km?.[key]
    if (typeof custom === "string" && custom.trim()) return custom
  }
  return translate(lang, value)
}

const LanguageContext = createContext(null)

function applyLanguage(lang) {
  const khmer = lang === "km"
  document.documentElement.lang = khmer ? "km" : "en"
  if (khmer) {
    document.documentElement.style.setProperty("--font-sans", '"Kantumruy Pro", "DM Sans", sans-serif')
    document.documentElement.style.setProperty("--font-display", '"Kantumruy Pro", "Playfair Display", serif')
  } else {
    document.documentElement.style.setProperty("--font-sans", `"${settings.bodyFont || "DM Sans"}", "Kantumruy Pro", system-ui, sans-serif`)
    document.documentElement.style.removeProperty("--font-display")
  }
  const tagline = settingText(lang, "tagline")
  if (settings.brand && tagline) document.title = `${settings.brand} | ${tagline}`
}

function storedLanguage() {
  return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "km"
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const initial = storedLanguage()
    applyLanguage(initial)
    return initial
  })

  useEffect(() => {
    applyLanguage(lang)
  }, [lang])

  function setLang(next) {
    const value = next === "km" ? "km" : "en"
    localStorage.setItem(STORAGE_KEY, value)
    setLangState(value)
  }

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const value = useContext(LanguageContext)
  const lang = value?.lang ?? "km"
  const setLang = value?.setLang ?? (() => {})
  return {
    lang,
    setLang,
    tx: (text) => translate(lang, text),
  }
}

export function LanguageSwitch({ lang, setLang, label }) {
  return (
    <div className="flex shrink-0 rounded-full bg-[#fff7f9] p-0.5" role="group" aria-label={label}>
      {[
        ["en", "EN"],
        ["km", "ខ្មែរ"],
      ].map(([value, name]) => (
        <button
          key={value}
          type="button"
          aria-pressed={lang === value}
          onClick={() => setLang(value)}
          className={`rounded-full px-2.5 py-1.5 text-xs font-bold ${
            lang === value ? "bg-white text-muru shadow-sm" : "text-ink/55"
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
