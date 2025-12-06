-- Create missing t_zar_comment table for comments functionality
-- This table stores comments on property listings

CREATE TABLE IF NOT EXISTS t_zar_comment (
    comment_id SERIAL PRIMARY KEY,
    zarid INTEGER NOT NULL,
    uid INTEGER NOT NULL,
    comment_text TEXT NOT NULL,
    createddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_zar_comment_zar FOREIGN KEY (zarid) REFERENCES t_zar(zid) ON DELETE CASCADE,
    CONSTRAINT fk_zar_comment_user FOREIGN KEY (uid) REFERENCES t_user(uid) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_zar_comment_zarid ON t_zar_comment(zarid);
CREATE INDEX IF NOT EXISTS idx_zar_comment_uid ON t_zar_comment(uid);
CREATE INDEX IF NOT EXISTS idx_zar_comment_createddate ON t_zar_comment(createddate DESC);

-- Add phone column to t_user if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 't_user' AND column_name = 'phone'
    ) THEN
        ALTER TABLE t_user ADD COLUMN phone VARCHAR(20);
    END IF;
END $$;

-- Create t_zar_likes table for likes functionality
-- This table stores user likes on property listings
CREATE TABLE IF NOT EXISTS t_zar_likes (
    like_id SERIAL PRIMARY KEY,
    zarid INTEGER NOT NULL,
    uid INTEGER NOT NULL,
    createddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_zar_likes_zar FOREIGN KEY (zarid) REFERENCES t_zar(zid) ON DELETE CASCADE,
    CONSTRAINT fk_zar_likes_user FOREIGN KEY (uid) REFERENCES t_user(uid) ON DELETE CASCADE,
    CONSTRAINT unique_zar_user_like UNIQUE (zarid, uid)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_zar_likes_zarid ON t_zar_likes(zarid);
CREATE INDEX IF NOT EXISTS idx_zar_likes_uid ON t_zar_likes(uid);
CREATE INDEX IF NOT EXISTS idx_zar_likes_createddate ON t_zar_likes(createddate DESC);

-- Verify the tables were created
SELECT 't_zar_comment and t_zar_likes tables created successfully' AS status;

