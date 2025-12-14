# CS2 Weapon Paints Plugin Integration Tutorial

## 🎯 Objective
Integrate the CS2 Weapon Paints Counter-Strike Sharp plugin with our CS2Inspect web application to enable seamless data synchronization and enhanced functionality.

## 📋 Prerequisites
- CS2 server with CounterStrikeSharp installed
- MySQL/MariaDB database server
- CS2Inspect web application deployed
- Basic knowledge of C# and database management

## 🔧 Step 1: Database Migration Setup

### 1.1 Create Migration Scripts

Create a new file `database_migration.sql`:

```sql
-- Migration script to convert plugin schema to web app schema
-- Run this AFTER the plugin has created its initial tables

-- Step 1: Create loadout system
CREATE TABLE IF NOT EXISTS `wp_player_loadouts` (
    `id` int unsigned auto_increment primary key,
    `steamid` varchar(64) not null,
    `name` varchar(25) not null default 'Default Loadout',
    `selected_knife_t` smallint unsigned null,
    `selected_knife_ct` smallint unsigned null,
    `selected_glove_t` smallint unsigned null,
    `selected_glove_ct` smallint unsigned null,
    `selected_agent_t` smallint unsigned null,
    `selected_agent_ct` smallint unsigned null,
    `selected_music` smallint unsigned null,
    `selected_pin` smallint unsigned null,
    `created_at` timestamp default current_timestamp(),
    `updated_at` timestamp default current_timestamp() on update current_timestamp(),
    unique key `unique_steamid_name` (`steamid`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 2: Create weapon category tables
CREATE TABLE IF NOT EXISTS `wp_player_rifles` (
    `id` int unsigned auto_increment primary key,
    `steamid` varchar(64) not null,
    `loadoutid` int unsigned not null,
    `active` tinyint(1) default 0,
    `team` tinyint unsigned not null,
    `defindex` smallint unsigned not null,
    `paintindex` smallint unsigned default 0,
    `paintseed` varchar(10) default '0',
    `paintwear` varchar(20) default '0.000001',
    `stattrak_enabled` tinyint(1) default 0,
    `stattrak_count` int unsigned default 0,
    `nametag` varchar(255) null,
    `sticker_0` varchar(200) default '0;0;0;0;0;0',
    `sticker_1` varchar(200) default '0;0;0;0;0;0',
    `sticker_2` varchar(200) default '0;0;0;0;0;0',
    `sticker_3` varchar(200) default '0;0;0;0;0;0',
    `sticker_4` varchar(200) default '0;0;0;0;0;0',
    `keychain` varchar(200) default '0;0;0;0;0',
    `created_at` timestamp default current_timestamp(),
    `updated_at` timestamp default current_timestamp() on update current_timestamp(),
    foreign key (`loadoutid`) references `wp_player_loadouts`(`id`) on delete cascade,
    unique key `unique_loadout_team_defindex` (`loadoutid`, `team`, `defindex`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Repeat similar structure for pistols, smgs, heavys tables
-- (See full schema in CS2Inspect database init.sql)
```

### 1.2 Data Migration Procedure

```sql
-- Migrate existing plugin data to new schema
-- Step 1: Create default loadouts for existing users
INSERT INTO `wp_player_loadouts` (`steamid`, `name`)
SELECT DISTINCT `steamid`, 'Default Loadout'
FROM `wp_player_skins`
WHERE `steamid` NOT IN (SELECT `steamid` FROM `wp_player_loadouts`);

-- Step 2: Migrate weapon skins to appropriate category tables
-- (This requires weapon categorization logic - see Step 2)
```

## 🔧 Step 2: Plugin Modification

### 2.1 Create Weapon Categorization Helper

Add to `Utility.cs`:

