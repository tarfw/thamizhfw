// ── Translation Dictionary ─────────────────────────────────────
// Keys are organised by area (ui.*, cat.* for categories)
// {{n}} is used for dynamic values

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    // Layout / Navigation
    'ui.topics': 'Topics',
    'ui.allArticles': 'All Articles',
    'ui.browseAll': 'Browse all articles',
    'ui.filterCategories': 'Filter categories...',
    'ui.copyright': '© 2026 Thamizhi · Open journalism',
    'ui.toggleMenu': 'Toggle menu',
    'ui.toggleSidebar': 'Toggle sidebar',
    'ui.toggleChat': 'Toggle AI chat',
    'ui.toggleTheme': 'Toggle dark mode',
    'ui.switchLang': 'Switch language',

    // Homepage
    'ui.independentJournalism': 'Independent & Open Journalism',
    'ui.openJournals': 'Open Journals from Tamil Nadu',
    'ui.tagline': 'Transparent, independent journalism covering every domain that matters.',
    'ui.browseArticles': 'Browse Articles',
    'ui.featured': 'Featured',
    'ui.latest': 'Latest',
    'ui.viewAll': 'View all →',
    'ui.noArticles': 'No articles yet.',

    // Articles list
    'ui.articles': 'Articles',
    'ui.articlesCount': '{{n}} article',
    'ui.articlesCount_plural': '{{n}} articles',
    'ui.noArticlesCategory': 'No articles found in this category.',
    'ui.noFilterResults': 'No categories match your filter.',

    // Article detail
    'ui.home': 'Home',
    'ui.editorial': 'Thamizhi Editorial',

    'ui.source': 'Source',
    'ui.backToArticles': 'Back to articles',

    // AI Chat
    'ui.aiAssistant': 'AI Assistant',
    'ui.askAbout': 'Ask about articles',
    'ui.askPlaceholder': 'Ask about articles, topics...',
    'ui.closePanel': 'Close chat panel',
    'ui.send': 'Send',

    // Meta / Time
    'ui.readingTime': '{{n}} min read',
    'ui.justNow': 'just now',
    'ui.backToTop': 'Back to top',
    'ui.minutesAgo': '{{n}}m ago',
    'ui.hoursAgo': '{{n}}h ago',
    'ui.daysAgo': '{{n}}d ago',
    'ui.weeksAgo': '{{n}}w ago',
  },
  ta: {
    // Layout / Navigation
    'ui.topics': 'தலைப்புகள்',
    'ui.allArticles': 'அனைத்து கட்டுரைகள்',
    'ui.browseAll': 'அனைத்து கட்டுரைகளையும் பார்க்க',
    'ui.filterCategories': 'வகைகளை வடிகட்டவும்...',
    'ui.copyright': '© 2026 தமிழி · திறந்த பத்திரிகை',
    'ui.toggleMenu': 'மெனுவை மாற்று',
    'ui.toggleSidebar': 'பக்க பட்டியை மாற்று',
    'ui.toggleChat': 'AI அரட்டையை மாற்று',
    'ui.toggleTheme': 'இருண்ட பயன்முறையை மாற்று',
    'ui.switchLang': 'மொழியை மாற்று',

    // Homepage
    'ui.independentJournalism': 'சுயாதீன மற்றும் திறந்த பத்திரிகை',
    'ui.openJournals': 'தமிழ்நாட்டில் இருந்து திறந்த பத்திரிகைகள்',
    'ui.tagline': 'வெளிப்படையான, சுயாதீன பத்திரிகை, எல்லா துறைகளையும் உள்ளடக்கியது.',
    'ui.browseArticles': 'கட்டுரைகளை பார்க்க',
    'ui.featured': 'சிறப்பு',
    'ui.latest': 'சமீபத்திய',
    'ui.viewAll': 'அனைத்தையும் பார்க்க →',
    'ui.noArticles': 'இதுவரை கட்டுரைகள் இல்லை.',

    // Articles list
    'ui.articles': 'கட்டுரைகள்',
    'ui.articlesCount': '{{n}} கட்டுரை',
    'ui.articlesCount_plural': '{{n}} கட்டுரைகள்',
    'ui.noArticlesCategory': 'இந்த பிரிவில் கட்டுரைகள் இல்லை.',
    'ui.noFilterResults': 'உங்கள் வடிகட்டலுடன் பொருந்தும் வகைகள் எதுவும் இல்லை.',

    // Article detail
    'ui.home': 'முகப்பு',
    'ui.editorial': 'தமிழி ஆசிரியர் குழு',

    'ui.source': 'மூலம்',
    'ui.backToArticles': 'கட்டுரைகளுக்கு திரும்ப',

    // AI Chat
    'ui.aiAssistant': 'AI உதவியாளர்',
    'ui.askAbout': 'கட்டுரைகள் பற்றி கேளுங்கள்',
    'ui.askPlaceholder': 'கட்டுரைகள், தலைப்புகள் பற்றி கேளுங்கள்...',
    'ui.closePanel': 'அரட்டை பேனலை மூடு',
    'ui.send': 'அனுப்பு',

    // Meta / Time
    'ui.readingTime': '{{n}} நிமிட வாசிப்பு',
    'ui.justNow': 'இப்போதுதான்',
    'ui.backToTop': 'மேலே செல்ல',
    'ui.minutesAgo': '{{n}} நிமி முன்',
    'ui.hoursAgo': '{{n}} மணி முன்',
    'ui.daysAgo': '{{n}} நா முன்',
    'ui.weeksAgo': '{{n}} வா முன்',
  },
};

