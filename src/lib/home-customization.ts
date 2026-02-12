export type HomeSlide = {
  id: string;
  tagText: string;
  heading: string;
  body: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  badgeText: string;
};

export type HomeCustomization = {
  autoplaySeconds: number;
  slides: HomeSlide[];
};

export const HOME_CUSTOMIZATION_STORAGE_KEY = 'healthi_home_customization_v1';

export const DEFAULT_HOME_CUSTOMIZATION: HomeCustomization = {
  autoplaySeconds: 5,
  slides: [
    {
      id: 'slide-1',
      tagText: 'Featured campaign',
      heading: 'Electronics Sale Live Now - 24 Hours to Save',
      body: 'Your next essential is waiting - up to 60% off during our flash sale.',
      buttonText: 'Shop Now',
      buttonLink: '/categories/all',
      imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1600',
      badgeText: 'Save Up to 60%',
    },
    {
      id: 'slide-2',
      tagText: 'Featured campaign',
      heading: 'Build Your Wellness Stack',
      body: 'Nutrition, diagnostics, and condition-care essentials in one place.',
      buttonText: 'Explore Products',
      buttonLink: '/categories/all',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1600',
      badgeText: 'Save Up to 40%',
    },
    {
      id: 'slide-3',
      tagText: 'Featured campaign',
      heading: 'Employer-Sponsored Benefits, Simplified',
      body: 'Apply wallet and rewards confidently with beneficiary-first checkout.',
      buttonText: 'View Cart',
      buttonLink: '/cart',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1600',
      badgeText: 'Save Up to 30%',
    },
  ],
};

export function parseHomeCustomization(raw: string | null): HomeCustomization {
  if (!raw) return DEFAULT_HOME_CUSTOMIZATION;
  try {
    const parsed = JSON.parse(raw) as Partial<HomeCustomization>;
    if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) {
      return DEFAULT_HOME_CUSTOMIZATION;
    }
    const slides = parsed.slides
      .filter((slide) => slide && slide.id && slide.heading)
      .map((slide) => ({
        id: String(slide.id),
        tagText: String(slide.tagText ?? ''),
        heading: String(slide.heading ?? ''),
        body: String(slide.body ?? ''),
        buttonText: String(slide.buttonText ?? 'Shop Now'),
        buttonLink: String(slide.buttonLink ?? '/'),
        imageUrl: String(slide.imageUrl ?? ''),
        badgeText: String(slide.badgeText ?? ''),
      }));
    if (slides.length === 0) return DEFAULT_HOME_CUSTOMIZATION;
    return {
      autoplaySeconds: Number(parsed.autoplaySeconds) > 0 ? Number(parsed.autoplaySeconds) : DEFAULT_HOME_CUSTOMIZATION.autoplaySeconds,
      slides,
    };
  } catch {
    return DEFAULT_HOME_CUSTOMIZATION;
  }
}
