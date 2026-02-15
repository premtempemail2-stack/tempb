const school1Template = {
  name: "School 1",
  version: "1.0.0",
  description:
    "A playful and vibrant template for schools and educational centers",
  thumbnail:
    "https://static.vecteezy.com/system/resources/previews/024/656/091/non_2x/colorful-playroom-with-toys-and-educational-materials-generated-by-ai-free-photo.jpg",
  category: "education",
  config: {
    pages: [
      {
        id: "p1",
        slug: "index",
        title: "Home | School1",
        seo: {
          description: "Welcome to our school",
        },
        sections: [
          {
            id: "s1",
            type: "school1navbar",
            props: {
              phone: "+000 - 123 - 456789",
              email: "info@school1.com",
              logoText: "KIDS",
              links: [
                { label: "Home", href: "./" },
                { label: "About Us", href: "./about" },
              ],
              ctaText: "Enquire Now",
              ctaLink: "./about",
              socialLinks: {
                facebook: "#",
                twitter: "#",
                linkedin: "#",
                instagram: "#",
              },
            },
          },
          {
            id: "s2",
            type: "school1hero",
            props: {
              headline: "For Your Child's Bright Future",
              subheadline: "Best choice for your your kids",
              mainImage:
                "https://static.vecteezy.com/system/resources/previews/024/656/091/non_2x/colorful-playroom-with-toys-and-educational-materials-generated-by-ai-free-photo.jpg",
              ctaText: "Discover More",
              ctaLink: "./about",
            },
          },
          {
            id: "s3",
            type: "school1stats",
            props: {
              stats: [
                {
                  value: "1000+",
                  label: "Students",
                  image:
                    "https://cdn-icons-png.flaticon.com/512/10294/10294706.png",
                },
                {
                  value: "100+",
                  label: "Classrooms",
                  image:
                    "https://cdn-icons-png.flaticon.com/512/8686/8686118.png",
                },
                {
                  value: "500+",
                  label: "Activities",
                  image:
                    "https://cdn-icons-png.flaticon.com/512/8628/8628052.png",
                },
              ],
              backgroundImage:
                "https://www.transparenttextures.com/patterns/handmade-paper.png",
            },
          },
          {
            id: "s4",
            type: "school1braintraining",
            props: {
              title: "Brain Training Activities",
              description:
                "We provide various activities to sharpen young minds.",
              activities: [
                {
                  title: "Swimming",
                  image:
                    "https://cdn-icons-png.flaticon.com/512/10418/10418446.png",
                  color: "#006080",
                },
                {
                  title: "Building Blocks",
                  image:
                    "https://cdn-icons-png.flaticon.com/512/10134/10134308.png",
                  color: "#fe9c01",
                },
                {
                  title: "Reading",
                  image:
                    "https://cdn-icons-png.flaticon.com/256/10294/10294706.png",
                  color: "#f50057",
                },
              ],
            },
          },
        ],
      },
      {
        id: "p2",
        slug: "about",
        title: "About Us | School1",
        seo: {
          description: "Learn more about our school and values",
        },
        sections: [
          {
            id: "s1",
            type: "school1navbar",
            props: {
              phone: "+000 - 123 - 456789",
              email: "info@school1.com",
              logoText: "KIDS",
              links: [
                { label: "Home", href: "./" },
                { label: "About Us", href: "./about" },
              ],
              ctaText: "Enquire Now",
              ctaLink: "./about",
            },
          },
          {
            id: "s2",
            type: "school1stats",
            props: {
              stats: [
                {
                  value: "20+",
                  label: "Years Excellence",
                  image:
                    "https://cdn-icons-png.flaticon.com/512/10295/10295587.png",
                },
              ],
            },
          },
        ],
      },
    ],
    theme: {
      color: {
        primary: "#e91e63",
        secondary: "#006080",
        accent: "#fe9c01",
        background: "#ffffff",
        text: "#333333",
      },
      font: "Quicksand",
    },
    navigation: [
      { label: "Home", href: "./" },
      { label: "About Us", href: "./about" },
    ],
    footer: {
      copyright: "© 2026 KIDS School. All rights reserved.",
    },
  },
  isActive: true,
};

module.exports = school1Template;
