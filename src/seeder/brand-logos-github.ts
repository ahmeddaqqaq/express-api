// Brand logos using the car-logos-dataset from GitHub
// Format: https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/[brand-name].png

export function getGithubLogoUrl(brandName: string): string {
  // Normalize brand name for URL
  // Convert to lowercase and replace spaces with hyphens
  const normalizedName = brandName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, ''); // Remove special characters
  
  // Base URL for the GitHub car logos dataset
  const baseUrl = 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb';
  
  // Special cases mapping
  const specialCases: Record<string, string> = {
    'mercedes-benz': 'mercedes',
    'mercedes': 'mercedes',
    'rolls-royce': 'rolls-royce',
    'alfa-romeo': 'alfa-romeo',
    'aston-martin': 'aston-martin',
    'land-rover': 'land-rover',
    'great-wall': 'great-wall',
    'ssangyong': 'ssangyong',
    'iran-khodro': 'iran-khodro',
    'li-auto': 'li',
    'mg': 'mg',
    'mini': 'mini',
    'gmc': 'gmc',
    'bmw': 'bmw',
    'vw': 'volkswagen',
    'byd': 'byd',
    'jac': 'jac',
    'man': 'man',
    'daf': 'daf',
    'ds': 'ds',
    'seat': 'seat',
  };
  
  // Check if we have a special case mapping
  const mappedName = specialCases[normalizedName] || normalizedName;
  
  return `${baseUrl}/${mappedName}.png`;
}

// Default logo if the brand logo is not found
export const GITHUB_DEFAULT_LOGO = 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/default.png';

// Function to get all possible logo URLs for a brand (with fallbacks)
export function getBrandLogoUrls(brandName: string): string[] {
  const urls: string[] = [];
  
  // Try the exact name first
  urls.push(getGithubLogoUrl(brandName));
  
  // Try without special characters
  const simpleName = brandName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (simpleName !== brandName.toLowerCase().replace(/\s+/g, '-')) {
    urls.push(`https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/${simpleName}.png`);
  }
  
  // Try with just the first word (for compound names)
  const firstWord = brandName.split(/\s+/)[0].toLowerCase();
  if (firstWord !== brandName.toLowerCase()) {
    urls.push(`https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/${firstWord}.png`);
  }
  
  return urls;
}