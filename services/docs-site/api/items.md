# Item Management

## Overview

Item endpoints handle the saving and retrieval of weapon customizations within loadouts, including weapons, knives, gloves, and pins.

::: warning Authentication Required
All item management endpoints require a valid JWT token.
:::

## Weapons

### `GET /api/weapons/:type`

Retrieve weapons of a specific type for the authenticated user's active loadout.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `:type` | string | Weapon type: `pistol`, `smg`, `rifle`, `heavy` |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `steamId` | string | Yes | User's Steam ID |
| `loadoutId` | number | No | Specific loadout ID |

**Response**:

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "steamid": "76561198012345678",
            "loadoutid": 1,
            "team": 2,
            "weapon_defindex": 7,
            "weapon_name": "AK-47",
            "active": 1,
            "paintindex": 253,
            "paintseed": 661,
            "paintwear": 0.15,
            "stattrak_enabled": 1,
            "stattrak_count": 1337,
            "nametag": "The Beast",
            "stickers": [
                {
                    "slot": 0,
                    "stickerId": 1230,
                    "wear": 0.0,
                    "rotation": 0,
                    "scale": 1.0
                }
            ],
            "keychain": {
                "keychainId": 6001,
                "seed": 42
            }
        }
    ],
    "count": 1
}
```

---

### `POST /api/weapons/save`

Save or update a weapon customization.

**Request Body**:

```json
{
    "steamId": "76561198012345678",
    "loadoutId": 1,
    "team": 2,
    "weaponDefindex": 7,
    "paintindex": 253,
    "paintseed": 661,
    "paintwear": 0.15,
    "statTrak": true,
    "statTrakCount": 1337,
    "nameTag": "The Beast",
    "stickers": [
        {
            "slot": 0,
            "stickerId": 1230,
            "wear": 0.0
        }
    ],
    "keychain": {
        "keychainId": 6001,
        "seed": 42
    }
}
```

**Response**:

```json
{
    "success": true,
    "data": {
        "id": 1,
        "message": "Weapon saved successfully"
    }
}
```

---

## Knives

### `GET /api/knives`

Retrieve knives for the authenticated user's active loadout.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `steamId` | string | Yes | User's Steam ID |
| `team` | number | No | Filter by team (2 for T, 3 for CT) |

**Response**:

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "steamid": "76561198012345678",
            "loadoutid": 1,
            "team": 2,
            "weapon_defindex": 507,
            "weapon_name": "Karambit",
            "active": 1,
            "paintindex": 418,
            "paintseed": 412,
            "paintwear": 0.01,
            "stattrak_enabled": 1,
            "stattrak_count": 500,
            "nametag": "Ruby Slayer"
        }
    ],
    "count": 1
}
```

---

### `POST /api/knives/save`

Save or update a knife customization.

**Request Body**:

```json
{
    "steamId": "76561198012345678",
    "loadoutId": 1,
    "team": 2,
    "weaponDefindex": 507,
    "paintindex": 418,
    "paintseed": 412,
    "paintwear": 0.01,
    "statTrak": true,
    "statTrakCount": 500,
    "nameTag": "Ruby Slayer"
}
```

**Response**:

```json
{
    "success": true,
    "data": {
        "id": 1,
        "message": "Knife saved successfully"
    }
}
```

---

## Gloves

### `GET /api/gloves`

Retrieve gloves for the authenticated user's active loadout.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `steamId` | string | Yes | User's Steam ID |
| `team` | number | No | Filter by team (2 for T, 3 for CT) |

**Response**:

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "steamid": "76561198012345678",
            "loadoutid": 1,
            "team": 2,
            "weapon_defindex": 5027,
            "weapon_name": "Hand Wraps",
            "active": 1,
            "paintindex": 10006,
            "paintseed": 0,
            "paintwear": 0.25
        }
    ],
    "count": 1
}
```

---

### `POST /api/gloves/save`

Save or update glove customization.

**Request Body**:

```json
{
    "steamId": "76561198012345678",
    "loadoutId": 1,
    "team": 2,
    "weaponDefindex": 5027,
    "paintindex": 10006,
    "paintseed": 0,
    "paintwear": 0.25
}
```

**Response**:

```json
{
    "success": true,
    "data": {
        "id": 1,
        "message": "Gloves saved successfully"
    }
}
```

---

## Pins

### `GET /api/pins`

Retrieve pins for the authenticated user's active loadout.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `steamId` | string | Yes | User's Steam ID |

**Response**:

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "steamid": "76561198012345678",
            "loadoutid": 1,
            "pin_defindex": 6001,
            "pin_name": "Skillful Pin"
        }
    ],
    "count": 1
}
```

---

### `POST /api/pins`

Add or update pins in the user's collection.

**Request Body**:

```json
{
    "steamId": "76561198012345678",
    "loadoutId": 1,
    "pins": [6001, 6002, 6003]
}
```

**Response**:

```json
{
    "success": true,
    "message": "Pins updated successfully"
}
```

---

## Team Values

| Team              | Value | Description     |
| ----------------- | ----- | --------------- |
| Terrorist         | 2     | T-side weapons  |
| Counter-Terrorist | 3     | CT-side weapons |

## Wear Ranges

| Condition      | Float Range |
| -------------- | ----------- |
| Factory New    | 0.00 - 0.07 |
| Minimal Wear   | 0.07 - 0.15 |
| Field-Tested   | 0.15 - 0.38 |
| Well-Worn      | 0.38 - 0.45 |
| Battle-Scarred | 0.45 - 1.00 |

::: tip Pattern/Seed
The `paintseed` value (0-1000) determines the pattern placement on the skin. Some patterns are more valuable than others (e.g., "blue gem" patterns on Case Hardened).
:::
