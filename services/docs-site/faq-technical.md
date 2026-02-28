# FAQ: Technical & Troubleshooting <Badge type="warning" text="Problem Solving" />

Technical issues, error messages, and troubleshooting guides.

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

### My loadout isn't being applied in-game

**Possible reasons**:

- CS2Inspect Plugin is not installed on the server
- Plugin is not configured to use the same database
- Plugin is not running or crashed
- Your loadout is not set as active
- Database connection issue between plugin and web app

**Solutions**:

1. **Verify plugin installation**: Check if the CS2Inspect Plugin is installed on the server
2. **Check plugin configuration**: Ensure the plugin uses the same database as the web application
3. **Check server logs**: Look for plugin errors in the CS2 server logs
4. **Verify active loadout**: Make sure you have an active loadout selected on the web application
5. **Test plugin commands**: Try using plugin commands in-game (e.g., `!cs2inspect`, `!loadout`)
6. **Restart server**: Ask admin to restart the CS2 server to reload the plugin

**Plugin Repository**: https://github.com/sak0a/CS2Inspect-Plugin

### Plugin and web app database mismatch

**Error**: Loadouts configured on web don't appear in-game

**Solutions**:

- Ensure both the plugin and web application use the **same database**:
    - Same database host
    - Same database port
    - Same database name
    - Same database user and password
- Check plugin configuration file (`config.json` in plugin directory)
- Check web application `.env` file
- Verify database connection from both components

---

## Troubleshooting Error Messages

### "Session expired" or "Please log in again"

**Cause**: Your authentication session has timed out.

**Solution**: Click "Login with Steam" again to authenticate.

### "Failed to load item data"

**Cause**: Cannot fetch item information from Steam or database.

**Solutions**:

1. Check internet connection
2. Retry the operation
3. Try a different item
4. Contact administrator if persistent

### "Invalid inspect URL"

**Cause**: The inspect link is malformed or incomplete.

**Solutions**:

1. Copy the full inspect link
2. Verify link format starts with `steam://rungame/730/...`
3. Try getting a fresh link from the source
4. Test with a different item's inspect link

### "Cannot connect to Steam"

**Cause**: Backend server cannot reach Steam servers.

**Solutions**:

1. Check if Steam is online (steamstat.us)
2. Contact server administrator
3. Wait for Steam services to recover
4. Try again later

### "Database error" or "Failed to save"

**Cause**: Server-side database issue.

**Solutions**:

1. This requires administrator intervention
2. Check server status page if available
3. Contact support with error details
4. Try again after a few minutes

### "Unauthorized" or "Access denied"

**Cause**: Not logged in or session invalid.

**Solutions**:

1. Log out and log back in
2. Clear cookies and try again
3. Check if your account is active
4. Contact support if persistent

---

## Development & Self-Hosting

### Can I host my own instance?

Yes! CS2Inspect is open source. See the [Setup Guide](setup.md) and [Deployment Guide](deployment.md) for instructions.

### What are the system requirements?

**Minimum**:

- Node.js 20+
- MariaDB 11+
- 1GB RAM
- 10GB disk space

**Recommended**:

- Node.js 20+ (LTS)
- Bun 1.x (for package management)
- MariaDB 11+
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

## Performance Optimization

### Why is the Visual Customizer slow?

The Visual Customizer uses HTML5 Canvas which can be CPU-intensive:

- Close other applications
- Use hardware acceleration in browser
- Reduce browser window size
- Disable unnecessary browser extensions

### How can I speed up page loading?

- Use a faster internet connection
- Enable browser caching
- Use a modern browser
- Close unnecessary tabs
- Clear old browser data

### Database is slow when loading loadouts

**Server-side issue**:

- Contact administrator
- Check database indexing
- Review server resources
- Consider database optimization

---

## Related Documentation

- **[General FAQ](faq-general.md)** - General questions and getting started
- **[Customization FAQ](faq-customization.md)** - Loadouts and weapon customization
- **[User Guide](user-guide.md)** - Complete usage guide
- **[Setup Guide](setup.md)** - Developer setup instructions
- **[Deployment Guide](deployment.md)** - Production deployment
