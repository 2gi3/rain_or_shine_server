- when prisma.schema is modified the following 2 commands need to run:
  - npx prisma migrate dev -n some_migration_name
  - npx prisma generate

- Open database from terminal
  - psql postgres
  - \l (list databases)
  - \c (connect to a specific database)
  - \dt (show tables)

- Example ```
UPDATE "User"
SET name = 'New Name'
WHERE email = 'user@example.com';
``` 