```csharp
public static class WeaponCategories
{
    // Weapon definition index mappings
    private static readonly Dictionary<int, string> WeaponCategoryMap = new()
    {
        // Rifles
        { 7, "rifles" },   // AK-47
        { 60, "rifles" },  // M4A4
        { 61, "rifles" },  // M4A1-S
        { 8, "rifles" },   // AUG
        { 39, "rifles" },  // SG 553
        // ... add all weapon mappings
        
        // Pistols
        { 1, "pistols" },  // Deagle
        { 2, "pistols" },  // Dual Berettas
        { 3, "pistols" },  // Five-SeveN
        // ... add all pistol mappings
        
        // SMGs
        { 17, "smgs" },    // MAC-10
        { 19, "smgs" },    // P90
        // ... add all SMG mappings
        
        // Heavy
        { 14, "heavys" },  // M249
        { 28, "heavys" },  // Negev
        // ... add all heavy mappings
    };
    
    public static string GetWeaponCategory(int defindex)
    {
        return WeaponCategoryMap.TryGetValue(defindex, out var category) ? category : "rifles";
    }
    
    public static string GetTableName(int defindex)
    {
        var category = GetWeaponCategory(defindex);
        return $"wp_player_{category}";
    }
}
```

### 2.2 Update WeaponSynchronization.cs

Replace the existing database methods with loadout-aware versions:

```csharp
private async Task<int> GetOrCreateDefaultLoadout(string steamId, MySqlConnection connection)
{
    // Check if user has a default loadout
    const string checkQuery = "SELECT id FROM wp_player_loadouts WHERE steamid = @steamid LIMIT 1";
    var existingLoadout = await connection.QueryFirstOrDefaultAsync<int?>(checkQuery, new { steamid = steamId });
    
    if (existingLoadout.HasValue)
        return existingLoadout.Value;
    
    // Create default loadout
    const string insertQuery = @"
        INSERT INTO wp_player_loadouts (steamid, name) 
        VALUES (@steamid, 'Default Loadout')";
    
    await connection.ExecuteAsync(insertQuery, new { steamid = steamId });
    
    // Get the inserted ID
    return await connection.QueryFirstAsync<int>("SELECT LAST_INSERT_ID()");
}

private void GetWeaponPaintsFromDatabase(PlayerInfo? player, MySqlConnection connection)
{
    try
    {
        if (!_config.Additional.SkinEnabled || string.IsNullOrEmpty(player?.SteamId))
            return;

        // Get or create default loadout
        var loadoutId = GetOrCreateDefaultLoadout(player.SteamId, connection).Result;
        
        // Query all weapon category tables
        string[] weaponTables = { "rifles", "pistols", "smgs", "heavys" };
        
        foreach (var table in weaponTables)
        {
            var query = $@"
                SELECT defindex, paintindex, paintseed, paintwear, stattrak_enabled, 
                       stattrak_count, nametag, sticker_0, sticker_1, sticker_2, 
                       sticker_3, sticker_4, keychain, team
                FROM wp_player_{table} 
                WHERE steamid = @steamid AND loadoutid = @loadoutid AND active = 1";
                
            var weapons = connection.Query<dynamic>(query, new { 
                steamid = player.SteamId, 
                loadoutid = loadoutId 
            });
            
            ProcessWeaponData(weapons, player);
        }
    }
    catch (Exception ex)
    {
        Utility.Log($"Error in GetWeaponPaintsFromDatabase: {ex.Message}");
    }
}
```

## 🔧 Step 3: API Integration Layer

### 3.1 Create Plugin API Controller

Add to your web application `server/api/plugin/`:

```typescript
// server/api/plugin/sync.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { steamid, action, data } = body
  
  try {
    switch (action) {
      case 'sync_weapons':
        return await syncWeaponsFromPlugin(steamid, data)
      case 'sync_loadout':
        return await syncLoadoutFromPlugin(steamid, data)
      case 'get_player_data':
        return await getPlayerDataForPlugin(steamid)
      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid action'
        })
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Sync failed'
    })
  }
})
```

### 3.2 Add HTTP Client to Plugin

Add to plugin dependencies in `WeaponPaints.csproj`:

```xml
<PackageReference Include="System.Net.Http" Version="4.3.4" />
<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
```

Create `ApiClient.cs`:

