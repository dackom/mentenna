# Genre CSV to Database Migration

This document outlines the migration process from CSV-based genre storage to database-backed genre management.

## Overview

The genre system has been migrated from a static CSV file (`src/csvs/genres.csv`) to a PostgreSQL database with proper relational structure. This enables dynamic CRUD operations for genre management through the admin interface.

## Database Schema

### New Tables

1. **genre_1** - Primary genres
   - `id` (UUID)
   - `name` (String)
   - `writes` (String) - Category: "Fiction", "Non-fiction", or "Speculative"
   - `order` (Int) - Display order
   - Unique constraint on `[writes, name]`

2. **genre_2** - Sub-genres
   - `id` (UUID)
   - `name` (String)
   - `genre1Id` (UUID) - Foreign key to genre_1
   - `order` (Int) - Display order
   - Unique constraint on `[genre1Id, name]`

### Updated Table

**author_writing_genres** - Author genre associations

- New fields:
  - `genre1Id` (UUID, nullable) - Foreign key to genre_1
  - `genre2Id` (UUID, nullable) - Foreign key to genre_2
- Legacy fields (deprecated, for backwards compatibility):
  - `genre_1` (String)
  - `genre_2` (String)
- Unchanged:
  - `writes` (String)
  - `genre_3` (String) - Free text field

## Migration Steps

### 1. Database Schema Update ✅

```bash
npx prisma db push
```

This creates the new tables and adds foreign key fields to author_writing_genres.

### 2. Import Genres from CSV ✅

```bash
npx tsx prisma/seed-genres.ts
```

This script:

- Parses the CSV file
- Extracts unique genre combinations
- Populates genre_1 and genre_2 tables
- Maintains the hierarchical relationship

Results:

- 86 Genre1 entries created
- 845 Genre2 entries created

### 3. Migrate Existing Author Data

```bash
npx tsx prisma/migrate-author-genres.ts
```

This script:

- Finds all author_writing_genres with legacy string values
- Matches them to the new Genre1/Genre2 records
- Updates genre1Id and genre2Id fields
- Reports any unmatched entries

## API Changes

### Genres API (`/api/genres`)

Updated to query database instead of CSV:

**Before:**

```typescript
GET /api/genres?level=genre_1&writes=Fiction
// Returns: { options: ["Romance", "Science fiction", ...] }
```

**After:**

```typescript
GET /api/genres?level=genre_1&writes=Fiction
// Returns: { options: [{ id: "uuid", name: "Romance" }, ...] }

GET /api/genres?level=genre_2&genre1Id=<uuid>
// Returns: { options: [{ id: "uuid", name: "Contemporary romance" }, ...] }
```

### New Admin APIs

1. **Genre1 Management**
   - `GET /api/admin/genres/genre1` - List all
   - `GET /api/admin/genres/genre1?writes=Fiction` - Filter by category
   - `POST /api/admin/genres/genre1` - Create
   - `GET /api/admin/genres/genre1/[id]` - Get one
   - `PATCH /api/admin/genres/genre1/[id]` - Update
   - `DELETE /api/admin/genres/genre1/[id]` - Delete

2. **Genre2 Management**
   - `GET /api/admin/genres/genre2?genre1Id=<uuid>` - List by parent
   - `POST /api/admin/genres/genre2` - Create
   - `GET /api/admin/genres/genre2/[id]` - Get one
   - `PATCH /api/admin/genres/genre2/[id]` - Update
   - `DELETE /api/admin/genres/genre2/[id]` - Delete

## UI Changes

### Admin Genre Management Page

New page at `/admin/genres` with:

- Tabs for Fiction, Non-fiction, and Speculative categories
- Hierarchical table showing genres and sub-genres
- Inline add/edit/delete functionality
- Expandable rows to show sub-genres

### Author Form Updates

- Genre selects now use IDs instead of string values
- Added "Manage Genres" button for quick access to genre management
- Dialog component for adding genres without leaving the form
- genre_3 remains a free text input field

## Backwards Compatibility

The system maintains backwards compatibility during transition:

1. Legacy fields (`genre_1`, `genre_2`) are still stored when creating/updating authors
2. Author forms can work with both old string values and new IDs
3. Migration script maps old string values to new IDs

## Future Cleanup

After confirming all data has been migrated:

1. Remove deprecated fields from schema:
   - `author_writing_genres.genre_1`
   - `author_writing_genres.genre_2`

2. Remove legacy CSV parsing code:
   - `src/lib/parse-genres.ts`

3. Archive CSV file:
   - Keep `src/csvs/genres.csv` as historical reference

## Testing Checklist

- [ ] Create new genre1 entry
- [ ] Create new genre2 entry under genre1
- [ ] Edit genre1 name
- [ ] Edit genre2 name
- [ ] Delete genre2 (should not affect genre1)
- [ ] Delete genre1 (should cascade delete genre2s)
- [ ] Create author with new genre selections
- [ ] Edit existing author's genres
- [ ] Verify genre options load correctly in author form
- [ ] Test genre management dialog from author form
- [ ] Verify migrated data displays correctly

## Troubleshooting

### Issue: Genres not appearing in dropdowns

**Solution:** Check browser console for API errors. Verify database connection and that genres were seeded correctly.

### Issue: Migration script reports unmatched genres

**Solution:**

1. Check the warning messages for specific genre names
2. Verify those genres exist in the database
3. If missing, add them through admin UI or directly to database
4. Re-run migration script

### Issue: Author form shows IDs instead of names

**Solution:** Ensure the API response includes the populated genre1 and genre2 objects in the include statement.

## Support

For issues or questions about the migration, contact the development team.
