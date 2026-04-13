// app/(dashboard)/admin/page.js
'use client';
import { useAuth } from '@/components/AuthProvider';
import { useQuote } from '@/components/QuoteProvider';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { gP, cTot, fP, C } from '@/lib/transform';

const ROLE_OPTS = [{v:'salesperson',l:'Salesperson'},{v:'reviewer',l:'Reviewer'},{v:'manager',l:'Manager'},{v:'supervisor',l:'Supervisor'}];

/* ═══ ADD ITEM MODAL ═══ */
function AddItemModal({onClose,onSave,sections,color}){
  const[n,setN]=useState('');const[sec,setSec]=useState(sections.length>0?sections[0]:'__new__');const[newSec,setNewSec]=useState('');
  const[fp,setFP]=useState(0);const[mc,setMC]=useState(0);const[lh,setLH]=useState(0);
  const[desc,setDesc]=useState('');const[nt,setNt]=useState('');
  const[hq,setHq]=useState(false);const[vp,setVP]=useState(0);const[ql,setQl]=useState('');
  const[opts,setOpts]=useState([]);
  const addOpt=()=>setOpts([...opts,{name:'',fp:0,vp:0}]);
  const updOpt=(i,f,v)=>{const a=[...opts];a[i]={...a[i],[f]:v};setOpts(a);};
  const rmOpt=(i)=>setOpts(opts.filter((_,j)=>j!==i));
  const iS={width:'100%',padding:'7px 10px',borderRadius:6,border:'1px solid '+C.border,fontSize:12,boxSizing:'border-box',background:'#fff'};
  const lS={fontSize:9,fontWeight:700,color:C.muted,letterSpacing:'.04em',marginBottom:3};
  const secT=(t)=><div style={{fontSize:11,fontWeight:700,color,letterSpacing:'.04em',paddingBottom:6,marginBottom:10,marginTop:16,borderBottom:'2px solid '+color+'30'}}>{t}</div>;
  return(
    <div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:520}}>
      <div style={{height:3,background:color,borderRadius:3,marginBottom:12}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
        <div style={{fontSize:17,fontWeight:800,color}}>Add New Item</div>
        <button onClick={onClose} style={{border:'none',background:'none',fontSize:18,color:C.muted,cursor:'pointer'}}>{'\u00D7'}</button></div>
      <div style={{marginBottom:10}}><div style={lS}>SECTION</div>
        {sections.length>0?<div style={{display:'flex',gap:8}}>
          <select value={sec} onChange={e=>setSec(e.target.value)} style={{...iS,flex:1}}>{sections.map(s=><option key={s} value={s}>{s}</option>)}<option value="__new__">+ New Section</option></select>
          {sec==='__new__'&&<input value={newSec} onChange={e=>setNewSec(e.target.value)} placeholder="New section name" style={{...iS,flex:1}}/>}
        </div>:<input value={newSec} onChange={e=>setNewSec(e.target.value)} placeholder="e.g. Slicing Equipment" style={{...iS,border:'2px solid '+color}}/>}
      </div>
      {secT('ITEM DETAILS')}
      <div style={{marginBottom:8}}><div style={lS}>ITEM NAME</div><input value={n} onChange={e=>setN(e.target.value)} placeholder="e.g. VisionPak VP125" style={iS}/></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
        <div><div style={lS}>DESCRIPTION</div><input value={desc} onChange={e=>setDesc(e.target.value)} style={iS}/></div>
        <div><div style={lS}>NOTE</div><input value={nt} onChange={e=>setNt(e.target.value)} style={iS}/></div></div>
      {secT('OPTIONS / VARIATIONS')}
      <div style={{fontSize:10,color:C.muted,marginBottom:8}}>{opts.length>0?'Each option has its own pricing.':'No options = single item with one price.'}</div>
      {opts.length>0&&<div style={{display:'grid',gridTemplateColumns:'1fr 90px 90px 28px',gap:6,marginBottom:4}}>
        <div style={{fontSize:8,fontWeight:700,color:C.muted}}>NAME</div><div style={{fontSize:8,fontWeight:700,color:C.muted}}>FIXED $</div><div style={{fontSize:8,fontWeight:700,color:C.muted}}>VAR $/UNIT</div><div/></div>}
      {opts.map((o,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'1fr 90px 90px 28px',gap:6,marginBottom:4}}>
        <input value={o.name} onChange={e=>updOpt(i,'name',e.target.value)} placeholder="e.g. VP400" style={{...iS,fontSize:11}}/>
        <input type="number" value={o.fp||''} onChange={e=>updOpt(i,'fp',parseFloat(e.target.value)||0)} style={{...iS,fontSize:11,textAlign:'right'}}/>
        <input type="number" value={o.vp||''} onChange={e=>updOpt(i,'vp',parseFloat(e.target.value)||0)} style={{...iS,fontSize:11,textAlign:'right'}}/>
        <button onClick={()=>rmOpt(i)} style={{border:'none',background:'none',color:'#ccc',cursor:'pointer',fontSize:14}}>{'\u00D7'}</button></div>)}
      <button onClick={addOpt} style={{fontSize:10,fontWeight:600,color,background:'none',border:'1px dashed '+color,padding:'5px 14px',borderRadius:6,cursor:'pointer',marginTop:4}}>+ Add Option</button>
      {opts.length===0?<div>{secT('PRICING')}<div style={{background:'#f8f9fb',borderRadius:8,padding:12}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div><div style={lS}>FIXED PRICE ($)</div><input type="number" value={fp||''} onChange={e=>setFP(parseFloat(e.target.value)||0)} style={iS}/></div>
          <div><div style={lS}>VARIABLE ($/unit)</div><input type="number" value={vp||''} onChange={e=>setVP(parseFloat(e.target.value)||0)} style={iS}/></div></div></div></div>
        :<div style={{background:color+'08',borderRadius:8,padding:'10px 14px',marginTop:12,border:'1px solid '+color+'20'}}>
          <div style={{fontSize:10,color,fontWeight:600}}>{'\u2713'} Pricing from each option above</div></div>}
      <div style={{display:'flex',alignItems:'center',gap:12,marginTop:10,padding:'8px 0',borderTop:'1px solid '+C.border}}>
        <label style={{fontSize:11,display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}><input type="checkbox" checked={hq} onChange={e=>setHq(e.target.checked)} style={{accentColor:color}}/> Show quantity input</label>
        {hq&&<input value={ql} onChange={e=>setQl(e.target.value)} placeholder="Qty label" style={{...iS,width:100}}/>}</div>
      {secT('COSTING')}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <div><div style={lS}>MATERIAL COST ($)</div><input type="number" value={mc||''} onChange={e=>setMC(parseFloat(e.target.value)||0)} style={iS}/></div>
        <div><div style={lS}>LABOR HOURS</div><input type="number" step="0.1" value={lh||''} onChange={e=>setLH(parseFloat(e.target.value)||0)} style={iS}/></div></div>
      <div style={{display:'flex',gap:8,marginTop:20,paddingTop:14,borderTop:'1px solid '+C.border}}>
        <button onClick={()=>{
          const finalSec=sec==='__new__'?newSec:sec;if(!n||!finalSec)return;
          const item={id:'item_'+Date.now(),n,fp,mc,lh};
          if(desc)item.desc=desc;if(nt)item.nt=nt;
          if(hq){item.hq=true;if(vp)item.vp=vp;if(ql)item.ql=ql;}else if(vp){item.hq=true;item.vp=vp;if(ql)item.ql=ql;}
          const vo=opts.filter(o=>o.name.trim());
          if(vo.length>0){item.ops=vo.map(o=>o.name.trim());item.opP={};vo.forEach(o=>{item.opP[o.name.trim()]=o.fp||0;});
            if(vo.some(o=>o.vp>0)){item.hq=true;item.opVP={};vo.forEach(o=>{item.opVP[o.name.trim()]=o.vp||0;});}}
          onSave(item,finalSec);
        }} style={{flex:1,padding:11,background:n?color:'#ccc',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:n?'pointer':'default'}}>Add Item</button>
        <button onClick={onClose} style={{padding:'11px 20px',background:'#f3f4f6',color:'#888',border:'none',borderRadius:8,fontSize:13,cursor:'pointer'}}>Cancel</button></div>
    </div></div>);
}