```csharp
public class ApiClient
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;
    
    public ApiClient(string baseUrl)
    {
        _baseUrl = baseUrl;
        _httpClient = new HttpClient();
    }
    
    public async Task<bool> SyncPlayerData(string steamId, object data)
    {
        try
        {
            var json = JsonConvert.SerializeObject(new { 
                steamid = steamId, 
                action = "sync_weapons", 
                data = data 
            });
            
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"{_baseUrl}/api/plugin/sync", content);
            
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            WeaponPaints.Instance.Logger.LogError($"API sync failed: {ex.Message}");
            return false;
        }
    }
}
```

## 🔧 Step 4: Configuration Updates

### 4.1 Update Plugin Config

Add to `Config.cs`:

```csharp
[JsonPropertyName("WebAppUrl")]
public string WebAppUrl { get; set; } = "";

[JsonPropertyName("EnableWebAppSync")]
public bool EnableWebAppSync { get; set; } = false;

[JsonPropertyName("SyncInterval")]
public int SyncInterval { get; set; } = 30; // seconds
```

### 4.2 Environment Variables

Add to your web app `.env`:

```env
# Plugin Integration
PLUGIN_API_KEY=your-secure-api-key
PLUGIN_SYNC_ENABLED=true
PLUGIN_WEBHOOK_URL=http://your-cs2-server:27015/webhook
```

## 🧪 Step 5: Testing Procedures

### 5.1 Database Migration Test

```sql
-- Test data migration
SELECT COUNT(*) as original_skins FROM wp_player_skins;
-- Run migration
SELECT COUNT(*) as migrated_rifles FROM wp_player_rifles;
-- Verify data integrity
```

### 5.2 Plugin Integration Test

1. Start CS2 server with modified plugin
2. Connect test player
3. Change weapon skin via web app
4. Verify skin appears in-game
5. Change skin in-game via plugin commands
6. Verify change reflects in web app

## 🔧 Step 6: Complete Database Migration Script

### 6.1 Full Migration Script

Create `complete_migration.sql`:

```sql
-- Complete migration from plugin schema to CS2Inspect schema
-- Execute this after plugin has created initial tables

-- Create weapon category mapping function
DELIMITER $$
CREATE FUNCTION GetWeaponCategory(defindex INT) RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
BEGIN
    CASE
        WHEN defindex IN (7,60,61,8,39,9,38,10,13) THEN RETURN 'rifles';
        WHEN defindex IN (1,2,3,4,30,32,36,61,63) THEN RETURN 'pistols';
        WHEN defindex IN (17,19,24,26,33,34) THEN RETURN 'smgs';
        WHEN defindex IN (14,28,35) THEN RETURN 'heavys';
        ELSE RETURN 'rifles';
    END CASE;
END$$
DELIMITER ;

-- Migrate weapon skins to categorized tables
INSERT INTO wp_player_rifles (steamid, loadoutid, active, team, defindex, paintindex, paintseed, paintwear, stattrak_enabled, stattrak_count, nametag, sticker_0, sticker_1, sticker_2, sticker_3, sticker_4, keychain)
SELECT
    s.steamid,
    l.id as loadoutid,
    1 as active,
    CASE s.weapon_team WHEN 2 THEN 1 WHEN 3 THEN 2 ELSE 1 END as team,
    s.weapon_defindex as defindex,
    s.weapon_paint_id as paintindex,
    CAST(s.weapon_seed AS CHAR) as paintseed,
    CAST(s.weapon_wear AS CHAR) as paintwear,
    s.weapon_stattrak as stattrak_enabled,
    s.weapon_stattrak_count as stattrak_count,
    s.weapon_nametag as nametag,
    SUBSTRING_INDEX(s.weapon_sticker_0, ';', 6) as sticker_0,
    SUBSTRING_INDEX(s.weapon_sticker_1, ';', 6) as sticker_1,
    SUBSTRING_INDEX(s.weapon_sticker_2, ';', 6) as sticker_2,
    SUBSTRING_INDEX(s.weapon_sticker_3, ';', 6) as sticker_3,
    SUBSTRING_INDEX(s.weapon_sticker_4, ';', 6) as sticker_4,
    s.weapon_keychain as keychain
FROM wp_player_skins s
JOIN wp_player_loadouts l ON s.steamid = l.steamid
WHERE GetWeaponCategory(s.weapon_defindex) = 'rifles';

-- Repeat for other weapon categories...
```

