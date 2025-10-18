<<<<<<< HEAD
# OpenSea NFT Viewer - Chrome Extension

A Chrome extension that fetches and displays NFTs listed for sale from OpenSea collections.

## Features

- 🖼️ View NFTs from any OpenSea collection
- 💰 Display NFT prices in a clean grid layout
- 🔍 Search by collection slug
- ⚡ Fast and responsive UI
- 🎨 Beautiful gradient design
- ⌨️ Keyboard shortcut support (Ctrl+Shift+N / Cmd+Shift+N)

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the extension folder

## Usage

1. Click the extension icon in your Chrome toolbar, or use the keyboard shortcut (Ctrl+Shift+N / Cmd+Shift+N)
2. Enter a collection slug (e.g., "mythicseed", "boredapeyachtclub")
3. Click "Fetch NFTs" or press Enter
4. Browse the NFTs in the grid layout
5. Click on any NFT card to view it on OpenSea

## API Configuration

The extension uses the OpenSea API v2. For higher rate limits, you can add your OpenSea API key:

1. Get an API key from [OpenSea Developer Portal](https://docs.opensea.io/reference/api-keys)
2. Open `panel.js`
3. Add your API key to the `API_KEY` constant:
   ```javascript
   const API_KEY = 'your-api-key-here';
=======
# youmio-Seed-Viewer
View  youmio Seed  collection
>>>>>>> c40f7b361727f2efd70d055619a5bc592126ded6
