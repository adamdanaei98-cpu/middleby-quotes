// components/QuoteProvider.js
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { dbToPrototypeCatalog, cTot } from '@/lib/transform';

const QuoteContext = createContext(null);

export function QuoteProvider({ children }) {
  const [cats, setCats] = useState({});
  const [sels, setSels] = useState({});
  const [companies, setCompanies] = useState({});
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('bundle');
  const [ci, setCi] = useState({
    name: '', contact: '', email: '', rep: '',
    proposalNumber: 'QC-' + Date.now().toString().slice(-6),
    revision: '1', purpose: '',
  });
  const [approval, setApproval] = useState({
    status: 'draft', reviewer: null, submittedAt: null, note: '',
  });
  const [terms, setTerms] = useState(
    '1. PRICING: All prices are in US Dollars and are valid for 30 days from proposal date. Prices are Ex-Works factory.\n\n2. PAYMENT TERMS: 30% deposit with order, 30% upon approval of general arrangement drawings, balance net 30 days from shipment.\n\n3. DELIVERY: Estimated delivery 16-20 weeks from receipt of order and approved drawings.\n\n4. WARRANTY: Equipment is warranted for a period of twelve (12) months from date of startup or fifteen (15) months from date of shipment, whichever occurs first.\n\n5. INSTALLATION: Installation supervision is available at prevailing per diem rates plus travel expenses.\n\n6. TAXES: Prices do not include any federal, state, or local taxes.\n\n7. CANCELLATION: Orders cancelled after acceptance are subject to cancellation charges.\n\n8. FORCE MAJEURE: Seller shall not be liable for delays due to causes beyond its reasonable control.'
  );

  useEffect(() => {
    async function load() {
      try {
        const [catRes, custRes] = await Promise.all([
          fetch('/api/catalog'),
          fetch('/api/customers'),
        ]);
        const catData = await catRes.json();
        const custData = await custRes.json();
        const { cats: c, companies: co, initSels } = dbToPrototypeCatalog(catData.companies || []);
        setCats(c);
        setCompanies(co);
        setSels(initSels);
        setCustomers(custData.customers || []);
      } catch (e) {
        console.error('Failed to load data:', e);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Computed totals
  const tots = Object.entries(cats).map(([k, cat]) => [k, cTot(cat, sels[k] || {})]);
  const gt = tots.reduce((a, [, t]) => a + t.g, 0);

  return (
    <QuoteContext.Provider value={{
      cats, setCats, sels, setSels, companies, setCompanies,
      customers, setCustomers, loading, mode, setMode,
      ci, setCi, approval, setApproval, terms, setTerms,
      tots, gt,
    }}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error('useQuote must be used within QuoteProvider');
  return ctx;
}