## 🔧 Step 7: Modified Plugin Files

### 7.1 Enhanced WeaponSynchronization.cs

Create `WeaponSynchronization_Enhanced.cs`:

```csharp
internal class WeaponSynchronizationEnhanced : WeaponSynchronization
{
    private readonly ApiClient _apiClient;

    public WeaponSynchronizationEnhanced(Database database, WeaponPaintsConfig config)
        : base(database, config)
    {
        if (config.EnableWebAppSync && !string.IsNullOrEmpty(config.WebAppUrl))
        {
            _apiClient = new ApiClient(config.WebAppUrl);
        }
    }

    internal async Task SyncWeaponToWebApp(PlayerInfo player, int defindex, WeaponInfo weaponInfo, CsTeam team)
    {
        if (_apiClient == null) return;

        var syncData = new
        {
            defindex = defindex,
            category = WeaponCategories.GetWeaponCategory(defindex),
            team = (int)team,
            paintindex = weaponInfo.Paint,
            paintseed = weaponInfo.Seed.ToString(),
            paintwear = weaponInfo.Wear.ToString("F6"),
            stattrak_enabled = weaponInfo.StatTrak,
            stattrak_count = weaponInfo.StatTrakCount,
            nametag = weaponInfo.Nametag,
            stickers = weaponInfo.Stickers.Select(s => new {
                id = s.Id,
                x = s.OffsetX,
                y = s.OffsetY,
                wear = s.Wear,
                scale = s.Scale,
                rotation = s.Rotation
            }).ToArray(),
            keychain = weaponInfo.KeyChain != null ? new {
                id = weaponInfo.KeyChain.Id,
                x = weaponInfo.KeyChain.OffsetX,
                y = weaponInfo.KeyChain.OffsetY,
                z = weaponInfo.KeyChain.OffsetZ,
                seed = weaponInfo.KeyChain.Seed
            } : null
        };

        await _apiClient.SyncPlayerData(player.SteamId, syncData);
    }
}
```

### 7.2 Database Helper Extensions

Create `DatabaseExtensions.cs`:

