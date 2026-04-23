// app/(dashboard)/margin/page.js
'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuote } from '@/components/QuoteProvider';
import { useAuth } from '@/components/AuthProvider';
import { gP, itemDN, fP, fD, C, cTot } from '@/lib/transform';

function MarginContent() {
  const { user } = useAuth();
  const { cats, sels, companies, ci, loading, loadQuote } = useQuote();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  const [quoteLoaded, setQuoteLoaded] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(!!quoteId);
  const [editing, setEditing] = useState(false);
  const [oMat, setOMat] = useState({}); // material overrides
  const [oLp, setOLp] = useState({}); // list price overrides

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
  const pill = (mp) => <span style={{fontSize:10,fontWeight:700,color:mp>=40?'#16a34a':mp>=25?'#ca8a04':'#dc2626',background:(mp>=40?'#dcfce7':mp>=25?'#fef9c3':'#fef2f2'),padding:'2px 8px',borderRadius:10}}>{mp}%</span>;
  const kv = (l,v,bold,clr) => <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #f3f4f6'}}><span style={{fontSize:11,color:'#555'}}>{l}</span><span style={{fontSize:11,fontWeight:bold?800:600,color:clr||'#333'}}>{v}</span></div>;

  // Build rows with overrides
  const secs=[]; let tMat=0,tLH=0,tLC=0,tPO=0,tList=0,t3rd=0;
  Object.entries(cats).forEach(([k,cat])=>{
    const co=companies[k]; if(!co)return; const rates=co.rates||{};
    Object.entries(cat).forEach(([sn,sec])=>{
      const rows=[]; (sec.items||[]).forEach(it=>{
        const s=(sels[k]||{})[it.id]; if(!s||!s.on)return;
        const q=it.hq&&s.q>0?s.q:1;
        const matKey=k+':'+it.id;
        const mat = oMat[matKey]!==undefined ? oMat[matKey] : (it.mc||0)*q;
        const lh=(it.lh||0)*q;
        const lc=Math.round(lh*(rates.laborRate||30)); const po=Math.round(lc*(rates.pohr||2)); const cost=mat+lc+po;
        const lpKey=k+':'+it.id;
        let lp = oLp[lpKey]!==undefined ? oLp[lpKey] : gP(it,s);
        const is3=sn.toLowerCase().includes('3rd');
        if(!is3 && oLp[lpKey]===undefined) lp=Math.round(lp*(1+(rates.markup||10)/100));
        const mg=lp-cost; const mp=lp>0?Math.round(mg/lp*100):0;
        rows.push({dn:itemDN(it,s),q,mat,lh,lc,po,cost,lp,mg,mp,itId:it.id,coKey:k});
        tMat+=mat; tLH+=lh; tLC+=lc; tPO+=po; tList+=lp; if(is3)t3rd+=lp;
      });
      if(rows.length>0){
        const sub={mat:0,lh:0,lc:0,po:0,cost:0,lp:0,mg:0};
        rows.forEach(r=>{sub.mat+=r.mat;sub.lh+=r.lh;sub.lc+=r.lc;sub.po+=r.po;sub.cost+=r.cost;sub.lp+=r.lp;sub.mg+=r.mg;});
        sub.mp=sub.lp>0?Math.round(sub.mg/sub.lp*100):0;
        secs.push({co:co.name,color:co.color,sn,rows,sub});
      }
    });
  });

  const has=secs.length>0; const manC=tMat+tLC+tPO; const mRev=tList-manC; const mPct=tList>0?Math.round(mRev/tList*100):0; const mEq=tList-t3rd;
  const coGroups={};
  secs.forEach(sec=>{
    if(!coGroups[sec.co])coGroups[sec.co]={color:sec.color,secs:[],totals:{mat:0,lh:0,lc:0,po:0,cost:0,lp:0,mg:0}};
    coGroups[sec.co].secs.push(sec);
    ['mat','lh','lc','po','cost','lp','mg'].forEach(f=>{coGroups[sec.co].totals[f]+=sec.sub[f];});
  });

  const eInput = (val, onChange, style={}) => editable
    ? <input type="number" value={Math.round(val)} onChange={e=>onChange(parseFloat(e.target.value)||0)} style={{width:70,textAlign:'right',fontSize:10,fontWeight:600,background:'#fffde7',border:'1px dashed #e0c000',borderRadius:3,padding:'1px 3px',fontFamily:'inherit',...style}} />
    : <span style={style}>{fD(val)}</span>;

  return (
    <div className="pdf-outer" style={{padding:20,background:'#d1d5db',minHeight:'calc(100vh - 56px)'}}>
      <div className="no-print" style={{textAlign:'center',marginBottom:20,display:'flex',justifyContent:'center',gap:10,alignItems:'center'}}>
        <button onClick={()=>window.history.back()} style={{padding:'10px 20px',borderRadius:8,border:'1px solid #ccc',background:'#fff',fontSize:12,fontWeight:600,color:'#666',cursor:'pointer'}}>← Back</button>
        <button onClick={()=>window.print()} style={{padding:'10px 28px',borderRadius:8,border:'none',background:C.navy,fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer'}}>Save as PDF</button>
        {isAdmin&&<button onClick={()=>setEditing(!editing)} style={{padding:'10px 20px',borderRadius:8,border:editing?'2px solid #e0c000':'1px solid #ccc',background:editing?'#fffde7':'#fff',fontSize:12,fontWeight:700,color:editing?'#b8860b':'#666',cursor:'pointer'}}>{editing?'\u2713 Editing On':'Edit Mode'}</button>}
        {editing&&<span style={{fontSize:10,color:'#b8860b'}}>Edit material costs & list prices — margins recalculate live</span>}
      </div>

      <div className="page-letter" style={{maxWidth:'11in',width:'11in',minHeight:'8.5in'}}>
        <div className="page-content" style={{padding:'0.4in 0.5in'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div><div contentEditable={ce} suppressContentEditableWarning style={{fontSize:18,fontWeight:800,color:C.navy}}>Margin Calculator</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{ci.name}{ci.name?' \u2022 ':''}Rev. {ci.revision}</div></div>
          <div style={{fontSize:9,color:'#dc2626',fontWeight:700,background:'#fef2f2',padding:'4px 12px',borderRadius:6}}>CONFIDENTIAL</div></div>

        {!has&&<div style={{textAlign:'center',padding:60,color:C.muted,fontSize:13}}>Select items in the Builder to see margin analysis</div>}

        {has&&<>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:20}}>
            {[{l:'Total List Price',v:fP(tList),c:C.navy},{l:'Manufacturing Cost',v:fD(manC),c:'#64748b'},{l:'Margin Revenue',v:fD(mRev),c:mPct>=40?'#16a34a':'#ca8a04'},{l:'Gross Margin',v:mPct+'%',c:mPct>=40?'#16a34a':'#ca8a04'}].map((kpi,i)=>(
              <div key={i} style={{background:'#fff',borderRadius:10,padding:'16px 18px',border:'1px solid '+C.border,borderTop:'3px solid '+kpi.c}}>
                <div style={{fontSize:9,fontWeight:700,color:C.muted,letterSpacing:'.05em'}}>{kpi.l}</div>
                <div style={{fontSize:22,fontWeight:800,color:kpi.c,marginTop:4}}>{kpi.v}</div></div>))}
          </div>

          {Object.entries(coGroups).map(([coName,grp])=>{
            const coMp=grp.totals.lp>0?Math.round(grp.totals.mg/grp.totals.lp*100):0;
            return(
              <div key={coName} style={{marginBottom:24,borderRadius:10,overflow:'hidden',border:'1px solid '+C.border}}>
                <div style={{background:grp.color,padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:16,fontWeight:800,color:'#fff'}}>{coName}</span>
                  <div style={{display:'flex',alignItems:'center',gap:16}}>
                    <div style={{textAlign:'right'}}><div style={{fontSize:8,color:'rgba(255,255,255,.5)'}}>COST</div><div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,.85)'}}>{fD(grp.totals.cost)}</div></div>
                    <div style={{textAlign:'right'}}><div style={{fontSize:8,color:'rgba(255,255,255,.5)'}}>LIST</div><div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{fP(grp.totals.lp)}</div></div>
                    <div style={{textAlign:'right'}}><div style={{fontSize:8,color:'rgba(255,255,255,.5)'}}>MARGIN</div><div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{fD(grp.totals.mg)}</div></div>
                    <div style={{background:'rgba(255,255,255,.2)',padding:'6px 14px',borderRadius:6,fontSize:15,fontWeight:800,color:'#fff'}}>{coMp}%</div></div></div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead><tr style={{background:'#f8f9fb'}}>
                    {['ITEM','QTY','MATERIAL','LABOR HRS','LABOR $','POHR','COST','LIST PRICE','MARGIN','M%'].map(x=>(
                      <th key={x} style={{padding:'7px 12px',textAlign:x==='ITEM'?'left':'right',fontSize:8,fontWeight:700,color:C.muted,borderBottom:'1px solid '+C.border}}>{x}</th>))}
                  </tr></thead>
                  <tbody>
                    {grp.secs.map((sec,si)=>[
                      <tr key={'hdr-'+si} style={{background:grp.color+'08'}}>
                        <td colSpan={7} style={{padding:'8px 12px',borderTop:si>0?'2px solid '+C.border:'none'}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:3,height:14,borderRadius:2,background:grp.color}}/><span contentEditable={ce} suppressContentEditableWarning style={{fontSize:11,fontWeight:700,color:grp.color}}>{sec.sn}</span></div></td>
                        <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,color:grp.color,borderTop:si>0?'2px solid '+C.border:'none'}}>{fP(sec.sub.lp)}</td>
                        <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,borderTop:si>0?'2px solid '+C.border:'none',color:sec.sub.mp>=40?'#16a34a':sec.sub.mp>=25?'#ca8a04':'#dc2626'}}>{fD(sec.sub.mg)}</td>
                        <td style={{padding:'8px 12px',textAlign:'right',borderTop:si>0?'2px solid '+C.border:'none'}}>{pill(sec.sub.mp)}</td></tr>,
                      ...sec.rows.map((r,ri)=>{const clr=r.mp>=50?'#16a34a':r.mp>=30?'#ca8a04':'#dc2626';return(
                        <tr key={'r-'+si+'-'+ri} style={{borderBottom:'1px solid #f3f4f6'}}>
                          <td contentEditable={ce} suppressContentEditableWarning style={{padding:'6px 12px 6px 24px',color:'#444'}}>{r.dn}</td>
                          <td style={{padding:'6px 12px',textAlign:'center',color:C.muted,fontSize:10}}>{r.q}</td>
                          <td style={{padding:'6px 12px',textAlign:'right'}}>{eInput(r.mat, v=>setOMat(p=>({...p,[r.coKey+':'+r.itId]:v})), {color:'#888',fontSize:10})}</td>
                          <td style={{padding:'6px 12px',textAlign:'right',color:'#888',fontSize:10}}>{r.lh.toFixed(1)}</td>
                          <td style={{padding:'6px 12px',textAlign:'right',color:'#888',fontSize:10}}>{fD(r.lc)}</td>
                          <td style={{padding:'6px 12px',textAlign:'right',color:'#888',fontSize:10}}>{fD(r.po)}</td>
                          <td style={{padding:'6px 12px',textAlign:'right',fontWeight:500,fontSize:10}}>{fD(r.cost)}</td>
                          <td style={{padding:'6px 12px',textAlign:'right'}}>{eInput(r.lp, v=>setOLp(p=>({...p,[r.coKey+':'+r.itId]:v})), {color:grp.color,fontWeight:600})}</td>
                          <td style={{padding:'6px 12px',textAlign:'right',fontWeight:500,color:clr}}>{fD(r.mg)}</td>
                          <td style={{padding:'6px 12px',textAlign:'right'}}>{pill(r.mp)}</td></tr>);})
                    ])}
                  </tbody></table></div>);})}

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginTop:8}}>
            <div style={{background:'#fff',borderRadius:10,border:'1px solid '+C.border,padding:18}}>
              <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:10,paddingBottom:8,borderBottom:'2px solid '+C.navy}}>Contract Info</div>
              {kv('Middleby Equipment',fD(mEq))}{kv('3rd Party',fD(t3rd))}{kv('Total Package',fD(tList),true,C.navy)}</div>
            <div style={{background:'#fff',borderRadius:10,border:'1px solid '+C.border,padding:18}}>
              <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:10,paddingBottom:8,borderBottom:'2px solid '+C.navy}}>POC Info</div>
              {kv('Material Cost',fD(tMat))}{kv('Labor Hours',tLH.toFixed(1)+' hrs')}{kv('Labor Cost',fD(tLC))}{kv('POHR',fD(tPO))}</div>
            <div style={{background:'#fff',borderRadius:10,border:'1px solid '+C.border,padding:18}}>
              <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:10,paddingBottom:8,borderBottom:'2px solid '+C.navy}}>Margin Summary</div>
              {kv('Equipment + 3rd Party',fD(tList))}{kv('Manufacturing Cost',fD(-manC),false,'#dc2626')}{kv('Margin Revenue',fD(mRev),true,mPct>=40?'#16a34a':'#ca8a04')}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:8}}>
                <span style={{fontSize:12,fontWeight:700}}>Gross Margin</span>{pill(mPct)}</div></div>
          </div>
        </>}
      </div>
    </div>
    </div>
  );
}

export default function MarginPage() {
  return <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 56px)'}}><div style={{fontSize:16,color:C.muted}}>Loading...</div></div>}><MarginContent /></Suspense>;
}
