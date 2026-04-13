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
  const [ci, setCi] = useState({ name: '', contact: '', email: '', rep: '', proposalNumber: 'QC-' + Date.now().toString().slice(-6), revision: '1', purpose: '' });
  const [approval, setApproval] = useState({ status: 'draft', reviewer: null, submittedAt: null, note: '' });
  const [terms, setTerms] = useState('1. PRICING: All prices in US Dollars, valid 30 days.\n\n2. PAYMENT: 30% deposit, balance net 30 from shipment.\n\n3. DELIVERY: 16-20 weeks from order.\n\n4. WARRANTY: 12 months from startup or 15 months from shipment.');
  const [navLogo, setNavLogo] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [catRes, custRes, settingsRes] = await Promise.all([fetch('/api/catalog'), fetch('/api/customers'), fetch('/api/settings')]);
        const catData = await catRes.json();
        const custData = await custRes.json();
        const { cats: c, companies: co, initSels } = dbToPrototypeCatalog(catData.companies || []);
        setCats(c); setCompanies(co); setSels(initSels); setCustomers(custData.customers || []);
        if (settingsRes.ok) { const sData = await settingsRes.json(); if (sData.settings?.terms) setTerms(sData.settings.terms); if (sData.settings?.navLogo) setNavLogo(sData.settings.navLogo); }
      } catch (e) { console.error('Load failed:', e); }
      setLoading(false);
    }
    load();
  }, []);

  const tots = Object.entries(cats).map(([k, cat]) => [k, cTot(cat, sels[k] || {})]);
  const gt = tots.reduce((a, [, t]) => a + t.g, 0);

  return (
    <QuoteContext.Provider value={{ cats, setCats, sels, setSels, companies, setCompanies, customers, setCustomers, loading, mode, setMode, ci, setCi, approval, setApproval, terms, setTerms, navLogo, setNavLogo, tots, gt }}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error('useQuote must be within QuoteProvider');
  return ctx;
}