```csharp
public static class DatabaseExtensions
{
    public static async Task<int> GetOrCreateDefaultLoadout(this MySqlConnection connection, string steamId)
    {
        const string checkQuery = "SELECT id FROM wp_player_loadouts WHERE steamid = @steamid LIMIT 1";
        var existingLoadout = await connection.QueryFirstOrDefaultAsync<int?>(checkQuery, new { steamid = steamId });

        if (existingLoadout.HasValue)
            return existingLoadout.Value;

        const string insertQuery = @"
            INSERT INTO wp_player_loadouts (steamid, name)
            VALUES (@steamid, 'Default Loadout')";

        await connection.ExecuteAsync(insertQuery, new { steamid = steamId });
        return await connection.QueryFirstAsync<int>("SELECT LAST_INSERT_ID()");
    }

    public static async Task UpsertWeaponSkin(this MySqlConnection connection, string steamId, int loadoutId,
        int team, int defindex, WeaponInfo weaponInfo)
    {
        var category = WeaponCategories.GetWeaponCategory(defindex);
        var tableName = $"wp_player_{category}";

        var query = $@"
            INSERT INTO {tableName}
            (steamid, loadoutid, active, team, defindex, paintindex, paintseed, paintwear,
             stattrak_enabled, stattrak_count, nametag, sticker_0, sticker_1, sticker_2, sticker_3, sticker_4, keychain)
            VALUES (@steamid, @loadoutid, 1, @team, @defindex, @paintindex, @paintseed, @paintwear,
                    @stattrak_enabled, @stattrak_count, @nametag, @sticker_0, @sticker_1, @sticker_2, @sticker_3, @sticker_4, @keychain)
            ON DUPLICATE KEY UPDATE
                paintindex = @paintindex,
                paintseed = @paintseed,
                paintwear = @paintwear,
                stattrak_enabled = @stattrak_enabled,
                stattrak_count = @stattrak_count,
                nametag = @nametag,
                sticker_0 = @sticker_0,
                sticker_1 = @sticker_1,
                sticker_2 = @sticker_2,
                sticker_3 = @sticker_3,
                sticker_4 = @sticker_4,
                keychain = @keychain,
                updated_at = CURRENT_TIMESTAMP";

        var parameters = new
        {
            steamid = steamId,
            loadoutid = loadoutId,
            team = team,
            defindex = defindex,
            paintindex = weaponInfo.Paint,
            paintseed = weaponInfo.Seed.ToString(),
            paintwear = weaponInfo.Wear.ToString("F6"),
            stattrak_enabled = weaponInfo.StatTrak,
            stattrak_count = weaponInfo.StatTrakCount,
            nametag = weaponInfo.Nametag ?? "",
            sticker_0 = FormatStickerData(weaponInfo.Stickers.ElementAtOrDefault(0)),
            sticker_1 = FormatStickerData(weaponInfo.Stickers.ElementAtOrDefault(1)),
            sticker_2 = FormatStickerData(weaponInfo.Stickers.ElementAtOrDefault(2)),
            sticker_3 = FormatStickerData(weaponInfo.Stickers.ElementAtOrDefault(3)),
            sticker_4 = FormatStickerData(weaponInfo.Stickers.ElementAtOrDefault(4)),
            keychain = FormatKeychainData(weaponInfo.KeyChain)
        };

        await connection.ExecuteAsync(query, parameters);
    }

    private static string FormatStickerData(StickerInfo? sticker)
    {
        if (sticker == null) return "0;0;0;0;0;0";
        return $"{sticker.Id};{sticker.OffsetX};{sticker.OffsetY};{sticker.Wear};{sticker.Scale};{sticker.Rotation}";
    }

    private static string FormatKeychainData(KeyChainInfo? keychain)
    {
        if (keychain == null) return "0;0;0;0;0";
        return $"{keychain.Id};{keychain.OffsetX};{keychain.OffsetY};{keychain.OffsetZ};{keychain.Seed}";
    }
}
```

## 🔧 Step 8: Web Application API Endpoints

### 8.1 Plugin Sync API

Create `server/api/plugin/weapons/sync.post.ts`:

```typescript
import { z } from 'zod'

const SyncWeaponSchema = z.object({
  steamid: z.string(),
  defindex: z.number(),
  category: z.enum(['rifles', 'pistols', 'smgs', 'heavys']),
  team: z.number().min(1).max(2),
  paintindex: z.number(),
  paintseed: z.string(),
  paintwear: z.string(),
  stattrak_enabled: z.boolean(),
  stattrak_count: z.number(),
  nametag: z.string().optional(),
  stickers: z.array(z.object({
    id: z.number(),
    x: z.number(),
    y: z.number(),
    wear: z.number(),
    scale: z.number(),
    rotation: z.number()
  })).optional(),
  keychain: z.object({
    id: z.number(),
    x: z.number(),
    y: z.number(),
    z: z.number(),
    seed: z.number()
  }).optional()
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const data = SyncWeaponSchema.parse(body)

    // Get or create default loadout
    const loadout = await getOrCreateDefaultLoadout(data.steamid)

    // Format sticker data for database
    const stickerData = Array.from({ length: 5 }, (_, i) => {
      const sticker = data.stickers?.[i]
      return sticker ? `${sticker.id};${sticker.x};${sticker.y};${sticker.wear};${sticker.scale};${sticker.rotation}` : '0;0;0;0;0;0'
    })

    // Format keychain data
    const keychainData = data.keychain
      ? `${data.keychain.id};${data.keychain.x};${data.keychain.y};${data.keychain.z};${data.keychain.seed}`
      : '0;0;0;0;0'

    // Insert/update weapon data
    const tableName = `wp_player_${data.category}`
    const query = `
      INSERT INTO ${tableName}
      (steamid, loadoutid, active, team, defindex, paintindex, paintseed, paintwear,
       stattrak_enabled, stattrak_count, nametag, sticker_0, sticker_1, sticker_2, sticker_3, sticker_4, keychain)
      VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        paintindex = VALUES(paintindex),
        paintseed = VALUES(paintseed),
        paintwear = VALUES(paintwear),
        stattrak_enabled = VALUES(stattrak_enabled),
        stattrak_count = VALUES(stattrak_count),
        nametag = VALUES(nametag),
        sticker_0 = VALUES(sticker_0),
        sticker_1 = VALUES(sticker_1),
        sticker_2 = VALUES(sticker_2),
        sticker_3 = VALUES(sticker_3),
        sticker_4 = VALUES(sticker_4),
        keychain = VALUES(keychain),
        updated_at = CURRENT_TIMESTAMP
    `

    await executeQuery(query, [
      data.steamid, loadout.id, data.team, data.defindex, data.paintindex,
      data.paintseed, data.paintwear, data.stattrak_enabled, data.stattrak_count,
      data.nametag || '', ...stickerData, keychainData
    ])

    return { success: true, message: 'Weapon synced successfully' }

  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Sync failed: ${error.message}`
    })
  }
})