// ── Category Translations ──────────────────────────────────────
export const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  en: {
    'women-violence': 'Women Violence',
    economy: 'Economy',
    environment: 'Environment',
    technology: 'Technology',
    culture: 'Culture',
    investigation: 'Investigation',
    crime: 'Crime & Justice',
    education: 'Education',
    health: 'Health',
    'human-rights': 'Human Rights',
    agriculture: 'Agriculture',
    infrastructure: 'Infrastructure',
    sports: 'Sports',
    'social-welfare': 'Social Welfare',
  },
  ta: {
    'women-violence': 'பெண்கள் வன்முறை',
    economy: 'பொருளாதாரம்',
    environment: 'சுற்றுச்சூழல்',
    technology: 'தொழில்நுட்பம்',
    culture: 'பண்பாடு',
    investigation: 'விசாரணை',
    crime: 'குற்றம் & நீதி',
    education: 'கல்வி',
    health: 'சுகாதாரம்',
    'human-rights': 'மனித உரிமைகள்',
    agriculture: 'விவசாயம்',
    infrastructure: 'உள்கட்டமைப்பு',
    sports: 'விளையாட்டு',
    'social-welfare': 'சமூக நலன்',
  },
};

export const CATEGORY_DESCRIPTIONS: Record<string, Record<string, string>> = {
  en: {
    'women-violence': 'Gender-based violence, domestic abuse, sexual assault, femicide, and justice for survivors.',
    economy: 'Markets, trade, industry, and economic development.',
    environment: 'Climate, ecology, conservation, and environmental justice.',
    technology: 'Innovation, digital infrastructure, and the tech industry.',
    culture: 'Arts, heritage, language, literature, and cultural discourse.',
    investigation: 'In-depth investigative reporting and accountability journalism.',
    crime: 'Policing, judiciary, corruption, and legal accountability.',
    education: 'Schools, universities, policy, and the future of learning.',
    health: 'Healthcare access, public health, medicine, and well-being.',
    'human-rights': 'Civil liberties, social justice, equality, and marginalised voices.',
    agriculture: 'Farming, rural livelihoods, agrarian distress, and food security.',
    infrastructure: 'Transport, urban development, water, energy, and public works.',
    sports: 'Athletics, games, sporting culture, and achievement.',
    'social-welfare': 'Government schemes, welfare benefits, and support for vulnerable communities.',
  },
  ta: {
    'women-violence': 'பாலின வன்முறை, குடும்ப துஷ்பிரயோகம், பாலியல் தாக்குதல், பெண் கொலை, மற்றும் பாதிக்கப்பட்டவர்களுக்கான நீதி.',
    economy: 'சந்தைகள், வர்த்தகம், தொழில், மற்றும் பொருளாதார வளர்ச்சி.',
    environment: 'காலநிலை, சூழலியல், பாதுகாப்பு, மற்றும் சுற்றுச்சூழல் நீதி.',
    technology: 'புதுமை, டிஜிட்டல் உள்கட்டமைப்பு, மற்றும் தொழில்நுட்ப துறை.',
    culture: 'கலை, பாரம்பரியம், மொழி, இலக்கியம், மற்றும் பண்பாட்டு உரையாடல்.',
    investigation: 'ஆழமான விசாரணை மற்றும் பொறுப்புக்கூறல் பத்திரிகை.',
    crime: 'காவல், நீதித்துறை, ஊழல், மற்றும் சட்ட பொறுப்புக்கூறல்.',
    education: 'பள்ளிகள், பல்கலைக்கழகங்கள், கொள்கை, மற்றும் கற்றலின் எதிர்காலம்.',
    health: 'சுகாதார அணுகல், பொது சுகாதாரம், மருத்துவம், மற்றும் நல்வாழ்வு.',
    'human-rights': 'குடிமை உரிமைகள், சமூக நீதி, சமத்துவம், மற்றும் ஒதுக்கப்பட்ட குரல்கள்.',
    agriculture: 'விவசாயம், கிராம வாழ்வாதாரம், விவசாய நெருக்கடி, மற்றும் உணவு பாதுகாப்பு.',
    infrastructure: 'போக்குவரத்து, நகர வளர்ச்சி, நீர், ஆற்றல், மற்றும் பொதுப்பணிகள்.',
    sports: 'தடகளம், விளையாட்டுகள், விளையாட்டு பண்பாடு, மற்றும் சாதனை.',
    'social-welfare': 'அரசு திட்டங்கள், நலன்புரி பலன்கள், மற்றும் பாதிக்கப்படக்கூடிய சமூகங்களுக்கான ஆதரவு.',
  },
};

