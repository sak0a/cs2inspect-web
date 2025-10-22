# FAQ: General Questions <Badge type="info" text="Getting Started" />

Common questions about CS2Inspect and getting started.

## What is CS2Inspect?

CS2Inspect is a web application that allows Counter-Strike 2 players to customize and manage their in-game item loadouts. You can customize weapon skins, knives, gloves, agents, music kits, and pins with full control over float values, StatTrak™, stickers, and more.

## Is CS2Inspect free to use?

Yes, the application is open source and free to use. You need a Steam account to log in and save your configurations.

## Do I need CS2 to use this application?

You don't need CS2 installed to use the application. However, to import items from inspect URLs, the backend needs access to Steam's Game Coordinator, which requires a Steam account configured in the server.

## Will this modify my actual CS2 inventory?

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

## Privacy & Data

### What data does CS2Inspect store?

CS2Inspect stores:
- Your Steam ID (public information)
- Your loadout configurations
- Your item customizations
- Your session information

### What data is NOT stored?

CS2Inspect does NOT store:
- Your Steam password
- Your actual inventory items
- Your personal contact information
- Your payment information

### Can other users see my loadouts?

No, your loadouts are private to your account. Only you can view and edit your configurations.

### Is my data secure?

Yes. The application uses:
- HTTPS encryption for all communications
- Secure session management
- Database encryption at rest
- Regular security updates

### How long is my data stored?

Your loadout data is stored indefinitely unless you delete it. You can delete individual loadouts or contact support to delete your entire account.

---

## Features & Limitations

### What CS2 items can I customize?

You can customize:
- All weapon skins
- Knives (both T and CT side)
- Gloves (both T and CT side)
- Agents (all factions, both sides)
- Music kits
- Pins

### Can I import items from the Steam Market?

Yes! You can import item configurations from inspect URLs found on:
- Steam Community Market
- CS2 in-game inspect links
- Player inventories
- Trading websites

### Does this work in official matchmaking?

No. These loadouts only work on community servers that have the compatible CS2Inspect plugin installed. Official Valve matchmaking servers do not support custom loadout configurations.

### Can I use this on any CS2 server?

Only on servers with the CS2Inspect plugin installed. Ask your server administrator if they support CS2Inspect.

---

## Still Have Questions?

If your question isn't answered here, check out:

- **[User Guide](user-guide.md)** - Step-by-step usage instructions
- **[Customization FAQ](faq-customization.md)** - Questions about loadouts and weapon customization
- **[Technical FAQ](faq-technical.md)** - Technical issues and troubleshooting
- **[How It Works](how-it-works.md)** - Detailed feature explanations
- **GitHub Issues** - Report bugs or request features

---

## Related Documentation

- [User Guide](user-guide.md) - Complete usage guide
- [Setup Guide](setup.md) - Developer setup
- [Contributing](contributing.md) - How to contribute
