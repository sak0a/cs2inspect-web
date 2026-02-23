# User Guide <Badge type="tip" text="For End Users" />

Welcome to CS2Inspect! This guide will help you get started with using the application to customize your CS2 loadouts.

## What You Need

To use CS2Inspect, you need:
- A **Steam account** (for login)
- A **web browser** (Chrome, Firefox, Edge, or Safari)
- An **internet connection**
- A **CS2 server with CS2Inspect Plugin installed** (required for in-game application)

::: warning Plugin Required
**CS2Inspect requires the CS2Inspect Plugin to be installed on your CS2 server.** The web application lets you configure loadouts, but the plugin applies them in-game. Without the plugin, you can configure loadouts on the web, but they won't be applied when you join a server.

**Plugin Repository**: https://github.com/sak0a/CS2Inspect-Plugin
:::

## Getting Started

### 1. Access the Application

Navigate to the CS2Inspect website in your web browser. The URL will be provided by your server administrator or community.

### 2. Log In with Steam

1. Click the **"Login with Steam"** button
2. You'll be redirected to Steam's login page
3. Enter your Steam credentials (your password goes to Steam, not CS2Inspect)
4. Authorize the application
5. You'll be redirected back to CS2Inspect, now logged in

::: warning Security Note
CS2Inspect uses Steam's official OpenID system. Your Steam password is never seen or stored by CS2Inspect. Only your public Steam ID and profile information are used.
:::

### 3. Create Your First Loadout

Once logged in, you'll start with a default loadout:

1. Click the **loadout selector** (usually at the top of the page)
2. Click **"New Loadout"**
3. Enter a name for your loadout (e.g., "Competitive", "Casual", "Red Theme")
4. Click **"Create"**

Your new loadout is now active and ready to customize!

::: tip In-Game Application
After configuring your loadout on the web, join a CS2 server with the CS2Inspect Plugin installed. Your loadout will be automatically applied when you spawn. The plugin reads your loadout configuration from the database and applies it in-game.
:::

## Customizing Your Loadout

### Weapons

To customize a weapon:

1. **Select the weapon** from the weapon grid or menu
2. **Choose a skin** from the available options
3. **Adjust settings**:
   - **Float Value**: Controls wear (lower = cleaner)
   - **StatTrak™**: Enable to add a kill counter
   - **Name Tag**: Give your weapon a custom name
4. **Add stickers** (optional):
   - Click an empty sticker slot
   - Search for a sticker
   - Click to apply it
5. **Save** your changes

::: tip Quick Tips
- Use the search bar to find skins quickly
- Click the preview to see your weapon in detail
- Changes are saved automatically
:::

### Knives

Knives work similar to weapons, but with some differences:

- You have **separate knives for T and CT** sides
- Select your knife type first (Karambit, Butterfly, M9 Bayonet, etc.)
- Then choose the skin and customize as normal
- Special skins like Doppler, Gamma Doppler, and Fade have unique variations

### Gloves

To customize gloves:

1. Click the **gloves section**
2. Select gloves for **T side** and **CT side** separately
3. Choose your glove model and skin
4. Adjust the float value for wear

::: info Note
Gloves don't support StatTrak™ or name tags.
:::

### Agents

Customize your player model:

1. Go to the **agents section**
2. Select agents for **T side** and **CT side**
3. Choose from various factions and characters
4. Save your selection

### Music Kits

1. Open the **music kit** selector
2. Browse or search for a music kit
3. Select your preferred music kit
4. It will apply to your loadout

### Pins

1. Navigate to the **pins section**
2. Add pins to your collection
3. Drag to rearrange pin display order
4. Save your pin selection

## Managing Multiple Loadouts

### Creating Multiple Loadouts

You can create as many loadouts as you want:

1. Click the **loadout selector**
2. Click **"New Loadout"**
3. Name it and click **"Create"**
4. Customize it differently from your other loadouts

### Switching Loadouts

1. Click the **loadout selector**
2. Select the loadout you want to use
3. Your configuration instantly switches to that loadout

### Renaming Loadouts

1. Click the **loadout selector**
2. Find the loadout you want to rename
3. Click the **edit/rename icon**
4. Enter the new name and save

### Deleting Loadouts

1. Click the **loadout selector**
2. Find the loadout you want to delete
3. Click the **delete icon**
4. Confirm deletion

::: warning Minimum Loadouts
You must always have at least one loadout. You cannot delete your last loadout.
:::

