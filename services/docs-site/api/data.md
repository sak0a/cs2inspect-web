# Data Endpoints

## Overview

Data endpoints provide static reference data for weapons, skins, stickers, and other CS2 items. These endpoints do not require authentication and are cached for performance.

::: info No Authentication Required
All data endpoints are public and do not require authentication.
:::

## Weapon Skins

### `GET /api/data/skins`

Retrieve all available weapon skins.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `weapon` | number | Filter by weapon defindex |
| `search` | string | Search skin names |

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "defindex": 7,
      "paintindex": 253,
      "name": "AK-47 | Fire Serpent",
      "weapon": "AK-47",
      "pattern": "Fire Serpent",
      "rarity": "Covert",
      "collection": "The Bravo Collection",
      "minFloat": 0.06,
      "maxFloat": 0.76,
      "image": "https://...",
      "statTrakAvailable": true
    }
  ],
  "count": 1
}
```

---

## Agents

### `GET /api/data/agents`

Retrieve all available agents.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `team` | string | Filter by team (`t` or `ct`) |

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "defindex": 4711,
      "name": "The Elite Mr. Muhlik | Elite Crew",
      "team": "t",
      "faction": "Elite Crew",
      "image": "https://...",
      "rarity": "Master"
    }
  ],
  "count": 1
}
```

---

## Stickers

### `GET /api/data/stickers`

Retrieve all available stickers.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search sticker names |
| `tournament` | string | Filter by tournament |
| `team` | string | Filter by team |

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "defindex": 1230,
      "name": "iBUYPOWER (Holo) | Katowice 2014",
      "tournament": "Katowice 2014",
      "team": "iBUYPOWER",
      "type": "team_holo",
      "image": "https://...",
      "rarity": "Exotic"
    }
  ],
  "count": 1
}
```

---

## Keychains

### `GET /api/data/keychains`

Retrieve all available keychains.

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "defindex": 6001,
      "name": "Chicken",
      "image": "https://...",
      "hasSeed": true
    }
  ],
  "count": 1
}
```

---

## Music Kits

### `GET /api/data/musickits`

Retrieve all available music kits.

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "defindex": 3,
      "name": "AWOLNATION, I Am",
      "artist": "AWOLNATION",
      "track": "I Am",
      "image": "https://...",
      "statTrakAvailable": true
    }
  ],
  "count": 1
}
```

---

## Collectibles (Pins)

### `GET /api/data/collectibles`

Retrieve all available pins and collectibles.

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "defindex": 6001,
      "name": "Skillful Pin",
      "series": "Series 1",
      "image": "https://...",
      "rarity": "Classified"
    }
  ],
  "count": 1
}
```

---

## Items by Type

### `GET /api/items/weapons/:type`

Retrieve weapons of a specific type.

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `:type` | string | Weapon type: `pistols`, `rifles`, `smgs`, `heavy`, `shotguns` |

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "defindex": 7,
      "name": "AK-47",
      "type": "rifle",
      "team": "t",
      "skins": [...]
    }
  ],
  "count": 1
}
```

### `GET /api/items/knives`

Retrieve all knife types with available skins.

### `GET /api/items/gloves`

Retrieve all glove types with available skins.

### `GET /api/items/pins`

Retrieve all pins and collectibles.

---

## Data Caching

::: tip Performance
Data endpoints are cached for optimal performance. Cache duration:

- Skins: 1 hour
- Stickers: 1 hour
- Agents: 24 hours
- Music Kits: 24 hours
  :::

## Data Sources

Item data is sourced from:

1. CS2 game files
2. Steam Community Market
3. Community-maintained databases

Data is updated periodically to reflect new items and changes.
