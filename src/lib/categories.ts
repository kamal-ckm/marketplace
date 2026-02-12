export type CategoryGroup = {
  name: string;
  slug: string;
  sub: Array<{
    name: string;
    slug: string;
  }>;
};

export const MENU_CATEGORIES: CategoryGroup[] = [
  {
    name: 'Fitness & Physical Health',
    slug: 'fitness-physical-health',
    sub: [
      { name: 'Gym & Fitness', slug: 'gym-fitness' },
      { name: 'Sports & Fitness Equipment', slug: 'sports-fitness-equipment' },
    ],
  },
  {
    name: 'Nutrition & Supplements',
    slug: 'nutrition-supplements',
    sub: [
      { name: 'Diet & Nutrition', slug: 'diet-nutrition' },
      { name: 'Supplements', slug: 'supplements' },
      { name: 'Health Foods', slug: 'health-foods' },
    ],
  },
  {
    name: 'Mental & Lifestyle Wellness',
    slug: 'mental-lifestyle-wellness',
    sub: [
      { name: 'Mental Wellness', slug: 'mental-wellness' },
      { name: 'Financial Wellness', slug: 'financial-wellness' },
    ],
  },
  {
    name: 'Medical & Condition Care',
    slug: 'medical-condition-care',
    sub: [
      { name: 'Condition Management', slug: 'condition-management' },
      { name: 'Medical Device', slug: 'medical-device' },
    ],
  },
  {
    name: 'Testing & Diagnostics',
    slug: 'testing-diagnostics',
    sub: [{ name: 'At Home Test Kits', slug: 'at-home-test-kits' }],
  },
];

export const ADMIN_CATEGORY_OPTIONS = MENU_CATEGORIES.flatMap((group) =>
  group.sub.map((item) => ({
    group: group.name,
    name: item.name,
    slug: item.slug,
  }))
);
