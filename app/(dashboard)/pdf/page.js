// app/(dashboard)/pdf/page.js
'use client';
import { Fragment, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuote } from '@/components/QuoteProvider';
import { useAuth } from '@/components/AuthProvider';
import { gP, cTot, itemDN, fP, C } from '@/lib/transform';

function PDFContent() {
  const { user } = useAuth();
  const { cats, sels, companies, ci, mode, terms, loading, loadQuote, navLogo } = useQuote();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  const [quoteLoaded, setQuoteLoaded] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(!!quoteId);
  const [editing, setEditing] = useState(false);

  // Override state for inline edits (admin only)
  const [oPrices, setOPrices] = useState({}); // { 'companyKey:itemId': number }
  const [oDescs, setODescs] = useState({}); // { 'companyKey:itemId': string }
  const [oExec, setOExec] = useState({}); // { companyKey: string }
  const [oTerms, setOTerms] = useState(null); // string or null
  const [oNotes, setONotes] = useState({}); // { 'companyKey:sectionName': string } extra notes per section

  useEffect(() => {
    if (quoteId && !loading && !quoteLoaded) {
      setLoadingQuote(true);
      loadQuote(quoteId).then(() => { setQuoteLoaded(true); setLoadingQuote(false); });
    }
  }, [quoteId, loading, quoteLoaded]);

  if (loading || loadingQuote) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 56px)'}}><div style={{fontSize:16,color:C.muted}}>Loading...</div></div>;

  const isAdmin = user?.isAdmin;
  const canEdit = isAdmin && editing;

  const activeCos = Object.keys(cats).filter(k => {
    const cat = cats[k]||{};
    return Object.values(cat).some(sec => (sec.items||[]).some(it => sels[k]?.[it.id]?.on));
  });

  // Price getter with overrides
  const getPrice = (k, it, s) => {
    const key = k+':'+it.id;
    if (oPrices[key] !== undefined) return oPrices[key];
    return gP(it, s);
  };

  // Company total with overrides
  const getCoTotal = (k) => {
    const cat = cats[k]||{};
    let total = 0;
    Object.values(cat).forEach(sec => {
      (sec.items||[]).forEach(it => {
        const s = sels[k]?.[it.id]; if (!s||!s.on) return;
        total += getPrice(k, it, s);
      });
    });
    return total;
  };

  let gt = 0;
  activeCos.forEach(k => { gt += getCoTotal(k); });

  // Editable field helpers
  const eStyle = canEdit ? {background:'#fffde7',border:'1px dashed #e0c000',borderRadius:3,padding:'1px 3px',cursor:'text'} : {};
  const eInput = (val, onChange, style={}) => canEdit
    ? <input value={val} onChange={e=>onChange(e.target.value)} onClick={e=>e.stopPropagation()} style={{...style,background:'#fffde7',border:'1px dashed #e0c000',borderRadius:3,padding:'1px 4px',fontFamily:'inherit',outline:'none',...style}} />
    : null;

  const stripe = <div style={{height:4,background:'linear-gradient(90deg,'+C.navy+' 40%,'+C.blue+' 40%,'+C.blue+' 70%,'+C.red+' 70%)'}} />;
  const docStyle = {width:680,margin:'0 auto 20px',background:'#fff',boxShadow:'0 2px 20px rgba(0,0,0,.1)',fontFamily:'Calibri, Arial, sans-serif'};
  const headerBar = <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #eee',marginBottom:10}}>
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      {navLogo ? <img src={navLogo} style={{height:18,objectFit:'contain'}} /> : <span style={{fontSize:11,fontWeight:800,color:C.navy,fontStyle:'italic'}}>MIDDLEBY</span>}
      <span style={{fontSize:6,color:C.muted,letterSpacing:'.08em'}}>FOOD PROCESSING</span>
    </div>
    <span style={{fontSize:7,color:C.muted}}>{ci.proposalNumber||''}</span>
  </div>;

  if (activeCos.length === 0) return (
    <div style={{padding:20,background:'#e5e7eb',minHeight:'calc(100vh - 56px)'}}>
      <div style={docStyle}><div style={{padding:40,textAlign:'center',color:C.muted}}>Select items in the Builder to generate a proposal.</div></div>
    </div>
  );

  const editTerms = oTerms !== null ? oTerms : terms;

  return (
    <div className="pdf-outer" style={{padding:20,background:'#e5e7eb',minHeight:'calc(100vh - 56px)'}}>
      <div className="no-print" style={{textAlign:'center',marginBottom:16,display:'flex',justifyContent:'center',gap:10,alignItems:'center'}}>
        <button onClick={()=>window.print()} style={{padding:'10px 28px',borderRadius:8,border:'none',background:C.navy,fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer'}}>Save as PDF</button>
        {isAdmin&&<button onClick={()=>setEditing(!editing)} style={{padding:'10px 20px',borderRadius:8,border:editing?'2px solid #e0c000':'1px solid #ccc',background:editing?'#fffde7':'#fff',fontSize:12,fontWeight:700,color:editing?'#b8860b':'#666',cursor:'pointer'}}>{editing?'Done Editing':'Edit Mode'}</button>}
      </div>
      {canEdit&&<div className="no-print" style={{textAlign:'center',marginBottom:12,fontSize:11,color:'#b8860b',background:'#fffde7',padding:'6px 16px',borderRadius:6,display:'inline-block',margin:'0 auto 12px',width:'fit-content'}}>
        Click any highlighted field to edit. Changes apply to this PDF only.
      </div>}

      {/* ══════════════════════════════════════ */}
      {/* COVER PAGE */}
      {/* ══════════════════════════════════════ */}
      <div className="pdf-doc pdf-page" style={docStyle}>
        {stripe}
        <div style={{padding:'30px 40px 20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24}}>
            {navLogo ? <img src={navLogo} style={{height:32,objectFit:'contain'}} /> : <span style={{fontSize:24,fontWeight:800,color:C.navy,fontStyle:'italic'}}>MIDDLEBY</span>}
            <span style={{fontSize:7,color:C.muted,letterSpacing:'.1em'}}>FOOD PROCESSING</span>
          </div>
          <div style={{fontSize:24,fontWeight:800,color:C.navy,marginBottom:4}}>Equipment Proposal</div>
          <div style={{fontSize:14,fontWeight:600,color:C.navy,marginBottom:20}}>
            {mode==='bundle'?'Complete Line Solution':'Individual Quote'} for {ci.name||'Customer'}
          </div>
          <div style={{background:'#f8f9fb',borderRadius:8,padding:'14px 18px',marginBottom:20,border:'1px solid #eef0f2'}}>
            <div style={{fontSize:8,fontWeight:700,color:C.muted,letterSpacing:'.06em',marginBottom:4}}>PREPARED FOR</div>
            <div style={{fontSize:16,fontWeight:700,color:C.navy}}>{ci.name||'\u2014'}</div>
            {ci.contact&&<div style={{fontSize:11,color:'#555',marginTop:2}}>Attn: {ci.contact}</div>}
            {ci.email&&<div style={{fontSize:10,color:C.muted}}>{ci.email}</div>}
          </div>
          <div style={{display:'flex',gap:30,fontSize:10,color:C.muted,marginBottom:24}}>
            <div><span style={{fontWeight:700}}>Proposal #:</span> {ci.proposalNumber||'\u2014'}</div>
            <div><span style={{fontWeight:700}}>Rev:</span> {ci.revision||'1'}</div>
            <div><span style={{fontWeight:700}}>Date:</span> {new Date().toLocaleDateString()}</div>
          </div>
          {ci.purpose&&<div style={{fontSize:10,fontStyle:'italic',color:'#666',padding:'10px 14px',background:'#fafbfc',borderRadius:6,borderLeft:'3px solid '+C.navy,marginBottom:24}}>{ci.purpose}</div>}
          <div style={{height:2,background:C.navy,marginBottom:20}} />

          {/* Company cards */}
          {activeCos.map(k => {
            const co = companies[k]; if (!co) return null;
            const coTotal = getCoTotal(k);
            const exec = oExec[k] !== undefined ? oExec[k] : (co.execSummary||'');
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
                  {canEdit
                    ? <textarea value={exec} onChange={e=>setOExec(p=>({...p,[k]:e.target.value}))} rows={3} style={{width:'100%',fontSize:8.5,lineHeight:1.5,color:'#555',background:'#fffde7',border:'1px dashed #e0c000',borderRadius:3,padding:4,fontFamily:'inherit',resize:'vertical'}} />
                    : exec&&<div style={{fontSize:8.5,lineHeight:1.5,color:'#555'}}>{exec}</div>}
                </div>
              </div>
            );
          })}
          <div style={{marginTop:16,borderTop:'3px double '+C.navy,paddingTop:12,display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:16,fontWeight:800,color:C.navy}}>{mode==='bundle'?'Bundle Total':'Total'}</span>
            <span style={{fontSize:16,fontWeight:800,color:C.navy}}>{fP(gt)}</span>
          </div>
        </div>
        {stripe}
      </div>

      {/* ══════════════════════════════════════ */}
      {/* COMPANY PAGES */}
      {/* ══════════════════════════════════════ */}
      {activeCos.map(k => {
        const co = companies[k]; if (!co) return null;
        const cat = cats[k]||{};
        const coTotal = getCoTotal(k);
        const exec = oExec[k] !== undefined ? oExec[k] : (co.execSummary||'');

        return (
          <div key={k} className="pdf-doc pdf-page" style={docStyle}>
            {stripe}
            <div style={{padding:'16px 40px 20px'}}>
              {headerBar}
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <div style={{width:4,height:24,borderRadius:2,background:co.color}} />
                <div style={{fontSize:18,fontWeight:800,color:co.color}}>{co.name}</div>
              </div>
              {co.machineImg&&<div style={{textAlign:'center',padding:16,background:'linear-gradient(135deg,#f8f9fb,#eef0f4)',borderRadius:10,marginBottom:14}}>
                <img src={co.machineImg} style={{maxWidth:'100%',maxHeight:180,objectFit:'contain'}} /></div>}
              {canEdit
                ? <textarea value={exec} onChange={e=>setOExec(p=>({...p,[k]:e.target.value}))} rows={3} style={{width:'100%',fontSize:9.5,lineHeight:1.6,color:'#444',background:'#fffde7',border:'1px dashed #e0c000',borderRadius:6,padding:'10px 14px',fontFamily:'inherit',resize:'vertical',marginBottom:14}} />
                : exec&&<div style={{fontSize:9.5,lineHeight:1.6,color:'#444',marginBottom:14,padding:'10px 14px',background:'#fafbfc',borderRadius:6,borderLeft:'3px solid '+co.color}}>{exec}</div>}

              {/* Sections & Items */}
              {Object.entries(cat).map(([sn, sec]) => {
                const sectionItems = (sec.items||[]).filter(it => {
                  const s = sels[k]?.[it.id]; if (!s||!s.on) return false;
                  return getPrice(k, it, s) > 0 || (it.hq && s.q > 0);
                });
                if (sectionItems.length === 0) return null;
                const noteKey = k+':'+sn;
                return (
                  <div key={sn} className="pdf-avoid-break" style={{marginBottom:10}}>
                    <div style={{fontSize:12,fontWeight:700,color:co.color,marginBottom:4,paddingBottom:3,borderBottom:'1px solid '+co.color+'30'}}>{sn}</div>
                    {sectionItems.map(it => {
                      const s = sels[k][it.id];
                      const pr = getPrice(k, it, s);
                      const dn = itemDN(it, s);
                      const qtyStr = it.hq && s.q > 0 ? '  \u2014  Qty. '+s.q : '';
                      const descKey = k+':'+it.id;
                      const descVal = oDescs[descKey] !== undefined ? oDescs[descKey] : (it.desc||'');
                      const descFirst = descVal ? descVal.split('\n').filter(l=>l.trim())[0]?.replace(/^[\u2022\-\s]+/,'').trim() : '';
                      return (
                        <div key={it.id} style={{padding:'4px 0 3px 8px',borderBottom:'1px solid #f3f4f6'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                            <span style={{fontSize:10.5,fontWeight:600,color:'#333'}}>{dn}{qtyStr}</span>
                            {canEdit
                              ? <input type="number" value={pr} onChange={e=>setOPrices(p=>({...p,[descKey]:parseFloat(e.target.value)||0}))} style={{width:80,fontSize:10.5,fontWeight:700,color:co.color,textAlign:'right',background:'#fffde7',border:'1px dashed #e0c000',borderRadius:3,padding:'1px 4px',fontFamily:'inherit'}} />
                              : <span style={{fontSize:10.5,fontWeight:700,color:co.color}}>{fP(pr)}</span>}
                          </div>
                          {canEdit
                            ? <textarea value={descVal} onChange={e=>setODescs(p=>({...p,[descKey]:e.target.value}))} rows={2} style={{width:'100%',fontSize:8.5,color:'#888',background:'#fffde7',border:'1px dashed #e0c000',borderRadius:3,padding:3,fontFamily:'inherit',fontStyle:'italic',resize:'vertical',marginTop:2}} />
                            : descFirst&&<div style={{fontSize:8.5,color:'#888',fontStyle:'italic',paddingLeft:4,marginTop:1}}>{descFirst.substring(0,120)}</div>}
                        </div>
                      );
                    })}
                    {/* Section note - admin can add extra text */}
                    {canEdit&&<textarea value={oNotes[noteKey]||''} onChange={e=>setONotes(p=>({...p,[noteKey]:e.target.value}))} placeholder="Add section note..." rows={1} style={{width:'100%',fontSize:8.5,color:'#666',background:'#fffde7',border:'1px dashed #e0c000',borderRadius:3,padding:3,fontFamily:'inherit',resize:'vertical',marginTop:4}} />}
                    {!canEdit&&oNotes[noteKey]&&<div style={{fontSize:8.5,color:'#666',fontStyle:'italic',marginTop:4,paddingLeft:4}}>{oNotes[noteKey]}</div>}
                  </div>
                );
              })}

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
              const t = getCoTotal(k);
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
      <div className="pdf-doc pdf-page" style={docStyle}>
        {stripe}
        <div style={{padding:'16px 40px 20px'}}>
          {headerBar}
          <div style={{fontSize:16,fontWeight:800,color:C.navy,marginBottom:12}}>Terms & Conditions</div>
          {canEdit
            ? <textarea value={editTerms} onChange={e=>setOTerms(e.target.value)} rows={20} style={{width:'100%',fontSize:9,lineHeight:1.7,color:'#444',background:'#fffde7',border:'1px dashed #e0c000',borderRadius:4,padding:10,fontFamily:'inherit',resize:'vertical'}} />
            : editTerms.split('\n').map((line,i) => {
              if (!line.trim()) return <div key={i} style={{height:6}} />;
              const isH = /^\d+\./.test(line.trim());
              return <div key={i} style={{fontSize:isH?10:9,lineHeight:1.7,color:isH?'#333':'#555',fontWeight:isH?700:400,marginBottom:isH?2:0}}>{line}</div>;
            })}
        </div>
        {stripe}
      </div>
    </div>
  );
}

export default function PDFPage() {
  return <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 56px)'}}><div style={{fontSize:16,color:'#8b919e'}}>Loading...</div></div>}><PDFContent /></Suspense>;
}
