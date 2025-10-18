// Get all the DOM elements we need
const fetchButton = document.getElementById('fetchButton');
const nftTypeSelect = document.getElementById('nftTypeSelect');
const sortSelect = document.getElementById('sortSelect');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const nftGrid = document.getElementById('nftGrid');
const emptyState = document.getElementById('emptyState');

// Store our data
let currentListings = [];
let currentCollectionSlug = '';
let imgCache = new Map(); // cache the images so we don't load them again
let pendingImgRequests = new Map(); // track ongoing requests
let pointsCache = new Map(); // cache staking points

// API stuff
const OPENSEA_API_BASE = 'https://api.opensea.io/api/v2';
const API_KEY = 'fdae3233ff1545ab8d5d7041e90ed89a';
const STAKING_API_BASE = 'https://staking.youmio.ai/api';

// Fetch NFT listings from OpenSea
async function fetchNFTListings(collectionSlug) {
  if (!API_KEY) {
    console.error('No API key!');
    throw new Error('API Key is required');
  }

  console.log('Fetching listings for:', collectionSlug);
  const url = `${OPENSEA_API_BASE}/listings/collection/${collectionSlug}/all`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X-API-KEY': API_KEY
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API Key');
    }
    throw new Error(`API Error: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Got listings:', data.listings?.length || 0);
  return data.listings || [];
}

function formatPrice(listing) {
  try {
    if (!listing.price?.current) return 'Price not available';
    const value = parseFloat(listing.price.current.value) / 1e18;
    const currency = listing.price.current.currency || 'ETH';
    return `${value.toFixed(4)} ${currency}`;
  } catch (error) {
    return 'Price not available';
  }
}

// Get image URL for an NFT
async function getImageUrl(listing) {
  const tokenId = getTokenId(listing);
  if (!tokenId) return 'https://via.placeholder.com/300x300?text=No+ID';
  
  // check if we already have this image cached
  if (imgCache.has(tokenId)) {
    return imgCache.get(tokenId);
  }
  
  // try to get from listing data first
  if (listing.protocol_data?.parameters?.offer?.[0]) {
    const offer = listing.protocol_data.parameters.offer[0];
    if (offer.imageUrl) {
      imgCache.set(tokenId, offer.imageUrl);
      return offer.imageUrl;
    }
  }
  
  const contractAddress = listing.protocol_data?.parameters?.offer?.[0]?.token;
  if (!contractAddress) {
    return 'https://via.placeholder.com/300x300?text=No+Contract';
  }
  
  // if already loading this image, return that promise
  if (pendingImgRequests.has(tokenId)) {
    return pendingImgRequests.get(tokenId);
  }
  
  // start loading the image
  const promise = (async () => {
    try {
      const url = `${OPENSEA_API_BASE}/chain/ethereum/contract/${contractAddress}/nfts/${tokenId}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': API_KEY
        },
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (res.ok) {
        const data = await res.json();
        let imgUrl = data.nft?.image_url || data.nft?.display_image_url;
        if (imgUrl) {
          imgCache.set(tokenId, imgUrl);
          pendingImgRequests.delete(tokenId);
          return imgUrl;
        }
      }
    } catch (err) {
      // probably timeout or network error
    }
    
    // fallback to placeholder
    const placeholder = `https://via.placeholder.com/300x300/667eea/ffffff?text=NFT+%23${tokenId}`;
    imgCache.set(tokenId, placeholder);
    pendingImgRequests.delete(tokenId);
    return placeholder;
  })();
  
  pendingImgRequests.set(tokenId, promise);
  return promise;
}

function getNFTName(listing) {
  try {
    if (listing.protocol_data?.parameters?.offer?.[0]) {
      const tokenId = listing.protocol_data.parameters.offer[0].identifierOrCriteria;
      return `NFT #${tokenId}`;
    }
    return 'Unknown NFT';
  } catch (error) {
    return 'Unknown NFT';
  }
}

function getTokenId(listing) {
  try {
    if (listing.protocol_data?.parameters?.offer?.[0]) {
      return listing.protocol_data.parameters.offer[0].identifierOrCriteria;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function fetchStakingPoints(tokenId, nftType) {
  const cacheKey = `${nftType}_${tokenId}`;
  
  // check cache first
  if (pointsCache.has(cacheKey)) {
    return pointsCache.get(cacheKey);
  }
  
  try {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'fetchStakingPoints', tokenId: tokenId, nftType: nftType },
        (response) => {
          if (response && response.success) {
            pointsCache.set(cacheKey, response.points);
            resolve(response.points);
          } else {
            pointsCache.set(cacheKey, 0);
            resolve(0);
          }
        }
      );
    });
  } catch (error) {
    pointsCache.set(cacheKey, 0);
    return 0;
  }
}

