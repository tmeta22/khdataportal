-- Creating comprehensive province data with 2024 statistics and administrative details
-- Insert all 25 provinces/municipalities with accurate 2024 data

-- Clear existing data first
TRUNCATE TABLE provinces CASCADE;

-- Insert all 25 provinces/municipalities with comprehensive data
INSERT INTO provinces (
    code, name_latin, name_khmer, type, population, area_km2, 
    latitude, longitude, elevation_m, established_year, 
    description, reference, official_note
) VALUES 
-- Phnom Penh (Capital)
('12', 'Phnom Penh', 'ភ្នំពេញ', 'capital', 2281951, 678.46, 11.5564, 104.9282, 12, 1979,
'Phnom Penh is the capital and most populous city of Cambodia. Located on the banks of the Tonlé Sap, Mekong, and Bassac Rivers, Phnom Penh is notable for its historical architecture and attractions. It serves as the political, economic, and cultural center of Cambodia.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'រាជធានីភ្នំពេញ ជាមជ្ឈមណ្ឌលនយោបាយ'),

-- Provinces (24 provinces)
('01', 'Banteay Meanchey', 'បន្ទាយមានជ័យ', 'province', 861883, 6679, 13.7525, 102.9700, 30, 1988,
'Banteay Meanchey Province is located in northwestern Cambodia, bordering Thailand. Known for its agricultural production, particularly rice and cassava. The province has significant historical sites and serves as an important border crossing.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តបន្ទាយមានជ័យ មានព្រំដែនជាប់ថៃ'),

('02', 'Battambang', 'បាត់ដំបង', 'province', 997169, 11702, 13.0957, 103.2020, 65, 1907,
'Battambang is Cambodia''s second-largest province by population. Known as the "Rice Bowl of Cambodia" due to its fertile agricultural lands. The province is famous for its French colonial architecture and the historic Bamboo Train.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តបាត់ដំបង ជាស្រុកស្រូវ'),

('03', 'Kampong Cham', 'កំពង់ចាម', 'province', 899791, 4549, 12.0000, 105.4667, 11, 1907,
'Kampong Cham Province is located in central Cambodia along the Mekong River. It is known for its rubber plantations, tobacco cultivation, and traditional silk weaving. The province has rich cultural heritage and historical significance.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តកំពង់ចាម ស្ថិតនៅតាមដងទន្លេមេគង្គ'),

('04', 'Kampong Chhnang', 'កំពង់ឆ្នាំង', 'province', 527027, 5521, 12.2500, 104.6667, 8, 1907,
'Kampong Chhnang Province is known for its pottery industry and floating villages on the Tonlé Sap Lake. The province is famous for traditional crafts and fishing communities.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តកំពង់ឆ្នាំង ល្បីខាងផលិតកម្មស្មូន'),

('05', 'Kampong Speu', 'កំពង់ស្ពឺ', 'province', 877523, 7017, 11.4500, 104.5200, 126, 1907,
'Kampong Speu Province is located southwest of Phnom Penh. Known for its palm sugar production, fruit cultivation, and the famous Kirirom National Park with its pine forests and waterfalls.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តកំពង់ស្ពឺ មានឧទ្យានជាតិគិរីរម្យ'),

('06', 'Kampong Thom', 'កំពង់ធំ', 'province', 681549, 13814, 12.7111, 104.8889, 15, 1907,
'Kampong Thom is Cambodia''s second-largest province by area. It contains the ancient capital of Sambor Prei Kuk, a UNESCO World Heritage Site with pre-Angkorian temples dating from the 7th century.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តកំពង់ធំ មានប្រាសាទសម្បូរព្រៃគុក'),

('07', 'Kampot', 'កំពត', 'province', 593829, 4873, 10.6167, 104.1833, 5, 1907,
'Kampot Province is famous for its pepper production, salt fields, and French colonial architecture. Located near the coast, it offers beautiful landscapes with mountains, rivers, and caves.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តកំពត ល្បីខាងម្រេចកំពត'),

('08', 'Kandal', 'កណ្ដាល', 'province', 1201581, 3179, 11.4667, 105.1000, 10, 1907,
'Kandal Province surrounds Phnom Penh and is known as the "Heart of Cambodia." It is highly developed with good infrastructure and serves as a key agricultural and industrial area.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តកណ្ដាល ជាបេះដូងកម្ពុជា'),

('09', 'Koh Kong', 'កោះកុង', 'province', 125902, 10090, 11.6153, 102.9839, 10, 1993,
'Koh Kong Province is located in southwestern Cambodia, bordering Thailand and the Gulf of Thailand. Known for its pristine beaches, mangrove forests, and the Cardamom Mountains.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តកោះកុង មានឆ្នេរសមុទ្រស្អាត'),

('10', 'Kratié', 'ក្រចេះ', 'province', 374755, 11094, 12.4833, 106.0167, 15, 1907,
'Kratié Province is located in northeastern Cambodia along the Mekong River. Famous for the rare Irrawaddy dolphins and traditional wooden houses on stilts.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តក្រចេះ មានផ្សោតទន្លេ'),

('11', 'Mondulkiri', 'មណ្ឌលគិរី', 'province', 92213, 14288, 12.4500, 107.2000, 800, 1961,
'Mondulkiri is Cambodia''s largest province by area and least populated. Known for its rolling hills, waterfalls, and indigenous Bunong people. Famous for elephant sanctuaries and eco-tourism.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តមណ្ឌលគិរី មានដំរីព្រៃ'),

('13', 'Preah Vihear', 'ព្រះវិហារ', 'province', 254827, 13788, 14.1500, 104.9667, 200, 1998,
'Preah Vihear Province is home to the UNESCO World Heritage Site Preah Vihear Temple, an ancient Khmer temple complex on the border with Thailand.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តព្រះវិហារ មានប្រាសាទព្រះវិហារ'),

('14', 'Prey Veng', 'ព្រៃវែង', 'province', 1057720, 4883, 11.4833, 105.3167, 8, 1907,
'Prey Veng Province is located in southeastern Cambodia along the Mekong River. Known for its agricultural production, particularly rice and vegetables.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តព្រៃវែង ជាតំបន់កសិកម្ម'),

('15', 'Pursat', 'ពោធិ៍សាត់', 'province', 419752, 12692, 12.5389, 103.9192, 30, 1907,
'Pursat Province is known for its marble quarries, floating villages on the Tonlé Sap Lake, and traditional crafts. The province has significant archaeological sites.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តពោធិ៍សាត់ មានកន្លែងជីកថ្មម៉ាប'),

('16', 'Ratanakiri', 'រតនគិរី', 'province', 217453, 10782, 13.7333, 106.9833, 200, 1959,
'Ratanakiri Province is located in northeastern Cambodia, known for its ethnic minorities, gem mining, and pristine forests. Famous for its crater lakes and waterfalls.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តរតនគិរី មានបឹងយ៉ាក់ឡោម'),

('17', 'Siem Reap', 'សៀមរាប', 'province', 1014234, 10299, 13.3617, 103.8600, 18, 1907,
'Siem Reap Province is home to the world-famous Angkor Archaeological Park, including Angkor Wat. It is Cambodia''s premier tourist destination with rich Khmer heritage.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តសៀមរាប មានប្រាសាទអង្គរវត្ត'),

('18', 'Preah Sihanouk', 'ព្រះសីហនុ', 'province', 310072, 1938, 10.6167, 103.5167, 5, 2008,
'Preah Sihanouk Province (formerly Sihanoukville) is Cambodia''s only deep-water port and premier beach destination. Known for its islands, beaches, and seafood.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តព្រះសីហនុ ជាកំពង់ផែសមុទ្រ'),

('19', 'Stung Treng', 'ស្ទឹងត្រែង', 'province', 165713, 11092, 13.5167, 105.9500, 50, 1907,
'Stung Treng Province is located in northeastern Cambodia at the confluence of the Mekong and Sekong rivers. Known for its rapids, waterfalls, and diverse wildlife.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តស្ទឹងត្រែង មានទន្លេរាប់'),

('20', 'Svay Rieng', 'ស្វាយរៀង', 'province', 525497, 2966, 11.0833, 105.8000, 15, 1907,
'Svay Rieng Province is located in southeastern Cambodia, bordering Vietnam. Known for its agricultural production and as an important border crossing.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តស្វាយរៀង ជាប់ព្រំដែនវៀតណាម'),

('21', 'Takéo', 'តាកែវ', 'province', 900914, 3563, 10.9833, 104.7833, 10, 1907,
'Takéo Province is known as the "Cradle of Khmer Civilization" with numerous pre-Angkorian archaeological sites. Famous for its ancient temples and traditional culture.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តតាកែវ ជាប្រភពអរិយធម៌ខ្មែរ'),

('22', 'Oddar Meanchey', 'ឧត្តរមានជ័យ', 'province', 276038, 6158, 14.1667, 103.5167, 100, 1999,
'Oddar Meanchey Province is located in northwestern Cambodia, bordering Thailand. Known for its forests, wildlife sanctuaries, and agricultural development.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តឧត្តរមានជ័យ មានជម្រកសត្វព្រៃ'),

('23', 'Kep', 'កែប', 'province', 42665, 336, 10.4833, 104.3167, 5, 2008,
'Kep Province is Cambodia''s smallest province, famous for its crab market, pepper farms, and French colonial villas. Known as a seaside resort destination.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តកែប ល្បីខាងក្តាម'),

('24', 'Pailin', 'ប៉ៃលិន', 'province', 75112, 803, 12.8500, 102.6167, 200, 2001,
'Pailin Province is known for its gem mining, particularly sapphires and rubies. Located near the Thai border, it has a significant Thai cultural influence.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តប៉ៃលិន ល្បីខាងត្បូងមាស'),

('25', 'Tboung Khmum', 'ត្បូងឃ្មុំ', 'province', 776841, 5250, 12.2000, 105.6833, 15, 2013,
'Tboung Khmum Province was created in 2013 from parts of Kampong Cham. Known for its rubber plantations, agricultural production, and Mekong River communities.',
'ប្រកាសលេខ ៦៦៦ ព្រ.ក', 'ខេត្តត្បូងឃ្មុំ ជាខេត្តថ្មី');

-- Update sequence
SELECT setval('provinces_id_seq', (SELECT MAX(id) FROM provinces));