## Using Your Loadout In-Game

::: info Server Plugin Required
To use your loadouts in CS2 servers, the server must have the **CS2Inspect Plugin** installed. Contact your server administrator to enable this feature.
:::

Once you're on a server with the plugin:

1. **Your loadout loads automatically** when you join
2. Your configured weapons, knives, gloves, agents, music kit, and pin will appear in-game
3. Use in-game commands to manage your items:
   - **Switch loadout**: `!loadout <name>` or `!switch <name>`
   - **List loadouts**: `!loadouts`
   - **Change knife**: `!knife <type>` (e.g., `!knife karambit`)
   - **Change gloves**: `!glove <type>`
   - **Change agent**: `!agent <type>`
   - **Configure weapon**: `!g <weapon> <config>` (e.g., `!g ak47 printstream .02`)
   - **View all commands**: `!cs2inspect`
   - **Use Steam inventory items**: `!knife inventory`, `!glove inventory`, etc.
   - **Reset to vanilla**: `!knife default`, `!glove default`, etc.

::: tip Full Command Reference
For the complete list of commands including the advanced weapon configuration syntax, per-knife shortcuts, and admin commands, see the [Plugin Commands](plugin/commands.md) documentation.
:::

## Importing from Inspect Links

You can import item configurations from CS2 inspect links:

1. Copy an inspect link from:
   - Steam Market listings
   - In-game inspect links
   - Inventory items
2. Go to the **inspect link import** section in CS2Inspect
3. Paste the inspect link
4. Click **"Import"**
5. The item configuration will be loaded
6. Apply it to a weapon in your loadout

## Troubleshooting

### I can't log in with Steam

- Make sure you're using your correct Steam credentials
- Check that Steam is not down (visit steamstat.us)
- Try clearing your browser cache and cookies
- Make sure you're allowing redirects to Steam's login page

### My loadout isn't saving

- Check your internet connection
- Make sure you're logged in (check for your username at the top)
- Try refreshing the page
- If the issue persists, contact the server administrator

### Images aren't loading

- Check your internet connection
- The image server might be temporarily down
- Try refreshing the page
- Clear your browser cache

### The application is slow

- Check your internet connection speed
- Try using a different browser
- Clear your browser cache
- Close other browser tabs

### I don't see my loadout in-game

- Make sure the server has the CS2Inspect Plugin installed
- Try using `!knife` or `!glove` to refresh your items
- Use `!loadouts` to check which loadout is active
- Use `!loadout <name>` to switch to the correct loadout
- Verify you're logged into the same Steam account on the website
- Contact the server administrator if the issue persists

## Tips for Best Experience

### Browser Recommendations

For the best experience, we recommend:
- **Chrome** or **Edge** (best compatibility)
- **Firefox** (good compatibility)
- **Safari** (works well on Mac/iOS)

### Performance Tips

- Use a modern browser (updated within the last year)
- Close unnecessary browser tabs
- Make sure you have a stable internet connection
- Clear your browser cache if the app feels slow

### Organizing Loadouts

Create loadouts for different scenarios:
- **"Competitive"** - Your serious, try-hard skins
- **"Casual"** - Fun, colorful skins
- **"Budget"** - Lower-tier skins
- **"Red Theme"** - All red skins
- **"Blue Theme"** - All blue skins

## Privacy & Safety

### What Information is Stored

CS2Inspect stores:
- Your Steam ID (public information)
- Your loadout configurations
- Your login session

### What is NOT Stored

CS2Inspect does NOT store:
- Your Steam password
- Your actual CS2 inventory
- Any payment information
- Personal messages or communications

### Logging Out

When you're done:
1. Click your **username** or **profile icon**
2. Click **"Logout"**
3. You'll be logged out and returned to the login page

Your loadout data is saved and will be there when you log back in.

## Getting Help

If you need help:

1. **Check the FAQ** - Many common questions are answered there
2. **Ask in the Community** - Discord servers, forums, etc.
3. **Contact Server Admin** - For server-specific questions
4. **GitHub Issues** - For bug reports (if you're technical)

## Related Documentation

- **[FAQ](faq.md)** - Frequently asked questions
- **[How It Works](how-it-works.md)** - Detailed feature explanations
- **[Setup Guide](setup.md)** - For developers who want to host their own instance

---

*Enjoy customizing your CS2 loadouts!*
