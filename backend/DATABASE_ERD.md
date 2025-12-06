# Database Entity Relationship Diagram (ERD)

## Overview
This document describes the database schema for the Tosol property listing application.

## Tables

### Core Tables

#### 1. t_user (Users)
**Primary Key:** `uid` (SERIAL)

| Column | Type | Description |
|--------|------|-------------|
| uid | SERIAL | Primary key, auto-increment |
| uname | VARCHAR | Username/Email (unique) |
| fname | VARCHAR | First name |
| lname | VARCHAR | Last name |
| upassword | VARCHAR | Password (hashed) |
| phone | VARCHAR(20) | Phone number (optional) |
| isverified | BOOLEAN | Email verification status |
| isbanned | BOOLEAN | Account ban status |
| createddate | TIMESTAMP | Account creation date |
| lastlogin | TIMESTAMP | Last login date |
| userrole | INTEGER | User role (2 = regular user) |

**Relationships:**
- One-to-Many with `t_zar` (users can post multiple properties)
- One-to-Many with `t_token` (users can have multiple tokens)
- One-to-Many with `t_zar_comment` (users can post multiple comments)

---

#### 2. t_zar (Properties/Listings)
**Primary Key:** `zid` (SERIAL)

| Column | Type | Description |
|--------|------|-------------|
| zid | SERIAL | Primary key, auto-increment |
| uid | INTEGER | Foreign key to t_user |
| z_title | VARCHAR | Property title |
| z_type | INTEGER | Foreign key to t_turul (property type) |
| z_status | INTEGER | Foreign key to t_tuluv (property status) |
| z_hot | INTEGER | Foreign key to t_hot (city) |
| z_duureg | INTEGER | Foreign key to t_duureg (district) |
| z_hiits | INTEGER | Foreign key to t_hiits (construction type) |
| z_price | DECIMAL | Property price |
| z_address | VARCHAR | Property address |
| z_rooms | INTEGER | Number of rooms |
| z_bathroom | INTEGER | Number of bathrooms |
| z_balcony | INTEGER | Number of balconies |
| z_m2 | DECIMAL | Area in square meters |
| z_floor | INTEGER | Floor number |
| z_description | TEXT | Property description |
| z_isactive | BOOLEAN | Active status |
| z_createddate | TIMESTAMP | Creation date |

**Relationships:**
- Many-to-One with `t_user` (each property belongs to one user)
- Many-to-One with `t_turul` (property type)
- Many-to-One with `t_tuluv` (property status)
- Many-to-One with `t_hot` (city)
- Many-to-One with `t_duureg` (district)
- Many-to-One with `t_hiits` (construction type)
- One-to-Many with `t_zar_zurag` (properties can have multiple images)
- One-to-Many with `t_zar_comment` (properties can have multiple comments)

---

#### 3. t_zar_zurag (Property Images)
**Primary Key:** `zid` (SERIAL)

| Column | Type | Description |
|--------|------|-------------|
| zid | SERIAL | Primary key, auto-increment |
| zarid | INTEGER | Foreign key to t_zar |
| zurag | TEXT | Image data (base64 or URL) |

**Relationships:**
- Many-to-One with `t_zar` (each image belongs to one property)

---

#### 4. t_zar_comment (Property Comments)
**Primary Key:** `comment_id` (SERIAL)

| Column | Type | Description |
|--------|------|-------------|
| comment_id | SERIAL | Primary key, auto-increment |
| zarid | INTEGER | Foreign key to t_zar |
| uid | INTEGER | Foreign key to t_user |
| comment_text | TEXT | Comment content |
| createddate | TIMESTAMP | Comment creation date |

**Relationships:**
- Many-to-One with `t_zar` (each comment belongs to one property)
- Many-to-One with `t_user` (each comment belongs to one user)

---

#### 5. t_token (Authentication Tokens)
**Primary Key:** `tokenid` (SERIAL)

| Column | Type | Description |
|--------|------|-------------|
| tokenid | SERIAL | Primary key, auto-increment |
| uid | INTEGER | Foreign key to t_user |
| token | VARCHAR | Token string |
| tokentype | VARCHAR | Token type (register, forgot, etc.) |
| tokenenddate | TIMESTAMP | Token expiration date |
| createddate | TIMESTAMP | Token creation date |

**Relationships:**
- Many-to-One with `t_user` (each token belongs to one user)

---

### Lookup Tables

#### 6. t_turul (Property Types)
**Primary Key:** `tid` (SERIAL)

| Column | Type | Description |
|--------|------|-------------|
| tid | SERIAL | Primary key |
| tname | VARCHAR | Type name (e.g., "Apartment", "House") |

