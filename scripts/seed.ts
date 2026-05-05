import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, userPermissions, products } from '../src/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const BRAND_PRODUCTS: Record<string, Array<{ title: string; category: string; spec: string; price: string; currency: string; source: string; country: string; tags: string[] }>> = {
  Osprey: [
    { title: 'Osprey Atmos AG 65', category: 'Backpack', spec: '65L', price: '269.95', currency: 'USD', source: 'REI', country: 'US', tags: ['backpacking', 'lightweight'] },
    { title: 'Osprey Aether Plus 70', category: 'Backpack', spec: '70L', price: '310.00', currency: 'USD', source: 'REI', country: 'US', tags: ['backpacking', 'expedition'] },
    { title: 'Osprey Daylite Plus', category: 'Daypack', spec: '20L', price: '75.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['day hike', 'commute'] },
    { title: 'Osprey Farpoint 40', category: 'Travel Pack', spec: '40L', price: '185.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['travel', 'carry-on'] },
    { title: 'Osprey Talon 22', category: 'Daypack', spec: '22L', price: '140.00', currency: 'USD', source: 'Backcountry', country: 'US', tags: ['day hike', 'hydration'] },
    { title: 'Osprey Exos 48', category: 'Backpack', spec: '48L', price: '240.00', currency: 'USD', source: 'REI', country: 'US', tags: ['ultralight', 'backpacking'] },
    { title: 'Osprey Kestrel 48', category: 'Backpack', spec: '48L', price: '200.00', currency: 'USD', source: 'Moosejaw', country: 'US', tags: ['backpacking', 'durable'] },
    { title: 'Osprey Stratos 34', category: 'Daypack', spec: '34L', price: '170.00', currency: 'USD', source: 'REI', country: 'US', tags: ['day hike', 'ventilated'] },
    { title: 'Osprey Rook 65', category: 'Backpack', spec: '65L', price: '190.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['backpacking', 'budget'] },
    { title: 'Osprey Duro 15', category: 'Hydration Vest', spec: '15L', price: '140.00', currency: 'USD', source: 'REI', country: 'US', tags: ['trail running', 'hydration'] },
    { title: 'Osprey Hikelite 26', category: 'Daypack', spec: '26L', price: '100.00', currency: 'USD', source: 'Backcountry', country: 'US', tags: ['day hike', 'lightweight'] },
    { title: 'Osprey Transporter 40', category: 'Travel Pack', spec: '40L', price: '160.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['travel', 'water resistant'] },
    { title: 'Osprey Kyte 46', category: 'Backpack', spec: '46L', price: '210.00', currency: 'USD', source: 'REI', country: 'US', tags: ['womens', 'backpacking'] },
    { title: 'Osprey Manta 24', category: 'Daypack', spec: '24L', price: '165.00', currency: 'USD', source: 'Moosejaw', country: 'US', tags: ['hydration', 'day hike'] },
    { title: 'Osprey Volt 60', category: 'Backpack', spec: '60L', price: '180.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['backpacking', 'budget'] },
    { title: 'Osprey Sirrus 36', category: 'Daypack', spec: '36L', price: '190.00', currency: 'USD', source: 'REI', country: 'US', tags: ['womens', 'day hike'] },
    { title: 'Osprey Skimmer 28', category: 'Daypack', spec: '28L', price: '130.00', currency: 'USD', source: 'Backcountry', country: 'US', tags: ['womens', 'day hike'] },
    { title: 'Osprey Aura AG 65', category: 'Backpack', spec: '65L', price: '285.00', currency: 'USD', source: 'REI', country: 'US', tags: ['womens', 'backpacking'] },
    { title: 'Osprey Renn 65', category: 'Backpack', spec: '65L', price: '175.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['womens', 'backpacking', 'budget'] },
    { title: 'Osprey Poco Plus', category: 'Child Carrier', spec: '26L', price: '320.00', currency: 'USD', source: 'REI', country: 'US', tags: ['child carrier', 'family'] },
  ],
  Gregory: [
    { title: 'Gregory Baltoro 65', category: 'Backpack', spec: '65L', price: '330.00', currency: 'USD', source: 'REI', country: 'US', tags: ['backpacking', 'premium'] },
    { title: 'Gregory Deva 60', category: 'Backpack', spec: '60L', price: '310.00', currency: 'USD', source: 'REI', country: 'US', tags: ['womens', 'backpacking'] },
    { title: 'Gregory Paragon 58', category: 'Backpack', spec: '58L', price: '270.00', currency: 'USD', source: 'Backcountry', country: 'US', tags: ['backpacking', 'lightweight'] },
    { title: 'Gregory Zulu 55', category: 'Backpack', spec: '55L', price: '250.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['backpacking', 'ventilated'] },
    { title: 'Gregory Nano 18', category: 'Daypack', spec: '18L', price: '65.00', currency: 'USD', source: 'REI', country: 'US', tags: ['day hike', 'minimal'] },
    { title: 'Gregory Citro 25', category: 'Daypack', spec: '25L', price: '110.00', currency: 'USD', source: 'Moosejaw', country: 'US', tags: ['day hike', 'hydration'] },
    { title: 'Gregory Jade 38', category: 'Backpack', spec: '38L', price: '230.00', currency: 'USD', source: 'REI', country: 'US', tags: ['womens', 'lightweight'] },
    { title: 'Gregory Miko 20', category: 'Daypack', spec: '20L', price: '100.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['day hike', 'hydration'] },
    { title: 'Gregory Optic 58', category: 'Backpack', spec: '58L', price: '260.00', currency: 'USD', source: 'Backcountry', country: 'US', tags: ['ultralight', 'backpacking'] },
    { title: 'Gregory Tetrad 40', category: 'Travel Pack', spec: '40L', price: '180.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['travel', 'carry-on'] },
    { title: 'Gregory Stout 45', category: 'Backpack', spec: '45L', price: '200.00', currency: 'USD', source: 'REI', country: 'US', tags: ['backpacking', 'budget'] },
    { title: 'Gregory Katmai 55', category: 'Backpack', spec: '55L', price: '280.00', currency: 'USD', source: 'Moosejaw', country: 'US', tags: ['backpacking', 'premium'] },
    { title: 'Gregory Focal 48', category: 'Backpack', spec: '48L', price: '240.00', currency: 'USD', source: 'Backcountry', country: 'US', tags: ['backpacking', 'lightweight'] },
    { title: 'Gregory Anode 28', category: 'Daypack', spec: '28L', price: '130.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['day hike', 'laptop'] },
    { title: 'Gregory Resin 25', category: 'Daypack', spec: '25L', price: '120.00', currency: 'USD', source: 'REI', country: 'US', tags: ['day hike', 'climbing'] },
    { title: 'Gregory Quadro 22', category: 'Daypack', spec: '22L', price: '90.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['travel', 'day pack'] },
    { title: 'Gregory Alpaca 45', category: 'Travel Pack', spec: '45L', price: '190.00', currency: 'USD', source: 'Backcountry', country: 'US', tags: ['travel', 'duffel'] },
    { title: 'Gregory Maven 55', category: 'Backpack', spec: '55L', price: '270.00', currency: 'USD', source: 'REI', country: 'US', tags: ['womens', 'backpacking'] },
    { title: 'Gregory Border 30', category: 'Travel Pack', spec: '30L', price: '150.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['travel', 'laptop'] },
    { title: 'Gregory Drift 10', category: 'Hydration Vest', spec: '10L', price: '95.00', currency: 'USD', source: 'REI', country: 'US', tags: ['trail running', 'hydration'] },
  ],
  'Mystery Ranch': [
    { title: 'Mystery Ranch Bridger 65', category: 'Backpack', spec: '65L', price: '375.00', currency: 'USD', source: 'Mystery Ranch', country: 'US', tags: ['backpacking', 'hunting'] },
    { title: 'Mystery Ranch Scree 32', category: 'Daypack', spec: '32L', price: '189.00', currency: 'USD', source: 'REI', country: 'US', tags: ['day hike', 'climbing'] },
    { title: 'Mystery Ranch Urban Assault 21', category: 'Daypack', spec: '21L', price: '139.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['urban', '3-zip'] },
    { title: 'Mystery Ranch 2 Day Assault', category: 'Backpack', spec: '27L', price: '249.00', currency: 'USD', source: 'Mystery Ranch', country: 'US', tags: ['tactical', 'military'] },
    { title: 'Mystery Ranch Coulee 40', category: 'Backpack', spec: '40L', price: '259.00', currency: 'USD', source: 'REI', country: 'US', tags: ['hunting', 'backpacking'] },
    { title: 'Mystery Ranch Glacier', category: 'Backpack', spec: '70L', price: '499.00', currency: 'USD', source: 'Mystery Ranch', country: 'US', tags: ['expedition', 'mountaineering'] },
    { title: 'Mystery Ranch High Water', category: 'Dry Bag', spec: '30L', price: '149.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['waterproof', 'fishing'] },
    { title: 'Mystery Ranch In & Out 22', category: 'Daypack', spec: '22L', price: '89.00', currency: 'USD', source: 'REI', country: 'US', tags: ['packable', 'lightweight'] },
    { title: 'Mystery Ranch Pintler', category: 'Backpack', spec: '60L', price: '449.00', currency: 'USD', source: 'Mystery Ranch', country: 'US', tags: ['hunting', 'backpacking'] },
    { title: 'Mystery Ranch Tower 47', category: 'Backpack', spec: '47L', price: '299.00', currency: 'USD', source: 'REI', country: 'US', tags: ['climbing', 'haul bag'] },
    { title: 'Mystery Ranch 3 Way 27', category: 'Travel Pack', spec: '27L', price: '189.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['travel', 'briefcase'] },
    { title: 'Mystery Ranch Mission Rover', category: 'Travel Pack', spec: '36L', price: '229.00', currency: 'USD', source: 'Mystery Ranch', country: 'US', tags: ['travel', 'weekender'] },
    { title: 'Mystery Ranch Hip Monkey', category: 'Waist Pack', spec: '8L', price: '65.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['waist pack', 'urban'] },
    { title: 'Mystery Ranch Street Fighter', category: 'Daypack', spec: '23L', price: '179.00', currency: 'USD', source: 'Mystery Ranch', country: 'US', tags: ['urban', 'laptop'] },
    { title: 'Mystery Ranch D-Route', category: 'Sling Pack', spec: '10L', price: '79.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['sling', 'urban'] },
    { title: 'Mystery Ranch Rip Ruck 15', category: 'Daypack', spec: '15L', price: '119.00', currency: 'USD', source: 'REI', country: 'US', tags: ['urban', 'laptop'] },
    { title: 'Mystery Ranch Sawtooth 45', category: 'Backpack', spec: '45L', price: '349.00', currency: 'USD', source: 'Mystery Ranch', country: 'US', tags: ['hunting', 'backpacking'] },
    { title: 'Mystery Ranch Gunfighter 14', category: 'Daypack', spec: '14L', price: '239.00', currency: 'USD', source: 'Mystery Ranch', country: 'US', tags: ['tactical', 'military'] },
    { title: 'Mystery Ranch Gallagator 19', category: 'Daypack', spec: '19L', price: '109.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['day hike', 'urban'] },
    { title: 'Mystery Ranch Terraframe 50', category: 'Backpack', spec: '50L', price: '525.00', currency: 'USD', source: 'Mystery Ranch', country: 'US', tags: ['backpacking', 'overload'] },
  ],
  'The North Face': [
    { title: 'The North Face Surge', category: 'Daypack', spec: '31L', price: '129.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['commute', 'laptop'] },
    { title: 'The North Face Borealis', category: 'Daypack', spec: '28L', price: '99.00', currency: 'USD', source: 'TNF Official', country: 'US', tags: ['commute', 'laptop'] },
    { title: 'The North Face Recon', category: 'Daypack', spec: '30L', price: '99.00', currency: 'USD', source: 'REI', country: 'US', tags: ['day hike', 'laptop'] },
    { title: 'The North Face Jester', category: 'Daypack', spec: '26L', price: '75.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['college', 'budget'] },
    { title: 'The North Face Terra 55', category: 'Backpack', spec: '55L', price: '169.00', currency: 'USD', source: 'REI', country: 'US', tags: ['backpacking', 'budget'] },
    { title: 'The North Face Vault', category: 'Daypack', spec: '27L', price: '79.00', currency: 'USD', source: 'TNF Official', country: 'US', tags: ['college', 'laptop'] },
    { title: 'The North Face Banchee 50', category: 'Backpack', spec: '50L', price: '239.00', currency: 'USD', source: 'REI', country: 'US', tags: ['backpacking', 'lightweight'] },
    { title: 'The North Face Cobra 60', category: 'Backpack', spec: '60L', price: '349.00', currency: 'USD', source: 'TNF Official', country: 'US', tags: ['mountaineering', 'winter'] },
    { title: 'The North Face Router', category: 'Daypack', spec: '40L', price: '139.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['travel', 'laptop'] },
    { title: 'The North Face Kaban 2.0', category: 'Daypack', spec: '26L', price: '129.00', currency: 'USD', source: 'TNF Official', country: 'US', tags: ['urban', 'laptop'] },
    { title: 'The North Face Phantom 38', category: 'Backpack', spec: '38L', price: '269.00', currency: 'USD', source: 'REI', country: 'US', tags: ['alpine', 'lightweight'] },
    { title: 'The North Face Chimera 24', category: 'Daypack', spec: '24L', price: '159.00', currency: 'USD', source: 'TNF Official', country: 'US', tags: ['climbing', 'lightweight'] },
    { title: 'The North Face Mica 25', category: 'Daypack', spec: '25L', price: '109.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['day hike', 'hydration'] },
    { title: 'The North Face Womens Recon', category: 'Daypack', spec: '28L', price: '99.00', currency: 'USD', source: 'REI', country: 'US', tags: ['womens', 'laptop'] },
    { title: 'The North Face Womens Surge', category: 'Daypack', spec: '29L', price: '129.00', currency: 'USD', source: 'TNF Official', country: 'US', tags: ['womens', 'commute'] },
    { title: 'The North Face Trail Lite 36', category: 'Backpack', spec: '36L', price: '139.00', currency: 'USD', source: 'REI', country: 'US', tags: ['backpacking', 'lightweight'] },
    { title: 'The North Face Flyweight Pack', category: 'Daypack', spec: '18L', price: '59.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['packable', 'ultralight'] },
    { title: 'The North Face Back-to-Berkeley', category: 'Daypack', spec: '23L', price: '89.00', currency: 'USD', source: 'TNF Official', country: 'US', tags: ['retro', 'urban'] },
    { title: 'The North Face Base Camp Duffel S', category: 'Duffel', spec: '50L', price: '139.00', currency: 'USD', source: 'REI', country: 'US', tags: ['travel', 'waterproof'] },
    { title: 'The North Face Stormbreak 3', category: 'Tent', spec: '3 Person', price: '229.00', currency: 'USD', source: 'TNF Official', country: 'US', tags: ['camping', 'tent'] },
  ],
  Stussy: [
    { title: 'Stussy Basic Logo Tee', category: 'T-Shirt', spec: 'M', price: '45.00', currency: 'USD', source: 'Stussy Official', country: 'US', tags: ['streetwear', 'logo'] },
    { title: 'Stussy 8 Ball Hoodie', category: 'Hoodie', spec: 'L', price: '130.00', currency: 'USD', source: 'Stussy Official', country: 'US', tags: ['streetwear', 'iconic'] },
    { title: 'Stussy World Tour Tee', category: 'T-Shirt', spec: 'S', price: '45.00', currency: 'USD', source: 'Dover Street Market', country: 'JP', tags: ['streetwear', 'graphic'] },
    { title: 'Stussy Sherpa Jacket', category: 'Jacket', spec: 'M', price: '189.00', currency: 'USD', source: 'Stussy Official', country: 'US', tags: ['outerwear', 'fleece'] },
    { title: 'Stussy Nike Air Max 2013', category: 'Shoes', spec: 'US10', price: '160.00', currency: 'USD', source: 'Nike SNKRS', country: 'US', tags: ['collab', 'sneakers'] },
    { title: 'Stussy Canvas Work Pant', category: 'Pants', spec: '32', price: '120.00', currency: 'USD', source: 'Stussy Official', country: 'US', tags: ['workwear', 'pants'] },
    { title: 'Stussy Dice Tee', category: 'T-Shirt', spec: 'M', price: '45.00', currency: 'USD', source: 'Stussy Official', country: 'US', tags: ['graphic', 'streetwear'] },
    { title: 'Stussy Crochet Bucket Hat', category: 'Hat', spec: 'One Size', price: '65.00', currency: 'USD', source: 'Stussy Official', country: 'US', tags: ['accessories', 'hat'] },
    { title: 'Stussy Crown Hoodie', category: 'Hoodie', spec: 'XL', price: '135.00', currency: 'USD', source: 'Dover Street Market', country: 'JP', tags: ['streetwear', 'hoodie'] },
    { title: 'Stussy Varsity Jacket', category: 'Jacket', spec: 'L', price: '280.00', currency: 'USD', source: 'Stussy Official', country: 'US', tags: ['varsity', 'premium'] },
    { title: 'Stussy Short Sleeve Polo', category: 'Polo', spec: 'M', price: '95.00', currency: 'USD', source: 'Stussy Official', country: 'US', tags: ['polo', 'casual'] },
    { title: 'Stussy Beach Shorts', category: 'Shorts', spec: 'M', price: '75.00', currency: 'USD', source: 'Stussy Official', country: 'US', tags: ['summer', 'shorts'] },
    { title: 'Stussy Nylon Cargo', category: 'Pants', spec: '30', price: '145.00', currency: 'USD', source: 'Stussy Official', country: 'US', tags: ['cargo', 'streetwear'] },
    { title: 'Stussy 40th Anniversary Tee', category: 'T-Shirt', spec: 'L', price: '55.00', currency: 'USD', source: 'Stussy Official', country: 'US', tags: ['anniversary', 'limited'] },
    { title: 'Stussy Card Holder', category: 'Accessory', spec: 'One Size', price: '35.00', currency: 'USD', source: 'Stussy Official', country: 'US', tags: ['wallet', 'accessories'] },
    { title: 'Stussy Zip Up Hoodie', category: 'Hoodie', spec: 'M', price: '140.00', currency: 'USD', source: 'Amazon', country: 'US', tags: ['zip up', 'streetwear'] },
    { title: 'Stussy S Logo Cap', category: 'Hat', spec: 'Adjustable', price: '50.00', currency: 'USD', source: 'Stussy Official', country: 'US', tags: ['cap', 'iconic'] },
    { title: 'Stussy Paisley Shirt', category: 'Shirt', spec: 'L', price: '110.00', currency: 'USD', source: 'Stussy Official', country: 'US', tags: ['pattern', 'casual'] },
    { title: 'Stussy Tie Dye Tee', category: 'T-Shirt', spec: 'S', price: '50.00', currency: 'USD', source: 'Dover Street Market', country: 'JP', tags: ['tie dye', 'graphic'] },
    { title: 'Stussy Boucle Knit', category: 'Knitwear', spec: 'M', price: '175.00', currency: 'USD', source: 'Stussy Official', country: 'US', tags: ['knit', 'premium'] },
  ],
  'Vivienne Westwood': [
    { title: 'Vivienne Westwood Orb Pendant', category: 'Jewelry', spec: 'Silver', price: '150.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['jewelry', 'orb'] },
    { title: 'Vivienne Westwood Mini Bas Relief Choker', category: 'Jewelry', spec: 'One Size', price: '125.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['choker', 'orb'] },
    { title: 'Vivienne Westwood Pearl Drop Earrings', category: 'Jewelry', spec: 'Silver', price: '95.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['earrings', 'pearl'] },
    { title: 'Vivienne Westwood Safety Pin Bracelet', category: 'Jewelry', spec: 'Adjustable', price: '110.00', currency: 'GBP', source: 'SSENSE', country: 'UK', tags: ['bracelet', 'punk'] },
    { title: 'Vivienne Westwood Nana Ring', category: 'Jewelry', spec: 'Size 6', price: '85.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['ring', 'armor'] },
    { title: 'Vivienne Westwood Two Row Pearl Choker', category: 'Jewelry', spec: 'One Size', price: '195.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['choker', 'pearl'] },
    { title: 'Vivienne Westwood Logo T-Shirt', category: 'T-Shirt', spec: 'M', price: '70.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['logo', 'casual'] },
    { title: 'Vivienne Westwood Houndstooth Jacket', category: 'Jacket', spec: 'L', price: '450.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['tailoring', 'houndstooth'] },
    { title: 'Vivienne Westwood Tartan Mini Skirt', category: 'Skirt', spec: 'M', price: '220.00', currency: 'GBP', source: 'SSENSE', country: 'UK', tags: ['tartan', 'punk'] },
    { title: 'Vivienne Westwood Squiggle Print Shirt', category: 'Shirt', spec: 'S', price: '180.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['print', 'casual'] },
    { title: 'Vivienne Westwood Yasmine Bag', category: 'Bag', spec: 'One Size', price: '320.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['handbag', 'tartan'] },
    { title: 'Vivienne Westwood Derby Necklace', category: 'Jewelry', spec: 'Silver', price: '135.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['necklace', 'derby'] },
    { title: 'Vivienne Westwood Mayfair Ring', category: 'Jewelry', spec: 'Size 7', price: '90.00', currency: 'GBP', source: 'SSENSE', country: 'UK', tags: ['ring', 'orb'] },
    { title: 'Vivienne Westwood Trousers Tweed', category: 'Pants', spec: '32', price: '250.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['tailoring', 'tweed'] },
    { title: 'Vivienne Westwood Crossbody Bag', category: 'Bag', spec: 'One Size', price: '265.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['bag', 'crossbody'] },
    { title: 'Vivienne Westwood Mini Bas Relief Earrings', category: 'Jewelry', spec: 'Gold', price: '115.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['earrings', 'orb'] },
    { title: 'Vivienne Westwood Archive Print Tee', category: 'T-Shirt', spec: 'L', price: '75.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['graphic', 'archive'] },
    { title: 'Vivienne Westwood Ballistic Sneakers', category: 'Shoes', spec: 'UK8', price: '210.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['sneakers', 'leather'] },
    { title: 'Vivienne Westwood Knit Jumper', category: 'Knitwear', spec: 'M', price: '280.00', currency: 'GBP', source: 'SSENSE', country: 'UK', tags: ['knit', 'orb'] },
    { title: 'Vivienne Westwood Ribbon Choker', category: 'Jewelry', spec: 'Silver', price: '100.00', currency: 'GBP', source: 'VW Official', country: 'UK', tags: ['choker', 'satin'] },
  ],
};

async function seed() {
  console.log('Seeding database...');

  // ─── 1. Admin 用户 ───
  await db.insert(users).values({
    id: 'user_admin_clerk_id',
    email: 'admin@bibimiao.com',
    name: 'Admin',
    role: 'admin',
    membershipTier: 'lifetime',
  }).onConflictDoNothing();
  console.log('  Admin user inserted');

  // ─── 2. 测试免费用户 ───
  await db.insert(users).values({
    id: 'user_free_clerk_id',
    email: 'free@test.com',
    name: 'Free User',
    role: 'user',
    membershipTier: 'free',
  }).onConflictDoNothing();
  console.log('  Free user inserted');

  // ─── 3. 测试付费用户 ───
  await db.insert(users).values({
    id: 'user_paid_clerk_id',
    email: 'paid@test.com',
    name: 'Paid User',
    role: 'user',
    membershipTier: 'monthly',
  }).onConflictDoNothing();

  // 付费用户品牌权限：Osprey + Gregory 不限量
  await db.insert(userPermissions).values([
    { userId: 'user_paid_clerk_id', brand: 'Osprey' },
    { userId: 'user_paid_clerk_id', brand: 'Gregory' },
  ]).onConflictDoNothing();
  console.log('  Paid user + permissions inserted');

  // ─── 4. 商品数据：6 品牌 × 20 商品 = 120 条 ───
  let totalProducts = 0;
  for (const [brand, items] of Object.entries(BRAND_PRODUCTS)) {
    const productValues = items.map((item) => ({
      title: item.title,
      brand,
      category: item.category,
      spec: item.spec,
      price: item.price,
      originalPrice: item.price,
      currency: item.currency,
      source: item.source,
      sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(item.title)}`,
      imageUrl: `/brands/${brand.toLowerCase().replace(/\s+/g, '-')}.png`,
      country: item.country,
      tags: item.tags,
    }));
    await db.insert(products).values(productValues);
    totalProducts += productValues.length;
  }
  console.log(`  ${totalProducts} products inserted (6 brands × 20)`);

  console.log('Seed complete!');
  process.exit(0);
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
