import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";

// --- Types ---
interface PriceEntry {
  product: string;
  currency: string;
  cost: number;
  countries: string[];
}

interface TableRow {
  id: string;
  product: string;
  originalCost: number;
  originalCurrency: string;
  convertedCost: number | null;
  targetCurrency: string;
  countries: string[];
}

const COMMON_CURRENCIES = ["AUD", "USD", "EUR", "GBP", "CAD", "JPY", "NZD", "SGD", "CHF", "CNY", "INR"];
const ALL_CURRENCIES = [
  "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN", 
  "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BRL", 
  "BSD", "BTN", "BWP", "BYN", "BZD", "CAD", "CDF", "CHF", "CLP", "CNY", 
  "COP", "CRC", "CUP", "CVE", "CZK", "DJF", "DKK", "DOP", "DZD", "EGP", 
  "ERN", "ETB", "EUR", "FJD", "FKP", "FOK", "GBP", "GEL", "GGP", "GHS", 
  "GIP", "GMD", "GNF", "GTQ", "GYD", "HKD", "HNL", "HRK", "HTG", "HUF", 
  "IDR", "ILS", "IMP", "INR", "IQD", "IRR", "ISK", "JEP", "JMD", "JOD", 
  "JPY", "KES", "KGS", "KHR", "KID", "KMF", "KRW", "KWD", "KYD", "KZT", 
  "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL", "MGA", "MKD", 
  "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MYR", "MZN", 
  "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN", "PGK", 
  "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR", 
  "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SLL", "SOS", "SRD", 
  "SSP", "STN", "SYP", "SZL", "THB", "TJS", "TMT", "TND", "TOP", "TRY", 
  "TTD", "TVD", "TWD", "TZS", "UAH", "UGX", "USD", "UYU", "UZS", "VES", 
  "VND", "VUV", "WST", "XAF", "XCD", "XDR", "XOF", "XPF", "YER", "ZAR", 
  "ZMW", "ZWL"
].filter(c => !COMMON_CURRENCIES.includes(c)); // Exclude common ones to avoid duplicates if we list them separately