---

#### 7. t_tuluv (Property Status)
**Primary Key:** `tid` (SERIAL)

| Column | Type | Description |
|--------|------|-------------|
| tid | SERIAL | Primary key |
| tname | VARCHAR | Status name (e.g., "For Sale", "For Rent") |

---

#### 8. t_hot (Cities)
**Primary Key:** `hid` (SERIAL)

| Column | Type | Description |
|--------|------|-------------|
| hid | SERIAL | Primary key |
| hname | VARCHAR | City name |

---

#### 9. t_duureg (Districts)
**Primary Key:** `did` (SERIAL)

| Column | Type | Description |
|--------|------|-------------|
| did | SERIAL | Primary key |
| dname | VARCHAR | District name |

---

#### 10. t_hiits (Construction Types)
**Primary Key:** `h_id` (SERIAL)

| Column | Type | Description |
|--------|------|-------------|
| h_id | SERIAL | Primary key |
| h_name | VARCHAR | Construction type name |

---

## Entity Relationship Diagram (Text Format)

```
┌─────────────┐
│   t_user    │
│─────────────│
│ uid (PK)    │
│ uname       │
│ fname       │
│ lname       │
│ upassword   │
│ phone       │
│ isverified  │
│ isbanned    │
│ createddate │
│ lastlogin   │
│ userrole    │
└──────┬──────┘
       │
       │ 1
       │
       │ N
       │
┌──────▼──────┐      ┌──────────────┐      ┌──────────────┐
│   t_zar     │      │ t_zar_zurag  │      │t_zar_comment │
│─────────────│      │──────────────│      │──────────────│
│ zid (PK)    │◄─────│ zid (PK)     │      │comment_id(PK)│
│ uid (FK)    │      │ zarid (FK)   │      │ zarid (FK)   │
│ z_title     │      │ zurag        │      │ uid (FK)     │
│ z_type (FK) │      └──────────────┘      │ comment_text │
│ z_status(FK)│                            │ createddate  │
│ z_hot (FK)  │                            └──────────────┘
│ z_duureg(FK)│
│ z_hiits (FK)│
│ z_price     │
│ z_address   │
│ z_rooms     │
│ z_bathroom  │
│ z_balcony   │
│ z_m2        │
│ z_floor     │
│ z_description│
│ z_isactive  │
│ z_createddate│
└──────┬──────┘
       │
       │ N
       │
       │ 1
       │
┌──────▼──────┐      ┌──────────────┐      ┌──────────────┐
│  t_turul   │      │  t_tuluv     │      │   t_hot      │
│────────────│      │──────────────│      │──────────────│
│ tid (PK)   │      │ tid (PK)     │      │ hid (PK)     │
│ tname      │      │ tname        │      │ hname        │
└────────────┘      └──────────────┘      └──────────────┘

┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│  t_duureg   │      │  t_hiits     │      │   t_token    │
│─────────────│      │──────────────│      │──────────────│
│ did (PK)    │      │ h_id (PK)    │      │ tokenid (PK) │
│ dname       │      │ h_name       │      │ uid (FK)     │
└─────────────┘      └──────────────┘      │ token        │
                                           │ tokentype    │
                                           │ tokenenddate │
                                           │ createddate  │
                                           └──────────────┘
```

## Relationships Summary

1. **t_user → t_zar**: One user can post many properties (1:N)
2. **t_user → t_token**: One user can have many tokens (1:N)
3. **t_user → t_zar_comment**: One user can post many comments (1:N)
4. **t_zar → t_zar_zurag**: One property can have many images (1:N)
5. **t_zar → t_zar_comment**: One property can have many comments (1:N)
6. **t_zar → t_turul**: Many properties belong to one type (N:1)
7. **t_zar → t_tuluv**: Many properties belong to one status (N:1)
8. **t_zar → t_hot**: Many properties belong to one city (N:1)
9. **t_zar → t_duureg**: Many properties belong to one district (N:1)
10. **t_zar → t_hiits**: Many properties belong to one construction type (N:1)

## Indexes

- `idx_zar_comment_zarid`: Index on `t_zar_comment.zarid` for faster comment retrieval
- `idx_zar_comment_uid`: Index on `t_zar_comment.uid` for faster user comment queries
- `idx_zar_comment_createddate`: Index on `t_zar_comment.createddate` for sorting

## Notes

- All foreign keys use CASCADE delete to maintain referential integrity
- The `phone` column in `t_user` is optional and may be NULL
- Images in `t_zar_zurag` can be stored as base64 strings or URLs
- Tokens in `t_token` have expiration dates for security
- All timestamps use PostgreSQL TIMESTAMP type

