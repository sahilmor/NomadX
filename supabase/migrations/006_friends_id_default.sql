-- friends.id had no default, so friend request inserts failed with null id
ALTER TABLE friends ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
