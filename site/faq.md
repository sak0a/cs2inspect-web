# Frequently Asked Questions (FAQ)

## General Questions

### What is CS2Inspect?

CS2Inspect is a web application that allows Counter-Strike 2 players to customize and manage their in-game item loadouts. You can customize weapon skins, knives, gloves, agents, music kits, and pins with full control over float values, StatTrak™, stickers, and more.

### Is CS2Inspect free to use?

Yes, the application is open source and free to use. You need a Steam account to log in and save your configurations.

### Do I need CS2 to use this application?

You don't need CS2 installed to use the application. However, to import items from inspect URLs, the backend needs access to Steam's Game Coordinator, which requires a Steam account configured in the server.

### Will this modify my actual CS2 inventory?

No, CS2Inspect does not and cannot modify your actual Steam inventory. It only stores your loadout configurations in the database for you to view and manage. To use these configurations in-game, you would need a compatible CS2 server plugin.

---

## Authentication & Account

### How do I log in?

Click the "Login with Steam" button and authenticate through Steam's OpenID system. You don't need to provide your Steam password to the application directly.

### Why is Steam login required?

Steam login is required to:
- Identify and save your unique loadout configurations
- Access your Steam profile information
- Ensure data security and ownership

### Can I log out?

Yes, you can log out from the user menu. Your loadout data will remain saved and accessible when you log back in.

### Is my Steam account safe?

Yes. The application uses Steam's official OpenID authentication system. Your Steam password is never sent to or stored by CS2Inspect. Only your public Steam ID and profile information are used.

---

## Loadouts

### What is a loadout?

A loadout is a complete configuration of your in-game items, including:
- Weapon skins (all weapon types)
- Knife skins (T and CT side)
- Glove skins (T and CT side)
- Agents (T and CT side)
- Music kit
- Pin collection

### Can I have multiple loadouts?

Yes! You can create unlimited loadouts (e.g., "Competitive", "Casual", "Red Theme"). Switch between them instantly.

### How do I create a new loadout?

1. Click the loadout selector
2. Click "New Loadout"
3. Enter a name
4. Click "Create"

Your new loadout is now active and ready to customize.

### Can I rename or delete loadouts?

Yes, use the loadout selector menu to:
- Rename: Click edit icon → Enter new name → Save
- Delete: Click delete icon → Confirm (you must have at least one loadout)

### Why can't I delete my last loadout?

You must always have at least one loadout. Create a new loadout before deleting the last one.

---

## Weapon Customization

### What can I customize on weapons?

For most weapons:
- **Skin**: Choose from thousands of available skins
- **Float Value**: Wear from 0.00 (Factory New) to 1.00 (Battle-Scarred)
- **Pattern Seed**: Affects pattern placement (0-1000)
- **StatTrak™**: Enable/disable and set kill count
- **Name Tag**: Custom weapon name (up to 20 characters)
- **Stickers**: Apply up to 5 stickers (weapon dependent)
- **Keychain**: Attach a keychain (CS2 feature)

### What is float value?

Float value determines the wear condition of a skin, ranging from 0.00 (Factory New - cleanest) to 1.00 (Battle-Scarred - most worn). Lower float values generally look better.

### What is pattern seed?

Pattern seed affects how the skin pattern is placed on the weapon. This is especially important for certain skins like Case Hardened, Fade, and Marble Fade where different patterns can have significantly different appearances.

### How do StatTrak™ weapons work?

StatTrak™ is a kill counter feature:
1. Enable StatTrak™ toggle
2. Set kill count (0-999999)
3. The weapon will display "StatTrak™" prefix

Note: Not all skins are available in StatTrak™ (e.g., contraband skins like Howl).

### How do I apply stickers?

1. Open weapon customization modal
2. Click "Add Sticker" on desired slot
3. Search for sticker in catalog
4. Select sticker
5. Adjust wear (0.0 = pristine, 1.0 = fully scratched)
6. Click "Apply"

Use the Visual Customizer for advanced positioning.

### What is the Visual Customizer?

The Visual Customizer is an advanced tool for precise sticker placement:
- Drag stickers to reposition
- Rotate stickers with handles
- Scale stickers
- Change sticker layering order
- Real-time preview on weapon

