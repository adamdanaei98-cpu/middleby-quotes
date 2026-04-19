// app/(dashboard)/pdf/page.js
'use client';
import { Fragment, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuote } from '@/components/QuoteProvider';
import { gP, cTot, itemDN, fP, C } from '@/lib/transform';

function PDFContent() {
  const { cats, sels, companies, ci, mode, terms, loading, loadQuote, navLogo } = useQuote();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  const [quoteLoaded, setQuoteLoaded] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(!!quoteId);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (quoteId && !loading && !quoteLoaded) {
      setLoadingQuote(true);
      loadQuote(quoteId).then(() => { setQuoteLoaded(true); setLoadingQuote(false); });
    }
  }, [quoteId, loading, quoteLoaded]);

  if (loading || loadingQuote) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 56px)'}}><div style={{fontSize:16,color:C.muted}}>Loading...</div></div>;

  const activeCos = Object.keys(cats).filter(k => {
    const cat = cats[k]||{};
    return Object.values(cat).some(sec => (sec.items||[]).some(it => sels[k]?.[it.id]?.on));
  });
  let gt = 0;
  activeCos.forEach(k => { gt += cTot(cats[k]||{}, sels[k]||{}).g; });

  const stripe = <div style={{height:4,background:'linear-gradient(90deg,'+C.navy+' 40%,'+C.blue+' 40%,'+C.blue+' 70%,'+C.red+' 70%)'}} />;
  const docStyle = {width:680,margin:'0 auto 20px',background:'#fff',boxShadow:'0 2px 20px rgba(0,0,0,.1)',fontFamily:'Calibri, Arial, sans-serif'};
  const headerBar = <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #eee',marginBottom:10}}>
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      {navLogo ? <img src={navLogo} style={{height:18,objectFit:'contain'}} /> : <span style={{fontSize:11,fontWeight:800,color:C.navy,fontStyle:'italic'}}>MIDDLEBY</span>}
      <span style={{fontSize:6,color:C.muted,letterSpacing:'.08em'}}>FOOD PROCESSING</span>
    </div>
    <span style={{fontSize:7,color:C.muted}}>{ci.proposalNumber||''}</span>
  </div>;

  const handleDownload = () => { window.print(); };

  if (activeCos.length === 0) return (
    <div style={{padding:20,background:'#e5e7eb',minHeight:'calc(100vh - 56px)'}}>
      <div style={docStyle}><div style={{padding:40,textAlign:'center',color:C.muted}}>Select items in the Builder to generate a proposal.</div></div>
    </div>
  );

  return (
    <div style={{padding:20,background:'#e5e7eb',minHeight:'calc(100vh - 56px)'}}>
      <div className="no-print" style={{textAlign:'center',marginBottom:16}}>
        <button onClick={handleDownload} style={{padding:'10px 28px',borderRadius:8,border:'none',background:C.navy,fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer'}}>Save as PDF</button>
        <div style={{fontSize:10,color:C.muted,marginTop:6}}>Select "Save as PDF" as destination in the print dialog</div>
      </div>

      {/* ══════════════════════════════════════ */}
      {/* COVER PAGE */}
      {/* ══════════════════════════════════════ */}
      <div className="pdf-doc pdf-page" style={docStyle}>
        {stripe}
        <div style={{padding:'30px 40px 20px'}}>
          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24}}>
            {navLogo ? <img src={navLogo} style={{height:32,objectFit:'contain'}} /> : <span style={{fontSize:24,fontWeight:800,color:C.navy,fontStyle:'italic'}}>MIDDLEBY</span>}
            <span style={{fontSize:7,color:C.muted,letterSpacing:'.1em'}}>FOOD PROCESSING</span>
          </div>

          {/* Title */}
          <div style={{fontSize:24,fontWeight:800,color:C.navy,marginBottom:4}}>Equipment Proposal</div>
          <div style={{fontSize:14,fontWeight:600,color:C.navy,marginBottom:20}}>
            {mode==='bundle'?'Complete Line Solution':'Individual Quote'} for {ci.name||'Customer'}
          </div>

          {/* Customer info */}
          <div style={{background:'#f8f9fb',borderRadius:8,padding:'14px 18px',marginBottom:20,border:'1px solid #eef0f2'}}>
            <div style={{fontSize:8,fontWeight:700,color:C.muted,letterSpacing:'.06em',marginBottom:4}}>PREPARED FOR</div>
            <div style={{fontSize:16,fontWeight:700,color:C.navy}}>{ci.name||'\u2014'}</div>
            {ci.contact&&<div style={{fontSize:11,color:'#555',marginTop:2}}>Attn: {ci.contact}</div>}
            {ci.email&&<div style={{fontSize:10,color:C.muted}}>{ci.email}</div>}
          </div>

          {/* Proposal info */}
          <div style={{display:'flex',gap:30,fontSize:10,color:C.muted,marginBottom:24}}>
            <div><span style={{fontWeight:700}}>Proposal #:</span> {ci.proposalNumber||'\u2014'}</div>
            <div><span style={{fontWeight:700}}>Rev:</span> {ci.revision||'1'}</div>
            <div><span style={{fontWeight:700}}>Date:</span> {new Date().toLocaleDateString()}</div>
          </div>

          {ci.purpose&&<div style={{fontSize:10,fontStyle:'italic',color:'#666',padding:'10px 14px',background:'#fafbfc',borderRadius:6,borderLeft:'3px solid '+C.navy,marginBottom:24}}>{ci.purpose}</div>}

          {/* Divider */}
          <div style={{height:2,background:C.navy,marginBottom:20}} />

          {/* Company cards */}
          {activeCos.map(k => {
            const co = companies[k]; if (!co) return null;
            const coTotal = cTot(cats[k]||{}, sels[k]||{}).g;
            return (
              <div key={k} className="pdf-avoid-break" style={{display:'flex',gap:16,padding:'16px 18px',marginBottom:12,borderRadius:10,border:'1px solid '+co.color+'30',background:co.color+'06'}}>
                {co.machineImg ? <img src={co.machineImg} style={{width:100,height:70,objectFit:'contain',borderRadius:6,background:'#f8f9fb',flexShrink:0}} />
                  : <div style={{width:50,height:50,borderRadius:10,background:co.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff',flexShrink:0}}>{co.name[0]}</div>}
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                    <div style={{fontSize:15,fontWeight:700,color:co.color}}>{co.name}</div>
                    <div style={{fontSize:14,fontWeight:800,color:co.color}}>{fP(coTotal)}</div>
                  </div>
                  <div style={{fontSize:9,color:co.color,opacity:.7,marginBottom:4}}>{co.desc||''}</div>
                  {co.execSummary&&<div style={{fontSize:8.5,lineHeight:1.5,color:'#555'}}>{co.execSummary}</div>}
                </div>
              </div>
            );
          })}

          {/* Grand total on cover */}
          <div style={{marginTop:16,borderTop:'3px double '+C.navy,paddingTop:12,display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:16,fontWeight:800,color:C.navy}}>{mode==='bundle'?'Bundle Total':'Total'}</span>
            <span style={{fontSize:16,fontWeight:800,color:C.navy}}>{fP(gt)}</span>
          </div>
        </div>
        {stripe}
      </div>

      {/* ══════════════════════════════════════ */}
      {/* COMPANY PAGES - one per company */}
      {/* ══════════════════════════════════════ */}
      {activeCos.map(k => {
        const co = companies[k]; if (!co) return null;
        const cat = cats[k]||{};
        const coTotal = cTot(cat, sels[k]||{}).g;

        return (
          <div key={k} className="pdf-doc pdf-page" style={docStyle}>
            {stripe}
            <div style={{padding:'16px 40px 20px'}}>
              {headerBar}

              {/* Company header */}
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <div style={{width:4,height:24,borderRadius:2,background:co.color}} />
                <div style={{fontSize:18,fontWeight:800,color:co.color}}>{co.name}</div>
              </div>

              {/* Machine image */}
              {co.machineImg&&<div style={{textAlign:'center',padding:16,background:'linear-gradient(135deg,#f8f9fb,#eef0f4)',borderRadius:10,marginBottom:14}}>
                <img src={co.machineImg} style={{maxWidth:'100%',maxHeight:180,objectFit:'contain'}} /></div>}

              {/* Exec summary */}
              {co.execSummary&&<div style={{fontSize:9.5,lineHeight:1.6,color:'#444',marginBottom:14,padding:'10px 14px',background:'#fafbfc',borderRadius:6,borderLeft:'3px solid '+co.color}}>{co.execSummary}</div>}

              {/* Sections & Items */}
              {Object.entries(cat).map(([sn, sec]) => {
                const sectionItems = (sec.items||[]).filter(it => {
                  const s = sels[k]?.[it.id]; if (!s||!s.on) return false;
                  return gP(it,s) > 0 || (it.hq && s.q > 0);
                });
                if (sectionItems.length === 0) return null;
                return (
                  <div key={sn} className="pdf-avoid-break" style={{marginBottom:10}}>
                    <div style={{fontSize:12,fontWeight:700,color:co.color,marginBottom:4,paddingBottom:3,borderBottom:'1px solid '+co.color+'30'}}>{sn}</div>
                    {sectionItems.map(it => {
                      const s = sels[k][it.id];
                      const pr = gP(it, s);
                      const dn = itemDN(it, s);
                      const qtyStr = it.hq && s.q > 0 ? '  \u2014  Qty. '+s.q : '';
                      const descFirst = it.desc ? it.desc.split('\n').filter(l=>l.trim())[0]?.replace(/^[\u2022\-\s]+/,'').trim() : '';
                      return (
                        <div key={it.id} style={{padding:'4px 0 3px 8px',borderBottom:'1px solid #f3f4f6'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                            <span style={{fontSize:10.5,fontWeight:600,color:'#333'}}>{dn}{qtyStr}</span>
                            <span style={{fontSize:10.5,fontWeight:700,color:co.color}}>{fP(pr)}</span>
                          </div>
                          {descFirst&&<div style={{fontSize:8.5,color:'#888',fontStyle:'italic',paddingLeft:4,marginTop:1}}>{descFirst.substring(0,120)}</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Company total */}
              <div style={{marginTop:12,borderTop:'2px solid '+co.color,paddingTop:8,display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:13,fontWeight:800,color:co.color}}>{co.name} Total</span>
                <span style={{fontSize:13,fontWeight:800,color:co.color}}>{fP(coTotal)}</span>
              </div>
            </div>
            {stripe}
          </div>
        );
      })}

      {/* ══════════════════════════════════════ */}
      {/* PRICE SUMMARY PAGE */}
      {/* ══════════════════════════════════════ */}
      <div className="pdf-doc pdf-page" style={docStyle}>
        {stripe}
        <div style={{padding:'16px 40px 20px'}}>
          {headerBar}
          <div style={{fontSize:18,fontWeight:800,color:C.navy,marginBottom:16}}>Price Summary</div>

          <div style={{maxWidth:400}}>
            {activeCos.map(k => {
              const co = companies[k]; if (!co) return null;
              const t = cTot(cats[k]||{}, sels[k]||{}).g;
              return (
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f3f4f6'}}>
                  <span style={{fontSize:12,fontWeight:700,color:co.color}}>{co.name}</span>
                  <span style={{fontSize:12,fontWeight:700,color:'#333'}}>{fP(t)}</span>
                </div>
              );
            })}
            <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0',marginTop:4,borderTop:'3px double '+C.navy}}>
              <span style={{fontSize:16,fontWeight:800,color:C.navy}}>{mode==='bundle'?'BUNDLE TOTAL:':'TOTAL:'}</span>
              <span style={{fontSize:16,fontWeight:800,color:C.navy}}>{fP(gt)}</span>
            </div>
          </div>
        </div>
        {stripe}
      </div>

      {/* ══════════════════════════════════════ */}
      {/* TERMS & CONDITIONS PAGE */}
      {/* ══════════════════════════════════════ */}
      {terms&&terms.trim()&&<div className="pdf-doc pdf-page" style={docStyle}>
        {stripe}
        <div style={{padding:'16px 40px 20px'}}>
          {headerBar}
          <div style={{fontSize:16,fontWeight:800,color:C.navy,marginBottom:12}}>Terms & Conditions</div>
          {terms.split('\n').map((line,i) => {
            if (!line.trim()) return <div key={i} style={{height:6}} />;
            const isH = /^\d+\./.test(line.trim());
            return <div key={i} style={{fontSize:isH?10:9,lineHeight:1.7,color:isH?'#333':'#555',fontWeight:isH?700:400,marginBottom:isH?2:0}}>{line}</div>;
          })}
        </div>
        {stripe}
      </div>}
    </div>
  );
}

export default function PDFPage() {
  return <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 56px)'}}><div style={{fontSize:16,color:'#8b919e'}}>Loading...</div></div>}><PDFContent /></Suspense>;
}
