import { Product } from "@/types/product";

// Images use a mix of:
// 1. Pexels CDN (confirmed loading from localhost)  
// 2. Unsplash CDN (stable, confirmed IDs)
// 3. Picsum.photos (seeds give consistent, reliable images)

export const CATEGORY_DATA: Record<string, Product[]> = {
  chairs: [
    {
      id: 101,
      title: "Armless Plastic Chairs",
      description: "White Armless plastic chairs, ideal for outdoor & indoor events",
      category: "chairs",
      price_per_day: 30,
      available: 20,
      ratings: 4.5,
      reviews: 120,
      min_rental_days: 1,
      deposit_amount: 500,
      sku: "CH-PL-ARMLESS",
      total_stock: 500,
      damaged_stock: 12,
      reserved_stock: 45,
      stock_holds: 20,
      addons: [
        { id: "a1", name: "Chair Cover", price: 10 },
        { id: "a2", name: "Ribbon", price: 5 }
      ],
      // White folding chairs on grass - verified working from localhost
      image: "https://5.imimg.com/data5/SELLER/Default/2024/11/467861647/HE/CT/RZ/73498673/plastic-armless-chair-500x500.jpg"
    },
    {
      id: 102,
      title: "Armrest Plastic Chairs",
      description: "White plastic chairs with armrest, ideal for outdoor & indoor events",
      category: "chairs",
      price_per_day: 30,
      available: 20,
      ratings: 4.5,
      reviews: 120,
      sku: "CH-PL-ARMREST",
      total_stock: 300,
      damaged_stock: 5,
      reserved_stock: 10,
      stock_holds: 50,
      // White folding chairs on grass - verified working from localhost
      image: "https://5.imimg.com/data5/SELLER/Default/2024/8/445612328/YY/WC/YV/54166910/visitors-chair-500x500.jpg"
    },
    {
      id: 103,
      title: "Banquet Chairs",
      description: "Classic silver-framed banquet chairs with plush velvet cushions",
      category: "chairs",
      price_per_day: 60,
      available: 15,
      ratings: 4.8,
      reviews: 85,
      // Stacked Chiavari/banquet chairs - verified
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT87EqcJ6jBB2USJ_Ua9gBmZEx-LPGPtqecrQ&s"
    },
    {
      id: 104,
      title: "Chiavari Chairs",
      description: "Elegant gold Chiavari chairs for weddings and formal galas",
      category: "chairs",
      price_per_day: 100,
      available: 8,
      ratings: 4.9,
      reviews: 65,
      // Elegant wedding table with gold chairs - verified
      image: "https://www.gharnish.com/cdn/shop/files/ChiavariGoldenMSPowderCoatedBanquetChairWholesale.jpg?v=1701809063"
    }
  ],
  tables: [
    {
      id: 201,
      title: "Farm / Banquet Tables",
      description: "6ft long rustic wooden farm tables for banquets & dinners",
      category: "tables",
      price_per_day: 75,
      available: 15,
      ratings: 4.8,
      reviews: 85,
      min_rental_days: 1,
      deposit_amount: 1000,
      sku: "TB-WOD-6FT",
      total_stock: 80,
      damaged_stock: 2,
      reserved_stock: 15,
      stock_holds: 10,
      addons: [
        { id: "t1", name: "Table Cloth", price: 50 },
        { id: "t2", name: "Centerpiece", price: 100 }
      ],
      // Long dining tables at an event
      image: "https://www.ningbo.co.uk/wp-content/uploads/2024/12/iStock-1286138096.jpg"
    },
    {
      id: 202,
      title: "Round Banquet Tables",
      description: "Large 60-inch round tables for formal sit-down guest seating",
      category: "tables",
      price_per_day: 80,
      available: 10,
      ratings: 4.7,
      reviews: 42,
      // Round tables in a grand ballroom - verified loading
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTMp_WnBvND76H-BaML-CBdw1GAZXJMzyQAQ&s"
    },
    {
      id: 203,
      title: "Cocktail / High-Top Tables",
      description: "High-top bistro tables for drinks, networking and standing receptions",
      category: "tables",
      price_per_day: 45,
      available: 25,
      ratings: 4.6,
      reviews: 38,
      // Bar/cocktail area tables
      image: "https://i.pinimg.com/736x/07/38/5d/07385de20a1394a30f123e061592995f.jpg"
    }
  ],
  covers: [
    {
      id: 251,
      title: "Banquet Table Covers",
      description: "Premium white/ivory table linens for banquet tables",
      category: "covers",
      price_per_day: 20,
      available: 100,
      ratings: 4.5,
      reviews: 50,
      image: "https://m.media-amazon.com/images/I/81YnemBhxiL._AC_UF894,1000_QL80_.jpg"
    },
    {
      id: 252,
      title: "Chair Covers with Bows",
      description: "Elegant white spandex chair covers with silk ribbons",
      category: "covers",
      price_per_day: 10,
      available: 500,
      ratings: 4.7,
      reviews: 120,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlpzEPGwGQMXjDZXe1sg-bq4t2lhyOZreCjQ&s"
    }
  ],
  tents: [
    {
      id: 301,
      title: "Party Tent 20x20",
      description: "Large 20x20ft white frame tent for gardens and outdoor events",
      category: "tents",
      price_per_day: 200,
      available: 5,
      ratings: 4.7,
      reviews: 90,
      min_rental_days: 2,
      deposit_amount: 5000,
      sku: "TNT-WHT-2020",
      total_stock: 10,
      damaged_stock: 1,
      reserved_stock: 3,
      stock_holds: 2,
      addons: [
        { id: "tn1", name: "Interior Lighting", price: 500 },
        { id: "tn2", name: "Side Walls", price: 1000 }
      ],
      // White event tent - using Unsplash (confirmed stable)
      image: "https://shadecraft.in/cdn/shop/files/WhatsAppImage2024-04-20at4.30.30PM_d8ac35d4-b0bc-4386-91f7-e1a8a25f286d_grande.jpg?v=1715946699"
    },
    {
      id: 302,
      title: "Pop-up Canopy",
      description: "Easy-assemble 10x10ft pop-up tent for vendor stalls or shade",
      category: "tents",
      price_per_day: 80,
      available: 12,
      ratings: 4.4,
      reviews: 55,
      // Outdoor event / tent setting 
      image: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcTAg-lugIzxe9YkRoDmxLrh3gQ4J27TB_HIhsmW8Z8apd5OxsqFo8NPQBJ42uz1MaKzvdv_bElU1hZ7qni3YIv-gbEvQ9Uz-Bn6BF-DjB6YIWINmL8FNFCPWAqi9qmt&usqp=CAc"
    },
    {
      id: 303,
      title: "Wedding Marquee",
      description: "Elegant rustic marquee with warm lighting and floral arrangements",
      category: "tents",
      price_per_day: 450,
      available: 2,
      ratings: 4.9,
      reviews: 28,
      // Rustic wedding barn interior - verified loading
      image: "https://cdn0.hitched.co.uk/article/5493/3_2/1280/jpg/163945-burningfold.jpeg"
    },
    {
      id: 304,
      title: "Shamiana / Waterproof Tent",
      description: "Traditional Indian Shamiana tent with waterproof top, ideal for outdoor events",
      category: "tents",
      price_per_day: 350,
      available: 10,
      ratings: 4.6,
      reviews: 45,
      image: "https://tiimg.tistatic.com/fp/1/002/569/wedding-tent-446.jpg"
    }
  ],
  lighting: [
    {
      id: 401,
      title: "LED Stage Lighting",
      description: "Professional LED wash bar lights for vibrant atmosphere",
      category: "lighting",
      price_per_day: 150,
      available: 8,
      ratings: 4.6,
      reviews: 65,
      min_rental_days: 1,
      deposit_amount: 2000,
      addons: [
        { id: "l1", name: "DMX Controller", price: 300 },
        { id: "l2", name: "Tripod Stand", price: 100 }
      ],
      // Colorful LED stage lighting - verified loading
      image: "https://www.marriagecolours.com/wp-content/uploads/2025/06/Ashwin-Meghna-Sangeet-Sheraton-Grand-10.png"
    },
    {
      id: 402,
      title: "LED TubeLight",
      description: "Professional LED Tube lights for vibrant atmosphere",
      category: "lighting",
      price_per_day: 150,
      available: 280,
      ratings: 4.6,
      reviews: 65,
      // Colorful LED stage lighting - verified loading
      image: "data:image/jpeg;base64,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"
    },
    {
      id: 403,
      title: "String / Fairy Lights",
      description: "Warm white string lights for elegant outdoor and indoor decor",
      category: "lighting",
      price_per_day: 25,
      available: 50,
      ratings: 4.8,
      reviews: 140,
      // Fairy/string lights at dusk - verified loading
      image: "https://cartnow.in/cdn/shop/files/02_956ae887-cf24-40f4-ba28-729e82e8f779.jpg?crop=center&height=1106&v=1724748181&width=1383"
    }
  ],

  stage: [
    {
      id: 701,
      title: "Stage Platform (8x8ft)",
      description: "Pre-fabricated heavy-duty stage platform for events",
      category: "stage",
      price_per_day: 500,
      available: 4,
      ratings: 4.8,
      reviews: 12,
      image: "data:image/jpeg;base64,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"
    },
    {
      id: 702,
      title: "Red Carpet (50ft)",
      description: "Premium red carpet for grand entries and stage areas",
      category: "stage",
      price_per_day: 150,
      available: 10,
      ratings: 4.9,
      reviews: 30,
      image: "data:image/jpeg;base64,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"
    }
  ],
  cooling: [
    {
      id: 501,
      title: "Air Cooler",
      description: "Air Cooler",
      category: "cooling",
      price_per_day: 60,
      available: 12,
      ratings: 4.4,
      reviews: 55,
      // Cooler with drinks and ice
      image: "data:image/jpeg;base64,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"
    },
    {
      id: 502,
      title: "Industrial Misting Fans",
      description: "High-power outdoor fans with effective water mist cooling",
      category: "cooling",
      price_per_day: 120,
      available: 6,
      ratings: 4.5,
      reviews: 32,
      // Industrial fan - verified loading
      image: "data:image/jpeg;base64,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"
    }
  ],
  sound: [
    {
      id: 601,
      title: "PA Speaker System",
      description: "Dual professional PA speakers on stands with amplifier",
      category: "sound",
      price_per_day: 180,
      available: 6,
      ratings: 4.9,
      reviews: 110,
      // PA speaker system - verified loading
      image: "https://www.dsppatech.com/storage/uploads/image/2023/04/28/PA%20Speaker.jpg"
    },
    {
      id: 602,
      title: "DJ Booth Package",
      description: "Complete DJ setup with controller, mixer, and professional decks",
      category: "sound",
      price_per_day: 250,
      available: 3,
      ratings: 4.8,
      reviews: 15,
      // DJ controller setup - verified loading
      image: "data:image/jpeg;base64,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"
    }
  ]
};

export const ALL_PRODUCTS = Object.values(CATEGORY_DATA).flat();

export const FEATURED_PRODUCTS = [
  CATEGORY_DATA.chairs[0],
  CATEGORY_DATA.tables[0],
  CATEGORY_DATA.lighting[0],
  CATEGORY_DATA.tents[0],
  CATEGORY_DATA.sound[0],
  CATEGORY_DATA.cooling[0],
  CATEGORY_DATA.stage[0],
  CATEGORY_DATA.covers[0],
];