async function getOrCreateDefaultLoadout(steamid: string) {
  const existing = await executeQuery<any[]>(
    'SELECT id FROM wp_player_loadouts WHERE steamid = ? LIMIT 1',
    [steamid]
  )

  if (existing.length > 0) {
    return existing[0]
  }

  await executeQuery(
    'INSERT INTO wp_player_loadouts (steamid, name) VALUES (?, ?)',
    [steamid, 'Default Loadout']
  )

  const newLoadout = await executeQuery<any[]>(
    'SELECT id FROM wp_player_loadouts WHERE steamid = ? ORDER BY id DESC LIMIT 1',
    [steamid]
  )

  return newLoadout[0]
}
```

## 🧪 Step 9: Testing & Validation

### 9.1 Integration Test Script

Create `test_integration.js`:

```javascript
// Node.js test script for plugin integration
const mysql = require('mysql2/promise');
const axios = require('axios');

async function testIntegration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'cs2inspect'
  });

  // Test 1: Verify migration
  const [originalSkins] = await connection.execute('SELECT COUNT(*) as count FROM wp_player_skins');
  const [migratedWeapons] = await connection.execute(`
    SELECT
      (SELECT COUNT(*) FROM wp_player_rifles) +
      (SELECT COUNT(*) FROM wp_player_pistols) +
      (SELECT COUNT(*) FROM wp_player_smgs) +
      (SELECT COUNT(*) FROM wp_player_heavys) as count
  `);

  console.log(`Original skins: ${originalSkins[0].count}`);
  console.log(`Migrated weapons: ${migratedWeapons[0].count}`);

  // Test 2: API endpoint
  try {
    const response = await axios.post('http://localhost:3000/api/plugin/weapons/sync', {
      steamid: '76561198000000000',
      defindex: 7, // AK-47
      category: 'rifles',
      team: 1,
      paintindex: 44,
      paintseed: '123',
      paintwear: '0.15',
      stattrak_enabled: true,
      stattrak_count: 1337,
      nametag: 'Test AK'
    });

    console.log('API test passed:', response.data);
  } catch (error) {
    console.error('API test failed:', error.message);
  }

  await connection.end();
}

testIntegration().catch(console.error);
```

## 📋 Step 10: Deployment Checklist

### 10.1 Pre-Deployment
- [ ] Backup existing database
- [ ] Test migration script on copy
- [ ] Verify plugin compilation
- [ ] Test API endpoints
- [ ] Validate data integrity

### 10.2 Deployment Steps
1. Stop CS2 server
2. Backup plugin directory
3. Run database migration
4. Deploy modified plugin
5. Update web app with new API endpoints
6. Start CS2 server
7. Test integration

### 10.3 Post-Deployment
- [ ] Monitor server logs
- [ ] Test player skin synchronization
- [ ] Verify web app functionality
- [ ] Check performance metrics
- [ ] Document any issues

## 🎉 Conclusion

This integration enables seamless synchronization between the CS2 Weapon Paints plugin and your CS2Inspect web application, providing players with a unified experience across both platforms.

For support and updates, refer to the project documentation and community forums.
