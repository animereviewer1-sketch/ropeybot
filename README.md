# Ropeybot

A node-based BC bot based on the old bot-api. Its functionality is divided up into
'games' and you configure the bot to run one of them via its config file.

Most code here is free to use (Apache licensed) but some is taken with
permission from the original bot hub (eg. kidnappers game, roleplay challenge).

We hope that this will be useful for people to make fun and interesting bots
for the club! You're also welcome to run the bots included yourself.

To make a new game, you can copy the 'petspa' game file and use that as a base, and add
your new file into bot.ts.

Usual club ettiquette applies, eg:

- Make sure people know your bot is a bot, not a real player
- Make sure people consent before your bot binds them / changes their clothing etc.
- Watch how many messages your bot sends. Even if it stays under the ratelimit, constantly
  sending messages will affect the server.
- Make bots fun / interesting / useful, rather than to just sit in rooms.

## Code layout

Anything in src/hub is from the original bot hub. This includes the 'kidnappers' game and the
roleplay challenge bot. These are copied in as they were, but with additions since.

Things in src/games use a newer, more event-based API. If you write new bots, they should
probably look like the ones in here.

Some things are unfinished and imperfect, but there should be enough here to make working and
fun bots! Improvements and fixes are always welcome.

## Running

The bot can either be run locally or via the Docker image.

### Running Locally

- Get an environment with NodeJS, pnpm (https://pnpm.io/installation) and git
- Check out the bot's code
  `git clone https://github.com/FriendsOfBC/ropeybot.git`
- Copy `config.sample.json` to `config.json` and customise it: you'll need to provide
  at least a username and password for an account that the bot can log in as. You can
  also choose what game the bot will run.
- Enter the directory and install the dependencies:
  `cd ropeybot`
  `pnpm install`
- Start the bot!
  `pnpm start`

### Running with Docker

- Install docker
- Create a config file as in the steps for running locally
- Run the bot, mapping in the config file you just made:
  `docker run --rm -it -v ${PWD}/config.json:/bot/cfg/config.json ghcr.io/FriendsOfBC/ropeybot:main`
- Alternatively you can build the docker container yourself:
  `docker build --tag ropeybot .`
- And then run said container with the config file mapped in
  `docker run --rm -it -v ${PWD}/config.json:/bot/cfg/config.json ropeybot`

## Bot Settings & Mod Support

The bot now supports configurable settings for mods and in-game features. When you start the bot,
you'll be prompted with an interactive menu to configure these settings.

### Interactive Settings Menu

When starting the bot, you'll see:

```
Would you like to configure bot settings? (y/N):
```

Type `y` to enter the settings configuration menu, where you can:

- Enable/disable mod support (script permissions)
- Configure wardrobe access permissions
- Set various in-game behavior options

### Configuration Options

The following settings can be configured:

1. **Enable All Mods** - Enables all mod/addon functionality (automatically enables script permissions)
2. **Allow Full Wardrobe Access** - Allows other players to edit all wardrobe settings
3. **Enable Script Permissions** - Allows scripts/mods to hide and block items (required for mods like FUSAM)
4. **Allow Player Leashing** - Permits other players to leash your bot
5. **Allow Rename** - Allows name/nickname changes
6. **Items Affect Expressions** - Allows items to modify facial expressions
7. **Block Body Cosplay** - Prevents body cosplay assets from being removed
8. **Disable Picking Locks On Self** - Prevents self-lock picking

### Using the Settings Menu

1. Start the bot with `pnpm start`
2. When prompted, type `y` to configure settings
3. Use numbers 1-8 to toggle individual settings
4. Type `s` or `save` to save and start the bot
5. Type `q` or `quit` to exit without saving

### Configuring Settings in config.json

You can also configure settings directly in your `config.json` file by adding a `botSettings` section:

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

See `config.sample.json` for a complete example with default values.

## Games

The bot comes with some built games. In brackets is the value to use for 'game' in the config
file to run that game.

### Dare Game ('dare')

A very simple game where players add dares and then draw them without knowing who added
each dare.
The dares added by players are stored in two files in the bot's working directory:
dares.json and unuseddares.json: delete both of these files to reset the dares.

### Pet Spa ('petspa')

This is an example of how to use the API to make an interactive map room, but also
applies to non map rooms. You can use this file as a base for things like how to react
when players enter areas on a map, adding restraints and setting their properties, sending
and reacting to messages.

### Kidnappers ('kidnappers')

From the original bot hub. Code is mostly unmodified from its original state.

### Roleplay challenge ('roleplay')

Also from the original bot hub.

### Maid's Party Night ('maidspartynight')

Also from the original bot hub, a single player adventure. Needs a second bot account
(user2 and password2 in the config). Probably buggy!
