#!/bin/bash
# Setup EAS Secrets for Play Store Internal Testing
# Run: bash scripts/setup-eas-secrets.sh
# Make sure you have the EAS CLI installed and are logged in

echo "Setting up EAS secrets for Thamizh Play Store internal testing..."
echo ""

# SpacetimeDB Host
echo "Setting EXPO_PUBLIC_SPACETIMEDB_HOST..."
eas secret:create --scope project --name EXPO_PUBLIC_SPACETIMEDB_HOST --value "wss://maincloud.spacetimedb.com"

# SpacetimeDB Database Name
echo "Setting EXPO_PUBLIC_SPACETIMEDB_DB_NAME..."
eas secret:create --scope project --name EXPO_PUBLIC_SPACETIMEDB_DB_NAME --value "thamizh-chat"

# App Name
echo "Setting EXPO_PUBLIC_APP_NAME..."
eas secret:create --scope project --name EXPO_PUBLIC_APP_NAME --value "Thamizh"

# BluSky Public API
echo "Setting EXPO_PUBLIC_BLUESKY_PUBLIC_API..."
eas secret:create --scope project --name EXPO_PUBLIC_BLUESKY_PUBLIC_API --value "https://public.api.bsky.app"

echo ""
echo "All EAS secrets set successfully!"
echo "You can now build for internal testing with:"
echo "  eas build --platform android --profile internal-testing"
echo ""
echo "Or create a build and submit to Play Store:"
echo "  eas build --platform android --profile production"
echo "  eas submit --platform android --profile production"
