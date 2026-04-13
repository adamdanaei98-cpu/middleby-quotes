// app/(dashboard)/quotes/page.js
'use client';
import { useAuth } from '@/components/AuthProvider';
import { useState, useEffect } from 'react';
import { C } from '@/lib/transform';

const STATUS_CFG = {
  draft:{label:'Draft',color:'#6b7085',bg:'#f3f4f6'},
  submitted:{label:'Submitted',color:'#d97706',bg:'#fef3c7'},
  info_requested:{label:'Info Requested',color:'#9333ea',bg:'#f3e8ff'},
  reviewed:{label:'Reviewed',color:'#2563eb',bg:'#dbeafe'},
  approved:{label:'Approved',color:'#16a34a',bg:'#dcfce7'},
  expired:{label:'Expired',color:'#8b919e',bg:'#f3f4f6'},
};
const ROLES = {salesperson:'Salesperson',reviewer:'Reviewer',manager:'Manager',supervisor:'Supervisor'};
function fP(n){return '$'+Math.round(n||0).toLocaleString('en-US');}

export default function QuotesPage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/quotes');
      if (res.ok) { const d = await res.json(); setQuotes(d.quotes || []); }
      setLoading(false);
    }
    load();
  }, []);

  let filtered = quotes;
  if (filter !== 'all') filtered = filtered.filter(q => q.status === filter);
  if (search.trim()) {
    const s = search.toLowerCase();
    filtered = filtered.filter(q => (q.quoteNumber||'').toLowerCase().includes(s) || (q.customerName||'').toLowerCase().includes(s) || (q.createdBy?.name||'').toLowerCase().includes(s));
  }
  filtered.sort((a, b) => {
    let va=a[sortBy],vb=b[sortBy];
    if(sortBy==='grandTotal'){va=va||0;vb=vb||0;}
    if(sortBy==='createdAt'){va=new Date(va);vb=new Date(vb);}
    if(typeof va==='string'){va=va.toLowerCase();vb=(vb||'').toLowerCase();}
    if(va<vb)return sortDir==='asc'?-1:1;
    if(va>vb)return sortDir==='asc'?1:-1;
    return 0;
  });

  const stats = {
    total:quotes.length,
    draft:quotes.filter(q=>q.status==='draft').length,
    pending:quotes.filter(q=>q.status==='submitted'||q.status==='reviewed'||q.status==='info_requested').length,
    approved:quotes.filter(q=>q.status==='approved').length,
    totalValue:quotes.filter(q=>q.status==='approved').reduce((a,q)=>a+(q.grandTotal||0),0),
    pipelineValue:quotes.filter(q=>q.status!=='expired').reduce((a,q)=>a+(q.grandTotal||0),0),
  };

  const toggleSort = (col) => { if(sortBy===col)setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortBy(col);setSortDir(col==='grandTotal'?'desc':'asc');} };
  const sortIcon = (col) => sortBy!==col?'':sortDir==='asc'?' ↑':' ↓';

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 56px)'}}><div style={{fontSize:16,color:C.muted}}>Loading quotes...</div></div>;

  return (
    <div style={{maxWidth:1400,margin:'0 auto',padding:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><h1 style={{fontSize:22,fontWeight:800,color:'#003250',margin:0}}>Quotes Dashboard</h1>
          <p style={{fontSize:12,color:'#8b919e',marginTop:2}}>
            {user.role==='supervisor'?'All quotes across all companies':user.role==='manager'?'Quotes pending approval':'Your quotes'}</p></div></div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:20}}>
        {[{l:'Total Quotes',v:stats.total,c:'#003250'},{l:'Drafts',v:stats.draft,c:'#6b7085'},{l:'Pending',v:stats.pending,c:'#d97706'},{l:'Approved',v:stats.approved,c:'#16a34a'},{l:'Approved Value',v:fP(stats.totalValue),c:'#059669'},{l:'Pipeline Value',v:fP(stats.pipelineValue),c:'#003250'}].map(kpi=>(
          <div key={kpi.l} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e4e9',padding:'14px 16px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#8b919e',letterSpacing:'.05em',marginBottom:4}}>{kpi.l.toUpperCase()}</div>
            <div style={{fontSize:22,fontWeight:800,color:kpi.c}}>{kpi.v}</div></div>))}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:2,background:'#fff',padding:3,borderRadius:8,border:'1px solid #e2e4e9'}}>
          {['all','draft','submitted','info_requested','reviewed','approved'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:'5px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:11,fontWeight:600,background:filter===f?'#003250':'transparent',color:filter===f?'#fff':'#8b919e'}}>
              {f==='all'?'All':STATUS_CFG[f]?.label}{f!=='all'&&<span style={{marginLeft:4,opacity:.7}}>{quotes.filter(q=>q.status===f).length}</span>}</button>))}
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search quotes, customers..." style={{padding:'7px 14px',borderRadius:8,border:'1px solid #e2e4e9',fontSize:12,width:260,boxSizing:'border-box'}}/>
        <div style={{marginLeft:'auto',fontSize:11,color:'#8b919e'}}>{filtered.length} of {quotes.length} quotes</div>
      </div>

      <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e4e9',overflow:'hidden'}}>
        {filtered.length===0?<div style={{padding:40,textAlign:'center',color:'#8b919e'}}>{quotes.length===0?'No quotes yet. Create your first quote in the Builder.':'No quotes match your filters.'}</div>
        :<table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#f8f9fb'}}>
            {[{k:'quoteNumber',l:'Quote #'},{k:'status',l:'Status'},{k:'customerName',l:'Customer'},{k:'mode',l:'Type'},{k:'grandTotal',l:'Amount'},{k:'createdBy',l:'Created By'},{k:'createdAt',l:'Date'}].map(col=>(
              <th key={col.k} onClick={()=>col.k!=='createdBy'&&toggleSort(col.k)} style={{padding:'10px 14px',textAlign:col.k==='grandTotal'?'right':'left',fontSize:9,fontWeight:700,color:'#8b919e',borderBottom:'1px solid #e2e4e9',cursor:col.k!=='createdBy'?'pointer':'default',userSelect:'none'}}>{col.l.toUpperCase()}{sortIcon(col.k)}</th>))}
          </tr></thead>
          <tbody>{filtered.map(q=>{const sc=STATUS_CFG[q.status]||STATUS_CFG.draft;return(
            <tr key={q.id} style={{borderBottom:'1px solid #f3f4f6'}} onMouseOver={e=>e.currentTarget.style.background='#fafbfc'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
              <td style={{padding:'10px 14px',fontWeight:600,color:'#003250'}}>{q.quoteNumber}{q.revision>1&&<span style={{fontSize:9,color:'#8b919e',marginLeft:4}}>Rev.{q.revision}</span>}</td>
              <td style={{padding:'10px 14px'}}><span style={{fontSize:10,fontWeight:700,color:sc.color,background:sc.bg,padding:'3px 10px',borderRadius:10}}>{sc.label}</span></td>
              <td style={{padding:'10px 14px'}}><div style={{fontWeight:500}}>{q.customerName||'—'}</div>{q.customer?.plant&&<div style={{fontSize:10,color:'#8b919e'}}>{q.customer.plant}</div>}</td>
              <td style={{padding:'10px 14px'}}><span style={{fontSize:9,fontWeight:600,color:q.mode==='bundle'?'#003250':'#8b919e',background:q.mode==='bundle'?'#e0e7ff':'#f3f4f6',padding:'2px 8px',borderRadius:4,textTransform:'uppercase'}}>{q.mode}</span></td>
              <td style={{padding:'10px 14px',textAlign:'right',fontWeight:700,color:'#003250'}}>{fP(q.grandTotal)}</td>
              <td style={{padding:'10px 14px'}}><div style={{fontSize:11,fontWeight:500}}>{q.createdBy?.name||'—'}</div><div style={{fontSize:9,color:'#8b919e'}}>{q.createdBy?.role?ROLES[q.createdBy.role]:''}</div></td>
              <td style={{padding:'10px 14px',fontSize:11,color:'#8b919e'}}>{new Date(q.createdAt).toLocaleDateString()}</td>
            </tr>);})}</tbody>
        </table>}
      </div>
    </div>
  );
}
