# User Creation Scripts

This directory contains scripts for creating users with real Don't Die account data.

## Scripts

### `create_user_from_dd.py`
Comprehensive script that creates a complete user profile by:
1. Creating a user in profile-mcp using Don't Die account data
2. Creating a self-model in em-mcp
3. Creating belief systems based on Don't Die data
4. Syncing everything together

**Usage:**
```bash
# Using command line arguments
python create_user_from_dd.py --dd-token YOUR_DD_TOKEN --dd-client-id YOUR_DD_CLIENT_ID

# Using environment variables
DD_TOKEN=your_token DD_CLIENT_ID=your_client_id python create_user_from_dd.py

# Verbose output
python create_user_from_dd.py --dd-token YOUR_DD_TOKEN --dd-client-id YOUR_DD_CLIENT_ID --verbose
```

### `startup_user_creation.py`
Startup script that automatically runs during docker compose initialization.
Checks for `DD_TOKEN` and `DD_CLIENT_ID` environment variables and creates a user if present.

## Docker Compose Integration

The `user-setup` service in docker-compose.yml automatically runs the startup script when you start the services.

### Setup

1. **Set your Don't Die credentials** in a `.env` file in the self-management-agent directory:
   ```bash
   DD_TOKEN=your_bearer_token_here
   DD_CLIENT_ID=your_client_id_here
   OPENAI_API_KEY=your_openai_key_here
   ```

2. **Start the services:**
   ```bash
   docker compose up -d
   ```

3. **Check the user-setup logs:**
   ```bash
   docker compose logs user-setup
   ```

### Manual User Creation

If you want to create users manually after the services are running:

```bash
# Enter the profile-mcp container
docker compose exec profile-mcp bash

# Run the script
python /app/scripts/create_user_from_dd.py --dd-token YOUR_TOKEN --dd-client-id YOUR_CLIENT_ID
```

## What Gets Created

When you create a user from Don't Die data, the script will:

1. **Fetch your Don't Die account info** and create a user record
2. **Fetch your health data** including:
   - DD Scores (last 30 days)
   - All biomarkers (Measurements, Capabilities, Biomarkers)
   - User protocols
3. **Create a self-model** in the Epistemic Me system
4. **Generate belief systems** based on your actual health data:
   - DD Score tracking beliefs
   - Biomarker monitoring beliefs  
   - Protocol adherence beliefs
5. **Sync everything** to the profile system

## Example Output

```
🚀 Starting user creation from Don't Die account...
🔄 Creating user in profile-mcp...
✅ User created: 550e8400-e29b-41d4-a716-446655440000
   Don't Die UID: dd_user_12345
🔄 Fetching Don't Die data...
✅ Fetched DD scores for 30 days
✅ Fetched biomarkers
✅ Fetched user protocols
🔄 Creating self-model in em-mcp...
✅ Self-model created
🔄 Creating belief systems...
✅ Created 5 beliefs: DD Score Tracking, Measurements Monitoring, Capabilities Monitoring, Biomarkers Monitoring, Protocol Adherence
🔄 Syncing self-model to profile-mcp...
✅ Self-model synced to profile-mcp

🎉 User creation completed successfully!
   User ID: 550e8400-e29b-41d4-a716-446655440000
   Don't Die Data: 3 categories fetched
   Beliefs Created: 5
```

## Troubleshooting

- **Services not ready**: The startup script waits for all services to be healthy before proceeding
- **Invalid credentials**: Check your DD_TOKEN and DD_CLIENT_ID values
- **User already exists**: The script will detect existing users and skip creation
- **API errors**: Check the logs for specific error messages from the Don't Die API

## Security Note

Keep your Don't Die credentials secure. The `.env` file should not be committed to version control. 