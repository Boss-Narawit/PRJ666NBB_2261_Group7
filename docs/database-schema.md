# ReDrobe — Database Schema Documentation

**Database:** MongoDB Atlas  
**ODM:** Mongoose 9  
**Last updated:** 2026-05-16

---

## Table of Contents

1. [Overview](#1-overview)
2. [Collection Summary](#2-collection-summary)
3. [Relationship Diagram](#3-relationship-diagram)
4. [Design Decisions](#4-design-decisions)
5. [Collections](#5-collections)
   - [User](#51-user)
   - [Clothing](#52-clothing)
   - [Outfit](#53-outfit)
   - [WearLog](#54-wearlog)
   - [ThoughtfulPurchase](#55-thoughtfulpurchase)
   - [SimilarityCheck](#56-similaritycheck)
   - [Partner](#57-partner)
   - [Export](#58-export)
   - [Notification](#59-notification)
6. [Index Reference](#6-index-reference)
7. [Business Rules Enforced by Schema](#7-business-rules-enforced-by-schema)
8. [Common Query Patterns](#8-common-query-patterns)

---

## 1. Overview

ReDrobe is a digital wardrobe management platform. The database stores everything needed for users to catalog clothing, track how often they wear items, plan outfits, think carefully before new purchases, and export unused items to resale or donation partners.

The schema uses **9 collections**. Where relationships are bounded and small (outfits, wear logs), items are **embedded** as sub-documents — the MongoDB-idiomatic approach. Where results are unbounded or require unique constraints (similarity checks), a **separate collection** is used.

---

## 2. Collection Summary

| Collection                                   | MongoDB Name          | Description                             | Approx. Documents       |
| -------------------------------------------- | --------------------- | --------------------------------------- | ----------------------- |
| [User](#51-user)                             | `users`               | Accounts, auth, preferences             | One per registered user |
| [Clothing](#52-clothing)                     | `clothings`           | Wardrobe items with analytics           | Many per user           |
| [Outfit](#53-outfit)                         | `outfits`             | Saved outfit combinations               | Many per user           |
| [WearLog](#54-wearlog)                       | `wearlogs`            | Daily wear record                       | One per user per day    |
| [ThoughtfulPurchase](#55-thoughtfulpurchase) | `thoughtfulpurchases` | Impulse-purchase cooling-off holds      | Many per user           |
| [SimilarityCheck](#56-similaritycheck)       | `similaritychecks`    | AI similarity results for a purchase    | Many per purchase       |
| [Partner](#57-partner)                       | `partners`            | Resale / donation platform integrations | Admin-managed           |
| [Export](#58-export)                         | `exports`             | Clothing export / listing records       | Many per user           |
| [Notification](#59-notification)             | `notifications`       | In-app notifications to users           | Many per user           |

---

## 3. Relationship Diagram

```
User
 ├──< Clothing
 │       ├── analytics (embedded sub-doc)
 │       └──< SimilarityCheck >── ThoughtfulPurchase ──< User
 │
 ├──< Outfit
 │       └── clothingItems: [Clothing] (embedded refs)
 │
 ├──< WearLog
 │       └── clothingWorn: [{ Clothing, Outfit? }] (embedded refs)
 │
 ├──< ThoughtfulPurchase
 ├──< Export ──> Partner
 └──< Notification
```

**Reading the diagram:**

- `──<` means "one-to-many" (one User has many Clothings)
- `>──` means "many-to-one" (many Exports point to one Partner)
- `[...]` means an embedded array of references

---

## 4. Design Decisions

### Embedding vs. Referencing

| Relationship                            | Approach                            | Reason                                                                                                                          |
| --------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Outfit → Clothing items                 | **Embedded** `[ObjectId]`           | Outfits have 3–15 items (bounded). Accessed together. Multikey index supports reverse lookup.                                   |
| WearLog → Items worn                    | **Embedded** `[{itemId, outfitId}]` | A day's log has 2–10 items (bounded). Multikey index supports per-item frequency queries.                                       |
| Clothing → Analytics                    | **Embedded** sub-doc                | A 1:1 relationship. Keeping it inside Clothing avoids a second round-trip on every wardrobe read.                               |
| ThoughtfulPurchase → Similarity results | **Separate collection**             | Unbounded growth (can check against hundreds of items). Needs a unique compound constraint and per-result `alertSent` tracking. |

### Date Storage

All dates are stored as native JavaScript `Date` objects (BSON `Date` type), **not strings**. This is required for MongoDB range queries (`$gte`, `$lte`) used in analytics and notification scheduling.

> ⚠️ `WearLog.logDate` is stored as **midnight UTC** (e.g., `2025-05-16T00:00:00.000Z`). When creating a log, always normalize the date to midnight UTC in the service layer before saving.

---

## 5. Collections

---

### 5.1 User

**File:** `backend/src/models/User.js`  
**MongoDB collection:** `users`

Stores account credentials, role, notification preferences, and personalization settings.

#### Fields

| Field                                    | Type     | Required | Default  | Description                                                                                     |
| ---------------------------------------- | -------- | -------- | -------- | ----------------------------------------------------------------------------------------------- |
| `_id`                                    | ObjectId | Auto     | —        | Unique document ID (MongoDB)                                                                    |
| `name`                                   | String   | ✅       | —        | Full display name                                                                               |
| `email`                                  | String   | ✅       | —        | Unique, lowercased. Used for login                                                              |
| `password`                               | String   | ✅       | —        | bcrypt hash. **Never store plaintext**                                                          |
| `role`                                   | String   | —        | `'user'` | `'user'` or `'admin'`. Admins can manage Partners                                               |
| `avatar`                                 | String   | —        | —        | URL to profile picture                                                                          |
| `notificationEnabled`                    | Boolean  | —        | `true`   | Master switch for all notifications                                                             |
| `notificationSlots`                      | [String] | —        | `[]`     | Scheduled times for notifications (e.g. `["09:00", "18:00"]`). Max 3, enforced in service layer |
| `scheduledDeletionAt`                    | Date     | —        | —        | Set when user requests account deletion. A background job wipes the account on this date        |
| `preferences.favoriteColors`             | [String] | —        | `[]`     | Used to personalize outfit suggestions                                                          |
| `preferences.favoriteCategories`         | [String] | —        | `[]`     | Used to personalize outfit suggestions                                                          |
| `preferences.forgottenItemThresholdDays` | Number   | —        | `30`     | Days without wearing before an item is considered "forgotten". Min: 7                           |
| `createdAt`                              | Date     | Auto     | —        | Managed by Mongoose `timestamps`                                                                |
| `updatedAt`                              | Date     | Auto     | —        | Managed by Mongoose `timestamps`                                                                |

#### Indexes

| Index   | Type   | Purpose                                        |
| ------- | ------ | ---------------------------------------------- |
| `email` | Unique | Fast login lookup; prevents duplicate accounts |

#### Example Document

```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
  "name": "Jane Doe",
  "email": "jane@redrobe.com",
  "password": "$2a$10$...",
  "role": "user",
  "notificationEnabled": true,
  "notificationSlots": ["09:00", "18:00"],
  "preferences": {
    "favoriteColors": ["black", "white", "navy"],
    "favoriteCategories": ["tops", "dresses"],
    "forgottenItemThresholdDays": 45
  },
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-05-01T08:30:00.000Z"
}
```

---

### 5.2 Clothing

**File:** `backend/src/models/Clothing.js`  
**MongoDB collection:** `clothings`

The core of the wardrobe catalog. Each document represents one physical clothing item owned by a user. Wear analytics are stored as an embedded `analytics` sub-document.

#### Fields

| Field                      | Type          | Required | Default       | Description                                                                                     |
| -------------------------- | ------------- | -------- | ------------- | ----------------------------------------------------------------------------------------------- |
| `_id`                      | ObjectId      | Auto     | —             | Unique document ID                                                                              |
| `userId`                   | ObjectId      | ✅       | —             | Reference to `User` who owns this item                                                          |
| `name`                     | String        | ✅       | —             | Item name (e.g. `"Black Slim Jeans"`)                                                           |
| `brand`                    | String        | ✅       | —             | Brand name (e.g. `"Levi's"`)                                                                    |
| `category`                 | String (enum) | ✅       | —             | See valid values below                                                                          |
| `colors`                   | [String]      | ✅       | —             | Array of color labels (e.g. `["black", "white"]`)                                               |
| `size`                     | String        | ✅       | —             | Size label (e.g. `"M"`, `"28"`, `"7"`)                                                          |
| `imageUrl`                 | String        | ✅       | —             | URL to the item's photo                                                                         |
| `condition`                | String (enum) | ✅       | —             | Physical condition. See valid values below                                                      |
| `status`                   | String (enum) | —        | `'Available'` | Wardrobe status. See valid values below                                                         |
| `purchasePrice`            | Number        | —        | —             | Original purchase price                                                                         |
| `purchaseDate`             | Date          | —        | —             | Date the item was purchased                                                                     |
| `tags`                     | [String]      | —        | `[]`          | Free-text labels (e.g. `["summer", "work", "vintage"]`)                                         |
| `aiEmbedding`              | [Number]      | —        | `[]`          | 512-dimensional vector from the `fashion-clip` AI service. Used for similarity matching         |
| `notes`                    | String        | —        | —             | Free-text notes from the user                                                                   |
| `analytics.wearCount`      | Number        | —        | `0`           | Total times this item has been worn. Incremented by the service layer when a WearLog is created |
| `analytics.lastWornAt`     | Date          | —        | —             | Date of most recent wear                                                                        |
| `analytics.lastNotifiedAt` | Date          | —        | —             | Date a "forgotten item" notification was last sent. Prevents repeated notifications             |
| `createdAt`                | Date          | Auto     | —             | Managed by Mongoose `timestamps`                                                                |
| `updatedAt`                | Date          | Auto     | —             | Managed by Mongoose `timestamps`                                                                |

#### Enum Values

| Field       | Valid Values                                                                     |
| ----------- | -------------------------------------------------------------------------------- |
| `category`  | `tops` · `bottoms` · `dresses` · `outerwear` · `shoes` · `accessories` · `other` |
| `condition` | `Excellent` · `Good` · `Fair` · `Damaged`                                        |
| `status`    | `Available` · `Archived`                                                         |

> **Note:** Items with `condition: 'Damaged'` cannot be sent to resale partners (BR21). Items with `status: 'Archived'` are excluded from outfit suggestions and similarity checks (BR23).

#### Indexes

| Index                          | Type     | Purpose                                                               |
| ------------------------------ | -------- | --------------------------------------------------------------------- |
| `userId`                       | Single   | Fetch all items for a user                                            |
| `userId + category`            | Compound | Filter by category within a user's wardrobe                           |
| `userId + status + lastWornAt` | Compound | Forgotten items job — prefix covers `{userId,status}` too (BR11/BR13) |

#### Example Document

```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d0e2",
  "userId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "name": "Black Slim Jeans",
  "brand": "Levi's",
  "category": "bottoms",
  "colors": ["black"],
  "size": "28",
  "imageUrl": "https://storage.redrobe.com/items/black-jeans.jpg",
  "condition": "Good",
  "status": "Available",
  "purchasePrice": 79.0,
  "purchaseDate": "2023-11-15T00:00:00.000Z",
  "tags": ["casual", "versatile"],
  "aiEmbedding": [0.12, -0.45, 0.78, "..."],
  "notes": "Goes with everything.",
  "analytics": {
    "wearCount": 20,
    "lastWornAt": "2025-05-10T00:00:00.000Z",
    "lastNotifiedAt": null
  },
  "createdAt": "2023-11-16T09:00:00.000Z",
  "updatedAt": "2025-05-10T20:00:00.000Z"
}
```

---

### 5.3 Outfit

**File:** `backend/src/models/Outfit.js`  
**MongoDB collection:** `outfits`

A saved combination of clothing items. The `clothingItems` array stores ObjectId references to Clothing documents — this is an embedded array (not a junction collection) because outfits have a bounded number of items and are always accessed as a whole.

#### Fields

| Field           | Type          | Required | Default | Description                                         |
| --------------- | ------------- | -------- | ------- | --------------------------------------------------- |
| `_id`           | ObjectId      | Auto     | —       | Unique document ID                                  |
| `userId`        | ObjectId      | ✅       | —       | Reference to the owner `User`                       |
| `name`          | String        | ✅       | —       | Outfit name (e.g. `"Work Chic"`)                    |
| `clothingItems` | [ObjectId]    | —        | `[]`    | References to `Clothing` documents in this outfit   |
| `occasion`      | String        | —        | —       | Context (e.g. `"work"`, `"date night"`, `"casual"`) |
| `season`        | String (enum) | —        | —       | `spring` · `summer` · `fall` · `winter` · `all`     |
| `rating`        | Number        | —        | —       | User's satisfaction rating. Range: 1–5              |
| `imageUrl`      | String        | —        | —       | Optional outfit photo URL                           |
| `notes`         | String        | —        | —       | Free-text notes                                     |
| `createdAt`     | Date          | Auto     | —       | Managed by Mongoose `timestamps`                    |
| `updatedAt`     | Date          | Auto     | —       | Managed by Mongoose `timestamps`                    |

#### Indexes

| Index           | Type     | Purpose                                                                                           |
| --------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `userId`        | Single   | Fetch all outfits for a user                                                                      |
| `clothingItems` | Multikey | Reverse lookup: "which outfits contain item X?" — used when archiving or deleting a clothing item |

#### Example Document

```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d0e5",
  "userId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "name": "Work Chic",
  "clothingItems": [
    "64a1b2c3d4e5f6a7b8c9d0e7",
    "64a1b2c3d4e5f6a7b8c9d0e3",
    "64a1b2c3d4e5f6a7b8c9d0e8"
  ],
  "occasion": "work",
  "season": "fall",
  "rating": 5,
  "imageUrl": null,
  "notes": "My go-to for important meetings.",
  "createdAt": "2025-02-01T10:00:00.000Z",
  "updatedAt": "2025-02-01T10:00:00.000Z"
}
```

---

### 5.4 WearLog

**File:** `backend/src/models/WearLog.js`  
**MongoDB collection:** `wearlogs`

Records what a user wore on a specific day. One document per user per day (enforced by unique index). The `clothingWorn` array embeds references to each item worn, plus which outfit it was part of (if any).

#### Fields

| Field                     | Type     | Required | Default | Description                                                                   |
| ------------------------- | -------- | -------- | ------- | ----------------------------------------------------------------------------- |
| `_id`                     | ObjectId | Auto     | —       | Unique document ID                                                            |
| `userId`                  | ObjectId | ✅       | —       | Reference to `User`                                                           |
| `logDate`                 | Date     | ✅       | —       | The day of wear, stored as **midnight UTC** (e.g. `2025-05-16T00:00:00.000Z`) |
| `clothingWorn`            | [Object] | —        | `[]`    | Array of items worn. See sub-fields below                                     |
| `clothingWorn[].itemId`   | ObjectId | ✅       | —       | Reference to the `Clothing` item worn                                         |
| `clothingWorn[].outfitId` | ObjectId | —        | —       | Reference to the `Outfit` this item was part of, if any                       |
| `occasion`                | String   | —        | —       | Context for the day (e.g. `"work"`, `"gym"`, `"date night"`)                  |
| `notes`                   | String   | —        | —       | Free-text notes about the day                                                 |
| `createdAt`               | Date     | Auto     | —       | Managed by Mongoose `timestamps`                                              |

> `updatedAt` is intentionally **disabled** — wear logs are immutable records once created.

#### Indexes

| Index                 | Type            | Purpose                                                                     |
| --------------------- | --------------- | --------------------------------------------------------------------------- |
| `userId + logDate`    | Unique compound | Enforces one log per user per day (BR8)                                     |
| `clothingWorn.itemId` | Multikey        | Counts how many times item X was worn; powers `analytics.wearCount` updates |

#### Example Document

```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d0f1",
  "userId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "logDate": "2025-05-15T00:00:00.000Z",
  "clothingWorn": [
    {
      "itemId": "64a1b2c3d4e5f6a7b8c9d0e7",
      "outfitId": "64a1b2c3d4e5f6a7b8c9d0e5"
    },
    {
      "itemId": "64a1b2c3d4e5f6a7b8c9d0e3",
      "outfitId": "64a1b2c3d4e5f6a7b8c9d0e5"
    }
  ],
  "occasion": "work",
  "notes": "Big presentation day.",
  "createdAt": "2025-05-15T22:30:00.000Z"
}
```

---

### 5.5 ThoughtfulPurchase

**File:** `backend/src/models/ThoughtfulPurchase.js`  
**MongoDB collection:** `thoughtfulpurchases`

Implements the "cooling-off" feature. When a user wants to buy something new, they submit it here with a cooldown timer. They cannot immediately buy — they must wait until `cooldownEndsAt`. This gives time for the AI to check if they already own something similar and for the user to reconsider.

#### Fields

| Field            | Type          | Required | Default     | Description                                                                                              |
| ---------------- | ------------- | -------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `_id`            | ObjectId      | Auto     | —           | Unique document ID                                                                                       |
| `userId`         | ObjectId      | ✅       | —           | Reference to `User`                                                                                      |
| `itemName`       | String        | ✅       | —           | Name of the item they want to buy                                                                        |
| `description`    | String        | —        | —           | Why they want it / description                                                                           |
| `imageUrl`       | String        | —        | —           | Photo of the item. Required for AI similarity check                                                      |
| `estimatedPrice` | Number        | —        | —           | Expected purchase price                                                                                  |
| `sourceUrl`      | String        | —        | —           | Link to where they saw it (e.g. online store URL)                                                        |
| `cooldownEndsAt` | Date          | ✅       | —           | When the cooling-off period ends. Must be ≥ 24 hours from `createdAt` (BR14). Validated in service layer |
| `status`         | String (enum) | —        | `'pending'` | `pending` → user is in cooldown · `approved` → they decided to buy · `rejected` → they decided not to    |
| `createdAt`      | Date          | Auto     | —           | Managed by Mongoose `timestamps`                                                                         |
| `updatedAt`      | Date          | Auto     | —           | Managed by Mongoose `timestamps`                                                                         |

#### Indexes

| Index             | Type     | Purpose                                               |
| ----------------- | -------- | ----------------------------------------------------- |
| `userId + status` | Compound | Fetch active (`pending`) holds for a user efficiently |

#### Example Document

```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d1a0",
  "userId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "itemName": "Camel Wool Coat",
  "description": "Long camel coat for winter. Saw it at Zara.",
  "imageUrl": "https://storage.redrobe.com/purchases/camel-coat.jpg",
  "estimatedPrice": 250.0,
  "sourceUrl": "https://www.zara.com/camel-coat",
  "cooldownEndsAt": "2025-05-18T10:00:00.000Z",
  "status": "pending",
  "createdAt": "2025-05-16T10:00:00.000Z",
  "updatedAt": "2025-05-16T10:00:00.000Z"
}
```

---

### 5.6 SimilarityCheck

**File:** `backend/src/models/SimilarityCheck.js`  
**MongoDB collection:** `similaritychecks`

Stores the AI similarity score between a ThoughtfulPurchase image and each of the user's existing clothing items. One document per (purchase, clothing item) pair.

This is kept as a **separate collection** (not embedded in ThoughtfulPurchase) because:

- The number of results is unbounded — a user could have hundreds of clothing items to compare against
- A unique compound index prevents the same pair from being checked more than once (BR18)
- `alertSent` must be tracked and updated independently per result

#### Fields

| Field        | Type     | Required | Default | Description                                                                                                               |
| ------------ | -------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `_id`        | ObjectId | Auto     | —       | Unique document ID                                                                                                        |
| `purchaseId` | ObjectId | ✅       | —       | Reference to `ThoughtfulPurchase`                                                                                         |
| `clothingId` | ObjectId | ✅       | —       | Reference to the `Clothing` item being compared                                                                           |
| `score`      | Number   | ✅       | —       | Similarity score from the AI service. Range: `0.0` (no match) to `1.0` (identical). Scores ≥ 0.70 trigger an alert (BR16) |
| `alertSent`  | Boolean  | —        | `false` | Flipped to `true` once a similarity alert notification has been sent for this result. Prevents duplicate notifications    |
| `createdAt`  | Date     | Auto     | —       | Managed by Mongoose `timestamps`                                                                                          |
| `updatedAt`  | Date     | Auto     | —       | Managed by Mongoose `timestamps`                                                                                          |

#### Indexes

| Index                     | Type            | Purpose                                           |
| ------------------------- | --------------- | ------------------------------------------------- |
| `purchaseId + clothingId` | Unique compound | Prevents checking the same pair twice (BR18)      |
| `purchaseId`              | Single          | Fetch all results for a purchase, sorted by score |

#### Example Document

```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d1b0",
  "purchaseId": "64a1b2c3d4e5f6a7b8c9d1a0",
  "clothingId": "64a1b2c3d4e5f6a7b8c9d0e3",
  "score": 0.82,
  "alertSent": true,
  "createdAt": "2025-05-16T10:05:00.000Z",
  "updatedAt": "2025-05-16T10:05:30.000Z"
}
```

---

### 5.7 Partner

**File:** `backend/src/models/Partner.js`  
**MongoDB collection:** `partners`

Represents a third-party platform (resale, donation, upcycling service) that users can send clothing to. Partners are managed by admins only (BR29). Inactive partners are hidden from users (BR30).

#### Fields

| Field         | Type     | Required | Default | Description                                                                            |
| ------------- | -------- | -------- | ------- | -------------------------------------------------------------------------------------- |
| `_id`         | ObjectId | Auto     | —       | Unique document ID                                                                     |
| `name`        | String   | ✅       | —       | Partner name. Must be unique                                                           |
| `type`        | String   | —        | —       | Category of partner (e.g. `"Resale"`, `"Donation"`, `"Tailor"`, `"Upcycle"`)           |
| `website`     | String   | —        | —       | Public-facing website URL                                                              |
| `email`       | String   | —        | —       | Contact email address                                                                  |
| `description` | String   | —        | —       | Short description shown to users                                                       |
| `apiEndpoint` | String   | —        | —       | URL the backend calls when submitting an export to this partner programmatically       |
| `isActive`    | Boolean  | —        | `true`  | When `false`, this partner does not appear in the export options shown to users (BR30) |
| `createdAt`   | Date     | Auto     | —       | Managed by Mongoose `timestamps`                                                       |
| `updatedAt`   | Date     | Auto     | —       | Managed by Mongoose `timestamps`                                                       |

#### Indexes

| Index      | Type   | Purpose                                         |
| ---------- | ------ | ----------------------------------------------- |
| `isActive` | Single | Filter active partners for the export UI (BR30) |

#### Example Document

```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d1c0",
  "name": "ThredUp",
  "type": "Resale",
  "website": "https://www.thredup.com",
  "email": "partners@thredup.com",
  "description": "Online consignment and thrift store. Earn cash or credit for your clothes.",
  "apiEndpoint": "https://api.thredup.com/v1/listings",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

---

### 5.8 Export

**File:** `backend/src/models/Export.js`  
**MongoDB collection:** `exports`

Records a user's decision to export (sell, donate, upcycle, or resell) a clothing item. Captures consent, the checklist completion, and which data fields the user agreed to share with the partner (BR22).

> ⚠️ **Service layer must enforce:** Items with `condition: 'Damaged'` cannot be exported to resale partners (BR21).

#### Fields

| Field                | Type          | Required | Default    | Description                                                                                                             |
| -------------------- | ------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `_id`                | ObjectId      | Auto     | —          | Unique document ID                                                                                                      |
| `userId`             | ObjectId      | ✅       | —          | Reference to `User`                                                                                                     |
| `clothingId`         | ObjectId      | ✅       | —          | Reference to the `Clothing` item being exported                                                                         |
| `partnerId`          | ObjectId      | —        | —          | Reference to `Partner`. Optional — a user may export without a specific platform                                        |
| `type`               | String (enum) | ✅       | —          | `sale` · `donation` · `upcycle` · `resale`                                                                              |
| `price`              | Number        | —        | —          | Listing price. Applicable when `type` is `'sale'` or `'resale'`                                                         |
| `description`        | String        | —        | —          | Listing description shown to potential buyers/recipients                                                                |
| `status`             | String (enum) | —        | `'active'` | Current status. See valid values below                                                                                  |
| `checklistCompleted` | Boolean       | —        | `false`    | Whether the user completed the pre-export checklist (BR17/BR20)                                                         |
| `consent`            | Boolean       | —        | `false`    | Whether the user explicitly consented to share their data with the partner (BR17)                                       |
| `selectedFields`     | [String]      | —        | `[]`       | Which clothing fields the user chose to share (e.g. `["name", "brand", "imageUrl"]`). Enforces data minimisation (BR22) |
| `createdAt`          | Date          | Auto     | —          | Managed by Mongoose `timestamps`                                                                                        |
| `updatedAt`          | Date          | Auto     | —          | Managed by Mongoose `timestamps`                                                                                        |

#### Enum Values

| Field    | Valid Values                               |
| -------- | ------------------------------------------ |
| `type`   | `sale` · `donation` · `upcycle` · `resale` |
| `status` | `active` · `sold` · `donated` · `removed`  |

#### Indexes

| Index    | Type   | Purpose               |
| -------- | ------ | --------------------- |
| `status` | Single | Active listings feed  |
| `userId` | Single | User's export history |

#### Example Document

```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d1d0",
  "userId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "clothingId": "64a1b2c3d4e5f6a7b8c9d0e9",
  "partnerId": "64a1b2c3d4e5f6a7b8c9d1c0",
  "type": "resale",
  "price": 20.0,
  "description": "Gently used denim jacket, no stains.",
  "status": "active",
  "checklistCompleted": true,
  "consent": true,
  "selectedFields": ["name", "brand", "condition", "imageUrl"],
  "createdAt": "2025-05-10T14:00:00.000Z",
  "updatedAt": "2025-05-10T14:00:00.000Z"
}
```

---

### 5.9 Notification

**File:** `backend/src/models/Notification.js`  
**MongoDB collection:** `notifications`

Stores in-app notifications delivered to users. Notifications are created by the service layer in response to system events (e.g. a clothing item not worn for 30+ days, a cooldown period expiring, a high similarity score detected).

> Notifications are **immutable** — there is no `updatedAt` field. The only mutation allowed is flipping `isRead` to `true`.

#### Fields

| Field       | Type          | Required | Default    | Description                                                                                                                                                      |
| ----------- | ------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_id`       | ObjectId      | Auto     | —          | Unique document ID                                                                                                                                               |
| `userId`    | ObjectId      | ✅       | —          | Reference to `User` who receives this notification                                                                                                               |
| `type`      | String (enum) | —        | —          | Category of notification. See valid values below                                                                                                                 |
| `message`   | String        | ✅       | —          | Human-readable notification text shown in the app                                                                                                                |
| `isRead`    | Boolean       | —        | `false`    | Flipped to `true` when the user opens/dismisses the notification                                                                                                 |
| `relatedId` | ObjectId      | —        | —          | Flexible reference to the document that triggered the notification (e.g. a `Clothing` ID for a forgotten item, a `ThoughtfulPurchase` ID for a similarity alert) |
| `createdAt` | Date          | —        | `Date.now` | When the notification was created                                                                                                                                |

#### Notification Types

| Type                | Triggered when                                                                     |
| ------------------- | ---------------------------------------------------------------------------------- |
| `forgotten_item`    | A clothing item hasn't been worn for `preferences.forgottenItemThresholdDays` days |
| `cooldown_reminder` | A ThoughtfulPurchase cooldown period is about to expire                            |
| `similarity_alert`  | A SimilarityCheck score ≥ 0.70 is found (user already owns something similar)      |
| `recap_ready`       | Annual Style Recap has been generated for the user                                 |
| `export_update`     | An export listing status has changed (e.g. item sold)                              |

#### Indexes

| Index                       | Type     | Purpose                               |
| --------------------------- | -------- | ------------------------------------- |
| `userId + isRead`           | Compound | Unread notification count badge       |
| `userId + createdAt` (desc) | Compound | Notification feed sorted newest-first |

#### Example Document

```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d1e0",
  "userId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "type": "similarity_alert",
  "message": "The Camel Wool Coat you want to buy is 82% similar to your Navy Blazer. Do you really need it?",
  "isRead": false,
  "relatedId": "64a1b2c3d4e5f6a7b8c9d1a0",
  "createdAt": "2025-05-16T10:06:00.000Z"
}
```

---

## 6. Index Reference

Complete index list across all collections.

| Collection            | Fields                     | Type            | Reason                                                                |
| --------------------- | -------------------------- | --------------- | --------------------------------------------------------------------- |
| `users`               | `email`                    | Unique          | Login lookup, prevent duplicate accounts                              |
| `clothings`           | `userId`                   | Single          | Fetch user's wardrobe                                                 |
| `clothings`           | `userId, category`         | Compound        | Filter by category                                                    |
| `clothings`           | `userId, status`           | Compound        | Exclude archived items (BR23)                                         |
| `outfits`             | `userId`                   | Single          | Fetch user's outfits                                                  |
| `outfits`             | `clothingItems`            | Multikey        | Reverse lookup: outfits containing item X                             |
| `wearlogs`            | `userId, logDate`          | Unique compound | One log per user per day (BR8)                                        |
| `wearlogs`            | `clothingWorn.itemId`      | Multikey        | Per-item wear frequency                                               |
| `thoughtfulpurchases` | `userId, status`           | Compound        | Fetch pending holds                                                   |
| `similaritychecks`    | `purchaseId, clothingId`   | Unique compound | Prevent duplicate checks (BR18); prefix serves `{purchaseId}` queries |
| `exports`             | `status`                   | Single          | Admin / active listings feed                                          |
| `exports`             | `userId, status`           | Compound        | User's export history filtered by status                              |
| `notifications`       | `userId, isRead`           | Compound        | Unread count badge                                                    |
| `notifications`       | `userId, createdAt` (desc) | Compound        | Notification feed                                                     |
| `partners`            | `isActive`                 | Single          | Active partner filter (BR30)                                          |

---

## 7. Business Rules Enforced by Schema

| Rule                                                                       | Where Enforced                                                      |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **BR4** — Clothing must have name, brand, category, colors, size, imageUrl | `required: true` on those fields in `Clothing`                      |
| **BR7** — Condition must be a valid value                                  | `enum` on `Clothing.condition`                                      |
| **BR8** — One wear log per user per day                                    | Unique compound index `{userId, logDate}` on `WearLog`              |
| **BR9** — Wear count is derived, not user-editable                         | `analytics.wearCount` managed only by service layer                 |
| **BR13** — Re-notify throttle for forgotten items                          | `analytics.lastNotifiedAt` on `Clothing`                            |
| **BR14** — Cooling-off period ≥ 24 hours                                   | `cooldownEndsAt` is required; minimum enforced in service/validator |
| **BR16** — Alert when similarity ≥ 0.70                                    | `SimilarityCheck.alertSent` tracks per-result notification state    |
| **BR17** — Export requires checklist + consent                             | `checklistCompleted` and `consent` fields on `Export`               |
| **BR18** — Similarity check runs once per (purchase, item) pair            | Unique compound index on `SimilarityCheck`                          |
| **BR19** — Only `Available` clothing used in similarity checks             | Enforced in service layer using `status` index on `Clothing`        |
| **BR21** — Damaged items cannot go to resale                               | Enforced in service layer before creating `Export`                  |
| **BR22** — Only user-selected fields shared with partner                   | `selectedFields` array on `Export`                                  |
| **BR23** — Archived items excluded from suggestions                        | `status` enum + index on `Clothing`                                 |
| **BR27** — Max 3 notification slots                                        | Array stored in `User.notificationSlots`; count enforced in service |
| **BR28** — Master notification toggle                                      | `User.notificationEnabled` checked before sending any notification  |
| **BR29** — Only admins manage partners                                     | `User.role` enum; authorization enforced in route middleware        |
| **BR30** — Inactive partners hidden from users                             | `Partner.isActive` field + index                                    |

---

## 8. Common Query Patterns

### Get a user's wardrobe (available items only)

```js
Clothing.find({ userId, status: 'Available' });
```

### Get a user's wardrobe filtered by category

```js
Clothing.find({ userId, category: 'tops', status: 'Available' });
```

### Get all outfits that contain a specific item

```js
Outfit.find({ clothingItems: clothingId });
```

### Check how many times an item was worn in the last 90 days

```js
WearLog.countDocuments({
  'clothingWorn.itemId': clothingId,
  logDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
});
```

### Create a wear log (normalise date to midnight UTC first)

```js
const logDate = new Date();
logDate.setUTCHours(0, 0, 0, 0);

WearLog.create({ userId, logDate, clothingWorn: [...] });
// Will throw duplicate key error if log already exists for that day
```

### Get active (pending) thoughtful purchases for a user

```js
ThoughtfulPurchase.find({ userId, status: 'pending' });
```

### Get similarity results for a purchase sorted by score

```js
SimilarityCheck.find({ purchaseId }).sort({ score: -1 });
```

### Get unread notification count

```js
Notification.countDocuments({ userId, isRead: false });
```

### Mark all notifications as read

```js
Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
```

### Get active export listings

```js
Export.find({ status: 'active' }).populate('clothingId').populate('partnerId');
```
