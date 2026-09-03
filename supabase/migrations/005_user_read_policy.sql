-- Users must be able to see other profiles for search + friends to work
CREATE POLICY "Authenticated users can view profiles"
ON "User" FOR SELECT
TO authenticated
USING (true);
