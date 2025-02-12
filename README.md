# Nuxt 3 Minimal Starter

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.



rifles/index.vue
> fetch the loadouts from the database
> fetch the loadout skins from the database




## Flow
Server Start: fetch the latest CSGO Data from the Steam API and store it
Client Start: fetch Loadouts from the Database and display them
Client Update: fetch the Skins from the Loadout via /api/weapons/[type]?loadoutid=[id]&steamid=[id]
Server Update: fetch the Skins from the Database if no skin is present, use the Default Weapon Skin
Client Update: open We


## Datastructure
- StickerData for Database and Frontend using API
  ```json
  {
    "id": 1,
    "x": 0.5,
    "y": 0.5,
    "wear": 0.3,
    "scale": 0.5,
    "rotation": 0.5,
    "api": {
      "name": "Sticker Name",
      "type": "team",
      "image": "https://example.com/image.png",
      "effect": "Holo",
      "rarity": {
        "name": "High Grade",
        "id": "rarity_rare",
        "color": "#4b69ff"
      },
      "tournament_team": "Astralis",
      "tournament_event": "IEM Katowice 2021"
    }
  }
  ```
  - KeychainData for Database and Frontend using API
  ```json
  {
    "id": 1,
    "x": 0.5,
    "y": 0.5,
    "z": 0.3,
    "seed": 0.3,
    "api": {
      "name": "Keychain Name",
      "image": "https://example.com/keychain.png",
      "rarity": {
        "name": "High Grade",
        "id": "rarity_rare",
        "color": "#4b69ff"
      },
    }
  }
  ```
- WeaponData for Database and Frontend using API
  ```json
  {
    "weapon_defindex": 7,
    "name": "AK-47 - The Empress",
    "defaultName": "AK-47",
    "weapon_name": "weapon_ak47",
    "image": "https://example.com/skin.png",
    "defaultImage": "https://example.com/default.png",
    "minFloat": 0.06,
    "maxFloat": 0.8,
    "paintIndex": 43,
    "rarity": {
      "name": "Covert",
      "id": "rarity_covert",
      "color": "#eb4b4b"
    }, 
    "availableTeams": "both", 
    "category": "rifles",
    "databaseInfo": {
      "active": true,
      "team": 2,
      "defindex": 7,
      "statTrak": true,
      "statTrakCount":  532,
      "paintIndex": 302,
      "paintWear": 0.7,
      "pattern": 424,
      "nameTag": "AK-47 Crazy 8",
      "stickers": [1, 2, 3, 4, 5],
      "keychain": 1
    }
  }
  ```



## API Endpoints

### GET /api/weapons/[type]?loadoutId=[id]&steamId=[id]
Fetches the weapons for a specific loadout and player.
## Request Parameters (exlusive Authorization Header)
```json
{
  "type": "rifles",
  "loadoutId": 1,
  "steamId": "1234567890"
}
```
## Response
```json
{
  "weapons": [
    {
      "defindex": 7,
      "paintindex": 302,
      "paintseed": 424,
      "paintwear": 0.023,
      "stattrack_enabled": true,
      "stattrack_count": 1432,
      "nametag": "AK-47 Vulcan ST FN",
      "sticker_0": 1,
      "sticker_1": 2,
      "sticker_2": 3,
      "sticker_3": 4,
      "sticker_4": 5,
      "keychain": 1
    }
  ]
}
```





## Database Structure


wp_player_knifes (id, steamid, loadoutid, active, team, 
defindex, paintindex, paintseed, paintwear, stattrack_enabled, stattrack_count, nametag, created_at, updated_at)

wp_player_smgs (id, steamid, loadoutid, active, team, defindex, paintindex, paintseed, paintwear, stattrack_enabled, stattrack_count, nametag, sticker_0, sticker_1, sticker_2, sticker_3, sticker_4, keychain, created_at, updated_at)

wp_player_rifles (id, steamid, loadoutid, active, team, defindex, paintindex, paintseed, paintwear, stattrack_enabled, stattrack_count, nametag, sticker_0, sticker_1, sticker_2, sticker_3, sticker_4, keychain, created_at, updated_at)

wp_player_heavys (id, steamid, loadoutid, active, team, defindex, paintindex, paintseed, paintwear, stattrack_enabled, stattrack_count, nametag, sticker_0, sticker_1, sticker_2, sticker_3, sticker_4, keychain, created_at, updated_at)

wp_player_pistols (id, steamid, loadoutid, active, team, defindex, paintindex, paintseed, paintwear, stattrack_enabled, stattrack_count, nametag, sticker_0, sticker_1, sticker_2, sticker_3, sticker_4, keychain, created_at, updated_at)

wp_player_gloves (id, steamid, loadoutid, active, team,
defindex, paintindex, paintseed, paintwear, created_at, updated_at)
 
wp_player_agents (id, steamid, loadoutid, active, team, defindex, agent_name, created_at, updated_at)

wp_player_pins (id, steamid, loadoutid, active, team, pinid, created_at, updated_at)

wp_player_music (id, steamid, loadoutid, active, team, musicid, created_at, updated_at)

wp_player_loadouts (id, steamid, name, created_at, updated_at)

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm run build

# yarn
yarn build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm run preview

# yarn
yarn preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
