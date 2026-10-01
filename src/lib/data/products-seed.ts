import type { Product } from "./types";

/*
 * Researched 2026-10-01 from made-by-ac.com, asrithcheepurupalli.tech, GitHub and our own notes.
 * LinkedIn was checked too: its Projects, Featured and Experience sections are empty.
 * Statuses reflect live checks on that date. Edit entries in the Hall of Products tab.
 */
export const PRODUCT_SEED_VERSION = 1;
export const PRODUCT_CHECKED_AT = "2026-10-01";

export const SEED_PRODUCTS: Array<Omit<Product, "created_at" | "updated_at" | "seed_version" | "edited" | "hidden" | "checked_at">> = [
  {
    "id": "made-table",
    "name": "made. table",
    "owner": "made",
    "type": "Product",
    "status": "live",
    "url": "https://table.made-by-ac.com",
    "repo": "",
    "tagline": "Your restaurant's ordering system.",
    "description": "Type a restaurant's name and vibe and a bespoke ordering system composes itself in front of you. The demo generator behind our restaurant work.",
    "tags": [
      "restaurant",
      "ordering",
      "AI"
    ],
    "source": "made-by-ac.com, labs",
    "note": "",
    "image": "/products/made-table.jpg"
  },
  {
    "id": "made-kitchen",
    "name": "made. kitchen",
    "owner": "made",
    "type": "Product",
    "status": "live",
    "url": "https://kitchen.made-by-ac.com",
    "repo": "",
    "tagline": "Own your customers.",
    "description": "Growth and retention for cloud kitchens. Acquire customers on the delivery apps, then keep them on channels you own: QR capture, CRM, WhatsApp and loyalty.",
    "tags": [
      "cloud kitchens",
      "retention",
      "CRM"
    ],
    "source": "made-by-ac.com",
    "note": "",
    "image": "/products/made-kitchen.jpg"
  },
  {
    "id": "made-crew",
    "name": "made. crew",
    "owner": "made",
    "type": "Product",
    "status": "live",
    "url": "https://crew.made-by-ac.com",
    "repo": "",
    "tagline": "Your crew, without the headcount.",
    "description": "A chief of staff as a subscription for founders, principals and busy operators: a managed team that runs the back office.",
    "tags": [
      "services",
      "chief of staff"
    ],
    "source": "made-by-ac.com",
    "note": "",
    "image": "/products/made-crew.jpg"
  },
  {
    "id": "airlock",
    "name": "Airlock",
    "owner": "made",
    "type": "Product",
    "status": "live",
    "url": "https://airlock.made-by-ac.com",
    "repo": "https://github.com/asrithcheepurupalli/airlock",
    "tagline": "The privacy firewall for AI.",
    "description": "Sensitive data is stripped on your device before any prompt reaches ChatGPT or Claude, then restored in the reply. Browser extension, runs fully on-device.",
    "tags": [
      "privacy",
      "AI",
      "extension"
    ],
    "source": "made-by-ac.com, asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": "/products/airlock.jpg"
  },
  {
    "id": "stash",
    "name": "Stash",
    "owner": "made",
    "type": "Product",
    "status": "live",
    "url": "https://stash.made-by-ac.com",
    "repo": "https://github.com/asrithcheepurupalli/stash",
    "tagline": "Your AI memory, on your machine.",
    "description": "Every AI chat and the pages you read, saved to one private, searchable archive that lives only on your own device.",
    "tags": [
      "local-first",
      "AI",
      "memory"
    ],
    "source": "made-by-ac.com, asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": "/products/stash.jpg"
  },
  {
    "id": "pingless",
    "name": "Pingless",
    "owner": "made",
    "type": "Product",
    "status": "live",
    "url": "https://pingless.made-by-ac.com",
    "repo": "",
    "tagline": "An AI gatekeeper for your attention.",
    "description": "An Android app that reads your notifications on-device, delivers what matters and quietly clears the rest. No internet permission.",
    "tags": [
      "Android",
      "privacy",
      "notifications"
    ],
    "source": "made-by-ac.com, labs",
    "note": "",
    "image": "/products/pingless.jpg"
  },
  {
    "id": "hindsight",
    "name": "hindsight.",
    "owner": "made",
    "type": "Product",
    "status": "live",
    "url": "https://hindsight.made-by-ac.com",
    "repo": "https://github.com/asrithcheepurupalli/hindsight.",
    "tagline": "See yourself the way they just saw you.",
    "description": "A time-shifted live mirror for video calls. See your real mid-conversation face. Runs entirely in the browser and records nothing.",
    "tags": [
      "video",
      "browser",
      "privacy"
    ],
    "source": "made-by-ac.com, asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": "/products/hindsight.jpg"
  },
  {
    "id": "percentyle",
    "name": "Percentyle",
    "owner": "made",
    "type": "Product",
    "status": "live",
    "url": "https://percentyle.in",
    "repo": "",
    "tagline": "Focused CAT 2026 prep.",
    "description": "An exam prep app for the CAT: real past-year question practice, mock tests and performance tracking, built as an installable web app.",
    "tags": [
      "education",
      "CAT",
      "PWA"
    ],
    "source": "made-by-ac.com",
    "note": "",
    "image": "/products/percentyle.jpg"
  },
  {
    "id": "supermind",
    "name": "supermind.",
    "owner": "made",
    "type": "Product",
    "status": "live",
    "url": "https://supermind.ink",
    "repo": "https://github.com/asrithcheepurupalli/supermind.",
    "tagline": "A second brain that stays on your device.",
    "description": "Capture notes, links and files; they get tagged, filed and found again. Fuzzy search, a graph view, offline, with optional AES-256 encryption and no server.",
    "tags": [
      "local-first",
      "notes",
      "encryption"
    ],
    "source": "made-by-ac.com, asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": "/products/supermind.jpg"
  },
  {
    "id": "cricadda",
    "name": "cricadda",
    "owner": "made",
    "type": "Product",
    "status": "down",
    "url": "https://cricadda-tau.vercel.app",
    "repo": "https://github.com/asrithcheepurupalli/cricadda",
    "tagline": "Live LED scoring for cricket turfs.",
    "description": "Turns any cricket turf into a stadium: live scores, player names and animations on the LED screen, controlled from a phone.",
    "tags": [
      "sports",
      "live scoring"
    ],
    "source": "made-by-ac.com, asrithcheepurupalli.tech, GitHub",
    "note": "The live link on made-by-ac.com returns 404 as of the last check.",
    "image": ""
  },
  {
    "id": "made-class",
    "name": "made.class",
    "owner": "made",
    "type": "Product",
    "status": "live",
    "url": "https://made-class.vercel.app",
    "repo": "https://github.com/asrithcheepurupalli/made.class",
    "tagline": "The school OS parents never install.",
    "description": "One-tap attendance, transparent UPI fee collection and parents reached on WhatsApp, in one calm system with role-specific views for principals, teachers and front desk.",
    "tags": [
      "schools",
      "India",
      "UPI"
    ],
    "source": "asrithcheepurupalli.tech, GitHub",
    "note": "Built and demoable. Still needs a pilot school.",
    "image": "/products/made-class.jpg"
  },
  {
    "id": "nadir",
    "name": "NADIR",
    "owner": "made",
    "type": "Product",
    "status": "live",
    "url": "https://nadir.made-by-ac.com",
    "repo": "https://github.com/asrithcheepurupalli/nadir",
    "tagline": "Name the ground from 11 kilometres up.",
    "description": "Point a phone out of a plane window and it names the ground below. Works offline with an honest error ellipse. One-time purchase.",
    "tags": [
      "offline",
      "aviation",
      "maps"
    ],
    "source": "GitHub",
    "note": "",
    "image": "/products/nadir.jpg"
  },
  {
    "id": "houselights",
    "name": "Houselights",
    "owner": "made",
    "type": "Product",
    "status": "live",
    "url": "https://houselights-eta.vercel.app",
    "repo": "",
    "tagline": "Low cost ticketing for comedy shows.",
    "description": "Sell tickets for standup shows, open mics and club nights with one honest fee: 2.5% plus the payment gateway at cost.",
    "tags": [
      "ticketing",
      "comedy",
      "payments"
    ],
    "source": "studio notes",
    "note": "",
    "image": "/products/houselights.jpg"
  },
  {
    "id": "must-try",
    "name": "Must Try",
    "owner": "made",
    "type": "Product",
    "status": "live",
    "url": "https://musttry.made-by-ac.com",
    "repo": "",
    "tagline": "Discover India's legendary dishes.",
    "description": "Community-voted star ratings for India's most iconic dishes, dish by dish, so you know exactly what to order.",
    "tags": [
      "food",
      "community",
      "India"
    ],
    "source": "studio notes",
    "note": "",
    "image": "/products/must-try.jpg"
  },
  {
    "id": "made-desk",
    "name": "made. desk",
    "owner": "made",
    "type": "Internal",
    "status": "live",
    "url": "https://made-desk.vercel.app",
    "repo": "https://github.com/asrithcheepurupalli/made-desk",
    "tagline": "Our studio operating system.",
    "description": "The internal tool you are reading this in: capture inbox for reels, playbooks and master SOPs, client workspaces, tasks and a grounded AI assistant. Stores everything in the browser.",
    "tags": [
      "internal",
      "knowledge base",
      "AI"
    ],
    "source": "GitHub",
    "note": "desk.made-by-ac.com does not resolve yet. The working address is made-desk.vercel.app.",
    "image": "/products/made-desk.jpg"
  },
  {
    "id": "made-ledger",
    "name": "made. ledger",
    "owner": "made",
    "type": "Product",
    "status": "live",
    "url": "https://made-ledger.vercel.app",
    "repo": "https://github.com/asrithcheepurupalli/made-ledger",
    "tagline": "A ledger for a supermarket.",
    "description": "A ledger app set up for Vaarahi Super Market.",
    "tags": [
      "retail",
      "ledger"
    ],
    "source": "GitHub",
    "note": "The page loads its content client-side, so the public description is thin. Edit this entry with the real scope.",
    "image": "/products/made-ledger.jpg"
  },
  {
    "id": "vane",
    "name": "VANE",
    "owner": "made",
    "type": "Concept study",
    "status": "live",
    "url": "https://vane.made-by-ac.com",
    "repo": "https://github.com/asrithcheepurupalli/vane",
    "tagline": "Zips jam. Feathers don't.",
    "description": "A closure with no slider, no teeth and one material, taken from the way a feather holds together. An interactive concept study with a case study.",
    "tags": [
      "concept",
      "design",
      "product"
    ],
    "source": "made-by-ac.com/labs, GitHub",
    "note": "",
    "image": "/products/vane.jpg"
  },
  {
    "id": "meanwhile",
    "name": "Meanwhile",
    "owner": "made",
    "type": "Concept study",
    "status": "live",
    "url": "https://meanwhile.made-by-ac.com",
    "repo": "https://github.com/asrithcheepurupalli/meanwhile",
    "tagline": "Half rent. Full opportunity.",
    "description": "A marketplace for the in-between: owners monetize vacant commercial space while growing businesses rent it temporarily.",
    "tags": [
      "marketplace",
      "real estate",
      "concept"
    ],
    "source": "made-by-ac.com/labs, asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": "/products/meanwhile.jpg"
  },
  {
    "id": "karu",
    "name": "Karu",
    "owner": "made",
    "type": "Concept study",
    "status": "live",
    "url": "https://karu.made-by-ac.com",
    "repo": "https://github.com/asrithcheepurupalli/karu.theartisian",
    "tagline": "Handcrafted in India, collected worldwide.",
    "description": "A luxury, story-first marketplace for handcrafted Indian art where every piece leads with its maker's story.",
    "tags": [
      "marketplace",
      "art",
      "e-commerce"
    ],
    "source": "made-by-ac.com/labs, asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": "/products/karu.jpg"
  },
  {
    "id": "tideline",
    "name": "Tideline",
    "owner": "made",
    "type": "Concept study",
    "status": "live",
    "url": "https://tideline.made-by-ac.com",
    "repo": "https://github.com/asrithcheepurupalli/tideline",
    "tagline": "Off the boat. Onto your table.",
    "description": "Book seats on working fishing boats and buy dock-direct catch, art-directed around live tidal data.",
    "tags": [
      "marketplace",
      "food",
      "concept"
    ],
    "source": "made-by-ac.com/labs, asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": "/products/tideline.jpg"
  },
  {
    "id": "somaa",
    "name": "Somaa",
    "owner": "made",
    "type": "Client build",
    "status": "live",
    "url": "https://somaa.made-by-ac.com",
    "repo": "",
    "tagline": "A restobar that remembers you.",
    "description": "An AI-powered dining experience for a coastal-Andhra restobar and live-music venue in Visakhapatnam: per-table QR ordering, guest recognition and a feedback loop. Our featured case study.",
    "tags": [
      "restaurant",
      "QR ordering",
      "AI"
    ],
    "source": "made-by-ac.com",
    "note": "",
    "image": "/products/somaa.jpg"
  },
  {
    "id": "ramachandra-ortho",
    "name": "Ramachandra Ortho Care",
    "owner": "made",
    "type": "Client build",
    "status": "live",
    "url": "https://rcorthocare.made-by-ac.com",
    "repo": "https://github.com/asrithcheepurupalli/ramachandra-ortho",
    "tagline": "Orthopaedic clinic site with WhatsApp booking.",
    "description": "Appointment site, WhatsApp booking bot and clinic admin for an orthopaedic clinic in Visakhapatnam, with deposits confirmed by webhook.",
    "tags": [
      "healthcare",
      "booking",
      "WhatsApp"
    ],
    "source": "studio notes, GitHub",
    "note": "The GitHub repo is currently public although it holds client invoices and pricing. Review it.",
    "image": "/products/ramachandra-ortho.jpg"
  },
  {
    "id": "innovolt",
    "name": "Innovolt",
    "owner": "made",
    "type": "Case study",
    "status": "live",
    "url": "https://www.made-by-ac.com/work#/work/innovolt",
    "repo": "",
    "tagline": "EV marketplace campaigns.",
    "description": "Campaign design for a commercial EV marketplace, including the Bengaluru fleet solutions campaign.",
    "tags": [
      "campaign",
      "EV",
      "brand"
    ],
    "source": "made-by-ac.com",
    "note": "",
    "image": ""
  },
  {
    "id": "mithai-maharaja",
    "name": "Mithai Maharaja",
    "owner": "made",
    "type": "Case study",
    "status": "live",
    "url": "https://www.made-by-ac.com/work#/work/mithai-maharaja",
    "repo": "",
    "tagline": "Luxury sweets packaging.",
    "description": "Luxury packaging and campaign design for an Indian sweets brand, from the Raksha Bandhan special to heritage combos.",
    "tags": [
      "packaging",
      "brand",
      "luxury"
    ],
    "source": "made-by-ac.com",
    "note": "",
    "image": ""
  },
  {
    "id": "greeka",
    "name": "Greeka Kitchen & Bar",
    "owner": "made",
    "type": "Pitch demo",
    "status": "live",
    "url": "https://greeka.made-by-ac.com",
    "repo": "",
    "tagline": "A Greek-mythology resto-bar in Ranchi.",
    "description": "A speculative pitch demo: our QR ordering platform rebranded for a Ranchi resto-bar with its real menu. Not a client.",
    "tags": [
      "restaurant",
      "pitch"
    ],
    "source": "studio notes",
    "note": "",
    "image": "/products/greeka.jpg"
  },
  {
    "id": "ayla",
    "name": "Ayla Skin Clinics",
    "owner": "made",
    "type": "Pitch demo",
    "status": "live",
    "url": "https://aylaskinclinics.made-by-ac.com",
    "repo": "https://github.com/asrithcheepurupalli/ayla-skin-clinics",
    "tagline": "Clinical dermatology, designed.",
    "description": "A speculative pitch site for a dermatology clinic: clinical dermatology, advanced aesthetics and hair restoration. Not a client.",
    "tags": [
      "healthcare",
      "pitch"
    ],
    "source": "studio notes, GitHub",
    "note": "",
    "image": "/products/ayla.jpg"
  },
  {
    "id": "skinshine",
    "name": "Skinshine Skin & Hair Clinic",
    "owner": "made",
    "type": "Pitch demo",
    "status": "live",
    "url": "https://skinshine-demo.vercel.app",
    "repo": "https://github.com/asrithcheepurupalli/skinshine-clinic",
    "tagline": "A dermatology clinic site.",
    "description": "A demo site for a skin and hair clinic with 18+ years of clinical dermatology and laser therapy.",
    "tags": [
      "healthcare",
      "pitch"
    ],
    "source": "GitHub",
    "note": "",
    "image": "/products/skinshine.jpg"
  },
  {
    "id": "relay",
    "name": "Relay",
    "owner": "made",
    "type": "Pitch demo",
    "status": "live",
    "url": "https://relay-madebyac.vercel.app",
    "repo": "https://github.com/asrithcheepurupalli/relay-demo",
    "tagline": "Live lead qualification and follow up.",
    "description": "A working AI automation pipeline demo: a lead comes in, gets qualified, routed and followed up automatically.",
    "tags": [
      "automation",
      "AI",
      "pitch"
    ],
    "source": "GitHub",
    "note": "",
    "image": "/products/relay.jpg"
  },
  {
    "id": "adcraft",
    "name": "AdCraft",
    "owner": "made",
    "type": "Pitch demo",
    "status": "live",
    "url": "https://adcraft-demo-roan.vercel.app",
    "repo": "https://github.com/asrithcheepurupalli/adcraft-demo",
    "tagline": "AI ad creative renderer.",
    "description": "A demo that renders ad creatives with AI.",
    "tags": [
      "ads",
      "AI",
      "pitch"
    ],
    "source": "GitHub",
    "note": "",
    "image": "/products/adcraft.jpg"
  },
  {
    "id": "proof",
    "name": "Proof",
    "owner": "made",
    "type": "Pitch demo",
    "status": "live",
    "url": "https://proof-mu.vercel.app",
    "repo": "https://github.com/asrithcheepurupalli/proof.",
    "tagline": "The ten second candidate view.",
    "description": "A working concept for a skills-first hiring product: verified, live, shipped work shown to a busy evaluator in the ten seconds they give it.",
    "tags": [
      "hiring",
      "concept"
    ],
    "source": "GitHub",
    "note": "",
    "image": "/products/proof.jpg"
  },
  {
    "id": "prevayu",
    "name": "Prevayu",
    "owner": "asrith",
    "type": "Venture",
    "status": "live",
    "url": "https://prevayu.vercel.app",
    "repo": "https://github.com/asrithcheepurupalli/prevayu",
    "tagline": "Find it before it finds your family.",
    "description": "A personal health guide for Indian families. For adults 25 to 40 with a family history of diabetes or high blood pressure: preventive screening made continuous.",
    "tags": [
      "health",
      "preventive care",
      "India"
    ],
    "source": "GitHub",
    "note": "",
    "image": "/products/prevayu.jpg"
  },
  {
    "id": "adda",
    "name": "Adda",
    "owner": "asrith",
    "type": "Product",
    "status": "beta",
    "url": "",
    "repo": "https://github.com/asrithcheepurupalli/adda",
    "tagline": "A social map of your city.",
    "description": "A premium, playful social map of your city: friend-powered places, food and events, with ranked lists. Mobile app, beta.",
    "tags": [
      "mobile",
      "social",
      "maps"
    ],
    "source": "asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": ""
  },
  {
    "id": "dsa-atlas",
    "name": "DSA Atlas",
    "owner": "asrith",
    "type": "Product",
    "status": "down",
    "url": "https://dsa-atlas-818.netlify.app",
    "repo": "",
    "tagline": "Learn data structures at your own pace.",
    "description": "An interactive self-paced DSA learning app: a full 56-topic curriculum, worked examples, quiz-gated mastery and goal-driven paths.",
    "tags": [
      "education",
      "DSA"
    ],
    "source": "studio notes",
    "note": "The Netlify link returns 404 as of the last check.",
    "image": ""
  },
  {
    "id": "curiosity",
    "name": "curiosity.",
    "owner": "asrith",
    "type": "Experiment",
    "status": "live",
    "url": "https://curiosity.asrithcheepurupalli.tech",
    "repo": "https://github.com/asrithcheepurupalli/curiosity..",
    "tagline": "Small questions about everyday things.",
    "description": "A minimalist inquiry into the mechanics of the ordinary: everyday questions, examined and published twice a week.",
    "tags": [
      "blog",
      "writing"
    ],
    "source": "asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": "/products/curiosity.jpg"
  },
  {
    "id": "portfolio",
    "name": "asrithcheepurupalli.tech",
    "owner": "asrith",
    "type": "Experiment",
    "status": "live",
    "url": "https://asrithcheepurupalli.tech",
    "repo": "https://github.com/asrithcheepurupalli/portfolio-asrithcheepurupalli.tech",
    "tagline": "Personal portfolio.",
    "description": "Case studies, creative experiments, blog and resume for Asrith Cheepurupalli.",
    "tags": [
      "portfolio"
    ],
    "source": "asrithcheepurupalli.tech",
    "note": "",
    "image": "/products/portfolio.jpg"
  },
  {
    "id": "vibe-portfolio",
    "name": "Vibe coding portfolio",
    "owner": "asrith",
    "type": "Experiment",
    "status": "live",
    "url": "https://vibemakesasrithcode.netlify.app",
    "repo": "",
    "tagline": "Creative coding experiments.",
    "description": "A creative portfolio of interactive projects and experiments.",
    "tags": [
      "creative coding"
    ],
    "source": "asrithcheepurupalli.tech",
    "note": "",
    "image": "/products/vibe-portfolio.jpg"
  },
  {
    "id": "index-experiment",
    "name": "index.-experiment",
    "owner": "asrith",
    "type": "Experiment",
    "status": "source_only",
    "url": "",
    "repo": "https://github.com/asrithcheepurupalli/index.-experiment",
    "tagline": "A public index of declared signals.",
    "description": "What if declared, and optionally verified, signals were summarized into a transparent public index? A design and engineering experiment.",
    "tags": [
      "experiment"
    ],
    "source": "asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": ""
  },
  {
    "id": "intent-action-parser",
    "name": "Intent Action Parser",
    "owner": "asrith",
    "type": "Tool",
    "status": "live",
    "url": "https://intent-action-parser-177007768449.us-west1.run.app",
    "repo": "https://github.com/asrithcheepurupalli/intent-action-parser",
    "tagline": "Messy messages in, structured actions out.",
    "description": "Converts messy real-world messages into structured, actionable outputs for business workflows.",
    "tags": [
      "AI",
      "automation"
    ],
    "source": "asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": "/products/intent-action-parser.jpg"
  },
  {
    "id": "cloud-shortener",
    "name": "Cloud URL Shortener",
    "owner": "asrith",
    "type": "Tool",
    "status": "down",
    "url": "https://cloud-shortener.onrender.com",
    "repo": "https://github.com/asrithcheepurupalli/cloud-shortener",
    "tagline": "URL shortener with analytics.",
    "description": "A URL shortener with an analytics dashboard. FastAPI, PostgreSQL, JWT and Chart.js.",
    "tags": [
      "backend",
      "FastAPI"
    ],
    "source": "asrithcheepurupalli.tech, GitHub",
    "note": "The Render link did not respond as of the last check.",
    "image": ""
  },
  {
    "id": "attendance-tracker",
    "name": "Attendance Tracker",
    "owner": "asrith",
    "type": "Tool",
    "status": "live",
    "url": "https://attendance-tracker-gvpcse01.netlify.app",
    "repo": "https://github.com/asrithcheepurupalli/student-attendance-tracker",
    "tagline": "An attendance tracker for my college.",
    "description": "A simple attendance tracker built for a college class.",
    "tags": [
      "education"
    ],
    "source": "GitHub",
    "note": "",
    "image": "/products/attendance-tracker.jpg"
  },
  {
    "id": "foothold",
    "name": "Foothold",
    "owner": "asrith",
    "type": "Tool",
    "status": "source_only",
    "url": "",
    "repo": "https://github.com/asrithcheepurupalli/foothold.",
    "tagline": "A personal startup-hiring agent.",
    "description": "Text-native agent that learns your background, sources real early-stage startups that fit you, scores each and drafts founder outreach. Nothing is sent without your approval. Runs on your own API key.",
    "tags": [
      "AI",
      "agent",
      "hiring"
    ],
    "source": "GitHub",
    "note": "",
    "image": ""
  },
  {
    "id": "homecast",
    "name": "HomeCast",
    "owner": "asrith",
    "type": "Experiment",
    "status": "source_only",
    "url": "",
    "repo": "https://github.com/asrithcheepurupalli/homecast",
    "tagline": "Synchronized multi-device headphones.",
    "description": "One audio source, many headphones, no perceptible lag. A Node and WebSocket sync prototype with clock sync and QR join.",
    "tags": [
      "audio",
      "prototype"
    ],
    "source": "GitHub",
    "note": "",
    "image": ""
  },
  {
    "id": "healthily",
    "name": "healthily",
    "owner": "asrith",
    "type": "Experiment",
    "status": "source_only",
    "url": "",
    "repo": "https://github.com/asrithcheepurupalli/healthily",
    "tagline": "A body-signal journal.",
    "description": "A small health and habit tracker to check whether you are actually being healthy.",
    "tags": [
      "health"
    ],
    "source": "asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": ""
  },
  {
    "id": "cloud-cost-compass",
    "name": "Cloud Cost Compass",
    "owner": "asrith",
    "type": "Tool",
    "status": "source_only",
    "url": "",
    "repo": "https://github.com/asrithcheepurupalli/cloudcostcompass",
    "tagline": "FinOps reporting prototype.",
    "description": "Describe a cloud workload and the dashboard produces a cost estimate, a budget risk signal, the service mix and recommended optimizations. Built as an internship review prototype.",
    "tags": [
      "FinOps",
      "dashboard"
    ],
    "source": "GitHub",
    "note": "",
    "image": ""
  },
  {
    "id": "ai-debug-assistant",
    "name": "AI Debug Assistant",
    "owner": "asrith",
    "type": "Tool",
    "status": "source_only",
    "url": "",
    "repo": "https://github.com/asrithcheepurupalli/debug-assistant",
    "tagline": "Paste a traceback, get a plain-English fix.",
    "description": "Parses Python tracebacks and suggests fixes using LLMs.",
    "tags": [
      "AI",
      "Python"
    ],
    "source": "asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": ""
  },
  {
    "id": "screen2md",
    "name": "screen2md",
    "owner": "asrith",
    "type": "Tool",
    "status": "source_only",
    "url": "",
    "repo": "https://github.com/asrithcheepurupalli/screen2md",
    "tagline": "Screenshots in, Markdown out.",
    "description": "Turns annotated screenshots into organized Markdown docs using OCR.",
    "tags": [
      "Python",
      "OCR"
    ],
    "source": "asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": ""
  },
  {
    "id": "flask-cicd-blog",
    "name": "CI/CD Flask Blog",
    "owner": "asrith",
    "type": "Tool",
    "status": "source_only",
    "url": "",
    "repo": "https://github.com/asrithcheepurupalli/flask-cicd-app",
    "tagline": "Flask blog with auto-deploys.",
    "description": "A Flask blog with automated tests and deploys through GitHub Actions and Docker.",
    "tags": [
      "DevOps",
      "Flask"
    ],
    "source": "asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": ""
  },
  {
    "id": "totp-cli",
    "name": "totp-cli",
    "owner": "asrith",
    "type": "Tool",
    "status": "source_only",
    "url": "",
    "repo": "https://github.com/asrithcheepurupalli/totp-cli",
    "tagline": "2FA codes from your terminal.",
    "description": "A command-line TOTP two-factor code generator with encrypted local storage, fully offline.",
    "tags": [
      "security",
      "CLI"
    ],
    "source": "asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": ""
  },
  {
    "id": "math-tutor-bot",
    "name": "math-tutor-bot",
    "owner": "asrith",
    "type": "Tool",
    "status": "source_only",
    "url": "",
    "repo": "https://github.com/asrithcheepurupalli/math-tutor-bot",
    "tagline": "Math, step by step.",
    "description": "A Python bot that works through math problems step by step.",
    "tags": [
      "Python",
      "education"
    ],
    "source": "asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": ""
  },
  {
    "id": "noupdateever",
    "name": "noupdateever.",
    "owner": "asrith",
    "type": "Experiment",
    "status": "concept",
    "url": "",
    "repo": "https://github.com/asrithcheepurupalli/noupdateever.",
    "tagline": "The newest experiment on the bench.",
    "description": "Announced on the portfolio as shipping soon. No public details yet.",
    "tags": [
      "upcoming"
    ],
    "source": "asrithcheepurupalli.tech, GitHub",
    "note": "",
    "image": ""
  }
];