// ── Runtime ─────────────────────────────────────────────────────
export function getCurrentLang(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('thamizhi-lang') || 'en';
}

export function t(key: string, params?: Record<string, string | number>): string {
  const lang = getCurrentLang();
  let text = TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{{${k}}}`, String(v));
    });
  }
  return text;
}

export function categoryLabel(key: string): string {
  const lang = getCurrentLang();
  return CATEGORY_LABELS[lang]?.[key] || CATEGORY_LABELS.en[key] || key;
}

export function categoryDescription(key: string): string {
  const lang = getCurrentLang();
  return CATEGORY_DESCRIPTIONS[lang]?.[key] || CATEGORY_DESCRIPTIONS.en[key] || '';
}

// ── DOM Translator (run on page load & lang change) ────────────
export function applyTranslations(lang?: string) {
  if (typeof document === 'undefined') return;
  const l = lang || getCurrentLang();
  const dict = TRANSLATIONS[l] || TRANSLATIONS.en;

  // Translate text nodes with data-i18n
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')!;
    // Handle category keys: cat.label.* and cat.desc.*
    if (key.startsWith('cat.label.')) {
      const catKey = key.replace('cat.label.', '');
      const translated = CATEGORY_LABELS[l]?.[catKey] || CATEGORY_LABELS.en[catKey];
      if (translated) el.textContent = translated;
    } else if (key.startsWith('cat.desc.')) {
      const catKey = key.replace('cat.desc.', '');
      const translated = CATEGORY_DESCRIPTIONS[l]?.[catKey] || CATEGORY_DESCRIPTIONS.en[catKey];
      if (translated) el.setAttribute('title', translated);
    } else {
      const translated = dict[key] || TRANSLATIONS.en[key];
      if (translated) el.textContent = translated;
    }
  });

  // Translate placeholders
  document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder')!;
    const translated = dict[key] || TRANSLATIONS.en[key];
    if (translated) (el as HTMLInputElement).placeholder = translated;
  });

  // Translate aria-labels and titles
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria')!;
    const translated = dict[key] || TRANSLATIONS.en[key];
    if (translated) {
      el.setAttribute('aria-label', translated);
      el.setAttribute('title', translated);
    }
  });

  // Translate titles
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title')!;
    const translated = dict[key] || TRANSLATIONS.en[key];
    if (translated) el.setAttribute('title', translated);
  });
}