/* ═══ EDIT ITEM MODAL ═══ */
function EditItemModal({item,onClose,onSave,onDelete,color}){
  const[n,setN]=useState(item.n||'');const[fp,setFP]=useState(item.fp||0);const[mc,setMC]=useState(item.mc||0);const[lh,setLH]=useState(item.lh||0);
  const[desc,setDesc]=useState(item.desc||'');const[nt,setNt]=useState(item.nt||'');
  const[hq,setHq]=useState(!!item.hq);const[vp,setVP]=useState(item.vp||0);const[ql,setQl]=useState(item.ql||'');
  const io=(item.ops||[]).map(name=>({name,fp:(item.opP&&item.opP[name])||0,vp:(item.opVP&&item.opVP[name])||0}));
  const[opts,setOpts]=useState(io);
  const addOpt=()=>setOpts([...opts,{name:'',fp:0,vp:0}]);
  const updOpt=(i,f,v)=>{const a=[...opts];a[i]={...a[i],[f]:v};setOpts(a);};
  const rmOpt=(i)=>setOpts(opts.filter((_,j)=>j!==i));
  const iS={width:'100%',padding:'7px 10px',borderRadius:6,border:'1px solid '+C.border,fontSize:12,boxSizing:'border-box',background:'#fff'};
  const lS={fontSize:9,fontWeight:700,color:C.muted,marginBottom:3};
  const secT=(t)=><div style={{fontSize:11,fontWeight:700,color,paddingBottom:6,marginBottom:10,marginTop:16,borderBottom:'2px solid '+color+'30'}}>{t}</div>;
  return(
    <div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:520}}>
      <div style={{height:3,background:color,borderRadius:3,marginBottom:12}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
        <div style={{fontSize:17,fontWeight:800,color}}>Edit Item</div>
        <button onClick={onClose} style={{border:'none',background:'none',fontSize:18,color:C.muted,cursor:'pointer'}}>{'\u00D7'}</button></div>
      {secT('ITEM DETAILS')}
      <div style={{marginBottom:8}}><div style={lS}>ITEM NAME</div><input value={n} onChange={e=>setN(e.target.value)} style={iS}/></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
        <div><div style={lS}>DESCRIPTION</div><input value={desc} onChange={e=>setDesc(e.target.value)} style={iS}/></div>
        <div><div style={lS}>NOTE</div><input value={nt} onChange={e=>setNt(e.target.value)} style={iS}/></div></div>
      {secT('OPTIONS')}
      {opts.length>0&&<div style={{display:'grid',gridTemplateColumns:'1fr 90px 90px 28px',gap:6,marginBottom:4}}>
        <div style={{fontSize:8,fontWeight:700,color:C.muted}}>NAME</div><div style={{fontSize:8,fontWeight:700,color:C.muted}}>FIXED $</div><div style={{fontSize:8,fontWeight:700,color:C.muted}}>VAR $/U</div><div/></div>}
      {opts.map((o,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'1fr 90px 90px 28px',gap:6,marginBottom:4}}>
        <input value={o.name} onChange={e=>updOpt(i,'name',e.target.value)} style={{...iS,fontSize:11}}/>
        <input type="number" value={o.fp||''} onChange={e=>updOpt(i,'fp',parseFloat(e.target.value)||0)} style={{...iS,fontSize:11,textAlign:'right'}}/>
        <input type="number" value={o.vp||''} onChange={e=>updOpt(i,'vp',parseFloat(e.target.value)||0)} style={{...iS,fontSize:11,textAlign:'right'}}/>
        <button onClick={()=>rmOpt(i)} style={{border:'none',background:'none',color:'#ccc',cursor:'pointer',fontSize:14}}>{'\u00D7'}</button></div>)}
      <button onClick={addOpt} style={{fontSize:10,fontWeight:600,color,background:'none',border:'1px dashed '+color,padding:'5px 14px',borderRadius:6,cursor:'pointer'}}>+ Add Option</button>
      {opts.length===0?<div>{secT('PRICING')}<div style={{background:'#f8f9fb',borderRadius:8,padding:12}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div><div style={lS}>FIXED PRICE ($)</div><input type="number" value={fp||''} onChange={e=>setFP(parseFloat(e.target.value)||0)} style={iS}/></div>
          <div><div style={lS}>VARIABLE ($/unit)</div><input type="number" value={vp||''} onChange={e=>setVP(parseFloat(e.target.value)||0)} style={iS}/></div></div></div></div>
        :<div style={{background:color+'08',borderRadius:8,padding:'10px 14px',marginTop:12,border:'1px solid '+color+'20'}}>
          <div style={{fontSize:10,color,fontWeight:600}}>{'\u2713'} Pricing from options</div></div>}
      <div style={{display:'flex',alignItems:'center',gap:12,marginTop:10,padding:'8px 0',borderTop:'1px solid '+C.border}}>
        <label style={{fontSize:11,display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}><input type="checkbox" checked={hq} onChange={e=>setHq(e.target.checked)} style={{accentColor:color}}/> Show quantity</label>
        {hq&&<input value={ql} onChange={e=>setQl(e.target.value)} placeholder="label" style={{...iS,width:100}}/>}</div>
      {secT('COSTING')}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <div><div style={lS}>MATERIAL COST ($)</div><input type="number" value={mc||''} onChange={e=>setMC(parseFloat(e.target.value)||0)} style={iS}/></div>
        <div><div style={lS}>LABOR HOURS</div><input type="number" step="0.1" value={lh||''} onChange={e=>setLH(parseFloat(e.target.value)||0)} style={iS}/></div></div>
      <div style={{display:'flex',gap:8,marginTop:20,paddingTop:14,borderTop:'1px solid '+C.border}}>
        <button onClick={()=>{
          const u={...item,n,fp,mc,lh,desc:desc||undefined,nt:nt||undefined,hq:hq||undefined,vp:vp||undefined,ql:ql||undefined};
          const vo=opts.filter(o=>o.name.trim());
          if(vo.length>0){u.ops=vo.map(o=>o.name.trim());u.opP={};vo.forEach(o=>{u.opP[o.name.trim()]=o.fp||0;});
            if(vo.some(o=>o.vp>0)){u.opVP={};vo.forEach(o=>{u.opVP[o.name.trim()]=o.vp||0;});}else{delete u.opVP;}}
          else{delete u.ops;delete u.opP;delete u.opVP;}
          onSave(u);
        }} style={{flex:1,padding:11,background:color,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>Save Changes</button>
        <button onClick={()=>{if(confirm('Delete this item?'))onDelete(item.id);}} style={{padding:'11px 16px',background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',borderRadius:8,fontSize:12,cursor:'pointer'}}>Delete</button>
        <button onClick={onClose} style={{padding:'11px 16px',background:'#f3f4f6',color:'#888',border:'none',borderRadius:8,fontSize:12,cursor:'pointer'}}>Cancel</button></div>
    </div></div>);
}

/* ═══ ADMIN PAGE ═══ */
export default function AdminPage() {
  const { user, canAdmin } = useAuth();
  const { cats, setCats, companies, setCompanies, customers, setCustomers, terms, setTerms, loading: qLoading } = useQuote();
  const router = useRouter();
  const [co, setCo] = useState(null);
  const [tab, setTab] = useState('profiles');
  const [newCoName, setNewCoName] = useState(''); const [newCoColor, setNewCoColor] = useState('#4A90D9'); const [newCoDesc, setNewCoDesc] = useState('');
  const [editItem, setEditItem] = useState(null); const [editSec, setEditSec] = useState(null);
  const [openCatSec, setOpenCatSec] = useState(null); const [showAddItem, setShowAddItem] = useState(false);
  const [users, setUsers] = useState([]); const [loadingUsers, setLoadingUsers] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false); const [editUser, setEditUser] = useState(null);
  const [newUser, setNewUser] = useState({ name:'',email:'',password:'',role:'salesperson',isAdmin:false,primaryCompanyId:'' });
  const [dbCompanies, setDbCompanies] = useState([]);
  const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const [showAddCust, setShowAddCust] = useState(false);
  const [newCust, setNewCust] = useState({name:'',plant:'',address:'',contact:'',email:'',phone:'',rep:'',industry:''});
  const [saving, setSaving] = useState(false);

  // Helper: update company locally AND persist to DB
  const saveTimers = {};
  const updCoAndSave = (k, field, value) => {
    // Update local state immediately
    const n = { ...companies }; n[k] = { ...n[k], [field]: value }; setCompanies(n);
    // Debounced save to DB
    const companyId = n[k]?.id;
    if (!companyId) return;
    clearTimeout(saveTimers[k + field]);
    saveTimers[k + field] = setTimeout(async () => {
      try { await fetch('/api/companies', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: companyId, [field]: value }) }); } catch {}
    }, 800);
  };

  // Helper: update rates locally AND persist
  const updRatesAndSave = (rateKey, value) => {
    const newRates = { ...(cd?.rates || {}), [rateKey]: value };
    updCoAndSave(co, 'rates', newRates);
  };

  // Helper: save terms to DB
  const saveTermsTimer = {};
  const updTermsAndSave = (val) => {
    setTerms(val);
    clearTimeout(saveTermsTimer.t);
    saveTermsTimer.t = setTimeout(async () => {
      try { await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'terms', value: val }) }); } catch {}
    }, 1000);
  };

  // Helper: add company to DB
  const addCompanyToDB = async () => {
    if (!newCoName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCoName.trim(), color: newCoColor, description: newCoDesc.trim() }) });
      if (res.ok) {
        const { company } = await res.json();
        const key = company.key;
        const n = { ...companies }; n[key] = { id: company.id, name: company.name, color: company.color, bg: company.color + '12', desc: company.description || '', execSummary: '', rates: company.rates || {}, logo: null, machineImg: null };
        setCompanies(n); setCats(p => ({ ...p, [key]: {} }));
        setNewCoName(''); setNewCoDesc('');
        setSuccess('Company added'); setTimeout(() => setSuccess(''), 3000);
      } else { const d = await res.json(); setError(d.error); }
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  // Helper: add catalog item to DB
  const addItemToDB = async (item, secName) => {
    const companyId = cd?.id;
    if (!companyId) { /* fallback to local only */ const nc = JSON.parse(JSON.stringify(cats)); if (!nc[co]) nc[co] = {}; if (!nc[co][secName]) nc[co][secName] = { items: [] }; nc[co][secName].items.push(item); setCats(nc); return; }
    try {
      // Ensure section exists
      const secRes = await fetch('/api/catalog/sections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyId, name: secName }) });
      const secData = await secRes.json();
      const sectionId = secData.section?.id;
      if (!sectionId) { setError('Failed to create section'); return; }
      // Create item
      const options = item.ops ? item.ops.map(name => ({ name, fixedPrice: item.opP?.[name] || 0, variablePrice: item.opVP?.[name] || 0 })) : null;
      const res = await fetch('/api/catalog/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sectionId, name: item.n, fixedPrice: item.fp || 0, variablePrice: item.vp || 0, materialCost: item.mc || 0, laborHours: item.lh || 0, description: item.desc || null, note: item.nt || null, hasQuantity: !!item.hq, quantityLabel: item.ql || null, options }) });
      if (res.ok) {
        const { item: dbItem } = await res.json();
        item.id = dbItem.id; // use DB id
        const nc = JSON.parse(JSON.stringify(cats)); if (!nc[co]) nc[co] = {}; if (!nc[co][secName]) nc[co][secName] = { items: [] }; nc[co][secName].items.push(item); setCats(nc);
        setSuccess('Item added'); setTimeout(() => setSuccess(''), 3000);
      } else { const d = await res.json(); setError(d.error); }
    } catch (e) { setError(e.message); }
  };

  // Helper: update catalog item in DB
  const updateItemInDB = async (updated) => {
    const nc = JSON.parse(JSON.stringify(cats)); const s = nc[co]?.[editSec]; if (!s) return;
    const idx = s.items.findIndex(x => x.id === updated.id); if (idx >= 0) s.items[idx] = updated;
    setCats(nc); setEditItem(null); setEditSec(null);
    // Persist
    try {
      const options = updated.ops ? updated.ops.map(name => ({ name, fixedPrice: updated.opP?.[name] || 0, variablePrice: updated.opVP?.[name] || 0 })) : null;
      await fetch('/api/catalog/items', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: updated.id, name: updated.n, fixedPrice: updated.fp || 0, variablePrice: updated.vp || 0, materialCost: updated.mc || 0, laborHours: updated.lh || 0, description: updated.desc || null, note: updated.nt || null, hasQuantity: !!updated.hq, quantityLabel: updated.ql || null, options }) });
    } catch {}
  };

  // Helper: delete catalog item from DB
  const deleteItemFromDB = async (id) => {
    const nc = JSON.parse(JSON.stringify(cats)); const s = nc[co]?.[editSec]; if (!s) return;
    s.items = s.items.filter(x => x.id !== id); if (s.items.length === 0) delete nc[co][editSec];
    setCats(nc); setEditItem(null); setEditSec(null);
    try { await fetch('/api/catalog/items?id=' + id, { method: 'DELETE' }); } catch {}
  };

  useEffect(() => {
    if (!canAdmin) { router.push('/builder'); return; }
    if (!co && Object.keys(companies).length > 0) setCo(Object.keys(companies)[0]);
    async function load() {
      try {
        const [uRes, cRes] = await Promise.all([fetch('/api/users'), fetch('/api/catalog')]);
        if (uRes.ok) setUsers((await uRes.json()).users || []);
        if (cRes.ok) setDbCompanies((await cRes.json()).companies || []);
      } catch (e) { console.error(e); }
      setLoadingUsers(false);
    }
    load();
  }, [canAdmin, router, companies, co]);

  if (!canAdmin || qLoading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 56px)'}}><div style={{fontSize:16,color:C.muted}}>Loading...</div></div>;

  const coKeys = Object.keys(companies);
  const cd = companies[co] || companies[coKeys[0]] || { name: 'None', color: '#999', desc: '', rates: {} };
  const cat = cats[co] || {};
  const updCo = updCoAndSave;
  const sectionNames = Object.keys(cat);
  const all = []; Object.entries(cat).forEach(([s, sec]) => (sec.items || []).forEach(it => all.push({ ...it, section: s })));

  const TB = ({ id, l }) => <button onClick={() => setTab(id)} style={{ padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: tab === id ? '#fff' : 'transparent', color: tab === id ? C.navy : '#888', boxShadow: tab === id ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{l}</button>;
  const iS = {width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e2e4e9',fontSize:12,boxSizing:'border-box'};
  const lS = {fontSize:10,fontWeight:700,color:'#8b919e',marginBottom:3,display:'block'};

  const handleAddUser = async () => {
    setError('');if(!newUser.name||!newUser.email||!newUser.password){setError('Name, email, password required');return;}
    try{const r=await fetch('/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newUser)});const d=await r.json();
      if(!r.ok){setError(d.error);return;}setUsers(p=>[...p,d.user]);setNewUser({name:'',email:'',password:'',role:'salesperson',isAdmin:false,primaryCompanyId:''});setShowAddUser(false);setSuccess('User created');setTimeout(()=>setSuccess(''),3000);
    }catch{setError('Network error');}
  };
  const handleUpdateUser = async (upd) => {
    setError('');try{const r=await fetch('/api/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(upd)});const d=await r.json();
      if(!r.ok){setError(d.error);return;}setUsers(p=>p.map(u=>u.id===d.user.id?d.user:u));setEditUser(null);setSuccess('Updated');setTimeout(()=>setSuccess(''),3000);
    }catch{setError('Network error');}
  };

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 2, background: '#fff', padding: 4, borderRadius: 10, border: '1px solid ' + C.border }}>
          <TB id="profiles" l="Company Profiles" /><TB id="rates" l="Rates" /><TB id="catalog" l="Catalog" /><TB id="terms" l="Terms" /><TB id="customers" l="Customers" /><TB id="users" l="Users" />
        </div>
        {(tab==='catalog'||tab==='rates')&&<div style={{display:'flex',gap:2,background:'#fff',padding:4,borderRadius:10,border:'1px solid '+C.border,marginLeft:'auto'}}>
          {coKeys.map(k=>{const d=companies[k];return <button key={k} onClick={()=>setCo(k)} style={{padding:'6px 14px',borderRadius:6,border:'none',cursor:'pointer',fontSize:11,fontWeight:700,background:co===k?d.color:'transparent',color:co===k?'#fff':d.color}}>{d.name}</button>;})}
        </div>}
      </div>

      {success&&<div style={{padding:'8px 16px',background:'#dcfce7',color:'#16a34a',borderRadius:8,fontSize:12,fontWeight:600,marginBottom:16}}>{success}</div>}
      {error&&<div style={{padding:'8px 16px',background:'#fef2f2',color:'#dc2626',borderRadius:8,fontSize:12,fontWeight:600,marginBottom:16}}>{error}</div>}

      {/* ═══ PROFILES ═══ */}
      {tab==='profiles'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
        {coKeys.map(k=>{const d=companies[k];return(
          <div key={k} style={{background:'#fff',borderRadius:12,border:'2px solid '+d.color,padding:20}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <div style={{width:44,height:44,borderRadius:10,background:d.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,color:'#fff'}}>{d.name[0]}</div>
              <div><div style={{fontSize:15,fontWeight:700,color:d.color}}>{d.name}</div><div style={{fontSize:10,color:C.muted}}>{d.desc}</div></div></div>
            <div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:C.muted,marginBottom:3}}>COMPANY NAME</div><input value={d.name} onChange={e=>updCo(k,'name',e.target.value)} style={iS}/></div>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:C.muted,marginBottom:3}}>DESCRIPTION</div><input value={d.desc} onChange={e=>updCo(k,'desc',e.target.value)} style={iS}/></div>
              <div style={{width:60}}><div style={{fontSize:9,fontWeight:700,color:C.muted,marginBottom:3}}>COLOR</div><input type="color" value={d.color} onChange={e=>updCo(k,'color',e.target.value)} style={{width:'100%',height:30,borderRadius:6,border:'1px solid '+C.border,cursor:'pointer',padding:0}}/></div></div>
            <div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,color:C.muted,marginBottom:3}}>EXECUTIVE SUMMARY</div>
              <textarea value={d.execSummary||''} onChange={e=>updCo(k,'execSummary',e.target.value)} rows={4} placeholder="Appears on bundle PDF..." style={{...iS,fontFamily:'inherit',resize:'vertical',lineHeight:1.5}}/></div>
            {(d.execSummary||'').length>0?<div style={{fontSize:9,color:C.green,fontWeight:600}}>{'\u2713'} Summary set</div>:<div style={{fontSize:9,color:'#92400e',fontWeight:600}}>{'\u26A0'} No summary</div>}
          </div>);})}
        <div style={{background:'#fff',borderRadius:12,border:'2px dashed '+C.border,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:C.navy,marginBottom:12}}>+ Add Company</div>
          <div style={{marginBottom:8}}><div style={{fontSize:9,fontWeight:700,color:C.muted,marginBottom:3}}>NAME</div><input value={newCoName} onChange={e=>setNewCoName(e.target.value)} placeholder="e.g. Alkar" style={iS}/></div>
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:C.muted,marginBottom:3}}>DESCRIPTION</div><input value={newCoDesc} onChange={e=>setNewCoDesc(e.target.value)} style={iS}/></div>
            <div style={{width:60}}><div style={{fontSize:9,fontWeight:700,color:C.muted,marginBottom:3}}>COLOR</div><input type="color" value={newCoColor} onChange={e=>setNewCoColor(e.target.value)} style={{width:'100%',height:30,borderRadius:6,border:'1px solid '+C.border,cursor:'pointer',padding:0}}/></div></div>
          <button onClick={addCompanyToDB} disabled={!newCoName.trim()||saving} style={{padding:'8px 16px',background:newCoName.trim()?C.navy:'#ccc',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:newCoName.trim()?'pointer':'default'}}>{saving?'Adding...':'Add Company'}</button>
        </div>
      </div>}

      {/* ═══ RATES ═══ */}
      {tab==='rates'&&cd&&<div style={{background:'#fff',borderRadius:12,border:'2px solid '+cd.color,padding:20,maxWidth:500}}>
        <div style={{fontSize:15,fontWeight:700,color:cd.color,marginBottom:16}}>{cd.name} Rates</div>
        {[['laborRate','Labor Rate ($)'],['pohr','POHR (X)'],['markup','Markup %'],['agentFee','Agent Fee %'],['commission','Commission %'],['freight','Freight ($)'],['install','Install ($)']].map(([rk,l])=>(
          <div key={rk} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid #f3f4f6'}}>
            <span style={{fontSize:12}}>{l}</span>
            <input type="number" step="0.1" value={(cd.rates&&cd.rates[rk])||0} onChange={e=>updRatesAndSave(rk,parseFloat(e.target.value)||0)} style={{width:80,padding:'4px 8px',borderRadius:5,border:'1px solid '+C.border,fontSize:11,textAlign:'right'}}/>
          </div>))}
      </div>}

      {/* ═══ CATALOG ═══ */}
      {tab==='catalog'&&<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div><span style={{fontSize:16,fontWeight:700,color:cd.color}}>{cd.name} Catalog</span><span style={{fontSize:12,color:C.muted,marginLeft:8}}>{all.length} items</span></div>
          <button onClick={()=>setShowAddItem(true)} style={{padding:'6px 14px',background:cd.color,color:'#fff',border:'none',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer'}}>+ Add Item</button>
        </div>
        {sectionNames.length===0&&<div style={{padding:40,textAlign:'center',color:C.muted,fontSize:12,background:'#fff',borderRadius:10,border:'1px dashed '+C.border}}>No items yet. Click + Add Item.</div>}
        {sectionNames.map(sn=>{const items=(cat[sn]&&cat[sn].items)||[];const isOpen=openCatSec===sn;return(
          <div key={sn} style={{marginBottom:8,borderRadius:10,overflow:'hidden',border:'1px solid '+C.border,background:'#fff'}}>
            <div onClick={()=>setOpenCatSec(isOpen?null:sn)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',cursor:'pointer',background:isOpen?cd.color+'08':'#fff'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:8,color:C.muted,transform:isOpen?'rotate(90deg)':'none',transition:'transform .15s',display:'inline-block'}}>{'\u25B6'}</span>
                <div style={{width:4,height:18,borderRadius:2,background:cd.color}}/>
                <span style={{fontSize:13,fontWeight:700,color:cd.color}}>{sn}</span></div>
              <span style={{fontSize:10,fontWeight:600,color:C.muted}}>{items.length} item{items.length!==1?'s':''}</span></div>
            {isOpen&&items.length>0&&<table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr style={{background:'#f9fafb'}}>{['Item Name','Fixed $','Options','Material $','Labor Hrs',''].map(x=><th key={x} style={{padding:'6px 12px',textAlign:x==='Item Name'?'left':'right',fontSize:8,fontWeight:700,color:C.muted}}>{x}</th>)}</tr></thead>
              <tbody>{items.map(it=>{const hasOps=it.ops&&it.ops.length>0;return(
                <tr key={it.id} onClick={()=>{setEditItem(it);setEditSec(sn);}} style={{borderBottom:'1px solid #f3f4f6',cursor:'pointer'}} onMouseOver={e=>e.currentTarget.style.background=cd.color+'06'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'8px 12px'}}><div style={{fontWeight:600,color:C.text}}>{it.n}</div>{it.desc&&<div style={{fontSize:9,color:C.muted,marginTop:1}}>{it.desc}</div>}</td>
                  <td style={{padding:'8px 12px',textAlign:'right',fontWeight:600,color:cd.color}}>{hasOps?'\u2014':'$'+(it.fp||0).toLocaleString()}</td>
                  <td style={{padding:'8px 12px',textAlign:'right',fontSize:10,color:hasOps?cd.color:C.muted}}>{hasOps?it.ops.length+' opts':it.vp?'$'+it.vp+'/u':'\u2014'}</td>
                  <td style={{padding:'8px 12px',textAlign:'right',color:'#888'}}>{'$'+(it.mc||0).toLocaleString()}</td>
                  <td style={{padding:'8px 12px',textAlign:'right',color:'#888'}}>{(it.lh||0).toFixed(1)}</td>
                  <td style={{padding:'8px 4px',width:20,textAlign:'center',color:C.muted,fontSize:12}}>{'\u270E'}</td>
                </tr>);})}</tbody></table>}
          </div>);})}
        {editItem&&<EditItemModal item={editItem} color={cd.color} onClose={()=>{setEditItem(null);setEditSec(null);}}
          onSave={updateItemInDB}
          onDelete={deleteItemFromDB}/>}
        {showAddItem&&<AddItemModal color={cd.color} sections={sectionNames} onClose={()=>setShowAddItem(false)}
          onSave={(item,secName)=>{addItemToDB(item,secName);setShowAddItem(false);}}/>}
      </div>}

      {/* ═══ TERMS ═══ */}
      {tab==='terms'&&<div style={{background:'#fff',borderRadius:12,border:'1px solid '+C.border,padding:24,maxWidth:900}}>
        <div style={{fontSize:16,fontWeight:700,color:C.navy,marginBottom:4}}>Terms & Conditions</div>
        <div style={{fontSize:11,color:C.muted,marginBottom:16}}>These terms appear on every PDF proposal.</div>
        <textarea value={terms} onChange={e=>updTermsAndSave(e.target.value)} rows={20} style={{...iS,lineHeight:1.7,fontFamily:'inherit',resize:'vertical'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
          <div style={{fontSize:10,color:C.muted}}>{terms.split('\n').filter(l=>l.trim()).length} clauses</div>
          <button onClick={()=>setTerms('1. PRICING: All prices are in US Dollars and are valid for 30 days.\n\n2. PAYMENT TERMS: 30% deposit with order, balance net 30 days from shipment.\n\n3. DELIVERY: Estimated delivery 16-20 weeks from receipt of order.\n\n4. WARRANTY: 12 months from startup or 15 months from shipment.\n\n5. INSTALLATION: Available at prevailing per diem rates plus travel.\n\n6. TAXES: Prices do not include taxes.\n\n7. CANCELLATION: Subject to cancellation charges.\n\n8. FORCE MAJEURE: Not liable for delays beyond reasonable control.')} style={{padding:'6px 16px',borderRadius:6,border:'1px solid '+C.border,background:'transparent',color:C.muted,fontSize:11,fontWeight:600,cursor:'pointer'}}>Reset to Default</button></div>
      </div>}

      {/* ═══ CUSTOMERS ═══ */}
      {tab==='customers'&&<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div><h2 style={{fontSize:18,fontWeight:800,color:'#003250',margin:0}}>Customers</h2><p style={{fontSize:12,color:'#8b919e',margin:'4px 0 0'}}>{customers.length} customers</p></div>
          <button onClick={()=>setShowAddCust(true)} style={{padding:'8px 18px',background:'#003250',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer'}}>+ Add Customer</button></div>
        {showAddCust&&<div className="modal-overlay" onClick={()=>setShowAddCust(false)}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:520}}>
          <div style={{fontSize:17,fontWeight:800,color:'#003250',marginBottom:16}}>Add New Customer</div>
          {[['name','Company Name'],['plant','Plant / Facility'],['address','Address'],['contact','Contact Name'],['email','Email'],['phone','Phone'],['rep','Sales Rep'],['industry','Industry']].map(([k,l])=>(
            <div key={k} style={{marginBottom:8}}><label style={lS}>{l.toUpperCase()}</label><input value={newCust[k]} onChange={e=>setNewCust({...newCust,[k]:e.target.value})} placeholder={l} style={iS}/></div>))}
          <div style={{display:'flex',gap:8,marginTop:16}}>
            <button onClick={async()=>{
              if(!newCust.name.trim()){setError('Customer name required');return;}
              try{const r=await fetch('/api/customers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newCust)});const d=await r.json();
                if(!r.ok){setError(d.error);return;}
                setCustomers(prev => [...prev, d.customer]);
                setNewCust({name:'',plant:'',address:'',contact:'',email:'',phone:'',rep:'',industry:''});setShowAddCust(false);setSuccess('Customer added');setTimeout(()=>setSuccess(''),3000);
              }catch{setError('Network error');}
            }} style={{flex:1,padding:10,background:'#003250',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>Add Customer</button>
            <button onClick={()=>setShowAddCust(false)} style={{padding:'10px 20px',background:'#f3f4f6',color:'#8b919e',border:'none',borderRadius:8,cursor:'pointer'}}>Cancel</button></div>
        </div></div>}
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e4e9',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr style={{background:'#f8f9fb'}}>
            {['Name','Plant','Contact','Email','Phone','Rep','Industry'].map(h=><th key={h} style={{padding:'8px 14px',textAlign:'left',fontSize:9,fontWeight:700,color:'#8b919e',borderBottom:'1px solid #e2e4e9'}}>{h}</th>)}
          </tr></thead><tbody>{customers.map(c=>(
            <tr key={c.id} style={{borderBottom:'1px solid #f3f4f6'}}>
              <td style={{padding:'8px 14px',fontWeight:600,color:'#003250'}}>{c.name}</td>
              <td style={{padding:'8px 14px',color:'#555'}}>{c.plant||'—'}</td>
              <td style={{padding:'8px 14px'}}>{c.contact||'—'}</td>
              <td style={{padding:'8px 14px',color:'#8b919e'}}>{c.email||'—'}</td>
              <td style={{padding:'8px 14px',color:'#8b919e'}}>{c.phone||'—'}</td>
              <td style={{padding:'8px 14px'}}>{c.rep||'—'}</td>
              <td style={{padding:'8px 14px',color:'#8b919e'}}>{c.industry||'—'}</td>
            </tr>))}</tbody></table></div>
      </div>}

      {/* ═══ USERS ═══ */}
      {tab==='users'&&<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div><h2 style={{fontSize:18,fontWeight:800,color:'#003250',margin:0}}>Users & Accounts</h2><p style={{fontSize:12,color:'#8b919e',margin:'4px 0 0'}}>{users.length} users</p></div>
          <button onClick={()=>setShowAddUser(true)} style={{padding:'8px 18px',background:'#003250',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer'}}>+ Add User</button></div>
        {showAddUser&&<div className="modal-overlay" onClick={()=>setShowAddUser(false)}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:480}}>
          <div style={{fontSize:17,fontWeight:800,color:'#003250',marginBottom:16}}>Add New User</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><label style={lS}>NAME</label><input value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})} style={iS}/></div>
            <div><label style={lS}>EMAIL</label><input value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} style={iS}/></div></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><label style={lS}>PASSWORD</label><input type="password" value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})} style={iS}/></div>
            <div><label style={lS}>ROLE</label><select value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value})} style={iS}>{ROLE_OPTS.map(r=><option key={r.v} value={r.v}>{r.l}</option>)}</select></div></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><label style={lS}>PRIMARY COMPANY</label><select value={newUser.primaryCompanyId} onChange={e=>setNewUser({...newUser,primaryCompanyId:e.target.value})} style={iS}><option value="">None (Corporate)</option>{dbCompanies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div style={{display:'flex',flexDirection:'column',gap:8,justifyContent:'end',paddingBottom:4}}>
              <label style={{fontSize:12,display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}><input type="checkbox" checked={newUser.isAdmin} onChange={e=>setNewUser({...newUser,isAdmin:e.target.checked})}/> Admin privileges</label>
            </div></div>
          <div style={{display:'flex',gap:8,marginTop:16}}>
            <button onClick={handleAddUser} style={{flex:1,padding:10,background:'#003250',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>Create User</button>
            <button onClick={()=>setShowAddUser(false)} style={{padding:'10px 20px',background:'#f3f4f6',color:'#8b919e',border:'none',borderRadius:8,cursor:'pointer'}}>Cancel</button></div>
        </div></div>}
        {editUser&&<div className="modal-overlay" onClick={()=>setEditUser(null)}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:480}}>
          <div style={{fontSize:17,fontWeight:800,color:'#003250',marginBottom:16}}>Edit: {editUser.name}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><label style={lS}>NAME</label><input defaultValue={editUser.name} id="en" style={iS}/></div>
            <div><label style={lS}>EMAIL</label><input defaultValue={editUser.email} id="ee" style={iS}/></div></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><label style={lS}>NEW PASSWORD</label><input type="password" id="ep" style={iS}/></div>
            <div><label style={lS}>ROLE</label><select defaultValue={editUser.role} id="er" style={iS}>{ROLE_OPTS.map(r=><option key={r.v} value={r.v}>{r.l}</option>)}</select></div></div>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:10}}>
            <label style={{fontSize:12,display:'flex',alignItems:'center',gap:6}}><input type="checkbox" defaultChecked={editUser.isAdmin} id="ea"/> Admin</label>
            <label style={{fontSize:12,display:'flex',alignItems:'center',gap:6}}><input type="checkbox" defaultChecked={editUser.active} id="eac"/> Active</label></div>
          <div style={{display:'flex',gap:8,marginTop:16}}>
            <button onClick={()=>{const pw=document.getElementById('ep').value;handleUpdateUser({id:editUser.id,name:document.getElementById('en').value,email:document.getElementById('ee').value,role:document.getElementById('er').value,isAdmin:document.getElementById('ea').checked,active:document.getElementById('eac').checked,...(pw?{password:pw}:{})});}} style={{flex:1,padding:10,background:'#003250',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>Save</button>
            <button onClick={()=>setEditUser(null)} style={{padding:'10px 20px',background:'#f3f4f6',color:'#8b919e',border:'none',borderRadius:8,cursor:'pointer'}}>Cancel</button></div>
        </div></div>}
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e4e9',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr style={{background:'#f8f9fb'}}>
            {['Name','Email','Role','Admin','Status',''].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:9,fontWeight:700,color:'#8b919e',borderBottom:'1px solid #e2e4e9'}}>{h}</th>)}
          </tr></thead><tbody>{users.map(u=><tr key={u.id} style={{borderBottom:'1px solid #f3f4f6'}}>
            <td style={{padding:'10px 14px',fontWeight:600,color:'#003250'}}>{u.name}</td>
            <td style={{padding:'10px 14px',color:'#555'}}>{u.email}</td>
            <td style={{padding:'10px 14px'}}><span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:10,background:u.role==='supervisor'?'#dbeafe':u.role==='manager'?'#dcfce7':u.role==='reviewer'?'#fef9c3':'#f3f4f6',color:u.role==='supervisor'?'#2563eb':u.role==='manager'?'#16a34a':u.role==='reviewer'?'#a16207':'#6b7085'}}>{ROLE_OPTS.find(r=>r.v===u.role)?.l}</span></td>
            <td style={{padding:'10px 14px'}}>{u.isAdmin&&<span style={{fontSize:10,fontWeight:600,color:'#E12C3E',background:'#fef2f2',padding:'2px 8px',borderRadius:10}}>Admin</span>}</td>
            <td style={{padding:'10px 14px'}}><span style={{fontSize:10,fontWeight:600,color:u.active?'#16a34a':'#dc2626'}}>{u.active?'Active':'Inactive'}</span></td>
            <td style={{padding:'10px 14px'}}><button onClick={()=>setEditUser(u)} style={{padding:'4px 10px',borderRadius:5,border:'1px solid #e2e4e9',background:'#fff',fontSize:10,fontWeight:600,cursor:'pointer'}}>Edit</button></td>
          </tr>)}</tbody></table></div>
      </div>}
    </div>
  );
}
