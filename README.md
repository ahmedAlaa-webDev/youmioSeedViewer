# Youmio Seed Viewer - Chrome Extension

Chrome extension to view and analyze Youmio Seed NFT collections (Mythic and Ancient) with staking points calculations.

## Features

-  View Mythic and Ancient Seed NFTs from OpenSea
-  Display NFT prices in ETH
-  Show staking points for each NFT
-  Calculate points per ETH ratio (Best Deal finder)
-  Smart caching (images & points don't reload)
-  Highlight best deals
-  Beautiful responsive UI
-  Fast loading with optimized requests

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the extension folder
6. Get your OpenSea API key from [OpenSea Docs](https://docs.opensea.io/reference/api-keys)
7. Add your API key in `panel.js`:
   ```javascript
   const API_KEY = 'fdae3233ff1545ab8d5d7041e90ed89a';
   ```

## Usage

1. Click the extension icon in your toolbar
2. Select NFT type (Mythic or Ancient)
3. Click "Load NFTs"
4. Sort by:
   - **Best Deal** - Highest points per ETH
   - **Highest Price** - Most expensive first
   - **Lowest Price** - Cheapest first
5. Click any NFT card to view it on OpenSea
6. Copy donation wallet if you want to support! 💖

---

## Functions Overview

### Data Fetching Functions

**`fetchNFTListings(collectionSlug)`**
- Fetches all NFT listings from OpenSea API for a specific collection
- Parameters: collection slug (e.g., "mythicseed" or "ancientseed")
- Returns: Array of NFT listings
- Uses: OpenSea API v2

**`getImageUrl(listing)`**
- Gets the image URL for an NFT
- Checks cache first, then tries listing data, then fetches from OpenSea API
- Has 8 second timeout to prevent hanging
- Caches results to avoid repeated API calls
- Returns: Image URL or placeholder

**`fetchStakingPoints(tokenId, nftType)`**
- Fetches staking points from Youmio API via background script
- Checks cache first before making new requests
- Parameters: tokenId, nftType ("Mythic" or "Ancient")
- Returns: Staking points (number)
- Cache key: `nftType_tokenId`

### Data Processing Functions

**`formatPrice(listing)`**
- Converts price from wei to ETH
- Formats to 4 decimal places
- Returns: Formatted price string (e.g., "0.0500 ETH")

**`getNFTName(listing)`**
- Extracts NFT name from listing data
- Returns: "NFT #tokenId" or "Unknown NFT"

**`getTokenId(listing)`**
- Extracts token ID from listing protocol data
- Returns: Token ID string or null

**`getPriceValue(listing)`**
- Gets numeric price value in ETH
- Returns: Price as number (for calculations)

**`calculatePointsPerPrice(listing)`**
- Calculates points per ETH ratio
- Formula: stakingPoints / priceInETH
- Used to find best deals
- Returns: Ratio number (0 if missing data)

### Sorting Functions

**`sortByPointsPerPrice(listings)`**
- Sorts listings by points per ETH (descending)
- Best deals first
- Returns: Sorted array

**`sortByPrice(listings, ascending)`**
- Sorts listings by price
- Parameters: listings array, ascending (true/false)
- Returns: Sorted array

**`sortListings(listings, sortType)`**
- Main sorting function
- Sort types: "bestdeal", "highestprice", "lowestprice"
- Returns: Sorted array copy

### UI Functions

**`createNFTCard(listing)`**
- Creates an HTML card element for an NFT
- Shows: image, name, price, points, ratio, type badge
- Adds click handler to open on OpenSea
- Returns: Card DOM element

**`displayNFTs(listings)`**
- Main display function
- Clears pending requests
- Creates placeholder cards first
- Loads images and points in parallel
- Re-sorts and displays final cards

**`showError(message)`**
- Displays error message for 5 seconds
- Auto-hides after timeout

**`showLoading()` / `hideLoading()`**
- Show/hide loading spinner

**`loadNFTs()`**
- Main load function
- Gets selected NFT type
- Fetches listings
- Displays NFTs
- Handles errors

### Utility Functions

**`showDonationToast(message, duration)`**
- Shows toast notification
- Default duration: 3 seconds

**`copyDonationWallet()`**
- Copies donation wallet address to clipboard
- Fallback for older browsers
- Shows success/error toast

### Event Listeners

- **Fetch Button** - Loads NFTs when clicked
- **NFT Type Select** - Reloads when type changes
- **Sort Select** - Re-sorts current listings
- **Donate Button** - Copies wallet address
- **Scroll Button** - Smooth scroll to top
- **NFT Cards** - Opens OpenSea page on click

---

## Caching System

The extension uses 3 cache types:

1. **`imgCache`** - Stores NFT images (Map: tokenId → imageUrl)
2. **`pointsCache`** - Stores staking points (Map: "nftType_tokenId" → points)
3. **`pendingImgRequests`** - Tracks ongoing image requests (prevents duplicates)

**Benefits:**
- No repeated API calls
- Fast refresh/reload
- Works even with slow network

## Technologies Used

- Chrome Extension APIs
- OpenSea API v2
- Youmio Staking API
- Vanilla JavaScript (no frameworks)
- CSS Grid Layout
- Modern ES6+ features

## Support

If you find this extension helpful, consider donating:

**Wallet:** `0x6C38ED25778a2341ABe9B6eEe6112151c7F189E5`

## License

MIT License - Feel free to use and modify!
