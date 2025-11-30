# Database Migration - Add Missing Columns

## Problem
The application schema defines columns that don't exist in the actual database:
- `is_ai_processed` (drawings table)
- `created_by`, `updated_by`, `deleted_at`, `deleted_by`, `uploaded_at` (drawings table)

## Solution
Run the migration script to add these missing columns.

## Steps

### Option 1: Using Neon Console (Recommended)

1. Go to **https://console.neon.tech**
2. Select your project and database
3. Click **SQL Editor**
4. Copy the entire contents of `ADD_MISSING_COLUMNS.sql`
5. Paste into the SQL Editor
6. Click **Execute**
7. You should see a success message and a table showing the columns

### Option 2: Using psql Command Line

```bash
psql $DATABASE_URL < ADD_MISSING_COLUMNS.sql
```

Replace `$DATABASE_URL` with your Neon database connection string.

### Option 3: Using Node.js

```bash
npm install -g @neondatabase/cli
neon sql -c "$(cat ADD_MISSING_COLUMNS.sql)"
```

## Verification

After running the migration, verify the columns were added:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'drawings'
ORDER BY ordinal_position;
```

You should see these columns:
- `is_ai_processed` (boolean, default: false)
- `created_by` (character varying)
- `updated_by` (character varying)
- `deleted_at` (timestamp without time zone)
- `deleted_by` (character varying)
- `uploaded_at` (timestamp without time zone, default: NOW())

## After Migration

1. Restart your development server: `npm run dev`
2. Try uploading an image again
3. It should now work! ✅

## Rollback (if needed)

If you need to undo this migration:

```sql
ALTER TABLE drawings DROP COLUMN IF EXISTS is_ai_processed;
ALTER TABLE drawings DROP COLUMN IF EXISTS created_by;
ALTER TABLE drawings DROP COLUMN IF EXISTS updated_by;
ALTER TABLE drawings DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE drawings DROP COLUMN IF EXISTS deleted_by;
ALTER TABLE drawings DROP COLUMN IF EXISTS uploaded_at;
```

## Questions?

If you encounter any issues:
1. Check that you're connected to the correct database
2. Verify the connection string is correct
3. Ensure you have write permissions on the database
4. Check the error message for specific details
