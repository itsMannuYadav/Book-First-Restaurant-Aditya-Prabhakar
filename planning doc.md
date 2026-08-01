You are a Senior Staff Software Engineer, Product Designer, UI/UX Designer, and Software Architect with 15+ years of experience building production-grade SaaS applications.

Your responsibility is NOT to simply generate code.

Your responsibility is to architect, design, and build a scalable, maintainable, reusable, and production-ready SaaS platform from scratch.

Treat this as a real startup project.

--------------------------------------------------
PROJECT OVERVIEW
--------------------------------------------------

We are building a modern SaaS platform for restaurants.

The goal is simple:

Restaurant owners can create their restaurant profile, manage their digital menu, generate a QR code, and customers can scan the QR code to instantly view the restaurant's digital menu.

This is NOT a food ordering platform.

This is NOT a reservation platform.

This is NOT an online payment platform.

This is a premium Digital Menu SaaS.

Future features like ordering, reservations, analytics, payments, loyalty programs, etc. will come later, so keep the architecture extensible without implementing them now.

--------------------------------------------------
PRIMARY OBJECTIVE
--------------------------------------------------

Build a beautiful, premium-looking SaaS product that feels polished, trustworthy, and modern.

Every page should look like it belongs to a high-end startup product.

The UI should immediately impress restaurant owners.

The customer menu should feel elegant enough that restaurants are proud to share it.

The platform should be responsive, accessible, and extremely fast.

--------------------------------------------------
TARGET USERS
--------------------------------------------------

1. Restaurant Owners

Most owners are not technical.

They want:

• simplicity
• beautiful UI
• minimal clicks
• fast loading
• clear navigation
• mobile-friendly dashboard

The interface should never overwhelm them.

Everything should feel intuitive.

--------------------------------------------------

2. Restaurant Customers

Customers only scan the QR.

No login.

No registration.

No unnecessary popups.

Open QR →

Instant menu.

The browsing experience should feel premium.

--------------------------------------------------
TECH STACK
--------------------------------------------------

Framework

• Next.js (App Router)
• TypeScript

Styling

• Tailwind CSS
• shadcn/ui

Backend

• Firebase

Use:

• Firebase Authentication
• Cloud Firestore
• Firebase Storage
• Firebase Hosting (if appropriate)

Image optimization

• next/image

Deployment

• Vercel

--------------------------------------------------
CODE QUALITY
--------------------------------------------------

Write production-grade code.

The project should look like it was written by an experienced engineering team.

Requirements:

• Clean architecture
• Feature-based folder structure
• Reusable components
• Reusable hooks
• Reusable utilities
• Strong TypeScript typing
• No duplicated code
• SOLID principles where appropriate
• Small components
• Easy to maintain
• Easy to extend

Avoid spaghetti code.

Avoid giant components.

Avoid hardcoded values.

--------------------------------------------------
PROJECT STRUCTURE
--------------------------------------------------

Design a scalable folder structure.

Separate:

• UI components
• Business logic
• Firebase services
• Hooks
• Types
• Constants
• Utilities
• Validation
• Layouts
• Feature modules

The project should remain manageable even if it grows to hundreds of files.

--------------------------------------------------
DESIGN SYSTEM
--------------------------------------------------

Create a proper design system.

Include:

• Typography scale
• Color palette
• Spacing system
• Border radius
• Shadows
• Button variants
• Input styles
• Card system
• Dialogs
• Toasts
• Loading states
• Empty states
• Error states
• Skeleton loaders

Everything should be reusable.

--------------------------------------------------
UX PRINCIPLES
--------------------------------------------------

Every interaction should feel smooth.

Animations should be subtle.

Buttons should have hover and active states.

Loading should never feel abrupt.

Navigation should always be obvious.

Avoid clutter.

Reduce cognitive load.

Make the application enjoyable.

--------------------------------------------------
RESTAURANT DASHBOARD
--------------------------------------------------

The owner dashboard should include:

Dashboard

Restaurant

Categories

Menu Items

Themes

QR Code

Settings

The dashboard should feel like a premium SaaS admin panel.

--------------------------------------------------
PUBLIC MENU
--------------------------------------------------

The public menu is the most important page.

I already have an HTML version of this page that I really like.

I will paste that HTML code after this prompt.

You MUST carefully study its:

• layout
• spacing
• visual hierarchy
• interactions
• typography
• animations
• responsiveness

Recreate that experience in Next.js and React using reusable components.

