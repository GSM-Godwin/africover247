UPDATE "User" u
SET phone = NULL
WHERE phone IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT ON (phone) id
    FROM "User"
    WHERE phone IS NOT NULL
    ORDER BY phone, "createdAt" ASC
  );

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
