export const en = {
  brand: 'bathroomsheli.com',
  brandMark: 'BS',
  nav: {
    links: [
      { label: 'Home', path: '/' },
      { label: 'Items', path: '/items' },
      { label: 'About', path: '/about' },
      { label: 'Contact', path: '/contact' },
    ],
    cta: 'Request Quote',
    langLabel: 'Language',
    lang: { en: 'EN', he: 'HE' },
    menu: 'Menu',
  },
  home: {
    hero: {
      eyebrow: 'Portable restroom trailers for events in Israel',
      title: 'Clean, modern restroom trailers that look great at any event.',
      subtitle:
        'bathroomsheli provides premium portable bathroom trailers for weddings, productions, and corporate events. Fast delivery, spotless setup, and a smooth guest experience.',
      primaryCta: 'Request Quote',
      secondaryCta: 'Email Us',
    },
    badges: [
      'Premium finish',
      'Fast setup',
      'Quiet A/C',
      'Private stalls',
      'Professional service',
    ],
    howItWorks: {
      title: 'How it works',
      steps: [
        {
          title: 'Choose a trailer',
          text: 'Pick the 2-stall or 3-stall suite based on your guest count.',
        },
        {
          title: 'Share event details',
          text: 'Tell us the date, city, and timeline. We confirm logistics quickly.',
        },
        {
          title: 'We deliver & set up',
          text: 'We arrive on time, connect utilities, and keep everything clean.',
        },
      ],
    },
    featured: {
      title: 'Featured trailers',
      subtitle: 'Simple pricing and premium comfort.',
      cards: [
        {
          name: '2-Stall Suite',
          price: '₪4,000',
          detail: 'Ideal for intimate weddings and VIP lounges.',
          capacity: 'Up to 150 guests',
        },
        {
          name: '3-Stall Suite',
          price: '₪5,000',
          detail: 'Best for larger gatherings and productions.',
          capacity: 'Up to 250 guests',
        },
      ],
    },
    faq: {
      title: 'Quick answers',
      items: [
        {
          question: 'How soon can you deliver?',
          answer: 'Typically within 48 hours for available dates.',
        },
        {
          question: 'Do you handle setup and cleanup?',
          answer: 'Yes. We handle delivery, setup, and a clean pickup.',
        },
        {
          question: 'Are the trailers climate controlled?',
          answer: 'Yes. All units have quiet A/C and heat.',
        },
      ],
    },
    quote: {
      title: 'Get a fast quote',
      subtitle: 'Send the basics and we will respond quickly.',
    },
  },
  items: {
    title: 'Our items',
    subtitle: 'Premium portable bathroom trailers designed for comfort and style.',
    cards: [
      {
        name: '2-Stall Suite',
        price: '₪4,000',
        includesTitle: 'Includes',
        includes: [
          'Two private stalls',
          'Full-length mirrors',
          'A/C and heat',
          'Premium lighting',
          'Stocked amenities',
        ],
        capacity: 'Recommended for up to 150 guests',
        uses: 'Weddings, boutique events, VIP lounges',
      },
      {
        name: '3-Stall Suite',
        price: '₪5,000',
        includesTitle: 'Includes',
        includes: [
          'Three private stalls',
          'Luxury countertops',
          'Quiet ventilation',
          'Premium lighting',
          'Stocked amenities',
        ],
        capacity: 'Recommended for up to 250 guests',
        uses: 'Corporate events, productions, high-traffic gatherings',
      },
    ],
    includedTitle: "What's included",
    includedItems: [
      'Climate control',
      'Freshwater & waste handling',
      'Touchless fixtures available',
      'Daily or weekly servicing',
      'Optional attendants',
      'Discreet exterior styling',
    ],
  },
  about: {
    title: 'Simple, premium restroom rentals across Israel.',
    body: [
      'bathroomsheli was built to make portable restroom rentals feel easy and professional.',
      'We focus on clean interiors, quiet comfort, and on-time service so your event runs smoothly.',
      'From weddings to productions, we deliver a polished experience that guests appreciate.',
      'Every unit is sanitized before arrival and inspected on-site to ensure a flawless presentation.',
    ],
    sections: [
      {
        title: 'Designed for elegant events',
        text: 'Our trailers are styled to blend with upscale venues, with soft lighting and clean finishes.',
      },
      {
        title: 'Reliable logistics',
        text: 'We coordinate delivery windows, site access, and utilities so you stay on schedule.',
      },
      {
        title: 'Guest-first cleanliness',
        text: 'We keep supplies stocked and surfaces spotless for the duration of your event.',
      },
      {
        title: 'Discreet, professional crew',
        text: 'Our team works quietly in the background to keep the experience seamless.',
      },
    ],
    gallery: [
      'Interior suite',
      'Premium fixtures',
      'Night-ready lighting',
      'Guest lounge view',
      'Event placement',
      'Service crew',
    ],
  },
  contact: {
    title: 'Contact the owner directly',
    subtitle: 'Fast response by email or form. We keep it simple.',
    cards: [
      { title: 'Email', text: 'bathroomsheli@gmail.com' },
      { title: 'Response time', text: 'Usually within a few hours' },
    ],
  },
  form: {
    fields: {
      fullName: 'Full name',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone number',
      eventDate: 'Event date',
      trailerType: 'Trailer type',
      wantsAnotherDate: 'Flexible date (I can move to another date)',
      message: 'Message (optional)',
    },
    trailerOptions: {
      placeholder: 'Select a trailer',
      two: '2-stall suite',
      three: '3-stall suite',
    },
    submit: 'Send request',
    successTitle: 'Thanks — we’ll reach out soon.',
    successBody: 'Your request has been received. A bathroomsheli specialist will reply shortly.',
    sendAnother: 'Send another request',
    errors: {
      fullName: 'Please enter your name.',
      firstName: 'Please enter your first name.',
      lastName: 'Please enter your last name.',
      email: 'Please enter a valid email.',
      phone: 'Please enter a valid phone number.',
      eventDate: 'Please choose a date.',
      trailerType: 'Please select a trailer.',
      submit: 'Something went wrong. Please try again.',
    },
  },
  footer: {
    title: 'bathroomsheli.com',
    description:
      'Israel-based luxury restroom trailer rentals for events, productions, and premium hospitality.',
    serviceTitle: 'Service area',
    serviceText: 'Nationwide coverage with emphasis on Tel Aviv and central districts.',
    contactTitle: 'Contact',
    email: 'bathroomsheli@gmail.com',
    note: '© 2026 bathroomsheli. All rights reserved.',
  },
} as const

