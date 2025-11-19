export const getCryptoPrice = async (symbol: string, currency = "USD") => {
  try {
    // Free API: CoinGecko (No key needed for basic usage, has rate limits)
    // Or CoinCap
    const res = await fetch(`https://api.coincap.io/v2/assets?search=${symbol}&limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.data && data.data.length > 0) {
        const priceUsd = parseFloat(data.data[0].priceUsd);
        // If currency is KES, we would need an FX rate, but for now returning USD price
        // and letting frontend handle or assuming USD for crypto.
        return priceUsd;
    }
    return null;
  } catch (e) {
    console.error("Crypto fetch error", e);
    return null;
  }
};

export const getStockPrice = async (symbol: string) => {
    // Mock for now as free stock APIs like AlphaVantage have tight limits (5/min)
    // or require keys. We'll return a random fluctuation around a base price.
    // In a real app, you'd use a backend job to update these periodically.
    return null; 
}

