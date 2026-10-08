/**
 * National Plasto — Centralized Corporate Data Layer
 * Encapsulates dynamic entities: Stats, Brands, Categories, Applications,
 * Manufacturing Infrastructure, Leadership, Plants, Quality Standards, and News.
 */

(function () {
  window.NPPL_STORE = {
    // 1. Corporate Verification & Statistics
    stats: {
      yearsExperience: 29,
      establishedYear: 1997,
      manufacturingPlants: 4,
      totalMouldsAndProducts: 1000,
      b2bClients: 500,
      distributionNetwork: "Pan-India",
      statesCovered: 24,
      pressMaxTonnage: 1200,
      loadBearingCapacityKg: 200,
      sqFtFacility: "100,000+"
    },

    // 2. 4-Tier Brand Architecture
    brands: [
      {
        id: "national",
        name: "NATIONAL",
        tagline: "Plastic Furniture & Utility Products",
        tier: "Semi-Virgin & Reprocessed",
        logo: "images/brand/company-national-logo.png",
        productCount: "66+ Products",
        accentColor: "#C21121",
        bgBadge: "rgba(194, 17, 33, 0.08)",
        description: "Our flagship mass-market division delivering durable, functional, and high-value plastic furniture across homes, institutions, and businesses throughout India.",
        highlights: ["Mass Market Benchmark", "Superior Structural Ribbing", "High Load Resilience"],
        image: "images/products/np-ntl-058-89dcdcfa74.jpg"
      },
      {
        id: "next",
        name: "NEXT",
        tagline: "Premium Plastic Furniture",
        tier: "100% Prime Virgin Polymer",
        logo: "images/brand/company-next-logo.png",
        productCount: "46+ Products",
        accentColor: "#076282",
        bgBadge: "rgba(179, 230, 251, 0.25)",
        description: "Engineered with 100% prime virgin polymer and contemporary ergonomics for modern residences, premium commercial complexes, and executive seating environments.",
        highlights: ["100% Virgin Grade", "Ultra-Smooth High-Gloss Finish", "Contemporary Ergonomics"],
        image: "images/products/np-ntl-049-4725aa0165.jpg"
      },
      {
        id: "sapphire",
        name: "SAPPHIRE",
        tagline: "Value-focused Plastic Furniture",
        tier: "High-Gloss Economical Reprocessed",
        logo: null,
        productCount: "30+ Products",
        accentColor: "#0D47A1",
        bgBadge: "rgba(13, 71, 161, 0.08)",
        description: "Purpose-built for price-conscious markets and high-utility hospitality applications, combining high-gloss finish with exceptional wear tolerance.",
        highlights: ["High-Gloss Formulation", "Cost Optimized", "All-Weather UV Stabilized"],
        image: "images/products/np-cpt-008-ab707a1f3c.jpg"
      },
      {
        id: "captain",
        name: "CAPTAIN",
        tagline: "Economical Plastic Furniture",
        tier: "High-Volume Commercial Grade",
        logo: null,
        productCount: "18+ Products",
        accentColor: "#D97706",
        bgBadge: "rgba(217, 119, 6, 0.08)",
        description: "Robust, heavy-duty economical furniture designed for banquet halls, tent rentals, outdoor catering, and institutional utility deployments.",
        highlights: ["High-Volume Durability", "Sturdy Commercial Gauge", "Rapid Stacking Design"],
        image: "images/products/np-cpt-008-61257cc736.jpg"
      }
    ],

    // 3. Product Categories
    categories: [
      {
        id: "chairs",
        name: "Chairs",
        slug: "chairs",
        productCount: 112,
        description: "Monoblock, armchairs, premium executive, and banquet seating engineered with ergonomic lumbar support.",
        image: "images/products/np-ntl-058-89dcdcfa74.jpg"
      },
      {
        id: "tables",
        name: "Tables",
        slug: "tables",
        productCount: 28,
        description: "Center tables, dining setups, study tables, and conference tops featuring reinforced non-wobble leg designs.",
        image: "images/brand/ind-home.jpg"
      },
      {
        id: "stools",
        name: "Stools",
        slug: "stools",
        productCount: 19,
        description: "High-load round stools, bathroom step-stools, and compact nesting seats with anti-skid rubber feet.",
        image: "images/brand/ind-retail.jpg"
      },
      {
        id: "baby-kids",
        name: "Baby & Kids",
        slug: "baby-kids",
        productCount: 14,
        description: "Rounded-edge, non-toxic, vibrant study chairs and activity furniture designed specifically for early learners.",
        image: "images/brand/case-study-education.jpg"
      },
      {
        id: "storage",
        name: "Storage",
        slug: "storage",
        productCount: 16,
        description: "Modular multi-tier drawer units, utility cupboards, and heavy-duty storage organizers for homes and stores.",
        image: "images/brand/ind-logistics.jpg"
      },
      {
        id: "outdoor",
        name: "Outdoor Furniture",
        slug: "outdoor",
        productCount: 22,
        description: "Weather-resistant, UV-stabilized dining sets, loungers, and patio chairs built for extreme Indian climates.",
        image: "images/brand/case-study-hospitality.jpg"
      },
      {
        id: "institutional",
        name: "Institutional Furniture",
        slug: "institutional",
        productCount: 35,
        description: "Heavy-traffic seating solutions certified for schools, universities, hospitals, exam centers, and cafeterias.",
        image: "images/brand/quality-lab-qa.jpg"
      },
      {
        id: "utility",
        name: "Utility Products",
        slug: "utility",
        productCount: 26,
        description: "Multipurpose industrial crates, waste bins, basins, and logistics containers for daily commercial operations.",
        image: "images/brand/ind-automotive.jpg"
      }
    ],

    // 4. Applications / Sectors
    applications: [
      {
        id: "home",
        title: "HOME & LIVING",
        subtitle: "Furniture for modern homes",
        description: "Contemporary dining, balcony, living, and patio solutions designed for daily family life.",
        image: "images/brand/ind-home.jpg",
        categoryFilter: "chairs"
      },
      {
        id: "education",
        title: "EDUCATION",
        subtitle: "Schools, colleges and institutions",
        description: "Heavy-duty ergonomic seating and sturdy classroom desks withstanding rigorous multi-shift usage.",
        image: "images/brand/case-study-education.jpg",
        categoryFilter: "institutional"
      },
      {
        id: "corporate",
        title: "CORPORATE",
        subtitle: "Office and commercial spaces",
        description: "Ergonomic cafeteria seating, breakout zone armchairs, and reception seating packages.",
        image: "images/brand/reach-kolkata-hub.jpg",
        categoryFilter: "chairs"
      },
      {
        id: "healthcare",
        title: "HEALTHCARE",
        subtitle: "Healthcare and institutional environments",
        description: "Hygienic, easy-to-sanitize waiting area chairs, bed-side stools, and clinical utility bins.",
        image: "images/brand/quality-lab-qa.jpg",
        categoryFilter: "institutional"
      },
      {
        id: "hospitality",
        title: "HOSPITALITY",
        subtitle: "Hotels, restaurants and banquet spaces",
        description: "High-gloss banquet chairs, poolside loungers, and all-weather dining furniture for hotels and resorts.",
        image: "images/brand/case-study-hospitality.jpg",
        categoryFilter: "outdoor"
      },
      {
        id: "government",
        title: "GOVERNMENT",
        subtitle: "Government and public-sector requirements",
        description: "RDSO-compliant vendor lineage and tender-compliant high-volume polymer procurement solutions.",
        image: "images/brand/company-photo.jpg",
        categoryFilter: "institutional"
      },
      {
        id: "retail",
        title: "RETAIL & DEALERS",
        subtitle: "Dealer and retail solutions",
        description: "High-turnover consumer stock, point-of-sale display arrangements, and attractive trade margins.",
        image: "images/brand/ind-retail.jpg",
        categoryFilter: "all"
      },
      {
        id: "industrial",
        title: "INDUSTRIAL",
        subtitle: "Industrial and commercial applications",
        description: "Heavy-duty material handling crates, component bins, and factory workshop seating.",
        image: "images/brand/ind-automotive.jpg",
        categoryFilter: "utility"
      }
    ],

    // 5. 4 Manufacturing Hubs
    plants: [
      {
        city: "Howrah",
        state: "West Bengal",
        type: "Central Manufacturing Hub & Tooling Facility",
        capacity: "Microprocessor presses up to 1,200T",
        address: "Jalan Industrial Complex, Dhulagarh, Howrah – 711302, West Bengal",
        certifications: "ISO 9001:2015 Certified",
        isHQ: true
      },
      {
        city: "Guwahati",
        state: "Assam",
        type: "North-East Regional Production Plant",
        capacity: "High-tonnage injection units for North-Eastern corridors",
        address: "Industrial Growth Centre, Matia, Goalpara / Guwahati, Assam",
        certifications: "ISO 9001:2015 Certified",
        isHQ: false
      },
      {
        city: "Roorkee",
        state: "Uttarakhand",
        type: "Northern Manufacturing & Depot Hub",
        capacity: "Automated monoblock production and dispatch terminal",
        address: "Khasra No. 124, Raipur Industrial Area, Roorkee – 247667, Uttarakhand",
        certifications: "ISO 9001:2015 Certified",
        isHQ: false
      },
      {
        city: "Hajipur",
        state: "Bihar",
        type: "Central-East Manufacturing Plant",
        capacity: "Multi-cavity moulding for mass furniture & storage",
        address: "Industrial Area, Hajipur – 844101, Vaishali District, Bihar",
        certifications: "ISO 9001:2015 Certified",
        isHQ: false
      }
    ],

    // 6. Leadership Profiles
    leadership: [
      {
        name: "Mr. Ratan Kumar Sharma",
        role: "Chairman & Managing Director",
        tag: "Founder & CMD",
        image: "images/team/ratan-kumar-sharma.jpg",
        bio: "With over 18 years of experience in the polymer industry prior to founding National Plasto in 1997, Mr. Ratan Kumar Sharma pioneered the company's expansion from a single manufacturing unit to four major manufacturing hubs across Howrah, Hajipur, Guwahati, and Roorkee.",
        quote: "Every business goes through difficult phases. What matters is not avoiding losses, but learning from them and growing bigger and better each time. How you treat people matters as much as how you run a business."
      },
      {
        name: "Mr. Rajkumar Sharma",
        role: "Director – Finance",
        tag: "Financial Stewardship",
        image: "images/team/rajkumar-sharma.jpg",
        bio: "Senior-most member of the executive governance team, Mr. Rajkumar Sharma has stewarded the financial discipline and strategic capital allocation across all four manufacturing plants since 1997."
      },
      {
        name: "Late Mr. Sukhram Sharma",
        role: "Director – Production",
        tag: "In Memoriam",
        initials: "SS",
        image: null,
        bio: "Instrumental in establishing National Plasto's factory floors and engineering culture. His hands-on production leadership and deep personal bond with the factory workforce continue to guide our plant culture."
      },
      {
        name: "Mr. Bhavesh Sharma",
        role: "Executive Director",
        tag: "Sales, Marketing & E-Commerce",
        image: "images/team/bhavesh-sharma.jpg",
        bio: "Spearheading modern market expansion, brand governance, and direct institutional partnerships. He has successfully established National Plasto's digital and e-commerce distribution across Amazon, Flipkart, and pan-India retail networks."
      },
      {
        name: "Mr. Devesh Sharma",
        role: "Executive Director",
        tag: "Operations & Plant Efficiency",
        image: "images/team/devesh-sharma.jpg",
        bio: "Leading modern manufacturing technologies, automation upgrades, and supply chain efficiencies across all 4 plants, driving the next-generation scale of National Plasto."
      }
    ],

    // 7. News & Corporate Updates
    news: [
      {
        id: "news-1",
        date: "September 15, 2026",
        category: "Manufacturing",
        title: "Installation of New 1,200T High-Speed Injection Moulding Press at Howrah Plant",
        summary: "Enhanced production capacity for ultra-large monoblock banquet tables and heavy-duty institutional seating with 20% shorter cycle times.",
        image: "images/brand/quality-lab-qa.jpg"
      },
      {
        id: "news-2",
        date: "August 28, 2026",
        category: "New Products",
        title: "Launch of NEXT Designer Series: Monoblock Seating for Modern Interiors",
        summary: "100% prime virgin polypropylene armchairs featuring breathable architectural lattice geometry and matte luxury colorways.",
        image: "images/products/np-ntl-058-89dcdcfa74.jpg"
      },
      {
        id: "news-3",
        date: "July 14, 2026",
        category: "Distribution",
        title: "National Plasto Expands Authorized Depot Footprint to 18 New Hubs",
        summary: "Accelerating 24-48h dispatch capabilities across Maharashtra, Gujarat, Uttar Pradesh, and Southern trade corridors.",
        image: "images/brand/reach-kolkata-hub.jpg"
      },
      {
        id: "news-4",
        date: "June 02, 2026",
        category: "Certifications",
        title: "National Plasto Re-Certified Under ISO 9001:2015 Across All 4 Operating Units",
        summary: "Rigorous surveillance audits validate strict conformity to dimensional accuracy, drop-testing standards, and raw resin traceabilities.",
        image: "images/brand/company-photo.jpg"
      }
    ],

    // Helper: Resolve Image URL with reliable fallback
    resolveImageUrl: function (path) {
      if (!path) return "images/brand/company-photo.jpg";
      if (path.startsWith("http")) return path;
      return path;
    },

    // Helper: Get product list
    getProducts: function () {
      if (window.NPPL_DATA && Array.isArray(window.NPPL_DATA.allWithImages) && window.NPPL_DATA.allWithImages.length > 0) {
        return window.NPPL_DATA.allWithImages;
      }
      if (window.NPPL_DATA && Array.isArray(window.NPPL_DATA.featured)) {
        return window.NPPL_DATA.featured;
      }
      return [];
    }
  };
})();
