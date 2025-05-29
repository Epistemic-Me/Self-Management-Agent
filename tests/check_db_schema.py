#!/usr/bin/env python3
import asyncio
import asyncpg
import os

async def check_database_schema():
    """Check what tables exist in the database."""
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/postgres")
    database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
    
    conn = await asyncpg.connect(database_url)
    try:
        # Get all tables
        tables = await conn.fetch("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        """)
        
        print("Tables in database:")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Check specific tables we need
        required_tables = ["users", "checklistitem", "self_models", "belief_systems", "beliefs"]
        print("\nRequired tables status:")
        for table_name in required_tables:
            exists = any(t[0] == table_name for t in tables)
            status = "✓" if exists else "✗"
            print(f"  {status} {table_name}")
        
        # If users table doesn't exist, check if there's a similar table
        if not any(t[0] == "users" for t in tables):
            print("\nLooking for user-related tables:")
            user_tables = [t[0] for t in tables if "user" in t[0].lower()]
            for table in user_tables:
                print(f"  - {table}")
                
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_database_schema()) 