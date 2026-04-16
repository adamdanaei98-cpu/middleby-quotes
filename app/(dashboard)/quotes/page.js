// app/(dashboard)/quotes/page.js
'use client';
import { useAuth } from '@/components/AuthProvider';
import { useState, useEffect } from 'react';
import { C } from '@/lib/transform';

const STATUS = {
  draft:{l:'Draft',c:'#6b7085',bg:'#f3f4f6'},
  submitted:{l:'Submitted',c:'#d97706',bg:'#fef3c7'},
  info_requested:{l:'Info Requested',c:'#9333ea',bg:'#f3e8ff'},
  reviewed:{l:'Reviewed',c:'#2563eb',bg:'#dbeafe'},
  approved:{l:'Approved',c:'#16a34a',bg:'#dcfce7'},
  expired:{l:'Expired',c:'#8b919e',bg:'#f3f4f6'},
};
const ROLES={salesperson:'Sales Rep',reviewer:'Reviewer',manager:'Manager',supervisor:'Executive'};
const fP=n=>'$'+Math.round(n||0).toLocaleString('en-US');

export default function QuotesPage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
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

  const loadQuotes = async () => {
    const res = await fetch('/api/quotes');
    if (res.ok) { const d = await res.json(); setQuotes(d.quotes || []); }
    setLoading(false);
  };

  useEffect(() => {
    loadQuotes();
    fetch('/api/users').then(r => r.ok ? r.json() : {}).then(d => setManagers((d.users || []).filter(u => u.role === 'manager'))).catch(() => {});
    fetch('/api/catalog').then(r => r.ok ? r.json() : {}).then(d => setAllCompanies(d.companies || [])).catch(() => {});
  }, []);

  const openDetail = async (quoteId) => {
    setSelected(quoteId); setLoadingDetail(true); setActionNote('');
    const res = await fetch('/api/quotes/' + quoteId);
    if (res.ok) { const d = await res.json(); setDetail(d.quote); }
    setLoadingDetail(false);
  };

  const doAction = async (action) => {
    if (!detail) return;
    setActing(true);
    try {
      const res = await fetch('/api/quotes/' + detail.id, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: actionNote }),
      });
      if (res.ok) {
        await loadQuotes();
        await openDetail(detail.id);
        setActionNote('');
      } else { const d = await res.json(); alert(d.error || 'Action failed'); }
    } catch (e) { alert(e.message); }
    setActing(false);
  };

  let filtered = quotes;
  if (filter !== 'all') filtered = filtered.filter(q => q.status === filter);
  if (search.trim()) {
    const s = search.toLowerCase();
    filtered = filtered.filter(q => (q.quoteNumber||'').toLowerCase().includes(s) || (q.customerName||'').toLowerCase().includes(s) || (q.createdBy?.name||'').toLowerCase().includes(s));
  }
  if (coFilter !== 'all') filtered = filtered.filter(q => q.companyKeys && q.companyKeys.includes(coFilter));
  if (divFilter !== 'all') {
    const divCos = allCompanies.filter(c => c.division === divFilter).map(c => c.key);
    filtered = filtered.filter(q => q.companyKeys && q.companyKeys.some(k => divCos.includes(k)));
  }
  filtered.sort((a, b) => {
    let va = a[sortCol], vb = b[sortCol];
    if (sortCol === 'grandTotal') { va = va || 0; vb = vb || 0; }
    else if (sortCol === 'createdAt') { va = new Date(va); vb = new Date(vb); }
    else if (sortCol === 'customerName' || sortCol === 'quoteNumber') { va = (va || '').toLowerCase(); vb = (vb || '').toLowerCase(); }
    else if (sortCol === 'status') { va = va || ''; vb = vb || ''; }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir(col === 'grandTotal' || col === 'createdAt' ? 'desc' : 'asc'); } };
  const sortIcon = (col) => sortCol !== col ? '' : sortDir === 'asc' ? ' \u2191' : ' \u2193';

  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    pending: quotes.filter(q => ['submitted','info_requested','reviewed'].includes(q.status)).length,
    approved: quotes.filter(q => q.status === 'approved').length,
    totalValue: quotes.filter(q => q.status === 'approved').reduce((a, q) => a + (q.grandTotal || 0), 0),
    pipelineValue: quotes.filter(q => q.status !== 'expired').reduce((a, q) => a + (q.grandTotal || 0), 0),
  };

  // What actions can this user take on the detail quote?
  const getActions = () => {
    if (!detail || !user) return [];
    // Corporate users (supervisor, corporate admin) cannot take actions on quotes
    const isCorp = user.role === 'supervisor' || (user.isAdmin && !user.primaryCompanyId);
    if (isCorp) return [];

    const s = detail.status;
    const isCreator = detail.createdById === user.id;
    const isReviewer = user.role === 'reviewer';
    const isManager = user.role === 'manager';
    const actions = [];

    if (s === 'draft' && isCreator) actions.push({ key: 'submit', label: 'Submit for Review', color: '#d97706', needsNote: false });
    if (s === 'submitted' && isCreator) actions.push({ key: 'recall', label: 'Recall to Draft', color: '#6b7085', needsNote: false });
    if (s === 'submitted' && isReviewer) {
      actions.push({ key: 'review_approve', label: 'Approve to Manager', color: '#2563eb', needsNote: false, needsManager: true });
      actions.push({ key: 'request_info', label: 'Request More Info', color: '#9333ea', needsNote: true });
    }
    if (s === 'info_requested' && isCreator) actions.push({ key: 'submit', label: 'Resubmit', color: '#d97706', needsNote: false });
    if (s === 'reviewed' && isManager) actions.push({ key: 'approve', label: 'Final Approve', color: '#16a34a', needsNote: false });
    return actions;
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 56px)'}}><div style={{fontSize:16,color:C.muted}}>Loading quotes...</div></div>;

  return (
    <div style={{maxWidth:1400,margin:'0 auto',padding:20}}>
      <h1 style={{fontSize:22,fontWeight:800,color:'#003250',margin:'0 0 4px'}}>Quotes Dashboard</h1>
      <p style={{fontSize:12,color:'#8b919e',marginBottom:20}}>{
        user.role==='supervisor'?'Corporate — all quotes (view only)':
        (user.isAdmin&&!user.primaryCompanyId)?'Corporate admin — all quotes (view only)':
        user.role==='manager'?'Quotes awaiting your final approval':
        user.role==='reviewer'?'Quotes submitted for your review':
        'Your company quotes'}</p>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:20}}>
        {[{l:'Total',v:stats.total,c:'#003250'},{l:'Drafts',v:stats.draft,c:'#6b7085'},{l:'Pending',v:stats.pending,c:'#d97706'},{l:'Approved',v:stats.approved,c:'#16a34a'},{l:'Approved $',v:fP(stats.totalValue),c:'#059669'},{l:'Pipeline $',v:fP(stats.pipelineValue),c:'#003250'}].map(k=>(
          <div key={k.l} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e4e9',padding:'14px 16px'}}>
            <div style={{fontSize:9,fontWeight:700,color:'#8b919e',marginBottom:4}}>{k.l.toUpperCase()}</div>
            <div style={{fontSize:20,fontWeight:800,color:k.c}}>{k.v}</div></div>))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:2,background:'#fff',padding:3,borderRadius:8,border:'1px solid #e2e4e9'}}>
          {['all','draft','submitted','info_requested','reviewed','approved'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:'5px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:11,fontWeight:600,background:filter===f?'#003250':'transparent',color:filter===f?'#fff':'#8b919e'}}>
              {f==='all'?'All':STATUS[f]?.l}{f!=='all'?` (${quotes.filter(q=>q.status===f).length})`:''}</button>))}
        </div>
        <select value={divFilter} onChange={e=>setDivFilter(e.target.value)} style={{padding:'5px 10px',borderRadius:8,border:'1px solid #e2e4e9',fontSize:11,fontWeight:600,background:'#fff',color:'#003250'}}>
          <option value="all">All Divisions</option>
          <option value="protein">Protein</option>
          <option value="bakery">Bakery</option>
        </select>
        <select value={coFilter} onChange={e=>setCoFilter(e.target.value)} style={{padding:'5px 10px',borderRadius:8,border:'1px solid #e2e4e9',fontSize:11,fontWeight:600,background:'#fff',color:'#003250'}}>
          <option value="all">All Companies</option>
          {allCompanies.map(c=><option key={c.key} value={c.key}>{c.name}{c.division?' ('+c.division.charAt(0).toUpperCase()+c.division.slice(1)+')':''}</option>)}
        </select>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search quotes, customers..." style={{padding:'7px 14px',borderRadius:8,border:'1px solid #e2e4e9',fontSize:12,width:200}}/>
        <div style={{marginLeft:'auto',fontSize:11,color:'#8b919e'}}>{filtered.length} quotes</div>
      </div>

      {/* Table */}
      <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e4e9',overflow:'hidden'}}>
        {filtered.length===0?<div style={{padding:40,textAlign:'center',color:'#8b919e'}}>No quotes found.</div>
        :<table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#f8f9fb'}}>
            {[{k:'quoteNumber',l:'Quote #'},{k:'status',l:'Status'},{k:'mode',l:'Company'},{k:'customerName',l:'Customer'},{k:'grandTotal',l:'Amount',right:true},{k:'createdBy',l:'Created By'},{k:'createdAt',l:'Date'},{k:'',l:''}].map(h=>(
              <th key={h.k||h.l} onClick={()=>h.k&&h.k!=='createdBy'&&h.k!==''&&toggleSort(h.k)} style={{padding:'10px 14px',textAlign:h.right?'right':'left',fontSize:9,fontWeight:700,color:'#8b919e',borderBottom:'1px solid #e2e4e9',cursor:h.k&&h.k!=='createdBy'&&h.k!==''?'pointer':'default',userSelect:'none'}}>{h.l}{h.k?sortIcon(h.k):''}</th>))}
          </tr></thead>
          <tbody>{filtered.map(q=>{const sc=STATUS[q.status]||STATUS.draft;
            const coNames = (q.companyKeys||[]).map(k=>{const c=allCompanies.find(x=>x.key===k);return c?{name:c.name,color:c.color}:null;}).filter(Boolean);
            return(
            <tr key={q.id} onClick={()=>openDetail(q.id)} style={{borderBottom:'1px solid #f3f4f6',cursor:'pointer'}} onMouseOver={e=>e.currentTarget.style.background='#fafbfc'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
              <td style={{padding:'10px 14px',fontWeight:600,color:'#003250'}}>{q.quoteNumber}{q.revision>1?<span style={{fontSize:9,color:'#8b919e',marginLeft:4}}>R{q.revision}</span>:null}</td>
              <td style={{padding:'10px 14px'}}><span style={{fontSize:10,fontWeight:700,color:sc.c,background:sc.bg,padding:'3px 10px',borderRadius:10}}>{sc.l}</span></td>
              <td style={{padding:'10px 14px'}}>{q.mode==='bundle'?<span style={{fontSize:9,fontWeight:700,color:'#003250',background:'#e0e7ff',padding:'2px 8px',borderRadius:4}}>Bundle</span>:coNames.length>0?<span style={{fontSize:10,fontWeight:600,color:coNames[0].color}}>{coNames[0].name}</span>:'—'}
                {q.mode==='bundle'&&coNames.length>0&&<div style={{marginTop:2}}>{coNames.map(c=><span key={c.name} style={{fontSize:8,color:c.color,marginRight:4}}>{c.name}</span>)}</div>}</td>
              <td style={{padding:'10px 14px'}}>{q.customerName||'—'}</td>
              <td style={{padding:'10px 14px',textAlign:'right',fontWeight:700,color:'#003250'}}>{fP(q.grandTotal)}</td>
              <td style={{padding:'10px 14px'}}><div style={{fontSize:11}}>{q.createdBy?.name||'—'}</div><div style={{fontSize:9,color:'#8b919e'}}>{ROLES[q.createdBy?.role]||''}</div></td>
              <td style={{padding:'10px 14px',color:'#8b919e'}}>{new Date(q.createdAt).toLocaleDateString()}</td>
              <td style={{padding:'10px 14px'}}><span style={{fontSize:10,color:'#003250',fontWeight:600}}>View →</span></td>
            </tr>);})}</tbody>
        </table>}
      </div>

      {/* Detail Modal */}
      {selected&&<div className="modal-overlay" onClick={()=>{setSelected(null);setDetail(null);}}>
        <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:640,maxHeight:'90vh',overflowY:'auto'}}>
          {loadingDetail?<div style={{padding:40,textAlign:'center',color:'#8b919e'}}>Loading...</div>:detail&&<div>
            {/* Header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:16}}>
              <div>
                <div style={{fontSize:20,fontWeight:800,color:'#003250'}}>{detail.quoteNumber}</div>
                <div style={{fontSize:11,color:'#8b919e'}}>Rev. {detail.revision} • {detail.mode} quote • {new Date(detail.createdAt).toLocaleDateString()}</div>
              </div>
              <div>
                {(()=>{const sc=STATUS[detail.status]||STATUS.draft;return <span style={{fontSize:12,fontWeight:700,color:sc.c,background:sc.bg,padding:'4px 14px',borderRadius:10}}>{sc.l}</span>;})()}
              </div>
            </div>

            {/* Customer info */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16,padding:'12px 16px',background:'#f8f9fb',borderRadius:8}}>
              <div><div style={{fontSize:9,fontWeight:700,color:'#8b919e'}}>CUSTOMER</div><div style={{fontSize:13,fontWeight:600,color:'#003250'}}>{detail.customerName||'—'}</div></div>
              <div><div style={{fontSize:9,fontWeight:700,color:'#8b919e'}}>CONTACT</div><div style={{fontSize:12}}>{detail.contactName||'—'}</div></div>
              <div><div style={{fontSize:9,fontWeight:700,color:'#8b919e'}}>REP</div><div style={{fontSize:12}}>{detail.repName||'—'}</div></div>
              <div><div style={{fontSize:9,fontWeight:700,color:'#8b919e'}}>TOTAL</div><div style={{fontSize:16,fontWeight:800,color:'#003250'}}>{fP(detail.grandTotal)}</div></div>
            </div>

            {detail.purpose&&<div style={{fontSize:11,color:'#555',fontStyle:'italic',padding:'8px 12px',background:'#fafbfc',borderRadius:6,marginBottom:16}}>{detail.purpose}</div>}

            {/* Companies involved */}
            {detail.companyKeys&&detail.companyKeys.length>0&&<div style={{marginBottom:16}}>
              <div style={{fontSize:9,fontWeight:700,color:'#8b919e',marginBottom:6}}>COMPANIES</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {detail.companyKeys.map(k=>{const c=allCompanies.find(x=>x.key===k);return c?<span key={k} style={{fontSize:10,fontWeight:600,color:c.color,background:c.color+'15',padding:'3px 10px',borderRadius:6,border:'1px solid '+c.color+'30'}}>{c.name}</span>:<span key={k} style={{fontSize:10,color:'#8b919e'}}>{k}</span>;})}
                <span style={{fontSize:10,fontWeight:600,color:'#003250',background:'#e0e7ff',padding:'3px 10px',borderRadius:6}}>{detail.mode==='bundle'?'Bundle':'Individual'}</span>
              </div>
            </div>}

            {/* Quick view buttons */}
            <div style={{display:'flex',gap:8,marginBottom:16}}>
              <button onClick={()=>{setSelected(null);setDetail(null);window.location.href='/pdf?quoteId='+detail.id;}} style={{flex:1,padding:'10px 16px',borderRadius:8,border:'1px solid #003250',background:'#fff',color:'#003250',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                View PDF Proposal
              </button>
              <button onClick={()=>{setSelected(null);setDetail(null);window.location.href='/margin?quoteId='+detail.id;}} style={{flex:1,padding:'10px 16px',borderRadius:8,border:'1px solid #059669',background:'#fff',color:'#059669',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                View Margin Report
              </button>
            </div>

            {/* Workflow timeline */}
            <div style={{marginBottom:16,padding:'12px 16px',background:'#fff',border:'1px solid #e2e4e9',borderRadius:8}}>
              <div style={{fontSize:11,fontWeight:700,color:'#003250',marginBottom:8}}>Workflow</div>
              <div style={{fontSize:11,color:'#555'}}>
                <div style={{marginBottom:4}}>Created by <strong>{detail.createdBy?.name}</strong> on {new Date(detail.createdAt).toLocaleString()}</div>
                {detail.submittedAt&&<div style={{marginBottom:4}}>Submitted on {new Date(detail.submittedAt).toLocaleString()}{detail.submitNote&&<span style={{color:'#8b919e'}}> — "{detail.submitNote}"</span>}</div>}
                {detail.infoRequestedAt&&<div style={{marginBottom:4,color:'#9333ea'}}>Info requested on {new Date(detail.infoRequestedAt).toLocaleString()}{detail.infoRequestNote&&<span> — "{detail.infoRequestNote}"</span>}</div>}
                {detail.reviewedAt&&<div style={{marginBottom:4,color:'#2563eb'}}>Reviewed by <strong>{detail.reviewedBy?.name}</strong> on {new Date(detail.reviewedAt).toLocaleString()}{detail.reviewNote&&<span style={{color:'#8b919e'}}> — "{detail.reviewNote}"</span>}</div>}
                {detail.approvedAt&&<div style={{color:'#16a34a'}}>Approved by <strong>{detail.approvedBy?.name}</strong> on {new Date(detail.approvedAt).toLocaleString()}{detail.managerNote&&<span style={{color:'#8b919e'}}> — "{detail.managerNote}"</span>}</div>}
              </div>
            </div>

            {/* Audit log */}
            {detail.auditLogs&&detail.auditLogs.length>0&&<div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:'#003250',marginBottom:6}}>Activity Log</div>
              {detail.auditLogs.map((log,i)=>(
                <div key={i} style={{fontSize:10,color:'#8b919e',padding:'4px 0',borderBottom:'1px solid #f3f4f6'}}>
                  <strong style={{color:'#555'}}>{log.user?.name||'System'}</strong> — {log.action} — {new Date(log.createdAt).toLocaleString()}
                  {log.details?.note&&<span> — "{log.details.note}"</span>}
                </div>))}
            </div>}

            {/* Actions */}
            {(()=>{
              const actions = getActions();
              if (actions.length === 0 && (user.role === 'supervisor' || (user.isAdmin && !user.primaryCompanyId))) {
                return <div style={{borderTop:'2px solid #e2e4e9',paddingTop:16,marginTop:8}}>
                  <div style={{fontSize:11,color:'#8b919e',fontStyle:'italic'}}>Corporate {user.isAdmin?'admin':'supervisor'} — view only. Quote workflow is handled by company-level staff.</div>
                </div>;
              }
              if (actions.length === 0) return null;
              const needsNote = actions.some(a => a.needsNote);
              const needsManager = actions.some(a => a.needsManager);
              return (
                <div style={{borderTop:'2px solid #e2e4e9',paddingTop:16,marginTop:8}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#003250',marginBottom:8}}>Actions</div>
                  {needsManager&&<div style={{marginBottom:8}}>
                    <div style={{fontSize:9,fontWeight:700,color:'#8b919e',marginBottom:3}}>SEND TO MANAGER</div>
                    <select value={selectedManager} onChange={e=>setSelectedManager(e.target.value)} style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e2e4e9',fontSize:12,boxSizing:'border-box'}}>
                      <option value="">Select manager...</option>
                      {managers.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>}
                  {needsNote&&<div style={{marginBottom:8}}>
                    <div style={{fontSize:9,fontWeight:700,color:'#8b919e',marginBottom:3}}>NOTE {needsNote?'(required for info request)':''}</div>
                    <input value={actionNote} onChange={e=>setActionNote(e.target.value)} placeholder="Add a note..." style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e2e4e9',fontSize:12,boxSizing:'border-box'}}/>
                  </div>}
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {actions.map(a=>(
                      <button key={a.key} onClick={()=>{
                        if(a.needsNote&&!actionNote.trim()){alert('Please add a note');return;}
                        if(a.needsManager&&!selectedManager){alert('Please select a manager');return;}
                        doAction(a.key);
                      }} disabled={acting} style={{padding:'8px 18px',borderRadius:8,border:'none',cursor:acting?'default':'pointer',background:acting?'#ccc':a.color,color:'#fff',fontSize:12,fontWeight:700,opacity:acting?.6:1}}>
                        {acting?'...':a.label}</button>))}
                  </div>
                </div>);
            })()}

            {/* Close */}
            <div style={{marginTop:16,textAlign:'right'}}>
              <button onClick={()=>{setSelected(null);setDetail(null);}} style={{padding:'8px 20px',borderRadius:8,border:'1px solid #e2e4e9',background:'#fff',color:'#8b919e',fontSize:12,fontWeight:600,cursor:'pointer'}}>Close</button>
            </div>
          </div>}
        </div>
      </div>}
    </div>
  );
}