Access it from the weapon customization modal.

### Can I remove stickers?

Yes, click the "X" or trash icon on the sticker slot to remove it.

---

## Knives & Gloves

### How are knives different from weapons?

Knives:
- Can have StatTrak™
- Can have name tags
- Team-specific (separate T and CT knives)
- Special finishes (Doppler phases, Gamma Doppler, Fade)

### What are Doppler phases?

Doppler skins have different color variations (phases) that are determined by the pattern seed. Some phases (like Ruby, Sapphire, and Black Pearl) are rarer and more valuable than others.

### How do gloves work?

Gloves:
- Team-specific (T and CT side)
- No StatTrak™ support
- No name tags
- Float value affects wear
- Pattern seed affects pattern placement

Choose glove model first, then select skin.

---

## Inspect Links

### What is an inspect link?

An inspect link is a special URL from CS2 that contains encoded item data. You can get inspect links from:
- Steam Community Market
- CS2 in-game (right-click item → Copy Inspect Link)
- Player inventories
- Trading websites

### What are masked and unmasked URLs?

There are two types of inspect links:
- **Masked URLs**: Contain all item data encoded directly in the link (common on Steam Market)
- **Unmasked URLs**: Reference an item in someone's inventory (used for player inventory items)

Both types can be imported into CS2Inspect.

### How do I import an item from an inspect link?

1. Copy inspect link from CS2 or Steam Market
2. Click "Import from Inspect Link"
3. Paste URL
4. Click "Analyze"
5. Review item details
6. Click "Import to Loadout"

### Why does my inspect link fail to process?

Common reasons:
- **Invalid format**: Ensure you copied the complete URL
- **Unmasked URL without Steam account**: Server needs Steam credentials configured
- **Item no longer exists**: Item was deleted or made private
- **Steam GC timeout**: Steam's Game Coordinator is slow or unavailable
- **Rate limiting**: Too many requests, wait 1-2 seconds between requests

### Can I generate inspect links?

Yes, but this feature requires:
- Proper Steam account configuration on the server
- CRC32 checksum validation
- Protobuf encoding

Use the "Generate Inspect Link" button in weapon customization.

---

## Technical Issues

### The website won't load

**Troubleshooting steps**:
1. Check your internet connection
2. Clear browser cache and cookies
3. Try a different browser
4. Check if the server is online (contact admin)
5. Disable browser extensions that might interfere

### I can't log in with Steam

