# Webbuilder Backend API

A Node.js/Express backend for a website builder application with template management, site customization, and custom domain support.

## Features

- **User Authentication**: JWT-based authentication with register/login
- **Template Management**: Versioned templates with changelog tracking
- **Site Builder**: Clone templates, customize with draft/preview workflow
- **Publishing**: Separate draft and published content states
- **Dynamic Pages**: Support for articles, products, and other dynamic content
- **Template Versioning**: Upgrade detection with migration support
- **Custom Domains**: Domain verification via DNS TXT records

## Quick Start

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Seed sample templates
npm run seed

# Start development server
npm run dev
```

## API Endpoints

### Authentication

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Register new user |
| POST   | `/api/auth/login`    | Login and get JWT |
| GET    | `/api/auth/me`       | Get current user  |

### Templates

| Method | Endpoint                      | Description          |
| ------ | ----------------------------- | -------------------- |
| GET    | `/api/templates`              | List all templates   |
| GET    | `/api/templates/:id`          | Get template details |
| GET    | `/api/templates/:id/versions` | Get version history  |

### Sites

| Method | Endpoint                           | Description                   |
| ------ | ---------------------------------- | ----------------------------- |
| GET    | `/api/sites`                       | List user's sites             |
| POST   | `/api/sites`                       | Clone template to create site |
| GET    | `/api/sites/:siteId`               | Get site details              |
| PUT    | `/api/sites/:siteId/draft`         | Update draft content          |
| GET    | `/api/sites/:siteId/preview`       | Get draft content             |
| POST   | `/api/sites/:siteId/publish`       | Publish site                  |
| GET    | `/api/sites/:siteId/check-updates` | Check for template updates    |
| POST   | `/api/sites/:siteId/apply-update`  | Apply template update         |

### Domains

| Method | Endpoint                  | Description             |
| ------ | ------------------------- | ----------------------- |
| GET    | `/api/domains`            | List user's domains     |
| POST   | `/api/domains`            | Add domain to site      |
| POST   | `/api/domains/:id/verify` | Verify domain ownership |
| DELETE | `/api/domains/:id`        | Remove domain           |

### Public (for rendering engine)

| Method | Endpoint                | Description           |
| ------ | ----------------------- | --------------------- |
| GET    | `/public/sites/:siteId` | Get published content |

## Project Structure

```
src/
├── index.js              # Express server entry
├── config/
│   └── db.js             # MongoDB connection
├── models/
│   ├── User.js           # User model
│   ├── Template.js       # Master templates
│   ├── UserSite.js       # User's cloned sites
│   └── Domain.js         # Custom domains
├── controllers/
│   ├── authController.js
│   ├── templateController.js
│   ├── siteController.js
│   └── domainController.js
├── routes/
│   ├── auth.js
│   ├── templates.js
│   ├── sites.js
│   ├── domains.js
│   └── public.js
├── middleware/
│   ├── auth.js           # JWT verification
│   ├── errorHandler.js   # Global error handler
│   └── validate.js       # Request validation
├── utils/
│   ├── generateSiteId.js
│   └── templateMigration.js
└── seeds/
    └── templateSeeder.js
```

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/webbuilder
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
BUILDER_DOMAIN=builder.com
```

## URL Structure

- **Preview**: `builder.com/sites/:siteId`
- **Published**: `:siteId.builder.com` (requires infrastructure setup)
- **Custom Domain**: `your-domain.com` (after DNS verification)

## License

ISC