function getPriceValue(listing) {
  try {
    if (!listing.price?.current?.value) return 0;
    return parseFloat(listing.price.current.value) / 1e18;
  } catch (error) {
    return 0;
  }
}

function calculatePointsPerPrice(listing) {
  const points = listing.stakingPoints || 0;
  const price = getPriceValue(listing);
  if (price === 0 || points === 0) return 0;
  return points / price;
}

function sortByPointsPerPrice(listings) {
  return listings.sort((a, b) => {
    const ratioA = calculatePointsPerPrice(a);
    const ratioB = calculatePointsPerPrice(b);
    return ratioB - ratioA;
  });
}

function sortByPrice(listings, ascending = false) {
  return listings.sort((a, b) => {
    const priceA = getPriceValue(a);
    const priceB = getPriceValue(b);
    return ascending ? priceA - priceB : priceB - priceA;
  });
}

function sortListings(listings, sortType) {
  switch(sortType) {
    case 'bestdeal':
      return sortByPointsPerPrice([...listings]);
    case 'highestprice':
      return sortByPrice([...listings], false);
    case 'lowestprice':
      return sortByPrice([...listings], true);
    default:
      return listings;
  }
}

async function createNFTCard(listing) {
  const card = document.createElement('div');
  card.className = 'nft-card';
  
  const name = getNFTName(listing);
  const price = formatPrice(listing);
  const points = listing.stakingPoints;
  const ratio = calculatePointsPerPrice(listing);
  
  const nftType = listing.nftType || 'Unknown';
  const typeBadge = nftType !== 'Unknown' ? `<span class="nft-type-badge">${nftType}</span>` : '';
  
  let pointsDisplay = 'Loading points...';
  let pointsClass = '';
  
  if (points !== undefined && points !== null) {
    if (points > 0) {
      pointsDisplay = `⭐ ${points} points`;
      pointsClass = 'points-loaded';
    } else {
      pointsDisplay = `⭐ 0 points`;
      pointsClass = 'points-zero';
    }
  }
  
  const tokenId = getTokenId(listing);
  const initialImage = listing.cachedImageUrl || `https://via.placeholder.com/300x300/667eea/ffffff?text=NFT+%23${tokenId || 'Loading'}`;
  
  card.innerHTML = `
    <div class="nft-image-container">
      ${typeBadge}
      <img src="${initialImage}" alt="${name}" class="nft-image" loading="lazy">
    </div>
    <div class="nft-info">
      <h3 class="nft-name" title="${name}">${name}</h3>
      <p class="nft-price">${price}</p>
      <p class="nft-points ${pointsClass}">
        ${pointsDisplay}
      </p>
      ${ratio > 0 ? `<p class="nft-ratio">📊 ${ratio.toFixed(2)} pts/ETH</p>` : ''}
    </div>
  `;
  
  const img = card.querySelector('.nft-image');
  if (img) {
    if (listing.cachedImageUrl) {
      img.src = listing.cachedImageUrl;
    } else {
      getImageUrl(listing).then(imageUrl => {
        img.src = imageUrl;
        listing.cachedImageUrl = imageUrl;
      });
    }
    
    img.onerror = () => {
      img.onerror = null;
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"%3E%3Crect fill="%23667eea" width="300" height="300"/%3E%3Ctext x="50%25" y="45%25" text-anchor="middle" fill="white" font-size="24" font-family="Arial"%3ENFT Image%3C/text%3E%3Ctext x="50%25" y="55%25" text-anchor="middle" fill="white" font-size="16" font-family="Arial"%3ENot Available%3C/text%3E%3C/svg%3E';
    };
  }
  
  card.addEventListener('click', () => {
    const tokenId = getTokenId(listing);
    const contractAddress = listing.protocol_data?.parameters?.offer?.[0]?.token;
    
    if (tokenId && contractAddress) {
      const openseaUrl = `https://opensea.io/assets/ethereum/${contractAddress}/${tokenId}`;
      chrome.tabs.create({ url: openseaUrl });
    }
  });
  
  return card;
}

