// app/(dashboard)/pdf/page.js
'use client';
import { Fragment, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuote } from '@/components/QuoteProvider';
import { gP, cTot, itemDN, fP, C } from '@/lib/transform';

function PDFContent() {
  const { cats, sels, companies, ci, mode, terms, loading, loadQuote } = useQuote();
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

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const { generateProposalPDF } = await import('@/lib/pdfgen');
      const doc = generateProposalPDF({ cats, sels, companies, ci, mode, terms, cTot, gP, itemDN });
      doc.save(`${ci.proposalNumber || 'Proposal'}_Rev${ci.revision || 1}.pdf`);
    } catch (e) { console.error('PDF generation failed:', e); alert('PDF generation failed: ' + e.message); }
    setGenerating(false);
  };

  if (loading || loadingQuote) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 56px)'}}><div style={{fontSize:16,color:C.muted}}>Loading{quoteId ? ' quote...' : '...'}</div></div>;

  const tots=Object.entries(cats).map(([k,cat])=>[k,cTot(cat,sels[k]||{})]);
  const gt=tots.reduce((a,[,t])=>a+t.g,0);
  const activeCos=tots.filter(([,t])=>t.g>0).map(([k])=>k);
  const stripe=<div style={{height:4,background:`linear-gradient(90deg,${C.navy} 40%,${C.blue} 40%,${C.blue} 70%,${C.red} 70%)`}}/>;
  const ps={width:720,margin:'0 auto 20px',background:'#fff',boxShadow:'0 2px 20px rgba(0,0,0,.1)',fontFamily:'Calibri,sans-serif'};

  return (
    <div style={{padding:20,background:'#e5e7eb',minHeight:'calc(100vh - 56px)'}}>
      <div className="no-print" style={{textAlign:'center',marginBottom:16}}>
        <button onClick={handleDownload} disabled={generating} style={{padding:'8px 24px',borderRadius:8,border:'none',background:generating?'#888':C.green,fontSize:13,fontWeight:600,color:'#fff',cursor:generating?'default':'pointer'}}>{generating?'Generating PDF...':'Download PDF'}</button></div>

      {/* Single continuous document */}
      <div className="pdf-doc" style={ps}>
        {stripe}
        <div style={{padding:'24px 40px'}}>
          {/* Header */}
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
            <span style={{fontSize:20,fontWeight:800,color:C.navy,fontStyle:'italic'}}>MIDDLEBY</span>
            <span style={{fontSize:7,color:C.muted,letterSpacing:'.1em'}}>FOOD PROCESSING</span></div>
          <div style={{fontSize:20,fontWeight:800,color:C.navy,marginBottom:2}}>{mode==='bundle'?'Bundle Equipment Proposal':'Equipment Proposal'}</div>
          <div style={{fontSize:10,color:C.muted,marginBottom:12}}>Proposal #{ci.proposalNumber} Rev. {ci.revision} | {ci.name||'—'} | {new Date().toLocaleDateString()}</div>

          {/* Company tags */}
          <div style={{display:'flex',gap:6,marginBottom:16}}>
            {activeCos.map(k=><div key={k} style={{padding:'4px 10px',background:companies[k]?.color,borderRadius:5}}><span style={{fontSize:9,fontWeight:700,color:'#fff'}}>{companies[k]?.name}</span></div>)}</div>

          {activeCos.length===0&&<div style={{textAlign:'center',padding:40,color:C.muted,fontSize:13}}>Select items in the Builder to generate the proposal.</div>}

          {/* Bundle intro */}
          {activeCos.length>0&&mode==='bundle'&&<div style={{marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:800,color:C.navy,marginBottom:10}}>The Complete Line Solution</div>
            {activeCos.map(k=>{const co=companies[k]; return(
              <div key={k} style={{display:'flex',gap:14,padding:'14px 16px',marginBottom:8,borderRadius:8,border:'1px solid '+co.color+'33',background:co.bg}}>
                <div style={{width:48,height:48,borderRadius:10,background:co.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,color:'#fff',flexShrink:0}}>{co.name[0]}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:co.color}}>{co.name}</div>
                  <div style={{fontSize:9,color:co.color,opacity:.7}}>{co.desc}</div>
                  {co.execSummary&&<div style={{fontSize:9,lineHeight:1.5,color:'#555',marginTop:3}}>{co.execSummary}</div>}</div></div>);})}
          </div>}

          {ci.purpose&&<div style={{fontSize:10,fontStyle:'italic',color:'#555',padding:'8px 12px',background:'#f9fafb',borderRadius:6,marginBottom:20}}>{ci.purpose}</div>}

          {/* Per-company sections */}
          {activeCos.map(k=>{
            const co=companies[k]; const cat=cats[k]||{}; const items=[];
            Object.entries(cat).forEach(([s,sec])=>(sec.items||[]).forEach(it=>{if(sels[k]?.[it.id]?.on)items.push({sec:s,it,sl:sels[k][it.id]});}));
            const coTotal=cTot(cat,sels[k]||{}).g;
            return(
              <div key={k} className="pdf-page" style={{marginTop:28,paddingTop:16,borderTop:'3px solid '+co.color}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <div style={{width:6,height:28,borderRadius:3,background:co.color}}/>
                  <div style={{flex:1}}><div style={{fontSize:16,fontWeight:800,color:co.color}}>{co.name}</div><div style={{fontSize:10,color:C.muted}}>{co.desc}</div></div>
                  <div style={{fontSize:14,fontWeight:800,color:co.color}}>{fP(coTotal)}</div></div>
                {co.machineImg&&<div style={{textAlign:'center',padding:20,background:'linear-gradient(135deg,#f8f9fb,#eef0f4)',borderRadius:10,marginBottom:14}}><img src={co.machineImg} style={{maxWidth:'100%',maxHeight:240,objectFit:'contain'}} alt={co.name}/></div>}
                {co.execSummary&&<div style={{fontSize:10,lineHeight:1.6,color:'#444',marginBottom:14,padding:'10px 14px',background:'#fafbfc',borderRadius:6,borderLeft:'3px solid '+co.color}}>{co.execSummary}</div>}
                {items.map((x,i)=>{
                  const prev=i>0?items[i-1].sec:null; const pr=gP(x.it,x.sl); const dn=itemDN(x.it,x.sl);
                  return(<Fragment key={i}>
                    {x.sec!==prev&&<div style={{fontSize:12,fontWeight:700,color:co.color,marginTop:10,marginBottom:3}}>{x.sec}</div>}
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}><span style={{fontSize:11,fontWeight:600}}>{dn}{x.it.hq&&x.sl.q>0?' — Qty. '+x.sl.q:''}</span><span style={{fontSize:11,fontWeight:700,color:co.color}}>{fP(pr)}</span></div>
                    {x.it.desc&&<div style={{fontSize:10,color:'#666',paddingLeft:8,fontStyle:'italic',marginTop:1}}>{x.it.desc}</div>}
                  </Fragment>);})}
                <div style={{display:'flex',justifyContent:'space-between',marginTop:16,paddingTop:8,borderTop:'2px solid '+co.color}}><span style={{fontSize:13,fontWeight:800,color:co.color}}>{co.name} Total</span><span style={{fontSize:13,fontWeight:800}}>{fP(coTotal)}</span></div>
              </div>);})}

          {/* Price Summary */}
          {activeCos.length>0&&<div style={{marginTop:28,borderTop:'2px solid '+C.navy,paddingTop:12}}>
            <div style={{fontSize:13,fontWeight:800,color:C.navy,marginBottom:10}}>Price Summary</div>
            {activeCos.map(k=>{const t=cTot(cats[k]||{},sels[k]||{});return(
              <div key={k} style={{display:'flex',justifyContent:'space-between',width:340,marginBottom:4}}>
                <span style={{fontSize:11,fontWeight:700,color:companies[k]?.color}}>{companies[k]?.name}</span>
                <span style={{fontSize:11,fontWeight:700}}>{fP(t.g)}</span></div>);})}
            <div style={{display:'flex',justifyContent:'space-between',width:340,padding:'8px 0',marginTop:4,borderTop:'3px double #333'}}>
              <span style={{fontSize:14,fontWeight:800,color:C.navy}}>{mode==='bundle'?'BUNDLE TOTAL:':'TOTAL:'}</span>
              <span style={{fontSize:14,fontWeight:800}}>{fP(gt)}</span></div></div>}

          {/* Terms */}
          {activeCos.length>0&&terms&&terms.trim()&&<div style={{marginTop:28,paddingTop:16,borderTop:'1px solid #ddd'}}>
            <div style={{fontSize:11,fontWeight:700,color:C.navy,marginBottom:8}}>Terms & Conditions</div>
            {terms.split('\n').map((line,i)=>{
              if(!line.trim())return <div key={i} style={{height:6}}/>;
              const isH=/^\d+\./.test(line.trim());
              return <div key={i} style={{fontSize:9,lineHeight:1.6,color:isH?'#333':'#555',fontWeight:isH?600:400}}>{line}</div>;})}</div>}
        </div>
        {stripe}
      </div>
    </div>
  );
}

export default function PDFPage() {
  return <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 56px)'}}><div style={{fontSize:16,color:C.muted}}>Loading...</div></div>}><PDFContent /></Suspense>;
}