Do NOT simply copy and paste the HTML.

Instead:

• convert it into reusable React components
• improve the code quality
• improve responsiveness
• improve accessibility
• optimize performance
• keep the overall visual experience nearly identical

Treat the HTML as the visual reference.

--------------------------------------------------
MENU EXPERIENCE
--------------------------------------------------

The menu page should feel premium.

Customers should easily:

• browse categories
• scroll smoothly
• open menu items
• see beautiful food images
• read descriptions
• check prices

Everything should feel polished.


--------------------------------------------------
REFERENCE MENU IMPLEMENTATION (document in the same directory as "menuCard-user frontend")
--------------------------------------------------

I already have a fully designed HTML/CSS/JavaScript version of the public restaurant menu page. 

Immediately after this prompt, I will paste the complete source code for that reference implementation.

This HTML project is ONLY a visual and UX reference.

It is NOT the codebase that should be used in production.

Your task is to carefully analyze the reference implementation and understand its:

• overall layout
• design language
• spacing
• typography
• color usage
• animations
• transitions
• responsiveness
• user interactions
• scrolling behavior
• visual hierarchy
• component arrangement
• overall user experience

Our goal is to recreate an experience that is as close as possible to the reference design while building an entirely new implementation.

IMPORTANT:

DO NOT copy the HTML.

DO NOT copy the CSS.

DO NOT copy the JavaScript.

DO NOT perform a direct conversion.

Instead, completely rewrite the implementation using modern Next.js architecture.

Build everything from scratch using:

• Next.js App Router
• React
• TypeScript
• Tailwind CSS
• shadcn/ui
• Reusable Components

The visual appearance should closely match the reference, but the implementation must follow modern React development practices.

Every section should be broken into reusable components.

Avoid duplicated code.

Use proper component composition.

Use reusable hooks where appropriate.

Keep business logic separate from UI.

Write clean, scalable, maintainable production-ready code.

Improve the implementation wherever possible without changing the overall look and feel.

If there are opportunities to improve:

• responsiveness
• accessibility
• animations
• performance
• maintainability
• component architecture
• loading experience
• mobile usability

then implement those improvements while preserving the same overall design language.

Treat the provided HTML as a design specification—not as source code to migrate.

The final result should look familiar to anyone comparing it with the reference, but the underlying codebase should reflect modern engineering best practices and be fully optimized for a production-grade Next.js application.



--------------------------------------------------
RESPONSIVE DESIGN
--------------------------------------------------

Design mobile first.

Support:

• Mobile
• Tablet
• Laptop
• Desktop

No broken layouts.

--------------------------------------------------
PERFORMANCE
--------------------------------------------------

Aim for excellent Lighthouse scores.

Optimize:

• Images
• Fonts
• Rendering
• Bundle size

Lazy load wherever appropriate.

--------------------------------------------------
ACCESSIBILITY
--------------------------------------------------

Use semantic HTML.

Keyboard navigation.

Proper contrast.

ARIA where needed.

Screen-reader friendly.

--------------------------------------------------
SECURITY
--------------------------------------------------

Implement Firebase Security Rules.

Validate inputs.

Sanitize data.

Protect authenticated routes.

Never trust client-side validation alone.

--------------------------------------------------
SCALABILITY
--------------------------------------------------

Architect the application so future modules can be added easily:

• Ordering
• Payments
• Reservations
• Analytics
• Coupons
• Loyalty
• Reviews

Do NOT implement these now.

Simply keep the architecture ready.

--------------------------------------------------
DEVELOPMENT APPROACH
--------------------------------------------------

Do NOT generate the whole project in one response.

Instead work feature-by-feature.

For every feature:

1. Explain architecture decisions briefly.
2. Generate clean code.
3. Ensure code compiles.
4. Ensure no duplicate logic.
5. Reuse existing components.
6. Follow the established design system.

--------------------------------------------------
IMPORTANT
--------------------------------------------------

Think before writing code.

Always ask:

"Would a senior engineer approve this implementation?"

If the answer is no,

refactor before generating.

Focus on long-term maintainability instead of the fastest implementation.

Build this product as if it will serve thousands of restaurants.

--------------------------------------------------
PLANNING DOC CREATED BY
--------------------------------------------------

Mannu Yadav
www.mannuyadav.com
github.com/MannuYadav
linkedin/in/MannuYadav

- (*Note:* _Update your correct details these are just sample data_)