async function displayNFTs(listings) {
  // clear any pending image requests from previous load
  pendingImgRequests.clear();
  
  nftGrid.innerHTML = '';
  
  if (listings.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  for (const listing of listings) {
    const card = await createNFTCard(listing);
    nftGrid.appendChild(card);
  }
  
  const imagePromises = listings.map(async (listing) => {
    const imageUrl = await getImageUrl(listing);
    listing.cachedImageUrl = imageUrl;
  });
  
  const pointsPromises = listings.map(async (listing) => {
    const tokenId = getTokenId(listing);
    const nftType = listing.nftType;
    if (tokenId && nftType) {
      const points = await fetchStakingPoints(tokenId, nftType);
      listing.stakingPoints = points;
    }
  });
  
  await Promise.all([...imagePromises, ...pointsPromises]);
  
  const sortType = sortSelect.value;
  const sorted = sortListings([...listings], sortType);
  nftGrid.innerHTML = '';
  
  for (let i = 0; i < sorted.length; i++) {
    const listing = sorted[i];
    const card = await createNFTCard(listing);
    
    if (sortType === 'bestdeal' && i === 0 && calculatePointsPerPrice(listing) > 0) {
      card.classList.add('best-deal');
      const badge = document.createElement('span');
      badge.className = 'best-deal-badge';
      badge.textContent = '🔥 Best Deal';
      card.querySelector('.nft-image-container').appendChild(badge);
    }
    nftGrid.appendChild(card);
  }
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
  setTimeout(() => {
    errorDiv.classList.add('hidden');
  }, 5000);
}

function showLoading() {
  loadingDiv.classList.remove('hidden');
  errorDiv.classList.add('hidden');
  nftGrid.innerHTML = '';
  emptyState.classList.add('hidden');
}

function hideLoading() {
  loadingDiv.classList.add('hidden');
}

async function loadNFTs() {
  const selectedType = nftTypeSelect.value;
  const collectionSlug = selectedType === 'Mythic' ? 'mythicseed' : 'ancientseed';
  currentCollectionSlug = collectionSlug;
  
  showLoading();
  
  try {
    const listings = await fetchNFTListings(collectionSlug);
    listings.forEach(listing => {
      listing.nftType = selectedType;
    });
    
    currentListings = listings;
    hideLoading();
    await displayNFTs(listings);
  } catch (error) {
    hideLoading();
    showError(`Failed to fetch ${selectedType} NFTs. Please try again.`);
  }
}

fetchButton.addEventListener('click', loadNFTs);
nftTypeSelect.addEventListener('change', loadNFTs);

sortSelect.addEventListener('change', async () => {
  if (currentListings.length === 0) return;
  
  const sortType = sortSelect.value;
  const sorted = sortListings([...currentListings], sortType);
  nftGrid.innerHTML = '';
  
  for (let i = 0; i < sorted.length; i++) {
    const listing = sorted[i];
    const card = await createNFTCard(listing);
    
    if (sortType === 'bestdeal' && i === 0 && calculatePointsPerPrice(listing) > 0) {
      card.classList.add('best-deal');
      const badge = document.createElement('span');
      badge.className = 'best-deal-badge';
      badge.textContent = '🔥 Best Deal';
      card.querySelector('.nft-image-container').appendChild(badge);
    }
    
    nftGrid.appendChild(card);
  }
});

function showDonationToast(message, duration = 3000) {
  const toast = document.getElementById('donationToast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}

async function copyDonationWallet() {
  const walletAddress = '0x6C38ED25778a2341ABe9B6eEe6112151c7F189E5';
  
  try {
    await navigator.clipboard.writeText(walletAddress);
    showDonationToast('✅ Wallet address copied! Thank you for your support! 💖');
  } catch (error) {
    const textArea = document.createElement('textarea');
    textArea.value = walletAddress;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      showDonationToast('✅ Wallet address copied! Thank you! 💖');
    } catch (err) {
      showDonationToast('❌ Failed to copy. Address: ' + walletAddress);
    }
    
    document.body.removeChild(textArea);
  }
}

const donateWalletBtn = document.getElementById('donateWalletBtn');
if (donateWalletBtn) {
  donateWalletBtn.addEventListener('click', copyDonationWallet);
}

const scrollToTopBtn = document.getElementById('scrollToTopBtn');

window.addEventListener('scroll', () => {
  if (window.pageYOffset > 300) {
    scrollToTopBtn.classList.remove('hidden');
  } else {
    scrollToTopBtn.classList.add('hidden');
  }
});

if (scrollToTopBtn) {
  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}