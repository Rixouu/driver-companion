#!/bin/bash

# Create backup directory
backup_dir="./backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup_dir"

# Files to remove (backup first)
files_to_remove=(
  "lib/sample-data.ts"
  "lib/offline-storage.ts"
  "types/api.ts"
  "types/index.ts"
  "components/providers/language-provider.tsx"
)

# Backup and remove files
for file in "${files_to_remove[@]}"; do
  if [ -f "$file" ]; then
    # Create backup directory structure
    mkdir -p "$backup_dir/$(dirname "$file")"
    # Copy file to backup
    cp "$file" "$backup_dir/$file"
    # Remove file
    rm "$file"
    echo "Removed and backed up: $file"
  fi
done

# Update providers/index.tsx to remove language provider
if [ -f "components/providers/index.tsx" ]; then
  cp components/providers/index.tsx "$backup_dir/components/providers/index.tsx"
  sed -i '' '/language-provider/d' components/providers/index.tsx
  sed -i '' '/<LanguageProvider>/d' components/providers/index.tsx
  sed -i '' '/<\/LanguageProvider>/d' components/providers/index.tsx
  echo "Updated providers/index.tsx"
fi

echo "Cleanup complete. Backups stored in $backup_dir"