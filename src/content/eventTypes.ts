export type EventTypeContent = {
  id: string
  title: string
  shortText: string
  homeImage: string
  aboutImages: string[]
  seoIntro: string
  details: string[]
  bullets: string[]
}

export const eventTypes: EventTypeContent[] = [
  {
    id: 'weddings',
    title: 'Weddings',
    shortText:
      'Add elegant comfort for couples, families, and guests with clean luxury restroom trailers that match your wedding style.',
    homeImage: '/images/loohaven-a1.webp',
    aboutImages: ['/images/loohaven-a1.webp', '/images/loohaven-b3.webp'],
    seoIntro:
      'For luxury wedding restroom trailer rentals in Israel, bathroomsheli provides high-end mobile restroom trailers for garden weddings, beach weddings, kibbutz weddings, and venue weddings in Tel Aviv, Jerusalem, Haifa, Netanya, Herzliya, and Caesarea.',
    details: [
      'Our wedding restroom trailers are designed to feel premium, private, and photo-ready. Couples and planners choose bathroomsheli when they need a polished guest experience that matches high-end decor and production standards.',
      'From rehearsal setup to final pickup, we coordinate with planners, venue teams, and production managers. This keeps access clear, service smooth, and the restroom area clean throughout the event timeline.',
    ],
    bullets: [
      'Premium interiors for formal attire, makeup touch-ups, and guest comfort.',
      'Quiet A/C for summer weddings and heating for cooler evenings.',
      'Professional setup timed with your wedding planner or production manager.',
      'Clean, stocked, and guest-ready from reception start to final pickup.',
      'Trusted solution for outdoor and mixed indoor-outdoor wedding venues in Israel.',
      'Reliable mobile restroom trailers for destination weddings and high-traffic celebrations.',
    ],
  },
  {
    id: 'special-events',
    title: 'Special Events',
    shortText:
      'Treat your guests like VIPs at corporate events, private celebrations, community gatherings, and large productions.',
    homeImage: '/images/loohaven-a2.webp',
    aboutImages: ['/images/loohaven-a2.webp', '/images/loohaven-b2.webp'],
    seoIntro:
      'For corporate event restroom trailer rentals in Israel, bathroomsheli supports conferences, brand activations, school graduations, municipal events, private parties, and public gatherings across central Israel and nationwide.',
    details: [
      'Special events need predictable logistics and clean restrooms at all hours. Our event restroom trailers provide an upgraded alternative to basic portable toilets and help maintain a premium event standard.',
      'We support production teams, event planners, and operations managers with practical setup plans, stable service windows, and fast communication before and during event days.',
    ],
    bullets: [
      'Professional presentation that upgrades guest experience beyond portable toilets.',
      'Reliable logistics for venues with limited permanent restroom capacity.',
      'Flexible service windows for daytime and night events.',
      'Suitable for outdoor venues, pop-up events, and high-traffic schedules.',
      'Excellent fit for corporate hospitality, launches, and community festivals.',
      'High-quality restroom trailer rental for events throughout Israel.',
    ],
  },
  {
    id: 'construction-long-term',
    title: 'Construction / Long-Term',
    shortText:
      'Need a clean long-term solution for renovation, construction, seasonal needs, or temporary facilities? We cover that too.',
    homeImage: '/images/loohaven-a3.webp',
    aboutImages: ['/images/loohaven-a3.webp', '/images/loohaven-b4.webp'],
    seoIntro:
      'For long-term restroom trailer rental in Israel, bathroomsheli offers dependable mobile restroom solutions for construction sites, villa renovations, hospitality overflow, and temporary infrastructure projects.',
    details: [
      'Long-term projects need consistency and durability. Our mobile restroom trailers are a strong fit when permanent plumbing is not available, under maintenance, or not practical for worker and visitor traffic.',
      'We work with builders, project managers, and site operators to keep service steady and operations clean. This supports both workforce welfare and client-facing presentation quality.',
    ],
    bullets: [
      'Stable long-term setup with practical servicing and maintenance options.',
      'Cleaner and safer alternative when indoor plumbing is unavailable or limited.',
      'Great for staged construction handovers and premium client-facing projects.',
      'Support for private, commercial, and municipality use cases.',
      'Ideal for seasonal and temporary-site operations in Israel.',
      'Professional restroom trailer rental with dependable uptime planning.',
    ],
  },
  {
    id: 'festivals-hospitality',
    title: 'Festivals & Hospitality',
    shortText:
      'Large crowds, food service, and full-day operations require restroom quality that can keep up with guest expectations.',
    homeImage: '/images/loohaven-b5.webp',
    aboutImages: ['/images/loohaven-b5.webp', '/images/loohaven-b1.webp'],
    seoIntro:
      'For festival restroom trailer rentals in Israel, bathroomsheli delivers upscale mobile restroom services for food festivals, tourism events, beachfront hospitality zones, and multi-day public gatherings.',
    details: [
      'Hospitality events are measured by comfort and flow. Our luxury restroom trailers help reduce restroom bottlenecks and support a cleaner, more organized visitor experience at high-volume events.',
      'For single-day and multi-day festivals, we provide restroom trailer logistics aligned with producer schedules and guest movement patterns to keep service quality stable from opening to close.',
    ],
    bullets: [
      'Built for high guest turnover with comfortable interiors and clear access.',
      'Strong option for food festivals, tourism events, and waterfront venues.',
      'Consistent quality for day-and-night event operations.',
      'Premium restroom presence for sponsors, VIP areas, and public service zones.',
      'Improves event reputation through visible cleanliness and professionalism.',
      'SEO-ready service focus: festival restroom trailer rental Israel.',
    ],
  },
]
