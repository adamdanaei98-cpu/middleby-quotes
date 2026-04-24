// app/(dashboard)/pdf/page.js
'use client';
import { Fragment, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuote } from '@/components/QuoteProvider';
import { useAuth } from '@/components/AuthProvider';
import { gP, cTot, itemDN, fP, C } from '@/lib/transform';

function PDFContent() {
  const { user } = useAuth();
  const { cats, sels, companies, ci, mode, terms, loading, loadQuote, navLogo, pdfLogo } = useQuote();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  const [quoteLoaded, setQuoteLoaded] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(!!quoteId);
  const [editing, setEditing] = useState(false);
  const [oPrices, setOPrices] = useState({}); // price overrides: { 'coKey:itemId': number }

  useEffect(() => {
    if (quoteId && !loading && !quoteLoaded) {
      setLoadingQuote(true);
      loadQuote(quoteId).then(() => { setQuoteLoaded(true); setLoadingQuote(false); });
    }
  }, [quoteId, loading, quoteLoaded]);

  if (loading || loadingQuote) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 56px)'}}><div style={{fontSize:16,color:C.muted}}>Loading...</div></div>;

  const isAdmin = user?.isAdmin;
  const editable = isAdmin && editing;
  const ce = editable ? true : undefined;

  const activeCos = Object.keys(cats).filter(k => {
    const cat = cats[k]||{};
    return Object.values(cat).some(sec => (sec.items||[]).some(it => sels[k]?.[it.id]?.on));
  });

  // Price with overrides
  const getP = (k, it, s) => {
    const key = k+':'+it.id;
    return oPrices[key] !== undefined ? oPrices[key] : gP(it, s);
  };
  const setP = (k, itId, v) => setOPrices(p => ({...p, [k+':'+itId]: parseFloat(v)||0}));

  // Company total with overrides
  const coTot = (k) => {
    let t = 0;
    Object.values(cats[k]||{}).forEach(sec => {
      (sec.items||[]).forEach(it => {
        const s = sels[k]?.[it.id]; if (!s||!s.on) return;
        t += getP(k, it, s);
      });
    });
    return t;
  };

  let gt = 0;
  activeCos.forEach(k => { gt += coTot(k); });

  const stripe = <div style={{height:4,background:`linear-gradient(90deg,${C.navy} 40%,${C.blue} 40%,${C.blue} 70%,${C.red} 70%)`}} />;
  const hdr = (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:8,borderBottom:'1px solid #eee',marginBottom:12}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        {pdfLogo ? <img src={pdfLogo} style={{height:18,objectFit:'contain'}} /> : <span style={{fontSize:11,fontWeight:800,color:C.navy,fontStyle:'italic'}}>MIDDLEBY</span>}
        <span style={{fontSize:6.5,color:C.muted,letterSpacing:'.08em'}}>FOOD PROCESSING</span>
      </div>
      <span style={{fontSize:7.5,color:C.muted}}>{ci.proposalNumber||''}</span>
    </div>
  );

  if (activeCos.length === 0) return (
    <div className="pdf-outer" style={{padding:20,background:'#d1d5db',minHeight:'calc(100vh - 56px)'}}>
      <div className="page-letter"><div style={{padding:40,textAlign:'center',color:C.muted}}>Select items in the Builder to generate a proposal.</div></div>
    </div>
  );

  return (
    <div className="pdf-outer" style={{padding:20,background:'#d1d5db',minHeight:'calc(100vh - 56px)'}}>
      <div className="no-print" style={{textAlign:'center',marginBottom:20}}>
        <div style={{display:'inline-flex',gap:10,alignItems:'center'}}>
          <button onClick={()=>window.print()} style={{padding:'10px 28px',borderRadius:8,border:'none',background:C.navy,fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer'}}>Save as PDF</button>
          {isAdmin&&<button onClick={()=>setEditing(!editing)} style={{padding:'10px 20px',borderRadius:8,border:editing?'2px solid #e0c000':'1px solid #ccc',background:editing?'#fffde7':'#fff',fontSize:12,fontWeight:700,color:editing?'#b8860b':'#666',cursor:'pointer'}}>{editing?'✓ Editing On':'Edit Mode'}</button>}
        </div>
      </div>

      {/* ═══ COVER PAGE ═══ */}
      <div className="page-letter">
        <div className="page-stripe">{stripe}</div>
        <div className="page-content">
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24}}>
            {pdfLogo ? <img src={pdfLogo} style={{height:36,objectFit:'contain'}} /> : <span style={{fontSize:26,fontWeight:800,color:C.navy,fontStyle:'italic'}}>MIDDLEBY</span>}
            <span style={{fontSize:8,color:C.muted,letterSpacing:'.1em'}}>FOOD PROCESSING</span>
          </div>
          <div contentEditable={ce} suppressContentEditableWarning style={{fontSize:26,fontWeight:800,color:C.navy,marginBottom:4}}>Equipment Proposal</div>
          <div contentEditable={ce} suppressContentEditableWarning style={{fontSize:15,fontWeight:600,color:C.navy,marginBottom:24}}>
            {mode==='bundle'?'Complete Line Solution':'Individual Quote'} for {ci.name||'Customer'}
          </div>
          <div style={{background:'#f8f9fb',borderRadius:8,padding:'14px 18px',marginBottom:20,border:'1px solid #eef0f2'}}>
            <div style={{fontSize:8,fontWeight:700,color:C.muted,letterSpacing:'.06em',marginBottom:4}}>PREPARED FOR</div>
            <div contentEditable={ce} suppressContentEditableWarning style={{fontSize:17,fontWeight:700,color:C.navy}}>{ci.name||'\u2014'}</div>
            <div contentEditable={ce} suppressContentEditableWarning style={{fontSize:11,color:'#555',marginTop:3}}>Attn: {ci.contact||''}</div>
            {ci.email&&<div style={{fontSize:10,color:C.muted}}>{ci.email}</div>}
          </div>
          <div style={{display:'flex',gap:30,fontSize:10,color:C.muted,marginBottom:24}}>
            <div><span style={{fontWeight:700}}>Proposal #:</span> {ci.proposalNumber||'\u2014'}</div>
            <div><span style={{fontWeight:700}}>Rev:</span> {ci.revision||'1'}</div>
            <div><span style={{fontWeight:700}}>Date:</span> {new Date().toLocaleDateString()}</div>
          </div>
          {ci.purpose&&<div contentEditable={ce} suppressContentEditableWarning style={{fontSize:10,fontStyle:'italic',color:'#666',padding:'10px 14px',background:'#fafbfc',borderRadius:6,borderLeft:'3px solid '+C.navy,marginBottom:24}}>{ci.purpose}</div>}
          <div style={{height:2,background:C.navy,marginBottom:20}} />

          {activeCos.map(k => {
            const co = companies[k]; if (!co) return null;
            const ct = coTot(k);
            return (
              <div key={k} className="pdf-avoid-break" style={{display:'flex',gap:16,padding:'14px 16px',marginBottom:10,borderRadius:10,border:'1px solid '+co.color+'30',background:co.color+'06'}}>
                {co.machineImg ? <img src={co.machineImg} style={{width:100,height:70,objectFit:'contain',borderRadius:6,background:'#f8f9fb',flexShrink:0}} />
                  : <div style={{width:50,height:50,borderRadius:10,background:co.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff',flexShrink:0}}>{co.name[0]}</div>}
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                    <div style={{fontSize:15,fontWeight:700,color:co.color}}>{co.name}</div>
                    <div style={{fontSize:14,fontWeight:800,color:co.color}}>{fP(ct)}</div>
                  </div>
                  <div style={{fontSize:9,color:co.color,opacity:.7,marginBottom:4}}>{co.desc||''}</div>
                  <div contentEditable={ce} suppressContentEditableWarning style={{fontSize:8.5,lineHeight:1.5,color:'#555'}}>{co.execSummary||''}</div>
                </div>
              </div>
            );
          })}

          <div style={{marginTop:16,borderTop:'3px double '+C.navy,paddingTop:12,display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:16,fontWeight:800,color:C.navy}}>{mode==='bundle'?'Bundle Total':'Total'}</span>
            <span style={{fontSize:16,fontWeight:800,color:C.navy}}>{fP(gt)}</span>
          </div>
        </div>
        <div className="page-stripe">{stripe}</div>
      </div>

      {/* ═══ COMPANY PAGES ═══ */}
      {activeCos.map(k => {
        const co = companies[k]; if (!co) return null;
        const cat = cats[k]||{};
        const ct = coTot(k);
        return (
          <div key={k} className="page-letter">
            <div className="page-stripe">{stripe}</div>
            <div className="page-content">
              {hdr}
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <div style={{width:4,height:26,borderRadius:2,background:co.color}} />
                <div style={{fontSize:20,fontWeight:800,color:co.color}}>{co.name}</div>
              </div>
              {co.machineImg&&<div style={{textAlign:'center',padding:14,background:'linear-gradient(135deg,#f8f9fb,#eef0f4)',borderRadius:10,marginBottom:14}}>
                <img src={co.machineImg} style={{maxWidth:'100%',maxHeight:160,objectFit:'contain'}} /></div>}
              {co.execSummary&&<div contentEditable={ce} suppressContentEditableWarning style={{fontSize:9.5,lineHeight:1.6,color:'#444',marginBottom:14,padding:'10px 14px',background:'#fafbfc',borderRadius:6,borderLeft:'3px solid '+co.color}}>{co.execSummary}</div>}

              {Object.entries(cat).map(([sn, sec]) => {
                const items = (sec.items||[]).filter(it => {
                  const s = sels[k]?.[it.id]; if (!s||!s.on) return false;
                  return getP(k,it,s) > 0 || (it.hq && s.q > 0);
                });
                if (items.length === 0) return null;
                return (
                  <div key={sn} className="pdf-avoid-break" style={{marginBottom:10}}>
                    <div contentEditable={ce} suppressContentEditableWarning style={{fontSize:12,fontWeight:700,color:co.color,marginBottom:4,paddingBottom:3,borderBottom:'1px solid '+co.color+'30'}}>{sn}</div>
                    {items.map(it => {
                      const s = sels[k][it.id]; const pr = getP(k,it,s); const dn = itemDN(it, s);
                      const qtyStr = it.hq && s.q > 0 ? '  \u2014  Qty. '+s.q : '';
                      const descLines = (it.desc||'').split('\n').filter(l=>l.trim());
                      const descFirst = descLines[0]?.replace(/^[\u2022\-\s]+/,'').trim()||'';
                      return (
                        <div key={it.id} style={{padding:'4px 0 3px 8px',borderBottom:'1px solid #f3f4f6'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                            <span contentEditable={ce} suppressContentEditableWarning style={{fontSize:10.5,fontWeight:600,color:'#333'}}>{dn}{qtyStr}</span>
                            {editable
                              ? <input type="number" value={pr} onChange={e=>setP(k,it.id,e.target.value)} style={{width:90,fontSize:10.5,fontWeight:700,color:co.color,textAlign:'right',background:'#fffde7',border:'1px dashed #e0c000',borderRadius:3,padding:'2px 4px',fontFamily:'inherit'}} />
                              : <span style={{fontSize:10.5,fontWeight:700,color:co.color}}>{fP(pr)}</span>}
                          </div>
                          <div contentEditable={ce} suppressContentEditableWarning style={{fontSize:8.5,color:'#888',fontStyle:'italic',paddingLeft:4,marginTop:1}}>{descFirst?descFirst.substring(0,120):editable?'Add description...':''}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              <div style={{marginTop:12,borderTop:'2px solid '+co.color,paddingTop:8,display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:13,fontWeight:800,color:co.color}}>{co.name} Total</span>
                <span style={{fontSize:13,fontWeight:800,color:co.color}}>{fP(ct)}</span>
              </div>
            </div>
            <div className="page-stripe">{stripe}</div>
          </div>
        );
      })}

      {/* ═══ PRICE SUMMARY ═══ */}
      <div className="page-letter">
        <div className="page-stripe">{stripe}</div>
        <div className="page-content">
          {hdr}
          <div style={{fontSize:20,fontWeight:800,color:C.navy,marginBottom:20}}>Price Summary</div>
          <div style={{maxWidth:420}}>
            {activeCos.map(k => {
              const co = companies[k]; if (!co) return null;
              return (
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #f3f4f6'}}>
                  <span style={{fontSize:13,fontWeight:700,color:co.color}}>{co.name}</span>
                  <span style={{fontSize:13,fontWeight:700,color:'#333'}}>{fP(coTot(k))}</span>
                </div>
              );
            })}
            <div style={{display:'flex',justifyContent:'space-between',padding:'14px 0',marginTop:6,borderTop:'3px double '+C.navy}}>
              <span style={{fontSize:18,fontWeight:800,color:C.navy}}>{mode==='bundle'?'BUNDLE TOTAL:':'TOTAL:'}</span>
              <span style={{fontSize:18,fontWeight:800,color:C.navy}}>{fP(gt)}</span>
            </div>
          </div>
        </div>
        <div className="page-stripe">{stripe}</div>
      </div>

      {/* ═══ TERMS ═══ */}
      {terms&&terms.trim()&&<div style={{width:'8.5in',margin:'0 auto 24px',background:'#fff',boxShadow:'0 2px 16px rgba(0,0,0,.12)',padding:'0.5in 0.65in',fontFamily:'Inter,-apple-system,sans-serif',pageBreakBefore:'always'}}>
        {hdr}
        <div style={{fontSize:18,fontWeight:800,color:C.navy,marginBottom:14}}>Terms & Conditions</div>
        <div contentEditable={ce} suppressContentEditableWarning style={{fontSize:9.5,lineHeight:1.8,color:'#444'}}>
          {terms.split('\n').map((line,i) => {
            if (!line.trim()) return <br key={i} />;
            const isH = /^\d+\./.test(line.trim());
            return <div key={i} style={{fontWeight:isH?700:400,color:isH?'#333':'#555',marginBottom:isH?2:0}}>{line}</div>;
          })}
        </div>
      </div>}
    </div>
  );
}

export default function PDFPage() {
  return <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 56px)'}}><div style={{fontSize:16,color:'#8b919e'}}>Loading...</div></div>}><PDFContent /></Suspense>;
}