// --- App Component ---
const App = () => {
  const [appId, setAppId] = useState("6477489729");
  const [targetCurrency, setTargetCurrency] = useState("AUD");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store raw app data to re-calculate conversions without re-fetching from Lambda
  const [rawAppData, setRawAppData] = useState<Record<string, PriceEntry[]> | null>(null);
  
  const [data, setData] = useState<TableRow[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof TableRow; direction: 'asc' | 'desc' } | null>({ key: 'originalCost', direction: 'asc' });
  
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  // 1. Fetch App Data (triggered by button)
  const fetchAppData = async () => {
    if (!appId) {
      setError("Please enter an App ID.");
      return;
    }

    setLoading(true);
    setError(null);
    setRawAppData(null);
    setData([]);
    setAvailableProducts([]);
    setSelectedProduct("");

    try {
      const baseUrl = (import.meta as any).env?.VITE_LAMBDA_URL;
      
      if (!baseUrl) {
        throw new Error("Configuration Error: VITE_LAMBDA_URL environment variable is not defined. Please check .env.local");
      }

      const lambdaUrl = `${baseUrl}?appId=${encodeURIComponent(appId)}`;
      const appRes = await fetch(lambdaUrl);
      if (!appRes.ok) throw new Error(`Failed to fetch app data: ${appRes.statusText}`);
      
      const appJson = await appRes.json();
      
      // Handle response structure
      let productGroups: Record<string, PriceEntry[]> = {};
      if ('body' in appJson && typeof appJson.body === 'object') {
          productGroups = appJson.body;
      } else {
          productGroups = appJson;
      }
      
      setRawAppData(productGroups);
      // The useEffect below will detect rawAppData change and trigger conversion

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setLoading(false);
    }
  };

  // 2. Update Conversion (triggered by rawAppData or targetCurrency change)
  useEffect(() => {
    const updateConversion = async () => {
      if (!rawAppData) return;

      setProcessing(true);
      setError(null);

      try {
        // Fetch Exchange Rates for the target currency
        const ratesRes = await fetch(`https://open.er-api.com/v6/latest/${targetCurrency}`);
        if (!ratesRes.ok) throw new Error("Failed to fetch exchange rates");
        const ratesData = await ratesRes.json();
        const rates = ratesData.rates;

        // Process & Aggregate Data
        const groupedData: Record<string, TableRow> = {};

        Object.keys(rawAppData).forEach((productName) => {
          if (productName === 'statusCode' || productName === 'headers') return;

          const entries = rawAppData[productName];
          if (!Array.isArray(entries)) return;

          entries.forEach((entry) => {
            // Group key: Product | Currency | Cost
            const pName = entry.product || productName;
            const groupKey = `${pName}|${entry.currency}|${entry.cost}`;

            if (!groupedData[groupKey]) {
                const rate = rates[entry.currency];
                let converted = null;
                if (rate) {
                  converted = entry.cost / rate;
                }

                groupedData[groupKey] = {
                  id: groupKey,
                  product: pName,
                  originalCost: entry.cost,
                  originalCurrency: entry.currency,
                  convertedCost: converted,
                  targetCurrency: targetCurrency,
                  countries: [...entry.countries],
                };
            } else {
                groupedData[groupKey].countries.push(...entry.countries);
            }
          });
        });

        const processedRows: TableRow[] = Object.values(groupedData).map(row => ({
            ...row,
            countries: Array.from(new Set(row.countries)).sort((a, b) => a.localeCompare(b))
        }));

        const products = Array.from(new Set(processedRows.map(r => r.product))).sort();
        setAvailableProducts(products);
        setData(processedRows);

      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Error calculating conversions");
      } finally {
        setLoading(false); // Ensure loading from initial fetch is off
        setProcessing(false);
      }
    };

    updateConversion();
  }, [rawAppData, targetCurrency]);

  // Separate effect to manage default selection to avoid race conditions in the main effect
  useEffect(() => {
    if (availableProducts.length > 0) {
      if (!selectedProduct || !availableProducts.includes(selectedProduct)) {
        setSelectedProduct(availableProducts[0]);
      }
    }
  }, [availableProducts]);


  // --- Filter Logic ---
  const filteredData = useMemo(() => {
      if (!selectedProduct) return [];
      return data.filter(row => row.product === selectedProduct);
  }, [data, selectedProduct]);

  // --- Sorting Logic ---
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];

      if (sortConfig.key === 'countries') {
          aValue = (a.countries[0] || '').toLowerCase();
          bValue = (b.countries[0] || '').toLowerCase();
      } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const requestSort = (key: keyof TableRow) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof TableRow) => {
    if (!sortConfig || sortConfig.key !== key) return <span className="sort-indicator">↕</span>;
    return <span className={`sort-indicator sort-active`}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (e) {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  return (
    <div>
      <h1>Global App Pricing Viewer</h1>
      
      <div className="controls">
        <div className="input-group">
          <label htmlFor="appId">App ID</label>
          <input
            id="appId"
            type="text"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder="e.g. com.example.app"
          />
        </div>

        <div className="input-group">
          <label htmlFor="currency">Convert to</label>
          <select
            id="currency"
            value={targetCurrency}
            onChange={(e) => setTargetCurrency(e.target.value)}
          >
            <optgroup label="Popular">
              {COMMON_CURRENCIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
            <optgroup label="All Currencies">
              {ALL_CURRENCIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
          </select>
        </div>
        
        {availableProducts.length > 0 && (
          <div className="input-group">
            <label htmlFor="productSelect">Select Product</label>
            <select
              id="productSelect"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              {availableProducts.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}

        <button onClick={fetchAppData} disabled={loading || processing}>
          {loading ? "Fetching..." : processing ? "Updating..." : "Fetch Pricing"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {filteredData.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort('product')}>
                  Product {getSortIcon('product')}
                </th>
                <th onClick={() => requestSort('originalCurrency')}>
                   Currency {getSortIcon('originalCurrency')}
                </th>
                <th onClick={() => requestSort('originalCost')}>
                  Local Price {getSortIcon('originalCost')}
                </th>
                <th onClick={() => requestSort('convertedCost')}>
                  Converted ({targetCurrency}) {getSortIcon('convertedCost')}
                </th>
                <th onClick={() => requestSort('countries')} style={{ width: "40%" }}>
                  Countries {getSortIcon('countries')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.product}</strong></td>
                  <td>{row.originalCurrency}</td>
                  <td className="price-cell">
                    {formatCurrency(row.originalCost, row.originalCurrency)}
                  </td>
                  <td className="price-cell">
                    {row.convertedCost !== null 
                      ? formatCurrency(row.convertedCost, row.targetCurrency)
                      : "N/A"}
                  </td>
                  <td className="countries-cell">
                    {row.countries.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {!loading && !processing && data.length === 0 && !error && (
        <p style={{ color: '#6b7280', textAlign: 'center', marginTop: '60px', fontSize: '16px' }}>
          Enter an App ID to view global pricing distribution.
        </p>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
