// app/(dashboard)/quotes/page.js
'use client';
import { useAuth } from '@/components/AuthProvider';
import { useState, useEffect, Fragment } from 'react';
import { C } from '@/lib/transform';

const STATUS = {
  draft:{l:'Draft',c:'#6b7085',bg:'#f3f4f6'},
  submitted:{l:'Submitted',c:'#d97706',bg:'#fef3c7'},
  info_requested:{l:'Info Requested',c:'#9333ea',bg:'#f3e8ff'},
  reviewed:{l:'Reviewed',c:'#2563eb',bg:'#dbeafe'},
  approved:{l:'Approved',c:'#16a34a',bg:'#dcfce7'},
  sent:{l:'Sent to Customer',c:'#0891b2',bg:'#cffafe'},
  expired:{l:'Expired',c:'#8b919e',bg:'#f3f4f6'},
};
const ROLES={salesperson:'Sales Rep',reviewer:'Reviewer',manager:'Manager',supervisor:'Executive',it:'IT Admin'};
const fP=n=>'$'+Math.round(n||0).toLocaleString('en-US');

export default function QuotesPage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null); // detail modal
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [acting, setActing] = useState(false);
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState('');
  const [allCompanies, setAllCompanies] = useState([]);
  const [divFilter, setDivFilter] = useState('all');
  const [coFilter, setCoFilter] = useState('all');
  const [sortCol, setSortCol] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  // Multi-select
  const [checked, setChecked] = useState(new Set());
  // Column filters
  const [colFilters, setColFilters] = useState({});
  const [showColFilter, setShowColFilter] = useState(null);

  const loadQuotes = async () => {
    const res = await fetch('/api/quotes');
    if (res.ok) { const d = await res.json(); setQuotes(d.quotes || []); }
    setLoading(false);
  };

  useEffect(() => {
    loadQuotes();
    fetch('/api/users').then(r=>r.ok?r.json():{}).then(d=>setManagers((d.users||[]).filter(u=>u.role==='manager'))).catch(()=>{});
    fetch('/api/catalog').then(r=>r.ok?r.json():{}).then(d=>setAllCompanies(d.companies||[])).catch(()=>{});
  }, []);

  const openDetail = async (quoteId) => {
    setSelected(quoteId); setLoadingDetail(true); setActionNote('');
    const res = await fetch('/api/quotes/'+quoteId);
    if (res.ok) { const d = await res.json(); setDetail(d.quote); }
    setLoadingDetail(false);
  };
  const doAction = async (action) => {
    if (!detail) return; setActing(true);
    try {
      const body = { action, note: actionNote };
      if (action === 'review_approve' && selectedManager) body.managerId = selectedManager;
      const res = await fetch('/api/quotes/'+detail.id, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      if (res.ok) { await loadQuotes(); await openDetail(detail.id); setActionNote(''); }
      else { const d = await res.json(); alert(d.error||'Failed'); }
    } catch(e) { alert(e.message); }
    setActing(false);
  };
  const isCorp = user && (user.role==='supervisor'||(user.isAdmin&&!user.primaryCompanyId));
  const getActions = () => {
    if (!detail||!user) return [];
    if (isCorp) return [];
    const s=detail.status, isCreator=detail.createdById===user.id;
    const a=[];
    if (s==='draft'&&isCreator) a.push({key:'submit',label:'Submit for Review',color:'#d97706'});
    if (s==='submitted'&&isCreator) a.push({key:'recall',label:'Recall to Draft',color:'#6b7085'});
    if (s==='submitted'&&user.role==='reviewer') { a.push({key:'review_approve',label:'Approve to Manager',color:'#2563eb',needsManager:true}); a.push({key:'request_info',label:'Request More Info',color:'#9333ea',needsNote:true}); }
    if (s==='info_requested'&&isCreator) a.push({key:'submit',label:'Resubmit',color:'#d97706'});
    if (s==='reviewed'&&user.role==='manager') a.push({key:'approve',label:'Final Approve',color:'#16a34a'});
    if (s==='approved') a.push({key:'mark_sent',label:'Mark as Sent',color:'#0891b2'});
    return a;
  };

  // ─── Filtering & Sorting ───
  let filtered = quotes;
  if (filter!=='all') filtered = filtered.filter(q=>q.status===filter);
  if (search.trim()) { const s=search.toLowerCase(); filtered=filtered.filter(q=>(q.quoteNumber||'').toLowerCase().includes(s)||(q.customerName||'').toLowerCase().includes(s)||(q.createdBy?.name||'').toLowerCase().includes(s)); }
  if (coFilter!=='all') filtered = filtered.filter(q=>q.companyKeys&&q.companyKeys.includes(coFilter));
  if (divFilter!=='all') { const dk=allCompanies.filter(c=>c.division===divFilter).map(c=>c.key); filtered=filtered.filter(q=>q.companyKeys&&q.companyKeys.some(k=>dk.includes(k))); }
  // Column filters
  Object.entries(colFilters).forEach(([col,vals])=>{ if(vals&&vals.size>0) filtered=filtered.filter(q=>{ let v=''; if(col==='status') v=q.status; else if(col==='customerName') v=q.customerName||''; else if(col==='mode') v=q.mode||''; else if(col==='createdBy') v=q.createdBy?.name||''; return vals.has(v); }); });
  // Sort
  filtered.sort((a,b)=>{ let va=a[sortCol],vb=b[sortCol]; if(sortCol==='grandTotal'){va=va||0;vb=vb||0;} else if(sortCol==='createdAt'){va=new Date(va);vb=new Date(vb);} else {va=(va||'').toString().toLowerCase();vb=(vb||'').toString().toLowerCase();} if(va<vb)return sortDir==='asc'?-1:1; if(va>vb)return sortDir==='asc'?1:-1; return 0; });
  const toggleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir(col==='grandTotal'||col==='createdAt'?'desc':'asc');}};
  const sortIcon=(col)=>sortCol!==col?'':sortDir==='asc'?' \u2191':' \u2193';

  // ─── Column filter helpers ───
  const getUniqueVals=(col)=>{ const vals=new Set(); quotes.forEach(q=>{ let v=''; if(col==='status') v=q.status; else if(col==='customerName') v=q.customerName||'\u2014'; else if(col==='mode') v=q.mode||''; else if(col==='createdBy') v=q.createdBy?.name||'\u2014'; if(v) vals.add(v); }); return [...vals].sort(); };
  const toggleColFilter=(col,val)=>{ setColFilters(prev=>{ const n={...prev}; const s=new Set(n[col]||[]); if(s.has(val))s.delete(val);else s.add(val); if(s.size===0)delete n[col];else n[col]=s; return n; }); };

  // ─── Multi-select ───
  const toggleCheck=(id,e)=>{ e.stopPropagation(); setChecked(prev=>{const n=new Set(prev);if(n.has(id))n.delete(id);else n.add(id);return n;}); };
  const toggleAll=()=>{ if(checked.size===filtered.length) setChecked(new Set()); else setChecked(new Set(filtered.map(q=>q.id))); };
  const checkedQuotes = quotes.filter(q=>checked.has(q.id));
  const selTotal = checkedQuotes.reduce((a,q)=>a+(q.grandTotal||0),0);
  const selStatuses = [...new Set(checkedQuotes.map(q=>q.status))];
  const selCos = [...new Set(checkedQuotes.flatMap(q=>q.companyKeys||[]))];

  const stats = {
    total:quotes.length, draft:quotes.filter(q=>q.status==='draft').length,
    pending:quotes.filter(q=>['submitted','info_requested','reviewed'].includes(q.status)).length,
    approved:quotes.filter(q=>q.status==='approved').length,
    totalValue:quotes.filter(q=>q.status==='approved').reduce((a,q)=>a+(q.grandTotal||0),0),
    pipelineValue:quotes.filter(q=>q.status!=='expired').reduce((a,q)=>a+(q.grandTotal||0),0),
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 56px)'}}><div style={{fontSize:16,color:C.muted}}>Loading...</div></div>;

  const COL_DEFS = [
    {k:'_check',l:'',w:36},
    {k:'quoteNumber',l:'Quote #',sortable:true},
    {k:'status',l:'Status',sortable:true,filterable:true},
    {k:'mode',l:'Company',sortable:true},
    {k:'customerName',l:'Customer',sortable:true,filterable:true},
    {k:'grandTotal',l:'Amount',sortable:true,right:true},
    {k:'createdBy',l:'Created By',filterable:true},
    {k:'createdAt',l:'Date',sortable:true},
    {k:'_view',l:'',w:60},
  ];

  return (
    <div style={{maxWidth:1400,margin:'0 auto',padding:20,paddingBottom:checked.size>0?80:20}}>
      <h1 style={{fontSize:22,fontWeight:800,color:'#003250',margin:'0 0 4px'}}>Quotes Dashboard</h1>
      <p style={{fontSize:12,color:'#8b919e',marginBottom:20}}>{
        isCorp?'Corporate \u2014 all quotes (view only)':
        user.role==='manager'?'Quotes awaiting your final approval':
        user.role==='reviewer'?'Quotes submitted for your review':'Your company quotes'}</p>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:18}}>
        {[{l:'Total',v:stats.total,c:'#003250'},{l:'Drafts',v:stats.draft,c:'#6b7085'},{l:'Pending',v:stats.pending,c:'#d97706'},{l:'Approved',v:stats.approved,c:'#16a34a'},{l:'Approved $',v:fP(stats.totalValue),c:'#059669'},{l:'Pipeline $',v:fP(stats.pipelineValue),c:'#003250'}].map(k=>(
          <div key={k.l} style={{background:'#fff',borderRadius:8,border:'1px solid #e2e4e9',padding:'12px 14px'}}>
            <div style={{fontSize:8,fontWeight:700,color:'#8b919e',marginBottom:3}}>{k.l.toUpperCase()}</div>
            <div style={{fontSize:18,fontWeight:800,color:k.c}}>{k.v}</div></div>))}
      </div>

      {/* Filters row */}
      <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:2,background:'#fff',padding:3,borderRadius:8,border:'1px solid #e2e4e9'}}>
          {['all','draft','submitted','info_requested','reviewed','approved','sent'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:'4px 10px',borderRadius:5,border:'none',cursor:'pointer',fontSize:10,fontWeight:600,background:filter===f?'#003250':'transparent',color:filter===f?'#fff':'#8b919e'}}>
              {f==='all'?'All':STATUS[f]?.l}{f!=='all'?' ('+quotes.filter(q=>q.status===f).length+')':''}</button>))}
        </div>
        <select value={divFilter} onChange={e=>setDivFilter(e.target.value)} style={{padding:'4px 8px',borderRadius:6,border:'1px solid #e2e4e9',fontSize:10,background:'#fff',color:'#003250'}}>
          <option value="all">All Divisions</option><option value="protein">Protein</option><option value="bakery">Bakery</option></select>
        <select value={coFilter} onChange={e=>setCoFilter(e.target.value)} style={{padding:'4px 8px',borderRadius:6,border:'1px solid #e2e4e9',fontSize:10,background:'#fff',color:'#003250'}}>
          <option value="all">All Companies</option>
          {allCompanies.map(c=><option key={c.key} value={c.key}>{c.name}</option>)}</select>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{padding:'5px 12px',borderRadius:6,border:'1px solid #e2e4e9',fontSize:11,width:180}}/>
        {Object.keys(colFilters).length>0&&<button onClick={()=>setColFilters({})} style={{padding:'4px 10px',borderRadius:5,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:10,cursor:'pointer'}}>Clear filters</button>}
        <div style={{marginLeft:'auto',fontSize:10,color:'#8b919e'}}>{filtered.length} of {quotes.length}</div>
      </div>

      {/* Table */}
      <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e4e9',overflow:'visible',position:'relative'}}>
        {filtered.length===0?<div style={{padding:40,textAlign:'center',color:'#8b919e'}}>No quotes found.</div>
        :<table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#f8f9fb'}}>
            {COL_DEFS.map(h=>(
              <th key={h.k} style={{padding:'8px 12px',textAlign:h.right?'right':'left',fontSize:8,fontWeight:700,color:'#8b919e',borderBottom:'1px solid #e2e4e9',cursor:h.sortable?'pointer':'default',userSelect:'none',width:h.w||'auto',position:'relative'}}>
                {h.k==='_check'?<input type="checkbox" checked={checked.size===filtered.length&&filtered.length>0} onChange={toggleAll} style={{cursor:'pointer'}} />
                :h.k==='_view'?''
                :<div style={{display:'flex',alignItems:'center',gap:2}}>
                  <span onClick={()=>h.sortable&&toggleSort(h.k)}>{h.l}{h.sortable?sortIcon(h.k):''}</span>
                  {h.filterable&&<button onClick={(e)=>{e.stopPropagation();setShowColFilter(showColFilter===h.k?null:h.k);}} style={{border:'none',background:'none',cursor:'pointer',fontSize:9,color:colFilters[h.k]?'#2563eb':'#ccc',padding:'0 2px'}}>{'\u25BC'}</button>}
                </div>}
                {/* Column filter dropdown */}
                {showColFilter===h.k&&<div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:'100%',left:0,zIndex:50,background:'#fff',border:'1px solid #e2e4e9',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,.1)',padding:8,minWidth:140,maxHeight:200,overflowY:'auto'}}>
                  {getUniqueVals(h.k).map(v=>(
                    <label key={v} style={{display:'flex',alignItems:'center',gap:6,padding:'3px 0',fontSize:10,cursor:'pointer'}}>
                      <input type="checkbox" checked={colFilters[h.k]?.has(v)||false} onChange={()=>toggleColFilter(h.k,v)} />
                      {h.k==='status'?<span style={{color:STATUS[v]?.c,fontWeight:600}}>{STATUS[v]?.l||v}</span>:v}
                    </label>))}
                  <div style={{borderTop:'1px solid #eee',marginTop:4,paddingTop:4}}>
                    <button onClick={()=>{setColFilters(p=>{const n={...p};delete n[h.k];return n;});setShowColFilter(null);}} style={{fontSize:9,color:'#dc2626',border:'none',background:'none',cursor:'pointer'}}>Clear</button>
                  </div>
                </div>}
              </th>))}
          </tr></thead>
          <tbody>{filtered.map(q=>{const sc=STATUS[q.status]||STATUS.draft;
            const coNames=(q.companyKeys||[]).map(k=>{const c=allCompanies.find(x=>x.key===k);return c?{name:c.name,color:c.color}:null;}).filter(Boolean);
            const isChecked=checked.has(q.id);
            return(
            <tr key={q.id} style={{borderBottom:'1px solid #f3f4f6',background:isChecked?'#f0f7ff':'transparent',cursor:'pointer'}} onMouseOver={e=>{if(!isChecked)e.currentTarget.style.background='#fafbfc';}} onMouseOut={e=>{if(!isChecked)e.currentTarget.style.background='transparent';}}>
              <td style={{padding:'8px 12px'}}><input type="checkbox" checked={isChecked} onChange={e=>toggleCheck(q.id,e)} style={{cursor:'pointer'}} /></td>
              <td onClick={()=>openDetail(q.id)} style={{padding:'8px 12px',fontWeight:600,color:'#003250'}}>{q.quoteNumber}{q.revision>1?<span style={{fontSize:9,color:'#8b919e',marginLeft:4}}>R{q.revision}</span>:null}</td>
              <td onClick={()=>openDetail(q.id)} style={{padding:'8px 12px'}}><span style={{fontSize:10,fontWeight:700,color:sc.c,background:sc.bg,padding:'2px 8px',borderRadius:10}}>{sc.l}</span></td>
              <td onClick={()=>openDetail(q.id)} style={{padding:'8px 12px'}}>{q.mode==='bundle'?<span style={{fontSize:9,fontWeight:700,color:'#003250',background:'#e0e7ff',padding:'2px 6px',borderRadius:4}}>Bundle</span>:coNames[0]?<span style={{fontSize:10,fontWeight:600,color:coNames[0].color}}>{coNames[0].name}</span>:'\u2014'}
                {q.mode==='bundle'&&coNames.length>0&&<div style={{marginTop:1}}>{coNames.map(c=><span key={c.name} style={{fontSize:7,color:c.color,marginRight:3}}>{c.name}</span>)}</div>}</td>
              <td onClick={()=>openDetail(q.id)} style={{padding:'8px 12px'}}>{q.customerName||'\u2014'}</td>
              <td onClick={()=>openDetail(q.id)} style={{padding:'8px 12px',textAlign:'right',fontWeight:700,color:'#003250'}}>{fP(q.grandTotal)}</td>
              <td onClick={()=>openDetail(q.id)} style={{padding:'8px 12px'}}><div style={{fontSize:10}}>{q.createdBy?.name||'\u2014'}</div><div style={{fontSize:8,color:'#8b919e'}}>{ROLES[q.createdBy?.role]||''}</div></td>
              <td onClick={()=>openDetail(q.id)} style={{padding:'8px 12px',color:'#8b919e',fontSize:10}}>{new Date(q.createdAt).toLocaleDateString()}</td>
              <td onClick={()=>openDetail(q.id)} style={{padding:'8px 12px'}}><span style={{fontSize:9,color:'#003250',fontWeight:600,cursor:'pointer'}}>View →</span></td>
            </tr>);})}</tbody>
        </table>}
      </div>

      {/* ═══ MULTI-SELECT SUMMARY BAR ═══ */}
      {checked.size>0&&<div style={{position:'fixed',bottom:0,left:0,right:0,background:'#003250',color:'#fff',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',zIndex:100,boxShadow:'0 -4px 20px rgba(0,0,0,.2)'}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{fontSize:13,fontWeight:700}}>{checked.size} quote{checked.size>1?'s':''} selected</div>
          <button onClick={()=>setChecked(new Set())} style={{padding:'4px 10px',borderRadius:4,border:'1px solid rgba(255,255,255,.3)',background:'transparent',color:'#fff',fontSize:10,cursor:'pointer'}}>Clear</button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:20}}>
          <div><div style={{fontSize:7,color:'rgba(255,255,255,.5)'}}>TOTAL VALUE</div><div style={{fontSize:16,fontWeight:800}}>{fP(selTotal)}</div></div>
          <div><div style={{fontSize:7,color:'rgba(255,255,255,.5)'}}>AVG VALUE</div><div style={{fontSize:13,fontWeight:700}}>{fP(selTotal/checked.size)}</div></div>
          <div><div style={{fontSize:7,color:'rgba(255,255,255,.5)'}}>STATUSES</div><div style={{display:'flex',gap:3,marginTop:2}}>{selStatuses.map(s=><span key={s} style={{fontSize:8,fontWeight:700,color:STATUS[s]?.c,background:STATUS[s]?.bg,padding:'1px 6px',borderRadius:6}}>{STATUS[s]?.l}</span>)}</div></div>
          <div><div style={{fontSize:7,color:'rgba(255,255,255,.5)'}}>COMPANIES</div><div style={{display:'flex',gap:3,marginTop:2}}>{selCos.map(k=>{const c=allCompanies.find(x=>x.key===k);return c?<span key={k} style={{fontSize:8,fontWeight:700,color:'#fff',background:c.color,padding:'1px 6px',borderRadius:4}}>{c.name}</span>:null;})}</div></div>
        </div>
      </div>}

      {/* ═══ DETAIL MODAL ═══ */}
      {selected&&<div className="modal-overlay" onClick={()=>{setSelected(null);setDetail(null);setShowColFilter(null);}}>
        <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:640,maxHeight:'90vh',overflowY:'auto'}}>
          {loadingDetail?<div style={{padding:40,textAlign:'center',color:'#8b919e'}}>Loading...</div>:detail&&<div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:16}}>
              <div><div style={{fontSize:20,fontWeight:800,color:'#003250'}}>{detail.quoteNumber}</div><div style={{fontSize:11,color:'#8b919e'}}>Rev. {detail.revision} • {detail.mode} • {new Date(detail.createdAt).toLocaleDateString()}</div></div>
              <div>{(()=>{const sc=STATUS[detail.status]||STATUS.draft;return <span style={{fontSize:12,fontWeight:700,color:sc.c,background:sc.bg,padding:'4px 14px',borderRadius:10}}>{sc.l}</span>;})()}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16,padding:'12px 16px',background:'#f8f9fb',borderRadius:8}}>
              <div><div style={{fontSize:9,fontWeight:700,color:'#8b919e'}}>CUSTOMER</div><div style={{fontSize:13,fontWeight:600,color:'#003250'}}>{detail.customerName||'\u2014'}</div></div>
              <div><div style={{fontSize:9,fontWeight:700,color:'#8b919e'}}>CONTACT</div><div style={{fontSize:12}}>{detail.contactName||'\u2014'}</div></div>
              <div><div style={{fontSize:9,fontWeight:700,color:'#8b919e'}}>REP</div><div style={{fontSize:12}}>{detail.repName||'\u2014'}</div></div>
              <div><div style={{fontSize:9,fontWeight:700,color:'#8b919e'}}>TOTAL</div><div style={{fontSize:16,fontWeight:800,color:'#003250'}}>{fP(detail.grandTotal)}</div></div>
            </div>
            {detail.purpose&&<div style={{fontSize:11,color:'#555',fontStyle:'italic',padding:'8px 12px',background:'#fafbfc',borderRadius:6,marginBottom:16}}>{detail.purpose}</div>}
            {detail.companyKeys&&detail.companyKeys.length>0&&<div style={{marginBottom:16}}>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {detail.companyKeys.map(k=>{const c=allCompanies.find(x=>x.key===k);return c?<span key={k} style={{fontSize:10,fontWeight:600,color:c.color,background:c.color+'15',padding:'3px 10px',borderRadius:6,border:'1px solid '+c.color+'30'}}>{c.name}</span>:null;})}
                <span style={{fontSize:10,fontWeight:600,color:'#003250',background:'#e0e7ff',padding:'3px 10px',borderRadius:6}}>{detail.mode==='bundle'?'Bundle':'Individual'}</span>
              </div></div>}
            <div style={{display:'flex',gap:8,marginBottom:16}}>
              <button onClick={()=>window.open('/pdf?quoteId='+detail.id,'_blank')} style={{flex:1,padding:'10px 16px',borderRadius:8,border:'1px solid #003250',background:'#fff',color:'#003250',fontSize:12,fontWeight:700,cursor:'pointer'}}>View PDF</button>
              <button onClick={()=>window.open('/margin?quoteId='+detail.id,'_blank')} style={{flex:1,padding:'10px 16px',borderRadius:8,border:'1px solid #059669',background:'#fff',color:'#059669',fontSize:12,fontWeight:700,cursor:'pointer'}}>View Margin</button>
            </div>
            {/* Visual Status Tracker */}
            <div style={{marginBottom:16,padding:'16px 16px',background:'#fff',border:'1px solid #e2e4e9',borderRadius:8}}>
              <div style={{fontSize:11,fontWeight:700,color:'#003250',marginBottom:12}}>Quote Status</div>
              {(()=>{
                const steps=[
                  {key:'draft',label:'Draft',icon:'\u270F\uFE0F'},
                  {key:'submitted',label:'Submitted',icon:'\u2709\uFE0F'},
                  {key:'info_requested',label:'Info Requested',icon:'\u2753',optional:true},
                  {key:'reviewed',label:'Reviewed',icon:'\u2705'},
                  {key:'approved',label:'Approved',icon:'\u2B50'},
                  {key:'sent',label:'Sent',icon:'\u2709\uFE0F'}
                ];
                const statusOrder={draft:0,submitted:1,info_requested:1,reviewed:3,approved:4,sent:5};
                const current=statusOrder[detail.status]??0;
                const activeSteps=steps.filter(s=>!s.optional||detail.status===s.key||detail.infoRequestedAt);
                return(
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:14}}>
                      {activeSteps.map((step,i)=>{
                        const stepIdx=steps.indexOf(step);
                        const isActive=detail.status===step.key;
                        const isPast=statusOrder[detail.status]>statusOrder[step.key];
                        const sc=STATUS[step.key]||STATUS.draft;
                        return(<Fragment key={step.key}>
                          {i>0&&<div style={{flex:1,height:2,background:isPast||isActive?sc.c+'44':'#e2e4e9'}} />}
                          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                            <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,
                              background:isActive?sc.c:isPast?sc.c+'22':'#f3f4f6',
                              color:isActive?'#fff':isPast?sc.c:'#ccc',
                              border:isActive?'2px solid '+sc.c:isPast?'2px solid '+sc.c+'44':'2px solid #e2e4e9'}}>
                              {isPast?'\u2713':i+1}</div>
                            <span style={{fontSize:8,fontWeight:isActive?700:500,color:isActive?sc.c:isPast?'#555':'#bbb'}}>{step.label}</span>
                          </div>
                        </Fragment>);
                      })}
                    </div>
                    {/* Status message */}
                    <div style={{background:STATUS[detail.status]?.bg||'#f3f4f6',borderRadius:6,padding:'8px 12px',fontSize:10,color:STATUS[detail.status]?.c||'#555'}}>
                      {detail.status==='draft'&&<span>Draft — waiting to be submitted for review</span>}
                      {detail.status==='submitted'&&<span>Submitted — waiting for reviewer {detail.reviewedBy?.name||''} to review</span>}
                      {detail.status==='info_requested'&&<span>More info requested — waiting for {detail.createdBy?.name||'creator'} to update and resubmit{detail.infoRequestNote&&<span style={{fontStyle:'italic'}}> — "{detail.infoRequestNote}"</span>}</span>}
                      {detail.status==='reviewed'&&<span>Reviewed — waiting for manager approval</span>}
                      {detail.status==='approved'&&<span>Approved by {detail.approvedBy?.name||'manager'} on {detail.approvedAt?new Date(detail.approvedAt).toLocaleDateString():''} — ready to send to customer</span>}
                      {detail.status==='sent'&&<span>Sent to customer</span>}
                    </div>
                    {/* Timeline */}
                    <div style={{marginTop:10,fontSize:10,color:'#777',borderTop:'1px solid #f3f4f6',paddingTop:8}}>
                      <div>Created by <strong>{detail.createdBy?.name}</strong> — {new Date(detail.createdAt).toLocaleString()}</div>
                      {detail.submittedAt&&<div style={{marginTop:3}}>Submitted — {new Date(detail.submittedAt).toLocaleString()}{detail.submitNote&&<span style={{color:'#aaa'}}> — "{detail.submitNote}"</span>}</div>}
                      {detail.infoRequestedAt&&<div style={{marginTop:3,color:'#9333ea'}}>Info requested — {new Date(detail.infoRequestedAt).toLocaleString()}</div>}
                      {detail.reviewedAt&&<div style={{marginTop:3,color:'#2563eb'}}>Reviewed by {detail.reviewedBy?.name} — {new Date(detail.reviewedAt).toLocaleString()}</div>}
                      {detail.approvedAt&&<div style={{marginTop:3,color:'#16a34a'}}>Approved by {detail.approvedBy?.name} — {new Date(detail.approvedAt).toLocaleString()}</div>}
                    </div>
                  </div>
                );
              })()}
            </div>
            {(()=>{
              const actions=getActions();
              if (actions.length===0&&isCorp) return <div style={{borderTop:'2px solid #e2e4e9',paddingTop:16,marginTop:8}}><div style={{fontSize:11,color:'#8b919e',fontStyle:'italic'}}>Corporate \u2014 view only</div></div>;
              if (actions.length===0) return null;
              const needsNote=actions.some(a=>a.needsNote), needsManager=actions.some(a=>a.needsManager);
              return (<div style={{borderTop:'2px solid #e2e4e9',paddingTop:16,marginTop:8}}>
                <div style={{fontSize:11,fontWeight:700,color:'#003250',marginBottom:8}}>Actions</div>
                {needsManager&&<div style={{marginBottom:8}}><div style={{fontSize:9,fontWeight:700,color:'#8b919e',marginBottom:3}}>SEND TO MANAGER</div><select value={selectedManager} onChange={e=>setSelectedManager(e.target.value)} style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e2e4e9',fontSize:12,boxSizing:'border-box'}}><option value="">Select manager...</option>{managers.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>}
                {needsNote&&<div style={{marginBottom:8}}><input value={actionNote} onChange={e=>setActionNote(e.target.value)} placeholder="Add a note..." style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e2e4e9',fontSize:12,boxSizing:'border-box'}}/></div>}
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{actions.map(a=>(<button key={a.key} onClick={()=>{if(a.needsNote&&!actionNote.trim()){alert('Add a note');return;}if(a.needsManager&&!selectedManager){alert('Select manager');return;}doAction(a.key);}} disabled={acting} style={{padding:'8px 18px',borderRadius:8,border:'none',cursor:acting?'default':'pointer',background:acting?'#ccc':a.color,color:'#fff',fontSize:12,fontWeight:700}}>{acting?'...':a.label}</button>))}</div>
              </div>);
            })()}
            <div style={{marginTop:16,textAlign:'right'}}><button onClick={()=>{setSelected(null);setDetail(null);}} style={{padding:'8px 20px',borderRadius:8,border:'1px solid #e2e4e9',background:'#fff',color:'#8b919e',fontSize:12,fontWeight:600,cursor:'pointer'}}>Close</button></div>
          </div>}
        </div>
      </div>}
    </div>
  );
}
