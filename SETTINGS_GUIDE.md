# Bot Settings Interface - Usage Guide

## Quick Start

When you start the bot with `pnpm start` or `npm start`, you'll see:

```
╔════════════════════════════════════════════════════╗
║            RopeyBot Startup                        ║
╚════════════════════════════════════════════════════╝

Would you like to configure bot settings? (y/N):
```

### Interactive Menu

Type `y` to open the settings configuration menu:

```
╔════════════════════════════════════════════════════╗
║         Bot Settings Configuration Menu           ║
╚════════════════════════════════════════════════════╝

Current Settings:
─────────────────────────────────────────────────────
1. Enable All Mods: ✓ ENABLED
   Enable all mod/addon functionality (enables script permissions)
2. Allow Full Wardrobe Access: ✓ ENABLED
   Allow other players to edit all wardrobe settings
3. Enable Script Permissions: ✓ ENABLED
   Allow scripts/mods to hide and block items (required for mods)
4. Allow Player Leashing: ✓ ENABLED
   Permit other players to leash your bot
5. Allow Rename: ✓ ENABLED
   Allow name/nickname changes
6. Items Affect Expressions: ✓ ENABLED
   Allow items to modify facial expressions
7. Block Body Cosplay: ✗ DISABLED
   Prevent body cosplay assets from being removed
8. Disable Picking Locks On Self: ✗ DISABLED
   Prevent self-lock picking

─────────────────────────────────────────────────────

Options:
  1-8: Toggle a setting
  [s]ave: Save settings and start bot
  [q]uit: Exit without saving

Your choice:
```

## How to Use

1. **View Settings**: The menu shows all available settings with their current state
    - Green ✓ ENABLED = Setting is on
    - Red ✗ DISABLED = Setting is off

2. **Toggle Settings**: Type a number (1-8) to toggle that setting on/off

3. **Save and Start**: Type `s` or `save` to save your configuration and start the bot

4. **Exit**: Type `q` or `quit` to exit without saving changes

## Configuration in config.json

You can also configure settings directly in your `config.json`:

```json
{
    "user": "your_bot_user_name",
    "password": "your_bot_password",
    "env": "live",
    "game": "dare",
    "botSettings": {
        "enableAllMods": true,
        "allowFullWardrobeAccess": true,
        "enableScriptPermissions": true,
        "allowPlayerLeashing": true,
        "allowRename": true,
        "itemsAffectExpressions": true,
        "blockBodyCosplay": false,
        "disablePickingLocksOnSelf": false
    }
}
```

## Settings Explained

### enableAllMods

**Default**: `true`  
**What it does**: Automatically enables script permissions, allowing mods like FUSAM addon loader to function properly.

### allowFullWardrobeAccess

**Default**: `true`  
**What it does**: Lets other players edit all your bot's wardrobe and appearance settings, useful for bot management.

### enableScriptPermissions

**Default**: `true`  
**What it does**: Grants scripts/mods permission to hide items and block actions. Essential for mods to work.

### allowPlayerLeashing

**Default**: `true`  
**What it does**: Allows other players to leash your bot and lead it around.

### allowRename

**Default**: `true`  
**What it does**: Permits players to change your bot's name or nickname.

### itemsAffectExpressions

**Default**: `true`  
**What it does**: Allows items (like gags, blindfolds) to automatically change facial expressions.

### blockBodyCosplay

**Default**: `false`  
**What it does**: When enabled, prevents body cosplay items from being removed.

### disablePickingLocksOnSelf

**Default**: `false`  
**What it does**: When enabled, the bot cannot pick locks on its own restraints.

## Mod Support

With the default settings (all mods enabled), your bot will support:

- ✅ FUSAM Addon Loader
- ✅ Custom scripts and extensions
- ✅ Full wardrobe management
- ✅ Interactive features
- ✅ All BC mod functionality

The bot will automatically apply these settings when it logs in, ensuring mods can load and function correctly.

## Tips

- **First Time Setup**: When running the bot for the first time, configure settings interactively to ensure everything is set up correctly
- **Quick Start**: If you just want mods to work, accept the defaults by typing `N` at the prompt
- **Customization**: Use the interactive menu to fine-tune settings for your specific use case
- **Persistence**: Settings are saved to your config.json and will be used on every bot restart
