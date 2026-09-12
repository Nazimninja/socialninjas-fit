import { CaseStudy } from '../types';

export const caseStudies: CaseStudy[] = [
    {
        id: 1,
        client: "Zara Skin Co.",
        logo: "https://placehold.co/200x60/020617/ffffff?text=Zara+Skin+Co.",
        category: "E-Commerce",
        mainMetric: "6.1x",
        metricLabel: "ROAS in 90 Days",
        secondaryMetrics: [
            { label: "Monthly Revenue", value: "₹18L+" },
            { label: "CPA Drop", value: "-38%" }
        ],
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800",
        challenge: "A Jaipur-based skincare D2C brand spending ₹2L/month on Meta Ads but stuck at a 1.4x ROAS — barely breaking even. Their ad creatives were brand-led and static, and their audience targeting was too broad, leading to sky-high CPMs and irrelevant clicks from non-buyers.",
        solution: "We rebuilt their entire paid media stack from zero. We created a 3-tier UGC creative pipeline — problem-agitation reels, ingredient breakdown carousels, and before/after testimonial videos — and matched each to a tightly defined audience segment. Budget was reallocated dynamically every 72 hours to only the top-performing ad sets. Result: 6.1x ROAS in month 3 with ₹18L+ monthly revenue.",
        tags: ["Meta Ads", "UGC Creatives", "D2C", "Skincare"],
        testimonial: {
            text: "We went from barely breaking even to our best quarter ever. The creative approach they used was completely different from anything we'd tried — it actually felt like content, not ads.",
            author: "Priya V.",
            role: "Founder, Zara Skin Co.",
            image: "https://randomuser.me/api/portraits/women/28.jpg"
        }
    },
    {
        id: 2,
        client: "Nexvue Technologies",
        logo: "https://placehold.co/200x60/020617/ffffff?text=Nexvue+Tech",
        category: "B2B Lead Gen",
        mainMetric: "+134%",
        metricLabel: "Qualified Pipeline",
        secondaryMetrics: [
            { label: "Cost Per Lead", value: "-52%" },
            { label: "Demo Book Rate", value: "+31%" }
        ],
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
        challenge: "A Pune-based B2B SaaS company selling HR automation software to mid-market firms. Despite a solid product, their LinkedIn campaigns were generating high-volume but low-quality leads — mostly junior HR executives with no buying authority. Their CPL was ₹4,200 and demo-to-close was under 8%.",
        solution: "We scrapped the broad LinkedIn campaign and built a precision ABM system targeting 800 verified decision-makers — CHROs, VP-HR, and Heads of People at companies with 200–2,000 employees. We deployed a 5-touch nurture sequence: cold outreach → lead magnet (ROI calculator) → retargeted case study → demo invite → urgency close. CPL dropped to ₹2,015 and demo bookings doubled.",
        tags: ["LinkedIn Ads", "ABM", "B2B SaaS", "Lead Nurture"],
        testimonial: {
            text: "We wasted 6 months getting the wrong people on calls. Social Ninja's rebuilt our targeting from the ground up and within 8 weeks our pipeline was full of actual decision-makers. The ROI calculator lead magnet alone booked 40 demos in a month.",
            author: "Rohit M.",
            role: "VP Marketing, Nexvue Technologies",
            image: "https://randomuser.me/api/portraits/men/41.jpg"
        }
    },
    {
        id: 3,
        client: "The Biryani House",
        logo: "https://placehold.co/200x60/020617/ffffff?text=Biryani+House",
        category: "Local Business",
        mainMetric: "4.2M+",
        metricLabel: "Organic Views in 60 Days",
        secondaryMetrics: [
            { label: "Zomato Orders", value: "+210%" },
            { label: "New Followers", value: "62K" }
        ],
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800",
        challenge: "A beloved Hyderabad cloud kitchen chain with 3 locations that had zero social presence despite excellent food and reviews. They were entirely dependent on Zomato/Swiggy for discovery and paying up to 30% commission per order. New location launch was 60 days away.",
        solution: "We built a 'Biryani ASMR' short-form content series — slow-motion dum biryani reveals, chef POV cooking videos, and 'what 500 grams of Hyderabadi biryani looks like' reels. We partnered with 12 Hyderabad food micro-influencers for launch week. The campaign hit 1M views in 11 days. Zomato self-ordering via Google Maps surged 210% as they became the top result for 'best biryani Hyderabad' locally.",
        tags: ["Reels", "Influencer", "Food & Beverage", "Local SEO"],
        testimonial: {
            text: "62,000 followers in 2 months. People now come in saying 'I saw you on Instagram' every single day. Our new branch had a 45-minute wait on day one because of the content campaign. Worth every rupee.",
            author: "Azhar K.",
            role: "Co-Founder, The Biryani House",
            image: "https://randomuser.me/api/portraits/men/67.jpg"
        }
    },
    {
        id: 4,
        client: "PocketFit India",
        logo: "https://placehold.co/200x60/020617/ffffff?text=PocketFit",
        category: "App Growth",
        mainMetric: "-61%",
        metricLabel: "Cost Per Install",
        secondaryMetrics: [
            { label: "D30 Retention", value: "+2.8x" },
            { label: "App Store Rank", value: "Top 12" }
        ],
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800",
        challenge: "A Mumbai-based fitness app targeting tier-2 Indian cities faced a brutal CPI of ₹180 on Meta and Google — unsustainable given their ₹299/year subscription price. Their generic 'get fit at home' creatives were being ignored in saturated feeds, and retention at day 30 was below 12%.",
        solution: "We pivoted the acquisition channel to YouTube Shorts and Instagram Reels with hyper-regional creator partnerships — vernacular trainers from Bhopal, Nagpur, and Surat who had 50K–500K engaged audiences. Content was produced in Hindi and Marathi, showing the app's 15-minute home workout plans in real living rooms. CPI dropped to ₹71. We also ran App Store Optimization to push them into the top 12 in the Health & Fitness category for key search terms.",
        tags: ["Creator Marketing", "App Store Opt.", "Regional", "Fitness"],
        testimonial: {
            text: "Regional creators in tier-2 cities changed everything for us. Our users now feel like the app was made for them. CPI went from ₹180 to ₹71 and the users who come in from this channel actually stay.",
            author: "Sneha P.",
            role: "Growth Lead, PocketFit India",
            image: "https://randomuser.me/api/portraits/women/53.jpg"
        }
    }
];