**Common causes**:
- Steam is down (check https://steamstat.us/)
- Cookies are disabled in your browser
- Browser is blocking pop-ups
- Steam Community is blocked by firewall

**Solutions**:
- Enable cookies and pop-ups
- Try incognito/private browsing mode
- Check firewall settings
- Wait and retry if Steam is having issues

### My loadout isn't saving

**Possible reasons**:
- No active internet connection
- Server database is down
- Session expired (log in again)
- Browser localStorage is full

**Solutions**:
1. Check browser console for errors (F12)
2. Try refreshing the page
3. Log out and log back in
4. Clear browser data and try again

### Images aren't loading

**Common causes**:
- CDN is down or blocked
- Ad blocker is interfering
- Network issue
- Missing image assets

**Solutions**:
- Disable ad blocker for this site
- Check browser console for 404 errors
- Try a different network
- Report missing images to developers

### The application is slow

**Performance tips**:
- Close unnecessary browser tabs
- Clear browser cache
- Use a modern browser (Chrome, Firefox, Edge)
- Check CPU/memory usage
- Disable browser extensions temporarily

### Database errors

**Error**: "Database connection failed"

**Solutions**:
- This is a server-side issue
- Contact server administrator
- Check server logs if you have access
- Wait for admin to fix database connection

---

## Development & Self-Hosting

### Can I host my own instance?

Yes! CS2Inspect is open source. See the [Setup Guide](setup.md) and [Deployment Guide](deployment.md) for instructions.

### What are the system requirements?

**Minimum**:
- Node.js 16+
- MariaDB/MySQL 10+
- 1GB RAM
- 10GB disk space

**Recommended**:
- Node.js 18+
- MariaDB 10.11+
- 2GB+ RAM
- 20GB+ disk space

### Do I need a Steam account for self-hosting?

**Steam API Key**: Required (for authentication)
**Steam Bot Account**: Optional (only for unmasked inspect URLs)

Get Steam API key: https://steamcommunity.com/dev/apikey

### How do I contribute?

See the [Contributing Guide](contributing.md) for:
- Code standards
- Development workflow
- Pull request process
- Issue guidelines

### Where can I report bugs?

Report bugs on GitHub Issues:
1. Search existing issues first
2. Create new issue if not found
3. Include detailed description
4. Add screenshots if applicable
5. Specify browser/OS version

---

## Features & Limitations

### Can I use this in CS2 servers?

CS2Inspect stores loadout configurations in a database. To use them in actual CS2 servers, you need:
1. A compatible CS2 server plugin
2. Server admin access
3. Plugin configured to read from CS2Inspect database

The application itself doesn't directly modify game servers.

### Does this work with CS:GO?

The application is designed for CS2 (Counter-Strike 2). While many concepts are similar to CS:GO, CS2 introduces new features like keychains that didn't exist in CS:GO.

### Are all CS2 items supported?

Currently supported:
- ✅ Weapon skins (all categories)
- ✅ Knife skins (all knife types)
- ✅ Glove skins (all glove types)
- ✅ Agents (all factions)
- ✅ Music kits
- ✅ Stickers
- ✅ Keychains
- ✅ Pins

### Can I import my CS2 inventory?

Not currently. You can:
- Import individual items via inspect links
- Manually configure items to match your inventory

Bulk inventory import may be added in future versions.

### Is there a mobile app?

No dedicated mobile app, but the web application is responsive and works on mobile browsers.

---

## Privacy & Data

### What data do you store?

We store:
- Steam ID (public identifier)
- Steam username and avatar (public profile data)
- Your loadout configurations
- Weapon/knife/glove customizations

We do NOT store:
- Steam password
- Email address (unless you provide it)
- Private profile information
- Trading history
- Real inventory data

### Can I delete my data?

Yes. Contact the server administrator to request data deletion, or delete your loadouts manually if you're self-hosting.

### Is my data shared with third parties?

No. Your loadout data is private and only visible to you (unless you explicitly share it).

### How is my data secured?

- Passwords hashed with bcrypt
- JWT tokens for authentication
- HTTPS encryption (in production)
- Database access restricted
- Regular security updates

---

## Troubleshooting Error Messages

### "Invalid JWT token"

**Cause**: Your session expired or token is corrupted

**Solution**: Log out and log back in

---

### "Database error"

**Cause**: Server database issue

**Solution**: Contact administrator or retry later

---

### "Steam API unavailable"

**Cause**: Steam's API is down or rate limited

**Solution**: Wait a few minutes and retry

---

### "Invalid inspect URL format"

**Cause**: URL is malformed or incomplete

**Solution**: 
- Ensure you copied the complete URL
- Try different format (see [How It Works](how-it-works.md))
- Check for special characters or encoding issues

---

### "Steam Game Coordinator timeout"

**Cause**: Steam's GC is slow or unavailable

**Solution**:
- Wait 1-2 seconds between requests
- Retry the request
- Check Steam server status
- Try again during off-peak hours

---

### "Unauthorized"

**Cause**: Not logged in or session expired

**Solution**: Log in with Steam

---

### "Weapon not found"

**Cause**: Trying to customize a weapon that doesn't exist

**Solution**: 
- Refresh the page
- Select weapon from the weapon tabs
- Create a new weapon configuration

---

## Still Have Questions?

- **Documentation**: Check the [docs/](.) directory
- **GitHub Issues**: Search for similar questions
- **GitHub Discussions**: Ask the community
- **Contact**: Reach out to maintainers

---

## Related Documentation

- [Setup Guide](setup.md) - Development environment setup
- [How It Works](how-it-works.md) - Detailed user flows
- [API Reference](api.md) - API documentation
- [Contributing](contributing.md) - How to contribute
- [Architecture](architecture.md) - System architecture
