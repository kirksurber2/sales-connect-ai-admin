export function generatePrompt(data) {
  const services = (data.services || []).filter(s => s.name);
  const servicesList = services.map((s, i) => `  - Service ${i + 1}: "${s.name}" — ${s.description || 'Short description'}`).join('\n');
  const servicesDetail = services.map((s, i) => `Service ${i + 1}:
  - Name: "${s.name}"
  - Description: ${s.description || '[2-3 sentences]'}
  - Key points: ${s.bullets || '[3-4 bullets]'}`).join('\n\n');

  const testimonials = (data.testimonials || []).filter(t => t.quote);
  const testimonialsText = testimonials.length
    ? testimonials.map((t, i) => `  - Testimonial ${i + 1}: "${t.quote}" — ${t.name}, ${t.location}`).join('\n')
    : '  (Use placeholder text)';

  const additionalPages = [];
  if (data.galleryPage) additionalPages.push(`Gallery Page (\`/gallery\`): Yes\n  - Photo grid with placeholder boxes\n  - Categories: ${data.galleryCategories || '"Before & After", "Completed Projects"'}`);
  if (data.faqPage) additionalPages.push(`FAQ Page (\`/faq\`): Yes\n${(data.faqs || []).filter(f => f.q).map((f, i) => `  - Q${i + 1}: ${f.q}\n    A: ${f.a}`).join('\n')}`);
  if (data.reviewsPage) additionalPages.push('Reviews Page (`/reviews`): Yes\n  - Testimonial cards\n  - Link to Google reviews');
  if (data.financingPage) additionalPages.push('Financing Page (`/financing`): Yes\n  - Brief description of financing options\n  - CTA to apply or call');
  if (data.serviceAreaPage) additionalPages.push(`Service Area Page (\`/service-area\`): Yes\n  - Cities: ${data.serviceAreaCities || '[list cities]'}\n  - Map embed`);

  return `# Client Site Build Prompt

Build this complete Next.js project. Generate every file listed in the file structure. Make all pages fully styled and production-ready. The site should look like a $3,000 custom build, not a template.

---

## INSTRUCTIONS FOR AI

You are an expert Next.js developer building a production-ready static website for a local home services business. Generate a complete, deployable Next.js 14+ project (App Router) with the following specifications. The site must:

- Score 95+ on Google PageSpeed Insights (mobile)
- Be fully responsive (mobile-first)
- Use CSS Modules for styling (no Tailwind, no styled-components)
- Export as static site (\`output: 'export'\` in next.config.mjs) for S3/CloudFront or Amplify hosting
- Include zero client-side JavaScript unless explicitly needed (forms only)
- Have no external font loading that blocks render (use \`next/font\`)
- Include proper meta tags, Open Graph, and structured data (LocalBusiness schema)

---

## CLIENT INFORMATION

\`\`\`
Business Name: ${data.businessName || '[Business Name]'}
Tagline/Slogan: ${data.tagline || '[Tagline]'}
Industry: ${data.industry || '[Industry]'}
Owner Name: ${data.ownerName || '[Owner Name]'}
Phone Number: ${data.phone || '[Phone]'}
Email: ${data.email || '[Email]'}
Address: ${data.address || '[Address]'}
Service Area: ${data.serviceArea || '[Service Area]'}
Years in Business: ${data.yearsInBusiness || '[Years]'}
Google Business Profile URL: ${data.gbpUrl || '[if available]'}
Domain: ${data.domain || '[domain.com]'}
Current Website: ${data.currentWebsite || '[None]'}
\`\`\`

---

## SEO KEYWORDS

\`\`\`
Primary Keywords: ${data.seoKeywords || '[e.g., "roofing houston", "roof repair near me"]'}
Secondary Keywords: ${data.seoSecondary || '[e.g., "storm damage repair", "gutter installation houston"]'}
\`\`\`

---

## STYLE GUIDE

\`\`\`
Primary Color: ${data.primaryColor || '#1e3a5f'}
Secondary Color: ${data.secondaryColor || '#f59e0b'}
Accent Color: ${data.accentColor || '#ffffff'}
Background (dark sections): ${data.bgDark || '#0f172a'}
Background (light sections): ${data.bgLight || '#f8fafc'}
Text Primary: ${data.textPrimary || '#1e293b'}
Text Secondary: ${data.textSecondary || '#64748b'}

Font Family (Headings): ${data.fontHeading || 'Inter'}
Font Family (Body): ${data.fontBody || 'Inter'}
Font Weight (Headings): ${data.fontWeightHeading || '800'}
Font Weight (Body): ${data.fontWeightBody || '400'}

Logo URL: "/logo.png"
Border Radius (cards): ${data.borderRadiusCards || '16px'}
Border Radius (buttons): ${data.borderRadiusButtons || '12px'}
Button Style: ${data.buttonStyle || 'Gradient'}
\`\`\`

---

## PAGES TO BUILD

### Home Page (\`/\`)
\`\`\`
Hero Section:
  - Headline: "${data.heroHeadline || data.businessName || '[Headline]'}"
  - Subheadline: "${data.heroSubheadline || data.tagline || '[Subheadline]'}"
  - CTA Button 1: "${data.ctaButton1 || 'Get a Free Quote'}" → links to /contact
  - CTA Button 2: "${data.ctaButton2 || 'Call Now'}" → tel: link
  - Background: ${data.heroBackground || 'gradient'}

Services Preview:
${servicesList || '  - [Add services]'}

Trust/Social Proof Section:
  - Years in business: "${data.yearsInBusiness || '[X]'}+"
  - Jobs completed: "${data.jobsCompleted || '[X]'}+"
  - Google rating: "${data.googleRating || '5.0 stars'}"
  - Licensed/Insured: Yes
  - Certifications: ${data.certifications || '[Any certifications]'}

Why Choose Us:
${(data.whyChooseUs || []).filter(Boolean).map((p, i) => `  - Point ${i + 1}: "${p}"`).join('\n') || '  - [Add points]'}

Testimonials:
${testimonialsText}

CTA Banner:
  - Text: "${data.ctaBannerText || 'Ready to get started? Call now or book online.'}"
  - Button: "${data.ctaBannerButton || 'Schedule Free Consultation'}"
\`\`\`

### About Page (\`/about\`)
\`\`\`
Company Story: ${data.companyStory || '[2-3 sentences about the business]'}
Mission Statement: ${data.missionStatement || '[optional]'}
Team: ${data.ownerName || '[Owner]'} — ${data.ownerTitle || 'Owner'}
Certifications: ${data.certifications || '[list any]'}
Service Area Description: "${data.serviceAreaDescription || `We serve the ${data.serviceArea || '[area]'} area.`}"
\`\`\`

### Services Page (\`/services\`)
\`\`\`
${servicesDetail || '[Add services]'}

CTA at bottom: "Ready to get started? Contact us for a free estimate."
\`\`\`

### Contact Page (\`/contact\`)
\`\`\`
Form Fields: Name, Phone, Email, Service needed (dropdown), Message
Submit button: "${data.contactSubmitText || 'Request Free Quote'}"
Form Action: "${data.formEndpoint || 'https://api.salesconnectai.com/leads'}"

Display: Phone, Email, Address, Hours: ${data.hours || 'Mon–Fri 7am–6pm, Sat 8am–2pm'}
Google Maps: ${data.googleMapsEmbed || 'PLACEHOLDER'}
\`\`\`

${additionalPages.length ? `### Additional Pages\n\`\`\`\n${additionalPages.join('\n\n')}\n\`\`\`` : ''}

---

## LAYOUT REQUIREMENTS

\`\`\`
Navigation: sticky top, logo left, links center/right, CTA button far right
Nav Links: Home, Services, About, Contact${data.galleryPage ? ', Gallery' : ''}${data.faqPage ? ', FAQ' : ''}
Mobile: hamburger menu
Footer: logo, phone, email, address, service area, copyright, links to pages

Landing Page Layout: any page inside /lp/ uses bare layout (no nav/footer)
\`\`\`

---

## EMBED / INTEGRATION SLOTS

\`\`\`
Sales Connect AI Booking Widget: ${data.scaWidget ? 'Yes' : 'No'}
Google Analytics ID: ${data.gaId || 'PLACEHOLDER'}
Facebook Pixel ID: ${data.fbPixel || 'PLACEHOLDER'}
Google Tag Manager ID: ${data.gtmId || 'PLACEHOLDER'}
Google Maps Embed URL: ${data.googleMapsEmbed || 'PLACEHOLDER'}
\`\`\`

---

## TONE & COPY DIRECTION

\`\`\`
Voice: ${data.voice || 'Professional but approachable. Like a trusted neighbor who happens to be great at what they do.'}
Avoid: ${data.avoid || 'Generic phrases, corporate speak, overly salesy language'}
Emphasize: ${data.emphasize || 'Speed, reliability, local trust, expertise'}
CTA Style: ${data.ctaStyle || 'Direct and action-oriented'}
\`\`\`

---

## TECHNICAL REQUIREMENTS

\`\`\`
Framework: Next.js 14+ (App Router)
Styling: CSS Modules
Output: Static export (next.config.mjs → output: 'export')
Font Loading: next/font/google
Icons: react-icons (fi set)
Structured Data: LocalBusiness JSON-LD on every page
Sitemap: auto-generated via app/sitemap.js
Robots.txt: in /public
Meta Tags: unique title + description per page
Open Graph: per page
Canonical URLs: per page
\`\`\`
`;
}
