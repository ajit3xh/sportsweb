import sqlite3

def fix_emails():
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    
    # helper to find dupes
    print("Finding duplicates...")
    cursor.execute("SELECT email, COUNT(*) FROM users_user GROUP BY email HAVING COUNT(*) > 1")
    dupes = cursor.fetchall()
    
    for email, count in dupes:
        if not email:
            continue
        print(f"Fixing {count} duplicates for email: '{email}'")
        
        # Get ids
        cursor.execute("SELECT id FROM users_user WHERE email = ?", (email,))
        ids = [row[0] for row in cursor.fetchall()]
        
        # Keep first, update others
        for i, user_id in enumerate(ids[1:], start=1):
            new_email = f"dup_{i}_{user_id}_{email}"
            cursor.execute("UPDATE users_user SET email = ? WHERE id = ?", (new_email, user_id))
            print(f"Updated user ID {user_id} email to {new_email}")
            
    # Fix empty emails
    print("Fixing empty emails...")
    cursor.execute("SELECT id FROM users_user WHERE email = '' OR email IS NULL")
    empty_ids = [row[0] for row in cursor.fetchall()]
    
    for user_id in empty_ids:
        new_email = f"missing_{user_id}@example.com"
        cursor.execute("UPDATE users_user SET email = ? WHERE id = ?", (new_email, user_id))
        print(f"Updated user ID {user_id} to {new_email}")
        
    conn.commit()
    conn.close()
    print("Done.")

if __name__ == '__main__':
    fix_emails()
