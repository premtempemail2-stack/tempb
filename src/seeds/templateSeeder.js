require("dotenv").config();
const mongoose = require("mongoose");
const Template = require("../models/Template");

const templates = [
  {
    name: "Daycare Center",
    version: "1.0.0",
    description:
      "A beautiful template for daycare centers and childcare facilities",
    thumbnail: "https://example.com/thumbnails/daycare.jpg",
    category: "education",
    config: {
      pages: [
        {
          id: "p1",
          slug: "index",
          title: "Daycare | Homepage",
          seo: {
            description: "This is the daycare page",
            ogImage: "https://example.com/ogimage.jpg",
          },
          sections: [
            {
              id: "s1",
              type: "Navbar",
              props: {
                logoUrl: "https://example.com/logo.jpg",
                tabs: [
                  { id: "tab1", label: "About US", action: "/about" },
                  { id: "tab2", label: "Contact US", action: "/contact" },
                ],
              },
            },
            {
              id: "s2",
              type: "Hero",
              props: {
                title: "Welcome to daycare center!!",
                subtitle: "Providing quality childcare since 2010",
                cta: "Explore Options",
                ctaLink: "/services",
                backgroundImage: "https://example.com/hero-bg.jpg",
              },
            },
            {
              id: "s3",
              type: "Features",
              props: {
                title: "Our Services",
                items: [
                  {
                    icon: "baby",
                    title: "Infant Care",
                    description: "Ages 0-12 months",
                  },
                  {
                    icon: "child",
                    title: "Toddler Care",
                    description: "Ages 1-3 years",
                  },
                  {
                    icon: "school",
                    title: "Preschool",
                    description: "Ages 3-5 years",
                  },
                ],
              },
            },
            {
              id: "s4",
              type: "Footer",
              props: {
                copyright: "© 2026 Daycare Powered by Stepswatch",
              },
            },
          ],
        },
        {
          id: "p2",
          slug: "about",
          title: "About Us | Daycare",
          seo: {
            description: "Learn more about our daycare center",
          },
          sections: [
            {
              id: "s1",
              type: "Navbar",
              props: {
                logoUrl: "https://example.com/logo.jpg",
                tabs: [
                  { id: "tab1", label: "Home", action: "/" },
                  { id: "tab2", label: "Contact US", action: "/contact" },
                ],
              },
            },
            {
              id: "s2",
              type: "Content",
              props: {
                title: "About Our Daycare",
                content: "We have been serving families for over 15 years...",
              },
            },
          ],
        },
        {
          id: "p3",
          slug: "contact",
          title: "Contact Us | Daycare",
          seo: {
            description: "Get in touch with our daycare center",
          },
          sections: [
            {
              id: "s1",
              type: "Navbar",
              props: {
                logoUrl: "https://example.com/logo.jpg",
                tabs: [
                  { id: "tab1", label: "Home", action: "/" },
                  { id: "tab2", label: "About US", action: "/about" },
                ],
              },
            },
            {
              id: "s2",
              type: "ContactForm",
              props: {
                title: "Get in Touch",
                fields: ["name", "email", "phone", "message"],
                submitLabel: "Send Message",
              },
            },
          ],
        },
        {
          id: "p4",
          slug: "articles",
          title: "Articles | Daycare",
          isDynamic: true,
          dynamicConfig: {
            collectionType: "articles",
            listTemplate: {
              title: "Latest Articles",
              itemsPerPage: 10,
            },
            itemTemplate: {
              sections: [
                { type: "ArticleHeader", props: {} },
                { type: "ArticleContent", props: {} },
                { type: "ArticleFooter", props: {} },
              ],
            },
          },
          sections: [],
        },
      ],
      theme: {
        color: {
          primary: "#000",
          secondary: "#666",
          accent: "#ff6b00",
          background: "#fff",
          text: "#333",
        },
        font: "Inter",
        fontSize: {
          base: "16px",
          heading: "32px",
        },
        fontWeight: {
          normal: 400,
          bold: 700,
        },
      },
      navigation: [
        { label: "Home", href: "/" },
        { label: "About Us", href: "/about" },
        { label: "Contact Us", href: "/contact" },
        { label: "Articles", href: "/articles" },
      ],
      footer: {
        copyright: "© 2026 Daycare Powered by Stepswatch",
        links: [
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms of Service", href: "/terms" },
        ],
      },
    },
    isActive: true,
    changelog: [
      {
        version: "1.0.0",
        date: new Date(),
        changes: [{ type: "added", description: "Initial release", path: "/" }],
      },
    ],
  },
  {
    name: "Restaurant",
    version: "1.0.0",
    description: "Modern template for restaurants and cafes",
    thumbnail: "https://example.com/thumbnails/restaurant.jpg",
    category: "food",
    config: {
      pages: [
        {
          id: "p1",
          slug: "index",
          title: "Restaurant | Home",
          seo: {
            description: "Welcome to our restaurant",
          },
          sections: [
            {
              id: "s1",
              type: "Navbar",
              props: {
                logoUrl: "https://example.com/restaurant-logo.jpg",
                tabs: [
                  { id: "tab1", label: "Menu", action: "/menu" },
                  {
                    id: "tab2",
                    label: "Reservations",
                    action: "/reservations",
                  },
                ],
              },
            },
            {
              id: "s2",
              type: "Hero",
              props: {
                title: "Fine Dining Experience",
                subtitle: "Exquisite cuisine in an elegant atmosphere",
                cta: "View Menu",
                ctaLink: "/menu",
              },
            },
            {
              id: "s3",
              type: "Gallery",
              props: {
                images: [],
                title: "Our Dishes",
              },
            },
          ],
        },
        {
          id: "p2",
          slug: "menu",
          title: "Menu | Restaurant",
          isDynamic: true,
          dynamicConfig: {
            collectionType: "menuItems",
            listTemplate: {
              groupBy: "category",
            },
          },
          sections: [],
        },
      ],
      theme: {
        color: {
          primary: "#1a1a1a",
          secondary: "#8b7355",
          accent: "#d4af37",
          background: "#faf8f5",
          text: "#333",
        },
        font: "Playfair Display",
      },
      navigation: [
        { label: "Home", href: "/" },
        { label: "Menu", href: "/menu" },
        { label: "Reservations", href: "/reservations" },
      ],
      footer: {
        copyright: "© 2026 Restaurant",
      },
    },
    isActive: true,
  },
  {
    name: "Portfolio",
    version: "1.0.0",
    description: "Clean portfolio template for creatives and professionals",
    thumbnail: "https://example.com/thumbnails/portfolio.jpg",
    category: "portfolio",
    config: {
      pages: [
        {
          id: "p1",
          slug: "index",
          title: "Portfolio",
          seo: {
            description: "My professional portfolio",
          },
          sections: [
            {
              id: "s1",
              type: "Navbar",
              props: {
                logoUrl: "",
                tabs: [
                  { id: "tab1", label: "Work", action: "/work" },
                  { id: "tab2", label: "Contact", action: "/contact" },
                ],
              },
            },
            {
              id: "s2",
              type: "Hero",
              props: {
                title: "Hello, I'm [Your Name]",
                subtitle: "Creative professional specializing in design",
                cta: "View My Work",
              },
            },
            {
              id: "s3",
              type: "ProjectGrid",
              props: {
                title: "Featured Projects",
                columns: 3,
              },
            },
          ],
        },
        {
          id: "p2",
          slug: "work",
          title: "My Work | Portfolio",
          isDynamic: true,
          dynamicConfig: {
            collectionType: "projects",
            listTemplate: {
              layout: "grid",
              columns: 3,
            },
            itemTemplate: {
              sections: [
                { type: "ProjectHero", props: {} },
                { type: "ProjectDetails", props: {} },
                { type: "ProjectGallery", props: {} },
              ],
            },
          },
          sections: [],
        },
      ],
      theme: {
        color: {
          primary: "#0066ff",
          secondary: "#1a1a1a",
          accent: "#00ff88",
          background: "#ffffff",
          text: "#1a1a1a",
        },
        font: "Outfit",
      },
      navigation: [
        { label: "Home", href: "/" },
        { label: "Work", href: "/work" },
        { label: "Contact", href: "/contact" },
      ],
      footer: {
        copyright: "© 2026 Portfolio",
      },
    },
    isActive: true,
  },
];

const seedTemplates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing templates
    await Template.deleteMany({});
    console.log("Cleared existing templates");

    // Insert new templates
    await Template.insertMany(templates);
    console.log(`Seeded ${templates.length} templates`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding templates:", error);
    process.exit(1);
  }
};

seedTemplates();
