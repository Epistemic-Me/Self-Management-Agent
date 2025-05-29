#!/usr/bin/env python3
import asyncio
import asyncpg
import os

async def check_user_table_schema():
    """Check the schema of the user table."""
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/postgres")
    database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
    
    conn = await asyncpg.connect(database_url)
    try:
        # Get user table columns
        columns = await conn.fetch("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'user' AND table_schema = 'public'
            ORDER BY ordinal_position
        """)
        
        print("User table schema:")
        for col in columns:
            nullable = "NULL" if col[2] == "YES" else "NOT NULL"
            default = f" DEFAULT {col[3]}" if col[3] else ""
            print(f"  - {col[0]}: {col[1]} {nullable}{default}")
                
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_user_table_schema()) 