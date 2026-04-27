// app/(dashboard)/admin/page.js
'use client';
import { useAuth } from '@/components/AuthProvider';
import { useQuote } from '@/components/QuoteProvider';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { gP, cTot, fP, C } from '@/lib/transform';

const RO=[{v:'salesperson',l:'Sales Rep'},{v:'reviewer',l:'Reviewer'},{v:'manager',l:'Manager'},{v:'supervisor',l:'Executive'},{v:'it',l:'IT Admin'}];
const f2b=(file,cb)=>{const r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(file);};
const pickFile=(accept,cb)=>{const i=document.createElement('input');i.type='file';i.accept=accept;i.onchange=e=>{if(e.target.files[0])f2b(e.target.files[0],cb);};i.click();};
const parseCSV=(text)=>{const lines=text.split('\n').map(l=>l.trim()).filter(Boolean);if(lines.length<2)return[];const headers=lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));return lines.slice(1).map(line=>{const vals=line.split(',').map(v=>v.trim().replace(/^"|"$/g,''));const obj={};headers.forEach((h,i)=>{obj[h]=vals[i]||'';});return obj;});};

/* ═══ IMPORT MODAL ═══ */
function ImportModal({type,onClose,onDone,companyId}){
  const[csv,setCsv]=useState('');const[preview,setPreview]=useState([]);const[importing,setImporting]=useState(false);const[result,setResult]=useState(null);
  const templates={customers:'name,plant,address,contact,email,phone,keywords\nAcme Foods,Plant 1,123 Main St,John Doe,john@acme.com,555-1234,"Meat,Poultry"',catalog:'section,name,fixedPrice,variablePrice,materialCost,laborHours,description,hasQuantity,quantityLabel\nChassis,Machine X,50000,0,15000,100,Standard model,false,',users:'name,email,password,role,isAdmin\nJane Doe,jane@middleby.com,pass123,salesperson,false'};
  const handleFile=()=>{const i=document.createElement('input');i.type='file';i.accept='.csv';i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{setCsv(r.result);setPreview(parseCSV(r.result));};r.readAsText(f);};i.click();};
  const doImport=async()=>{setImporting(true);try{const r=await fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,rows:preview,companyId})});const d=await r.json();setResult(d);}catch(e){setResult({error:e.message});}setImporting(false);};
  return(<div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:640}}>
    <div style={{fontSize:17,fontWeight:800,color:'#003250',marginBottom:12}}>Bulk Import — {type}</div>
    <div style={{fontSize:11,color:'#8b919e',marginBottom:12}}>Upload a CSV file or paste CSV data below. First row must be headers.</div>
    <div style={{display:'flex',gap:8,marginBottom:12}}>
      <button onClick={handleFile} style={{padding:'6px 14px',border:'1px solid #003250',background:'#fff',color:'#003250',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer'}}>Upload CSV</button>
      <button onClick={()=>{setCsv(templates[type]||'');setPreview(parseCSV(templates[type]||''));}} style={{padding:'6px 14px',border:'1px solid #e2e4e9',background:'#fff',color:'#8b919e',borderRadius:6,fontSize:11,cursor:'pointer'}}>Load Template</button></div>
    <textarea value={csv} onChange={e=>{setCsv(e.target.value);setPreview(parseCSV(e.target.value));}} rows={6} placeholder="Paste CSV here..." style={{width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e2e4e9',fontSize:11,fontFamily:'monospace',boxSizing:'border-box',resize:'vertical',marginBottom:12}}/>
    {preview.length>0&&!result&&<div style={{marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:600,color:'#003250',marginBottom:4}}>Preview ({preview.length} rows)</div>
      <div style={{maxHeight:150,overflow:'auto',border:'1px solid #e2e4e9',borderRadius:6,fontSize:10}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr style={{background:'#f8f9fb'}}>{Object.keys(preview[0]||{}).map(h=><th key={h} style={{padding:'4px 8px',textAlign:'left',fontWeight:700,color:'#8b919e',fontSize:8}}>{h}</th>)}</tr></thead>
        <tbody>{preview.slice(0,5).map((r,i)=><tr key={i} style={{borderBottom:'1px solid #f3f4f6'}}>{Object.values(r).map((v,j)=><td key={j} style={{padding:'4px 8px',fontSize:10}}>{v}</td>)}</tr>)}{preview.length>5&&<tr><td colSpan={99} style={{padding:'4px 8px',color:'#8b919e',fontSize:10}}>...and {preview.length-5} more</td></tr>}</tbody></table></div></div>}
    {result&&<div style={{padding:12,borderRadius:8,background:result.error?'#fef2f2':'#dcfce7',marginBottom:12}}>
      {result.error?<div style={{color:'#dc2626',fontSize:12}}>{result.error}</div>:<div>
        <div style={{color:'#16a34a',fontSize:12,fontWeight:600}}>Imported {result.created} of {result.total}</div>
        {result.errors?.length>0&&<div style={{marginTop:4,fontSize:10,color:'#dc2626'}}>{result.errors.slice(0,5).map((e,i)=><div key={i}>{e}</div>)}</div>}</div>}</div>}
    <div style={{display:'flex',gap:8}}>
      {!result?<button onClick={doImport} disabled={preview.length===0||importing} style={{flex:1,padding:10,background:preview.length>0?'#003250':'#ccc',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:preview.length>0?'pointer':'default'}}>{importing?'Importing...':'Import '+preview.length+' rows'}</button>
      :<button onClick={()=>{onDone();onClose();}} style={{flex:1,padding:10,background:'#003250',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>Done — Reload Data</button>}
      <button onClick={onClose} style={{padding:'10px 20px',background:'#f3f4f6',color:'#8b919e',border:'none',borderRadius:8,cursor:'pointer'}}>Cancel</button></div>
  </div></div>);
}

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
  const iS={width:'100%',padding:'7px 10px',borderRadius:6,border:'1px solid '+C.border,fontSize:12,boxSizing:'border-box'};
  const lS={fontSize:9,fontWeight:700,color:C.muted,marginBottom:3};
  const secT=(t)=><div style={{fontSize:11,fontWeight:700,color,paddingBottom:6,marginBottom:10,marginTop:16,borderBottom:'2px solid '+color+'30'}}>{t}</div>;
  return(<div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:520}}>
    <div style={{height:3,background:color,borderRadius:3,marginBottom:12}}/>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}><div style={{fontSize:17,fontWeight:800,color}}>Add New Item</div><button onClick={onClose} style={{border:'none',background:'none',fontSize:18,color:C.muted,cursor:'pointer'}}>{'\u00D7'}</button></div>
    <div style={{marginBottom:10}}><div style={lS}>SECTION</div>
      {sections.length>0?<div style={{display:'flex',gap:8}}><select value={sec} onChange={e=>setSec(e.target.value)} style={{...iS,flex:1}}>{sections.map(s=><option key={s} value={s}>{s}</option>)}<option value="__new__">+ New Section</option></select>
        {sec==='__new__'&&<input value={newSec} onChange={e=>setNewSec(e.target.value)} placeholder="New section name" style={{...iS,flex:1}}/>}</div>
      :<input value={newSec} onChange={e=>setNewSec(e.target.value)} placeholder="e.g. Slicing Equipment" style={{...iS,border:'2px solid '+color}}/>}</div>
    {secT('ITEM DETAILS')}
    <div style={{marginBottom:8}}><div style={lS}>ITEM NAME</div><input value={n} onChange={e=>setN(e.target.value)} placeholder="e.g. VisionPak VP125" style={iS}/></div>
    <div style={{marginBottom:8}}><div style={lS}>DESCRIPTION <span style={{fontWeight:400,color:'#aaa'}}>(use • for bullets, - for sub-bullets)</span></div>
      <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={5} placeholder={'• Main feature or spec\n  - Sub detail\n  - Sub detail\n• Another feature'} style={{...iS,fontFamily:'inherit',resize:'vertical',lineHeight:1.6,fontSize:11}}/></div>
    <div style={{marginBottom:8}}><div style={lS}>NOTE</div><input value={nt} onChange={e=>setNt(e.target.value)} style={iS}/></div>
    <div style={{display:'flex',gap:4,marginBottom:8}}>
      <button type="button" onClick={()=>setDesc(d=>d+(d&&!d.endsWith('\n')?'\n':'')+'• ')} style={{padding:'3px 8px',borderRadius:4,border:'1px solid '+C.border,background:'#f8f9fb',fontSize:10,cursor:'pointer',color:'#555'}}>+ Bullet •</button>
      <button type="button" onClick={()=>setDesc(d=>d+(d&&!d.endsWith('\n')?'\n':'')+'  - ')} style={{padding:'3px 8px',borderRadius:4,border:'1px solid '+C.border,background:'#f8f9fb',fontSize:10,cursor:'pointer',color:'#555'}}>+ Sub-bullet -</button>
    </div>
    {secT('OPTIONS / VARIATIONS')}
    <div style={{fontSize:10,color:C.muted,marginBottom:8}}>{opts.length>0?'Each option has its own pricing.':'No options = single price.'}</div>
    {opts.length>0&&<div style={{display:'grid',gridTemplateColumns:'1fr 90px 90px 28px',gap:6,marginBottom:4}}><div style={{fontSize:8,fontWeight:700,color:C.muted}}>NAME</div><div style={{fontSize:8,fontWeight:700,color:C.muted}}>FIXED $</div><div style={{fontSize:8,fontWeight:700,color:C.muted}}>VAR $/U</div><div/></div>}
    {opts.map((o,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'1fr 90px 90px 28px',gap:6,marginBottom:4}}><input value={o.name} onChange={e=>updOpt(i,'name',e.target.value)} style={{...iS,fontSize:11}}/><input type="number" value={o.fp||''} onChange={e=>updOpt(i,'fp',parseFloat(e.target.value)||0)} style={{...iS,fontSize:11,textAlign:'right'}}/><input type="number" value={o.vp||''} onChange={e=>updOpt(i,'vp',parseFloat(e.target.value)||0)} style={{...iS,fontSize:11,textAlign:'right'}}/><button onClick={()=>rmOpt(i)} style={{border:'none',background:'none',color:'#ccc',cursor:'pointer',fontSize:14}}>{'\u00D7'}</button></div>)}
    <button onClick={addOpt} style={{fontSize:10,fontWeight:600,color,background:'none',border:'1px dashed '+color,padding:'5px 14px',borderRadius:6,cursor:'pointer'}}>+ Add Option</button>
    {opts.length===0?<div>{secT('PRICING')}<div style={{background:'#f8f9fb',borderRadius:8,padding:12}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><div><div style={lS}>FIXED PRICE ($)</div><input type="number" value={fp||''} onChange={e=>setFP(parseFloat(e.target.value)||0)} style={iS}/></div><div><div style={lS}>VARIABLE ($/unit)</div><input type="number" value={vp||''} onChange={e=>setVP(parseFloat(e.target.value)||0)} style={iS}/></div></div></div></div>:<div style={{background:color+'08',borderRadius:8,padding:'10px 14px',marginTop:12,border:'1px solid '+color+'20'}}><div style={{fontSize:10,color,fontWeight:600}}>{'\u2713'} Pricing from options</div></div>}
    <div style={{display:'flex',alignItems:'center',gap:12,marginTop:10,padding:'8px 0',borderTop:'1px solid '+C.border}}><label style={{fontSize:11,display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}><input type="checkbox" checked={hq} onChange={e=>setHq(e.target.checked)} style={{accentColor:color}}/> Show quantity</label>{hq&&<input value={ql} onChange={e=>setQl(e.target.value)} placeholder="label" style={{...iS,width:100}}/>}</div>
    {secT('COSTING')}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><div><div style={lS}>MATERIAL COST ($)</div><input type="number" value={mc||''} onChange={e=>setMC(parseFloat(e.target.value)||0)} style={iS}/></div><div><div style={lS}>LABOR HOURS</div><input type="number" step="0.1" value={lh||''} onChange={e=>setLH(parseFloat(e.target.value)||0)} style={iS}/></div></div>
    <div style={{display:'flex',gap:8,marginTop:20,paddingTop:14,borderTop:'1px solid '+C.border}}>
      <button onClick={()=>{const finalSec=sec==='__new__'?newSec:sec;if(!n||!finalSec)return;const item={id:'item_'+Date.now(),n,fp,mc,lh};if(desc)item.desc=desc;if(nt)item.nt=nt;if(hq){item.hq=true;if(vp)item.vp=vp;if(ql)item.ql=ql;}else if(vp){item.hq=true;item.vp=vp;if(ql)item.ql=ql;}const vo=opts.filter(o=>o.name.trim());if(vo.length>0){item.ops=vo.map(o=>o.name.trim());item.opP={};vo.forEach(o=>{item.opP[o.name.trim()]=o.fp||0;});if(vo.some(o=>o.vp>0)){item.hq=true;item.opVP={};vo.forEach(o=>{item.opVP[o.name.trim()]=o.vp||0;});}}onSave(item,finalSec);}} style={{flex:1,padding:11,background:n?color:'#ccc',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:n?'pointer':'default'}}>Add Item</button>
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
  const iS={width:'100%',padding:'7px 10px',borderRadius:6,border:'1px solid '+C.border,fontSize:12,boxSizing:'border-box'};
  const lS={fontSize:9,fontWeight:700,color:C.muted,marginBottom:3};
  const secT=(t)=><div style={{fontSize:11,fontWeight:700,color,paddingBottom:6,marginBottom:10,marginTop:16,borderBottom:'2px solid '+color+'30'}}>{t}</div>;
  return(<div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:520}}>
    <div style={{height:3,background:color,borderRadius:3,marginBottom:12}}/>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}><div style={{fontSize:17,fontWeight:800,color}}>Edit Item</div><button onClick={onClose} style={{border:'none',background:'none',fontSize:18,color:C.muted,cursor:'pointer'}}>{'\u00D7'}</button></div>
    {secT('ITEM DETAILS')}
    <div style={{marginBottom:8}}><div style={lS}>ITEM NAME</div><input value={n} onChange={e=>setN(e.target.value)} style={iS}/></div>
    <div style={{marginBottom:8}}><div style={lS}>DESCRIPTION <span style={{fontWeight:400,color:'#aaa'}}>(use • for bullets, - for sub-bullets)</span></div>
      <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={5} placeholder={'• Main feature\n  - Sub detail'} style={{...iS,fontFamily:'inherit',resize:'vertical',lineHeight:1.6,fontSize:11}}/></div>
    <div style={{marginBottom:8}}><div style={lS}>NOTE</div><input value={nt} onChange={e=>setNt(e.target.value)} style={iS}/></div>
    <div style={{display:'flex',gap:4,marginBottom:8}}>
      <button type="button" onClick={()=>setDesc(d=>d+(d&&!d.endsWith('\n')?'\n':'')+'• ')} style={{padding:'3px 8px',borderRadius:4,border:'1px solid '+C.border,background:'#f8f9fb',fontSize:10,cursor:'pointer',color:'#555'}}>+ Bullet •</button>
      <button type="button" onClick={()=>setDesc(d=>d+(d&&!d.endsWith('\n')?'\n':'')+'  - ')} style={{padding:'3px 8px',borderRadius:4,border:'1px solid '+C.border,background:'#f8f9fb',fontSize:10,cursor:'pointer',color:'#555'}}>+ Sub-bullet -</button>
    </div>
    {secT('OPTIONS')}
    {opts.length>0&&<div style={{display:'grid',gridTemplateColumns:'1fr 90px 90px 28px',gap:6,marginBottom:4}}><div style={{fontSize:8,fontWeight:700,color:C.muted}}>NAME</div><div style={{fontSize:8,fontWeight:700,color:C.muted}}>FIXED $</div><div style={{fontSize:8,fontWeight:700,color:C.muted}}>VAR $/U</div><div/></div>}
    {opts.map((o,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'1fr 90px 90px 28px',gap:6,marginBottom:4}}><input value={o.name} onChange={e=>updOpt(i,'name',e.target.value)} style={{...iS,fontSize:11}}/><input type="number" value={o.fp||''} onChange={e=>updOpt(i,'fp',parseFloat(e.target.value)||0)} style={{...iS,fontSize:11,textAlign:'right'}}/><input type="number" value={o.vp||''} onChange={e=>updOpt(i,'vp',parseFloat(e.target.value)||0)} style={{...iS,fontSize:11,textAlign:'right'}}/><button onClick={()=>rmOpt(i)} style={{border:'none',background:'none',color:'#ccc',cursor:'pointer',fontSize:14}}>{'\u00D7'}</button></div>)}
    <button onClick={addOpt} style={{fontSize:10,fontWeight:600,color,background:'none',border:'1px dashed '+color,padding:'5px 14px',borderRadius:6,cursor:'pointer'}}>+ Add Option</button>
    {opts.length===0?<div>{secT('PRICING')}<div style={{background:'#f8f9fb',borderRadius:8,padding:12}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><div><div style={lS}>FIXED PRICE ($)</div><input type="number" value={fp||''} onChange={e=>setFP(parseFloat(e.target.value)||0)} style={iS}/></div><div><div style={lS}>VARIABLE ($/unit)</div><input type="number" value={vp||''} onChange={e=>setVP(parseFloat(e.target.value)||0)} style={iS}/></div></div></div></div>:<div style={{background:color+'08',borderRadius:8,padding:'10px 14px',marginTop:12,border:'1px solid '+color+'20'}}><div style={{fontSize:10,color,fontWeight:600}}>{'\u2713'} Pricing from options</div></div>}
    <div style={{display:'flex',alignItems:'center',gap:12,marginTop:10,padding:'8px 0',borderTop:'1px solid '+C.border}}><label style={{fontSize:11,display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}><input type="checkbox" checked={hq} onChange={e=>setHq(e.target.checked)} style={{accentColor:color}}/> Show quantity</label>{hq&&<input value={ql} onChange={e=>setQl(e.target.value)} placeholder="label" style={{...iS,width:100}}/>}</div>
    {secT('COSTING')}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><div><div style={lS}>MATERIAL COST ($)</div><input type="number" value={mc||''} onChange={e=>setMC(parseFloat(e.target.value)||0)} style={iS}/></div><div><div style={lS}>LABOR HOURS</div><input type="number" step="0.1" value={lh||''} onChange={e=>setLH(parseFloat(e.target.value)||0)} style={iS}/></div></div>
    <div style={{display:'flex',gap:8,marginTop:20,paddingTop:14,borderTop:'1px solid '+C.border}}>
      <button onClick={()=>{const u={...item,n,fp,mc,lh,desc:desc||undefined,nt:nt||undefined,hq:hq||undefined,vp:vp||undefined,ql:ql||undefined};const vo=opts.filter(o=>o.name.trim());if(vo.length>0){u.ops=vo.map(o=>o.name.trim());u.opP={};vo.forEach(o=>{u.opP[o.name.trim()]=o.fp||0;});if(vo.some(o=>o.vp>0)){u.opVP={};vo.forEach(o=>{u.opVP[o.name.trim()]=o.vp||0;});}else{delete u.opVP;}}else{delete u.ops;delete u.opP;delete u.opVP;}onSave(u);}} style={{flex:1,padding:11,background:color,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>Save Changes</button>
      <button onClick={()=>{if(confirm('Delete this item?'))onDelete(item.id);}} style={{padding:'11px 16px',background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',borderRadius:8,fontSize:12,cursor:'pointer'}}>Delete</button>
      <button onClick={onClose} style={{padding:'11px 16px',background:'#f3f4f6',color:'#888',border:'none',borderRadius:8,fontSize:12,cursor:'pointer'}}>Cancel</button></div>
  </div></div>);
}

/* ═══ ADMIN PAGE ═══ */
export default function AdminPage() {
  const { user, canAdmin } = useAuth();
  const { cats, setCats, companies, setCompanies, customers, setCustomers, terms, setTerms, navLogo, setNavLogo, pdfLogo, setPdfLogo, navColor, setNavColor, appName, setAppName, loading: qL } = useQuote();
  const router = useRouter();
  const [co, setCo] = useState(null);
  const [tab, setTab] = useState('profiles');
  const [newCoName, setNewCoName] = useState('');const [newCoColor, setNewCoColor] = useState('#4A90D9');const [newCoDesc, setNewCoDesc] = useState('');
  const [editItem, setEditItem] = useState(null);const [editSec, setEditSec] = useState(null);
  const [openCatSec, setOpenCatSec] = useState(null);const [showAddItem, setShowAddItem] = useState(false);
  const [users, setUsers] = useState([]);const [loadingU, setLoadingU] = useState(true);
  const [showModal, setShowModal] = useState(null); // 'addUser','editUser','addCust','editCust'
  const [modalData, setModalData] = useState({});
  const [dbCos, setDbCos] = useState([]);
  const [err, setErr] = useState('');const [ok, setOk] = useState('');
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(null); // 'customers','catalog','users'
  const [checkedCust, setCheckedCust] = useState(new Set());
  const [checkedUsers, setCheckedUsers] = useState(new Set());
  const [custSearch, setCustSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [custSort, setCustSort] = useState({ k: 'name', d: 'asc' });
  const [userSort, setUserSort] = useState({ k: 'name', d: 'asc' });
  const [custColFilter, setCustColFilter] = useState(null); // which col dropdown is open
  const [custColVals, setCustColVals] = useState({}); // {colKey: Set of selected values}
  const [userColFilter, setUserColFilter] = useState(null);
  const [userColVals, setUserColVals] = useState({});

  useEffect(() => {
    if (!canAdmin) { router.push('/builder'); return; }
    if (!co && Object.keys(companies).length > 0) {
      // Default to user's own company, not first in list
      const myKey = Object.keys(companies).find(k => companies[k]?.id === user?.primaryCompanyId);
      setCo(myKey || Object.keys(companies)[0]);
    }
    async function load() {
      try {
        const [uR, cR] = await Promise.all([fetch('/api/users'), fetch('/api/catalog')]);
        if (uR.ok) setUsers((await uR.json()).users || []);
        if (cR.ok) setDbCos((await cR.json()).companies || []);
      } catch {}
      setLoadingU(false);
    }
    load();
  }, [canAdmin, router, companies, co]);

  if (!canAdmin || qL) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'calc(100vh - 56px)'}}><div style={{fontSize:16,color:C.muted}}>Loading...</div></div>;

  const coKeys = Object.keys(companies);
  const cd = companies[co] || companies[coKeys[0]] || { name:'', color:'#999', desc:'', rates:{} };
  const cat = cats[co] || {};
  const sectionNames = Object.keys(cat);
  const isCorporate = user.role === 'supervisor' || (user.role === 'it' && !user.primaryCompanyId) || (user.isAdmin && !user.primaryCompanyId);
  const isCorporateAdm = user.isAdmin && (!user.primaryCompanyId || user.role === 'supervisor') || (user.role === 'it' && !user.primaryCompanyId);

  // Get the company key for the current user's primary company
  const userCoKey = (() => {
    if (!user.primaryCompanyId) return null;
    return coKeys.find(k => companies[k]?.id === user.primaryCompanyId) || null;
  })();

  // Can current user edit this company's data?
  const canEditCo = (k) => {
    if (isCorporateAdm) return true; // corporate admin edits anything
    if (user.role === 'supervisor' && !user.isAdmin) return false; // supervisor without admin = view only
    // Company-level admin/reviewer can edit own company only
    if (user.isAdmin || user.role === 'reviewer') return k === userCoKey;
    return false;
  };

  // Debounced save helpers
  const st = {};
  // Map local state field names to API field names
  const apiFieldMap = { desc: 'description', machineImg: 'machineImage', websiteUrl: 'websiteUrl' };
  const updCo = (k, f, v) => {
    const n = {...companies}; n[k] = {...n[k], [f]: v}; setCompanies(n);
    const cid = n[k]?.id; if (!cid) return;
    const apiField = apiFieldMap[f] || f; // translate field name for API
    clearTimeout(st[k+f]); st[k+f] = setTimeout(async()=>{try{await fetch('/api/companies',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:cid,[apiField]:v})});}catch{}},800);
  };
  const updTerms = (v) => { setTerms(v); clearTimeout(st.t); st.t = setTimeout(async()=>{try{await fetch('/api/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'terms',value:v})});}catch{}},1000); };
  const saveNavLogo = (dataUrl) => { setNavLogo(dataUrl); fetch('/api/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'navLogo',value:dataUrl})}).catch(()=>{}); };
  const savePdfLogo = (dataUrl) => { setPdfLogo(dataUrl); fetch('/api/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'pdfLogo',value:dataUrl})}).catch(()=>{}); };

  // Catalog DB helpers
  const addItemDB = async (item, secName) => {
    const cid = cd?.id;
    if (!cid) { const nc=JSON.parse(JSON.stringify(cats));if(!nc[co])nc[co]={};if(!nc[co][secName])nc[co][secName]={items:[]};nc[co][secName].items.push(item);setCats(nc);return; }
    try { const sR=await fetch('/api/catalog/sections',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({companyId:cid,name:secName})}); const sD=await sR.json(); const sid=sD.section?.id; if(!sid)return;
      const opts=item.ops?item.ops.map(name=>({name,fixedPrice:item.opP?.[name]||0,variablePrice:item.opVP?.[name]||0})):null;
      const r=await fetch('/api/catalog/items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sectionId:sid,name:item.n,fixedPrice:item.fp||0,variablePrice:item.vp||0,materialCost:item.mc||0,laborHours:item.lh||0,description:item.desc||null,note:item.nt||null,hasQuantity:!!item.hq,quantityLabel:item.ql||null,options:opts})});
      if(r.ok){const{item:di}=await r.json();item.id=di.id;const nc=JSON.parse(JSON.stringify(cats));if(!nc[co])nc[co]={};if(!nc[co][secName])nc[co][secName]={items:[]};nc[co][secName].items.push(item);setCats(nc);setOk('Item added');setTimeout(()=>setOk(''),3000);}
    } catch(e){setErr(e.message);}
  };
  const updItemDB = async (u) => {
    const nc=JSON.parse(JSON.stringify(cats));const s=nc[co]?.[editSec];if(!s)return;const i=s.items.findIndex(x=>x.id===u.id);if(i>=0)s.items[i]=u;setCats(nc);setEditItem(null);setEditSec(null);
    try{const opts=u.ops?u.ops.map(name=>({name,fixedPrice:u.opP?.[name]||0,variablePrice:u.opVP?.[name]||0})):null;await fetch('/api/catalog/items',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:u.id,name:u.n,fixedPrice:u.fp||0,variablePrice:u.vp||0,materialCost:u.mc||0,laborHours:u.lh||0,description:u.desc||null,note:u.nt||null,hasQuantity:!!u.hq,quantityLabel:u.ql||null,options:opts})});}catch{}
  };
  const delItemDB = async (id) => {
    const nc=JSON.parse(JSON.stringify(cats));const s=nc[co]?.[editSec];if(!s)return;s.items=s.items.filter(x=>x.id!==id);if(s.items.length===0)delete nc[co][editSec];setCats(nc);setEditItem(null);setEditSec(null);
    try{await fetch('/api/catalog/items?id='+id,{method:'DELETE'});}catch{}
  };

  // User/Customer save helpers
  const saveUser = async (data, isNew) => {
    setErr('');try{const r=await fetch('/api/users',{method:isNew?'POST':'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await r.json();if(!r.ok){setErr(d.error);return;}
      if(isNew)setUsers(p=>[...p,d.user]);else setUsers(p=>p.map(u=>u.id===d.user.id?d.user:u));setShowModal(null);setOk(isNew?'User created':'User updated');setTimeout(()=>setOk(''),3000);}catch(e){setErr(e.message);}
  };
  const saveCust = async (data, isNew) => {
    setErr('');try{
      // Save basic fields
      const basicData = { id: data.id, name: data.name, plant: data.plant, address: data.address, contact: data.contact, email: data.email, phone: data.phone, keywords: data.keywords, notes: data.notes, companyId: data.companyId, active: data.active !== false };
      const r=await fetch('/api/customers',{method:isNew?'POST':'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(basicData)});const d=await r.json();if(!r.ok){setErr(d.error);return;}
      const custId = isNew ? d.customer.id : data.id;
      // Always save extended fields through field-map API
      const extData = { ...data, name: data.name, id: custId };
      try { await fetch('/api/field-map/customers/' + custId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(extData) }); } catch {}
      if(isNew)setCustomers(p=>[...p,d.customer]);else setCustomers(p=>p.map(c=>c.id===custId?{...d.customer,...data}:c));setShowModal(null);setOk(isNew?'Customer added':'Customer updated');setTimeout(()=>setOk(''),3000);}catch(e){setErr(e.message);}
  };

  const TB=({id,l})=><button onClick={()=>setTab(id)} style={{padding:'7px 14px',borderRadius:6,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:tab===id?'#fff':'transparent',color:tab===id?C.navy:'#888',boxShadow:tab===id?'0 1px 3px rgba(0,0,0,.08)':'none'}}>{l}</button>;
  const iS={width:'100%',padding:'8px 12px',borderRadius:6,border:'1px solid #e2e4e9',fontSize:12,boxSizing:'border-box'};
  const lS={fontSize:10,fontWeight:700,color:'#8b919e',marginBottom:3,display:'block'};
  const rowHov={cursor:'pointer',borderBottom:'1px solid #f3f4f6'};

  // Can current user edit this other user?
  const canEditUser = (u) => {
    if (isCorporateAdm) return true; // corporate admin can edit anyone
    if (user.role === 'supervisor' && !user.isAdmin) return false; // supervisor view-only
    if (!user.primaryCompanyId) return false;
    // Company admin can only edit users in same company
    return u.primaryCompanyId === user.primaryCompanyId;
  };

  return (
    <div style={{maxWidth:1320,margin:'0 auto',padding:20}}>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:2,background:'#fff',padding:4,borderRadius:10,border:'1px solid '+C.border}}>
          <TB id="profiles" l="Companies"/><TB id="rates" l="Rates"/><TB id="catalog" l="Catalog"/><TB id="terms" l="Terms"/><TB id="customers" l="Customers"/><TB id="users" l="Users"/>
        </div>
        {(tab==='catalog'||tab==='rates'||tab==='users'||tab==='customers'||tab==='terms')&&<div style={{display:'flex',gap:2,background:'#fff',padding:4,borderRadius:10,border:'1px solid '+C.border,marginLeft:'auto'}}>
          {tab==='users'&&<button onClick={()=>setCo('__corporate')} style={{padding:'6px 14px',borderRadius:6,border:'none',cursor:'pointer',fontSize:11,fontWeight:700,background:co==='__corporate'?C.navy:'transparent',color:co==='__corporate'?'#fff':C.navy}}>Corporate</button>}
          {coKeys.map(k=>{const d=companies[k];return <button key={k} onClick={()=>setCo(k)} style={{padding:'6px 14px',borderRadius:6,border:'none',cursor:'pointer',fontSize:11,fontWeight:700,background:co===k?d.color:'transparent',color:co===k?'#fff':d.color}}>{d.name}</button>;})}
        </div>}
      </div>
      {ok&&<div style={{padding:'8px 16px',background:'#dcfce7',color:'#16a34a',borderRadius:8,fontSize:12,fontWeight:600,marginBottom:16}}>{ok}</div>}
      {err&&<div style={{padding:'8px 16px',background:'#fef2f2',color:'#dc2626',borderRadius:8,fontSize:12,fontWeight:600,marginBottom:16}}>{err}</div>}

      {/* ═══ PROFILES ═══ */}
      {tab==='profiles'&&<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:16}}>
          {coKeys.map(k=>{const d=companies[k];return(
            <div key={k} style={{background:'#fff',borderRadius:12,border:'2px solid '+d.color,padding:20,opacity:canEditCo(k)?1:.85}}>
              {!canEditCo(k)&&<div style={{fontSize:9,fontWeight:700,color:'#8b919e',background:'#f3f4f6',padding:'3px 10px',borderRadius:6,marginBottom:10,display:'inline-block'}}>View Only</div>}
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                <div style={{position:'relative',cursor:canEditCo(k)?'pointer':'default'}} onClick={()=>canEditCo(k)&&pickFile('image/*',url=>updCo(k,'logo',url))}>
                  {d.logo?<img src={d.logo} style={{width:44,height:44,borderRadius:10,objectFit:'contain',background:'#f8f9fb'}}/>:<div style={{width:44,height:44,borderRadius:10,background:d.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,color:'#fff'}}>{d.name[0]}</div>}
                  {canEditCo(k)&&<div style={{position:'absolute',bottom:-2,right:-2,width:14,height:14,borderRadius:7,background:d.color,border:'2px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,color:'#fff'}}>{'\u270E'}</div>}</div>
                <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:d.color}}>{d.name}</div><div style={{fontSize:10,color:C.muted}}>{d.desc}</div></div></div>
              <div style={{marginBottom:10}}><div style={lS}>COMPANY NAME</div><input value={d.name} onChange={e=>updCo(k,'name',e.target.value)} disabled={!canEditCo(k)} style={{...iS,opacity:canEditCo(k)?1:.6}}/></div>
              <div style={{display:'flex',gap:8,marginBottom:10}}><div style={{flex:1}}><div style={lS}>DESCRIPTION</div><input value={d.desc} onChange={e=>updCo(k,'desc',e.target.value)} disabled={!canEditCo(k)} style={{...iS,opacity:canEditCo(k)?1:.6}}/></div><div style={{width:60}}><div style={lS}>COLOR</div><input type="color" value={d.color} onChange={e=>updCo(k,'color',e.target.value)} disabled={!canEditCo(k)} style={{width:'100%',height:30,borderRadius:6,border:'1px solid '+C.border,cursor:canEditCo(k)?'pointer':'default',padding:0}}/></div></div>
              <div style={{marginBottom:10}}><div style={lS}>EXEC SUMMARY</div><textarea value={d.execSummary||''} onChange={e=>updCo(k,'execSummary',e.target.value)} disabled={!canEditCo(k)} rows={3} style={{...iS,fontFamily:'inherit',resize:'vertical',lineHeight:1.5,opacity:canEditCo(k)?1:.6}}/></div>
              <div style={{marginBottom:10}}><div style={lS}>DIVISION</div><select value={d.division||'protein'} onChange={e=>updCo(k,'division',e.target.value)} disabled={!canEditCo(k)} style={{...iS,opacity:canEditCo(k)?1:.6}}><option value="protein">Protein</option><option value="bakery">Bakery</option></select></div>
              <div style={{marginBottom:10}}><div style={lS}>MACHINE IMAGE</div>
                {d.machineImg?<div style={{position:'relative'}}><img src={d.machineImg} style={{width:'100%',maxHeight:120,objectFit:'contain',background:'#f8f9fb',borderRadius:8}}/>{canEditCo(k)&&<button onClick={()=>updCo(k,'machineImg',null)} style={{position:'absolute',top:4,right:4,border:'none',background:'rgba(0,0,0,.5)',color:'#fff',borderRadius:10,width:20,height:20,cursor:'pointer',fontSize:10}}>{'\u00D7'}</button>}</div>
                :canEditCo(k)?<button onClick={()=>pickFile('image/*',url=>updCo(k,'machineImg',url))} style={{padding:'8px 16px',border:'1px dashed '+d.color,background:'none',color:d.color,borderRadius:6,fontSize:11,cursor:'pointer'}}>Upload Machine Image</button>:<div style={{fontSize:11,color:C.muted,fontStyle:'italic'}}>No image</div>}</div>
              <div style={{marginBottom:10}}><div style={lS}>WEBSITE URL</div><input value={d.websiteUrl||''} onChange={e=>updCo(k,'websiteUrl',e.target.value)} disabled={!canEditCo(k)} placeholder="https://www.example.com" style={{...iS,opacity:canEditCo(k)?1:.6}}/></div>
            </div>);})}
          {/* Add company */}
          <div style={{background:'#fff',borderRadius:12,border:'2px dashed '+C.border,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:C.navy,marginBottom:12}}>+ Add Company</div>
            <div style={{marginBottom:8}}><div style={lS}>NAME</div><input value={newCoName} onChange={e=>setNewCoName(e.target.value)} style={iS}/></div>
            <div style={{display:'flex',gap:8,marginBottom:8}}><div style={{flex:1}}><div style={lS}>DESCRIPTION</div><input value={newCoDesc} onChange={e=>setNewCoDesc(e.target.value)} style={iS}/></div><div style={{width:60}}><div style={lS}>COLOR</div><input type="color" value={newCoColor} onChange={e=>setNewCoColor(e.target.value)} style={{width:'100%',height:30,borderRadius:6,border:'1px solid '+C.border,cursor:'pointer',padding:0}}/></div></div>
            <button onClick={async()=>{if(!newCoName.trim())return;setSaving(true);try{const r=await fetch('/api/companies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newCoName.trim(),color:newCoColor,description:newCoDesc.trim()})});if(r.ok){const{company:c}=await r.json();const n={...companies};n[c.key]={id:c.id,name:c.name,color:c.color,bg:c.color+'12',desc:c.description||'',execSummary:'',rates:c.rates||{},logo:null,machineImg:null};setCompanies(n);setCats(p=>({...p,[c.key]:{}}));setNewCoName('');setNewCoDesc('');setOk('Company added');setTimeout(()=>setOk(''),3000);}}catch(e){setErr(e.message);}setSaving(false);}} disabled={!newCoName.trim()} style={{padding:'8px 16px',background:newCoName.trim()?C.navy:'#ccc',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:newCoName.trim()?'pointer':'default'}}>{saving?'Adding...':'Add Company'}</button>
          </div>
          {/* Brand settings */}
          {isCorporate&&<div style={{background:'#fff',borderRadius:12,border:'2px solid '+C.navy,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:C.navy,marginBottom:12}}>Brand Settings</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
              <div><div style={lS}>NAV BAR COLOR</div><input type="color" value={navColor||'#002a3e'} onChange={e=>{setNavColor(e.target.value);fetch('/api/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'navColor',value:e.target.value})});}} style={{width:'100%',height:30,borderRadius:6,border:'1px solid '+C.border,cursor:'pointer',padding:0}}/></div>
              <div><div style={lS}>APP NAME</div><input value={appName||'QUOTECRAFT'} onChange={e=>{setAppName(e.target.value);clearTimeout(st.an);st.an=setTimeout(()=>fetch('/api/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'appName',value:e.target.value})}),800);}} style={iS}/></div></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {/* Nav Logo - white/light version for dark nav bar */}
              <div style={{border:'1px solid '+C.border,borderRadius:8,padding:12}}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:6}}>NAV BAR LOGO</div>
                <div style={{fontSize:8,color:C.muted,marginBottom:8}}>White/light version for dark nav background</div>
                <div style={{width:'100%',height:44,borderRadius:6,background:navColor||'#002a3e',display:'flex',alignItems:'center',justifyContent:'center',padding:6,marginBottom:8}}>
                  {navLogo?<img src={navLogo} style={{maxHeight:32,maxWidth:'90%',objectFit:'contain'}}/>:<span style={{color:'#fff',fontWeight:800,fontSize:12,fontStyle:'italic'}}>MIDDLEBY</span>}</div>
                <div style={{display:'flex',gap:6}}><button onClick={()=>pickFile('image/*',saveNavLogo)} style={{padding:'4px 10px',borderRadius:5,border:'1px solid '+C.navy,background:'transparent',color:C.navy,fontSize:10,fontWeight:600,cursor:'pointer'}}>Upload</button>
                  {navLogo&&<button onClick={()=>saveNavLogo('')} style={{padding:'4px 10px',borderRadius:5,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:10,cursor:'pointer'}}>Remove</button>}</div>
              </div>
              {/* PDF Logo - full color version for white PDF background */}
              <div style={{border:'1px solid '+C.border,borderRadius:8,padding:12}}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:6}}>PDF / DOCUMENT LOGO</div>
                <div style={{fontSize:8,color:C.muted,marginBottom:8}}>Full color version for white PDF background</div>
                <div style={{width:'100%',height:44,borderRadius:6,background:'#fff',border:'1px solid #eee',display:'flex',alignItems:'center',justifyContent:'center',padding:6,marginBottom:8}}>
                  {pdfLogo?<img src={pdfLogo} style={{maxHeight:32,maxWidth:'90%',objectFit:'contain'}}/>:<span style={{color:C.navy,fontWeight:800,fontSize:12,fontStyle:'italic'}}>MIDDLEBY</span>}</div>
                <div style={{display:'flex',gap:6}}><button onClick={()=>pickFile('image/*',savePdfLogo)} style={{padding:'4px 10px',borderRadius:5,border:'1px solid '+C.navy,background:'transparent',color:C.navy,fontSize:10,fontWeight:600,cursor:'pointer'}}>Upload</button>
                  {pdfLogo&&<button onClick={()=>savePdfLogo('')} style={{padding:'4px 10px',borderRadius:5,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:10,cursor:'pointer'}}>Remove</button>}</div>
              </div>
            </div>
          </div>}
        </div>
      </div>}

      {/* ═══ RATES ═══ */}
      {tab==='rates'&&cd&&<div style={{background:'#fff',borderRadius:12,border:'2px solid '+cd.color,padding:20,maxWidth:500}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}><div style={{fontSize:15,fontWeight:700,color:cd.color}}>{cd.name} Rates</div>{!canEditCo(co)&&<span style={{fontSize:9,fontWeight:700,color:'#8b919e',background:'#f3f4f6',padding:'3px 10px',borderRadius:6}}>View Only</span>}</div>
        {[['laborRate','Labor Rate ($)'],['pohr','POHR (X)'],['markup','Markup %'],['agentFee','Agent Fee %'],['commission','Commission %'],['freight','Freight ($)'],['install','Install ($)']].map(([rk,l])=>(
          <div key={rk} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid #f3f4f6'}}>
            <span style={{fontSize:12}}>{l}</span>
            <input type="number" step="0.1" value={(cd.rates&&cd.rates[rk])||0} onChange={e=>{const r={...(cd.rates||{}),[rk]:parseFloat(e.target.value)||0};updCo(co,'rates',r);}} disabled={!canEditCo(co)} style={{width:80,padding:'4px 8px',borderRadius:5,border:'1px solid '+C.border,fontSize:11,textAlign:'right',opacity:canEditCo(co)?1:.6}}/>
          </div>))}
      </div>}

      {/* ═══ CATALOG ═══ */}
      {tab==='catalog'&&<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div><span style={{fontSize:16,fontWeight:700,color:cd.color}}>{cd.name} Catalog</span>{!canEditCo(co)&&<span style={{fontSize:9,fontWeight:700,color:'#8b919e',background:'#f3f4f6',padding:'3px 10px',borderRadius:6,marginLeft:8}}>View Only</span>}</div>
          {canEditCo(co)&&<div style={{display:'flex',gap:6}}><button onClick={()=>setShowAddItem(true)} style={{padding:'6px 14px',background:cd.color,color:'#fff',border:'none',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer'}}>+ Add Item</button><button onClick={()=>setShowImport('catalog')} style={{padding:'6px 14px',background:'#fff',color:cd.color,border:'1px solid '+cd.color,borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer'}}>Import CSV</button></div>}</div>
        {sectionNames.length===0&&<div style={{padding:40,textAlign:'center',color:C.muted,fontSize:12,background:'#fff',borderRadius:10,border:'1px dashed '+C.border}}>No items yet. Click + Add Item.</div>}
        {sectionNames.map(sn=>{const items=(cat[sn]&&cat[sn].items)||[];const isOpen=openCatSec===sn;return(
          <div key={sn} style={{marginBottom:8,borderRadius:10,overflow:'hidden',border:'1px solid '+C.border,background:'#fff'}}>
            <div onClick={()=>setOpenCatSec(isOpen?null:sn)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',cursor:'pointer',background:isOpen?cd.color+'08':'#fff'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:8,color:C.muted,transform:isOpen?'rotate(90deg)':'none',transition:'transform .15s',display:'inline-block'}}>{'\u25B6'}</span><div style={{width:4,height:18,borderRadius:2,background:cd.color}}/><span style={{fontSize:13,fontWeight:700,color:cd.color}}>{sn}</span></div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:10,fontWeight:600,color:C.muted}}>{items.length} item{items.length!==1?'s':''}</span>
                {canEditCo(co)&&<button onClick={async(e)=>{e.stopPropagation();if(!confirm('Delete section "'+sn+'" and all '+items.length+' items?'))return;
                  // Find section ID from dbCos
                  const dco=dbCos.find(d=>companies[co]?.id===d.id);const sec=dco?.catalogSections?.find(s=>s.name===sn);
                  if(sec)try{await fetch('/api/catalog/sections?id='+sec.id,{method:'DELETE'});}catch{}
                  const nc=JSON.parse(JSON.stringify(cats));delete nc[co][sn];setCats(nc);setOk('Section deleted');setTimeout(()=>setOk(''),3000);
                }} style={{padding:'2px 8px',borderRadius:4,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:9,fontWeight:600,cursor:'pointer'}}>Delete</button>}
              </div></div>
            {isOpen&&<table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}><thead><tr style={{background:'#f9fafb'}}>{['Item','Fixed $','Options','Material $','Labor Hrs'].map(x=><th key={x} style={{padding:'6px 12px',textAlign:x==='Item'?'left':'right',fontSize:8,fontWeight:700,color:C.muted}}>{x}</th>)}</tr></thead>
              <tbody>{items.map(it=>{const hasOps=it.ops&&it.ops.length>0;return(
                <tr key={it.id} onClick={()=>{if(canEditCo(co)){setEditItem(it);setEditSec(sn);}}} style={{...rowHov,cursor:canEditCo(co)?'pointer':'default'}} onMouseOver={e=>{if(canEditCo(co))e.currentTarget.style.background=cd.color+'06';}} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:'8px 12px'}}><div style={{fontWeight:600}}>{it.n}</div>{it.desc&&<div style={{fontSize:9,color:C.muted}}>{it.desc}</div>}</td>
                  <td style={{padding:'8px 12px',textAlign:'right',fontWeight:600,color:cd.color}}>{hasOps?'\u2014':'$'+(it.fp||0).toLocaleString()}</td>
                  <td style={{padding:'8px 12px',textAlign:'right',fontSize:10,color:hasOps?cd.color:C.muted}}>{hasOps?it.ops.length+' opts':it.vp?'$'+it.vp+'/u':'\u2014'}</td>
                  <td style={{padding:'8px 12px',textAlign:'right',color:'#888'}}>{'$'+(it.mc||0).toLocaleString()}</td>
                  <td style={{padding:'8px 12px',textAlign:'right',color:'#888'}}>{(it.lh||0).toFixed(1)}</td></tr>);})}</tbody></table>}
          </div>);})}
        {editItem&&<EditItemModal item={editItem} color={cd.color} onClose={()=>{setEditItem(null);setEditSec(null);}} onSave={updItemDB} onDelete={delItemDB}/>}
        {showAddItem&&<AddItemModal color={cd.color} sections={sectionNames} onClose={()=>setShowAddItem(false)} onSave={(item,secName)=>{addItemDB(item,secName);setShowAddItem(false);}}/>}
      </div>}

      {/* ═══ TERMS ═══ */}
      {tab==='terms'&&<div style={{background:'#fff',borderRadius:12,border:'1px solid '+C.border,padding:24,maxWidth:900}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}><div style={{fontSize:16,fontWeight:700,color:C.navy}}>Terms & Conditions</div>{!canEditCo(co)&&<span style={{fontSize:9,fontWeight:700,color:'#8b919e',background:'#f3f4f6',padding:'3px 10px',borderRadius:6}}>View Only</span>}</div>
        <div style={{fontSize:11,color:C.muted,marginBottom:16}}>Auto-saves as you type. Appears on every PDF proposal.</div>
        <textarea value={terms} onChange={e=>canEditCo(co)&&updTerms(e.target.value)} disabled={!canEditCo(co)} rows={20} style={{...iS,lineHeight:1.7,fontFamily:'inherit',resize:'vertical',opacity:canEditCo(co)?1:.6}}/>
        {canEditCo(co)&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
          <div style={{fontSize:10,color:C.muted}}>{terms.split('\n').filter(l=>l.trim()).length} clauses</div>
          <button onClick={()=>updTerms('1. PRICING: All prices are in US Dollars and are valid for 30 days.\n\n2. PAYMENT TERMS: 30% deposit with order, balance net 30.\n\n3. DELIVERY: 16-20 weeks from order.\n\n4. WARRANTY: 12 months from startup or 15 months from shipment.\n\n5. INSTALLATION: Available at prevailing rates plus travel.\n\n6. TAXES: Prices do not include taxes.\n\n7. CANCELLATION: Subject to cancellation charges.\n\n8. FORCE MAJEURE: Not liable for delays beyond reasonable control.')} style={{padding:'6px 16px',borderRadius:6,border:'1px solid '+C.border,background:'transparent',color:C.muted,fontSize:11,cursor:'pointer'}}>Reset Default</button></div>}
      </div>}

      {/* ═══ CUSTOMERS ═══ */}
      {tab==='customers'&&(()=>{
        let filtered = customers.filter(c => {
          if (co === '__corporate' || !co) return true;
          const dco = dbCos.find(d => companies[co]?.id === d.id);
          return dco && c.companyId === dco.id;
        });
        if (custSearch) { const s=custSearch.toLowerCase(); filtered=filtered.filter(c=>(c.name||'').toLowerCase().includes(s)||(c.contact||'').toLowerCase().includes(s)||(c.email||'').toLowerCase().includes(s)||(c.plant||'').toLowerCase().includes(s)); }
        // Column filters
        Object.entries(custColVals).forEach(([col,vals])=>{if(vals&&vals.size>0)filtered=filtered.filter(c=>{let v='';if(col==='name')v=c.name||'';else if(col==='plant')v=c.plant||'\u2014';else if(col==='contact')v=c.contact||'\u2014';return vals.has(v);});});
        filtered.sort((a,b)=>{ const av=(a[custSort.k]||'').toString().toLowerCase(); const bv=(b[custSort.k]||'').toString().toLowerCase(); return custSort.d==='asc'?av.localeCompare(bv):bv.localeCompare(av); });
        const allChecked = filtered.length>0 && filtered.every(c=>checkedCust.has(c.id));
        const checkedList = filtered.filter(c=>checkedCust.has(c.id));
        const getCustUniqueVals=(col)=>{const vals=new Set();customers.forEach(c=>{let v='';if(col==='name')v=c.name||'';else if(col==='plant')v=c.plant||'\u2014';else if(col==='contact')v=c.contact||'\u2014';if(v)vals.add(v);});return [...vals].sort();};
        const toggleCustColFilter=(col,val)=>{setCustColVals(p=>{const n={...p};const s=new Set(n[col]||[]);if(s.has(val))s.delete(val);else s.add(val);if(s.size===0)delete n[col];else n[col]=s;return n;});};
        const custCols=[{k:'name',l:'Name',filterable:true},{k:'plant',l:'Plant',filterable:true},{k:'contact',l:'Contact',filterable:true},{k:'email',l:'Email'},{k:'phone',l:'Phone'},{k:'keywords',l:'Keywords'}];
        return <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <h2 style={{fontSize:18,fontWeight:800,color:'#003250',margin:0}}>Customers</h2>
              <span style={{fontSize:10,color:C.muted}}>{filtered.length} total</span></div>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <input value={custSearch} onChange={e=>setCustSearch(e.target.value)} placeholder="Search..." style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e2e4e9',fontSize:11,width:150}}/>
              {canEditCo(co)&&<><button onClick={()=>{setModalData({name:'',plant:'',address:'',contact:'',email:'',phone:'',keywords:[],notes:'',companyId:co!=='__corporate'?cd?.id||'':'',concept:'',city:'',state:'',country:'',contacts:[],plants:[],equipment:[]});setShowModal('addCust');}} style={{padding:'6px 14px',background:'#003250',color:'#fff',border:'none',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer'}}>+ Add Customer</button><button onClick={()=>setShowImport('customers')} style={{padding:'6px 10px',background:'#fff',color:'#003250',border:'1px solid #003250',borderRadius:6,fontSize:10,fontWeight:600,cursor:'pointer'}}>Import</button></>}
            </div></div>
          {/* Catalog-style: customer as section, plants as items */}
          {filtered.length===0?<div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e4e9',padding:30,textAlign:'center',color:'#8b919e'}}>No customers</div>
          :filtered.map(c=>{
            const editCust = async () => {
              if(!canEditCo(co)) return;
              try{const r=await fetch('/api/field-map/customers');const d=await r.json();const full=(d.customers||[]).find(x=>x.id===c.id);
              setModalData({...c,...(full||{}),keywords:c.keywords||[],contacts:full?.contacts||[],plants:full?.plants||[],equipment:(full?.equipment||[]).map(e=>({...e,companyId:e.companyId||e.company?.id||null}))});
              }catch{setModalData({...c,keywords:c.keywords||[],contacts:[],plants:[],equipment:[]});}
              setShowModal('editCust');
            };
            return <div key={c.id} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e4e9',marginBottom:8,overflow:'hidden'}}>
              {/* Customer header - like catalog section */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',background:'#f8f9fb',cursor:'pointer'}} onClick={editCust}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{width:3,height:20,borderRadius:2,background:'#003250'}}/>
                  <span style={{fontSize:14,fontWeight:700,color:'#003250'}}>{c.name}</span>
                  {c.concept&&<span style={{fontSize:9,color:C.muted}}>{c.concept}</span>}
                  {(c.keywords||[]).map(k=><span key={k} style={{fontSize:8,background:'#e0e7ff',color:'#3b5998',padding:'1px 5px',borderRadius:4}}>{k}</span>)}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:9,color:C.muted}}>{c.contact||''}{c.phone?' · '+c.phone:''}</span>
                </div>
              </div>
              {/* Plant rows - like catalog items */}
              <div>
                {c.address&&<div style={{display:'flex',alignItems:'center',padding:'6px 16px 6px 36px',borderTop:'1px solid #f3f4f6',fontSize:11}}>
                  <span style={{flex:2,fontWeight:500,color:'#333'}}>{c.address}</span>
                  <span style={{flex:1,color:C.muted,fontSize:10}}>{[c.city,c.state].filter(Boolean).join(', ')}</span>
                  <span style={{flex:1,color:C.muted,fontSize:10}}>{c.email||''}</span>
                </div>}
                {c.plant&&<div style={{display:'flex',alignItems:'center',padding:'6px 16px 6px 36px',borderTop:'1px solid #f3f4f6',fontSize:11}}>
                  <span style={{flex:2,fontWeight:500,color:'#555'}}>{c.plant}</span>
                  <span style={{flex:1}}></span><span style={{flex:1}}></span>
                </div>}
              </div>
            </div>;
          })}
          {checkedList.length>0&&<div style={{position:'fixed',bottom:0,left:0,right:0,background:'#003250',color:'#fff',padding:'10px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',zIndex:100,boxShadow:'0 -4px 20px rgba(0,0,0,.2)'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:12,fontWeight:700}}>{checkedList.length} customer{checkedList.length>1?'s':''} selected</span>
              <button onClick={()=>setCheckedCust(new Set())} style={{padding:'3px 8px',borderRadius:4,border:'1px solid rgba(255,255,255,.3)',background:'transparent',color:'#fff',fontSize:10,cursor:'pointer'}}>Clear</button></div>
            <button onClick={async()=>{if(!confirm('Delete '+checkedList.length+' customer(s)?'))return;for(const c of checkedList){try{await fetch('/api/customers?id='+c.id,{method:'DELETE'});}catch{}}setCustomers(p=>p.filter(c=>!checkedCust.has(c.id)));setCheckedCust(new Set());setOk('Customers deleted');setTimeout(()=>setOk(''),3000);}} style={{padding:'6px 16px',borderRadius:6,border:'none',background:'#dc2626',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>Delete Selected</button>
          </div>}
        </div>;
      })()}

      {/* ═══ USERS ═══ */}
      {tab==='users'&&(()=>{
        let filtered = co==='__corporate' ? users.filter(u=>!u.primaryCompanyId) : users.filter(u=>{const dco=dbCos.find(c=>companies[co]?.id===c.id);return dco&&u.primaryCompanyId===dco.id;});
        if (userSearch) { const s=userSearch.toLowerCase(); filtered=filtered.filter(u=>(u.name||'').toLowerCase().includes(s)||(u.email||'').toLowerCase().includes(s)); }
        Object.entries(userColVals).forEach(([col,vals])=>{if(vals&&vals.size>0)filtered=filtered.filter(u=>{let v='';if(col==='role')v=RO.find(r=>r.v===u.role)?.l||'';else if(col==='active')v=u.active?'Active':'Inactive';return vals.has(v);});});
        filtered.sort((a,b)=>{ const av=(a[userSort.k]||'').toString().toLowerCase(); const bv=(b[userSort.k]||'').toString().toLowerCase(); return userSort.d==='asc'?av.localeCompare(bv):bv.localeCompare(av); });
        const allChecked = filtered.length>0 && filtered.every(u=>checkedUsers.has(u.id));
        const checkedList = filtered.filter(u=>checkedUsers.has(u.id));
        const canManage = isCorporate||(userCoKey&&co===userCoKey);
        const getUserUniqueVals=(col)=>{const vals=new Set();users.forEach(u=>{let v='';if(col==='role')v=RO.find(r=>r.v===u.role)?.l||'';else if(col==='active')v=u.active?'Active':'Inactive';if(v)vals.add(v);});return [...vals].sort();};
        const toggleUserColFilter=(col,val)=>{setUserColVals(p=>{const n={...p};const s=new Set(n[col]||[]);if(s.has(val))s.delete(val);else s.add(val);if(s.size===0)delete n[col];else n[col]=s;return n;});};
        const userCols=[{k:'name',l:'Name'},{k:'email',l:'Email'},{k:'role',l:'Role',filterable:true},{k:'isAdmin',l:'Admin'},{k:'active',l:'Status',filterable:true}];
        return <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <h2 style={{fontSize:18,fontWeight:800,color:'#003250',margin:0}}>Users {co==='__corporate'?'— Corporate':cd?.name?'— '+cd.name:''}</h2>
              <span style={{fontSize:10,color:C.muted}}>{filtered.length} total</span>
              {Object.keys(userColVals).length>0&&<button onClick={()=>setUserColVals({})} style={{padding:'3px 8px',borderRadius:4,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:9,cursor:'pointer'}}>Clear filters</button>}</div>
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search..." style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e2e4e9',fontSize:11,width:150}}/>
              {canManage&&<><button onClick={()=>{setModalData({name:'',email:'',password:'',role:'salesperson',isAdmin:false,primaryCompanyId:co==='__corporate'?'':cd?.id||''});setShowModal('addUser');}} style={{padding:'6px 14px',background:'#003250',color:'#fff',border:'none',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer'}}>+ Add</button><button onClick={()=>setShowImport('users')} style={{padding:'6px 10px',background:'#fff',color:'#003250',border:'1px solid #003250',borderRadius:6,fontSize:10,fontWeight:600,cursor:'pointer'}}>Import</button></>}
            </div></div>
          {filtered.length===0?<div style={{padding:30,textAlign:'center',color:C.muted,fontSize:12,background:'#fff',borderRadius:10,border:'1px dashed '+C.border}}>No users.</div>
          :<div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e4e9',overflow:'visible',position:'relative'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr style={{background:'#f8f9fb'}}>
              {canManage&&<th style={{padding:'6px 10px',width:30}}><input type="checkbox" checked={allChecked} onChange={()=>{if(allChecked)setCheckedUsers(new Set());else setCheckedUsers(new Set(filtered.map(u=>u.id)));}} style={{cursor:'pointer'}}/></th>}
              {userCols.map(h=>(
                <th key={h.k} style={{padding:'6px 12px',textAlign:'left',fontSize:9,fontWeight:700,color:'#8b919e',borderBottom:'1px solid #e2e4e9',cursor:'pointer',userSelect:'none',position:'relative'}}>
                  <div style={{display:'flex',alignItems:'center',gap:2}}>
                    <span onClick={()=>setUserSort(p=>({k:h.k,d:p.k===h.k&&p.d==='asc'?'desc':'asc'}))}>{h.l} {userSort.k===h.k?(userSort.d==='asc'?'\u2191':'\u2193'):''}</span>
                    {h.filterable&&<button onClick={e=>{e.stopPropagation();setUserColFilter(userColFilter===h.k?null:h.k);}} style={{border:'none',background:'none',cursor:'pointer',fontSize:9,color:userColVals[h.k]?'#2563eb':'#ccc',padding:'0 2px'}}>{'\u25BC'}</button>}
                  </div>
                  {userColFilter===h.k&&<div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:'100%',left:0,zIndex:50,background:'#fff',border:'1px solid #e2e4e9',borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,.1)',padding:8,minWidth:120,maxHeight:200,overflowY:'auto'}}>
                    {getUserUniqueVals(h.k).map(v=>(<label key={v} style={{display:'flex',alignItems:'center',gap:6,padding:'3px 0',fontSize:10,cursor:'pointer'}}><input type="checkbox" checked={userColVals[h.k]?.has(v)||false} onChange={()=>toggleUserColFilter(h.k,v)}/>{v}</label>))}
                    <div style={{borderTop:'1px solid #eee',marginTop:4,paddingTop:4}}><button onClick={()=>{setUserColVals(p=>{const n={...p};delete n[h.k];return n;});setUserColFilter(null);}} style={{fontSize:9,color:'#dc2626',border:'none',background:'none',cursor:'pointer'}}>Clear</button></div>
                  </div>}
                </th>))}
            </tr></thead><tbody>{filtered.map(u=>{const editable=canEditUser(u);const ck=checkedUsers.has(u.id);return(
              <tr key={u.id} style={{borderBottom:'1px solid #f3f4f6',background:ck?'#f0f7ff':'transparent',cursor:editable?'pointer':'default'}} onMouseOver={e=>{if(!ck)e.currentTarget.style.background='#fafbfc';}} onMouseOut={e=>{if(!ck)e.currentTarget.style.background=ck?'#f0f7ff':'transparent';}}>
                {canManage&&<td style={{padding:'6px 10px'}} onClick={e=>e.stopPropagation()}><input type="checkbox" checked={ck} onChange={()=>{setCheckedUsers(p=>{const n=new Set(p);if(n.has(u.id))n.delete(u.id);else n.add(u.id);return n;});}} style={{cursor:'pointer'}}/></td>}
                <td onClick={()=>{if(editable){setModalData({...u,password:''});setShowModal('editUser');}}} style={{padding:'6px 12px',fontWeight:600,color:'#003250'}}>{u.name}</td>
                <td style={{padding:'6px 12px',color:'#555'}}>{u.email}</td>
                <td style={{padding:'6px 12px'}}><span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:10,background:u.role==='supervisor'?'#dbeafe':u.role==='manager'?'#dcfce7':u.role==='reviewer'?'#fef9c3':u.role==='it'?'#fce7f3':'#f3f4f6',color:u.role==='supervisor'?'#2563eb':u.role==='manager'?'#16a34a':u.role==='reviewer'?'#a16207':u.role==='it'?'#be185d':'#6b7085'}}>{RO.find(r=>r.v===u.role)?.l}</span></td>
                <td style={{padding:'6px 12px'}}>{u.isAdmin&&<span style={{fontSize:10,fontWeight:600,color:'#E12C3E',background:'#fef2f2',padding:'2px 8px',borderRadius:10}}>Admin</span>}</td>
                <td style={{padding:'6px 12px'}}><span style={{fontSize:10,fontWeight:600,color:u.active?'#16a34a':'#dc2626'}}>{u.active?'Active':'Inactive'}</span></td>
              </tr>);})}</tbody></table></div>}
          {checkedList.length>0&&<div style={{position:'fixed',bottom:0,left:0,right:0,background:'#003250',color:'#fff',padding:'10px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',zIndex:100,boxShadow:'0 -4px 20px rgba(0,0,0,.2)'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:12,fontWeight:700}}>{checkedList.length} user{checkedList.length>1?'s':''} selected</span>
              <button onClick={()=>setCheckedUsers(new Set())} style={{padding:'3px 8px',borderRadius:4,border:'1px solid rgba(255,255,255,.3)',background:'transparent',color:'#fff',fontSize:10,cursor:'pointer'}}>Clear</button></div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,.5)'}}>Roles: {[...new Set(checkedList.map(u=>RO.find(r=>r.v===u.role)?.l))].join(', ')}</div>
              <button onClick={async()=>{if(!confirm('Deactivate '+checkedList.length+' user(s)?'))return;for(const u of checkedList){try{await fetch('/api/users?id='+u.id,{method:'DELETE'});}catch{}}setUsers(p=>p.filter(u=>!checkedUsers.has(u.id)));setCheckedUsers(new Set());setOk('Users deactivated');setTimeout(()=>setOk(''),3000);}} style={{padding:'6px 16px',borderRadius:6,border:'none',background:'#dc2626',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>Delete Selected</button>
            </div></div>}
        </div>;
      })()}

      {/* ═══ UNIVERSAL MODAL ═══ */}
      {showModal&&<div className="modal-overlay" onClick={()=>setShowModal(null)}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:(showModal==='addCust'||showModal==='editCust')?780:500}}>
        <div style={{fontSize:17,fontWeight:800,color:'#003250',marginBottom:16}}>{showModal==='addUser'?'Add User':showModal==='editUser'?'Edit User':showModal==='addCust'?'Add Customer':'Edit Customer'}</div>

        {(showModal==='addUser'||showModal==='editUser')&&<div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><label style={lS}>NAME</label><input value={modalData.name||''} onChange={e=>setModalData({...modalData,name:e.target.value})} style={iS}/></div>
            <div><label style={lS}>EMAIL</label><input value={modalData.email||''} onChange={e=>setModalData({...modalData,email:e.target.value})} style={iS}/></div></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><label style={lS}>{showModal==='editUser'?'NEW PASSWORD (blank=keep)':'PASSWORD'}</label><input type="password" value={modalData.password||''} onChange={e=>setModalData({...modalData,password:e.target.value})} style={iS}/></div>
            <div><label style={lS}>ROLE</label><select value={modalData.role||'salesperson'} onChange={e=>setModalData({...modalData,role:e.target.value})} style={iS}>{RO.map(r=><option key={r.v} value={r.v}>{r.l}</option>)}</select></div></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><label style={lS}>PRIMARY COMPANY</label><select value={modalData.primaryCompanyId||''} onChange={e=>setModalData({...modalData,primaryCompanyId:e.target.value})} style={iS}><option value="">None (Corporate)</option>{dbCos.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div style={{display:'flex',flexDirection:'column',gap:8,justifyContent:'end',paddingBottom:4}}>
              <label style={{fontSize:12,display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}><input type="checkbox" checked={modalData.isAdmin||false} onChange={e=>setModalData({...modalData,isAdmin:e.target.checked})}/> Admin privileges</label>
              {showModal==='editUser'&&<label style={{fontSize:12,display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}><input type="checkbox" checked={modalData.active!==false} onChange={e=>setModalData({...modalData,active:e.target.checked})}/> Active</label>}
            </div></div>
          <div style={{display:'flex',gap:8,marginTop:16}}>
            <button onClick={()=>{const d={...modalData};if(!d.password)delete d.password;saveUser(d,showModal==='addUser');}} style={{flex:1,padding:10,background:'#003250',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>{showModal==='addUser'?'Create User':'Save Changes'}</button>
            {showModal==='editUser'&&<button onClick={async()=>{if(!confirm('Delete user '+modalData.name+'? They will be deactivated.'))return;try{await fetch('/api/users?id='+modalData.id,{method:'DELETE'});setUsers(p=>p.filter(u=>u.id!==modalData.id));setShowModal(null);setOk('User deleted');setTimeout(()=>setOk(''),3000);}catch(e){setErr(e.message);}}} style={{padding:'10px 16px',background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',borderRadius:8,fontSize:12,cursor:'pointer'}}>Delete</button>}
            <button onClick={()=>setShowModal(null)} style={{padding:'10px 20px',background:'#f3f4f6',color:'#8b919e',border:'none',borderRadius:8,cursor:'pointer'}}>Cancel</button></div>
        </div>}

        {(showModal==='addCust'||showModal==='editCust')&&<div>
          {/* ── Customer Details ── */}
          <div style={{fontSize:12,fontWeight:700,color:'#003250',marginBottom:6,paddingBottom:4,borderBottom:'1px solid #00325040'}}>CUSTOMER DETAILS</div>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:8,marginBottom:12}}>
            <div><label style={lS}>CUSTOMER NAME *</label><input value={modalData.name||''} onChange={e=>setModalData({...modalData,name:e.target.value})} placeholder="e.g. Hormel Foods" list="adminCustNames" style={iS}/><datalist id="adminCustNames">{[...new Set(customers.map(c=>c.name))].sort().map(n=><option key={n} value={n}/>)}</datalist></div>
            <div><label style={lS}>INDUSTRY / CONCEPT</label><input value={modalData.concept||''} onChange={e=>setModalData({...modalData,concept:e.target.value})} placeholder="Meat Processing" style={iS}/></div>
            <div><label style={lS}>STATUS</label><select value={modalData.active===false?'inactive':'active'} onChange={e=>setModalData({...modalData,active:e.target.value==='active'})} style={iS}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          </div>

          {/* ── Plants / Locations ── */}
          <div style={{fontSize:12,fontWeight:700,color:'#003250',marginBottom:6,paddingBottom:4,borderBottom:'1px solid #00325040',display:'flex',justifyContent:'space-between'}}>
            <span>PLANTS / LOCATIONS</span>
            <button onClick={()=>setModalData(p=>({...p,plants:[...(p.plants||[]),{name:'',address:'',city:'',state:'',country:'',lat:'',lng:''}]}))} style={{padding:'2px 8px',borderRadius:4,border:'1px dashed #003250',background:'none',color:'#003250',fontSize:9,fontWeight:600,cursor:'pointer'}}>+ Add Plant</button>
          </div>
          {/* Main address */}
          <div style={{background:'#f8f9fb',borderRadius:8,padding:10,marginBottom:6,border:'1px solid #eef0f2'}}>
            <div style={{fontSize:10,fontWeight:600,color:'#8b919e',marginBottom:4}}>Main Address (HQ)</div>
            <div style={{display:'flex',gap:6,marginBottom:6}}>
              <input value={modalData.address||''} onChange={e=>setModalData({...modalData,address:e.target.value})} placeholder="Street address" style={{...iS,flex:1}}/>
              <button onClick={async()=>{const a=[modalData.address,modalData.city,modalData.state,modalData.country].filter(Boolean).join(', ');if(!a)return;try{const r=await fetch('/api/field-map/geocode',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address:a})});if(r.ok){const d=await r.json();setModalData(p=>({...p,lat:d.lat,lng:d.lng}));}else alert('Not found');}catch{alert('Geocode failed');}}} style={{padding:'6px 10px',borderRadius:6,border:'1px solid #003250',background:'none',color:'#003250',fontSize:9,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>📍 Lookup</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',gap:6}}>
              <div><label style={lS}>CITY</label><input value={modalData.city||''} onChange={e=>setModalData({...modalData,city:e.target.value})} style={iS}/></div>
              <div><label style={lS}>STATE</label><input value={modalData.state||''} onChange={e=>setModalData({...modalData,state:e.target.value})} style={iS}/></div>
              <div><label style={lS}>COUNTRY</label><input value={modalData.country||''} onChange={e=>setModalData({...modalData,country:e.target.value})} style={iS}/></div>
              <div><label style={lS}>LAT</label><input type="number" step="any" value={modalData.lat||''} onChange={e=>setModalData({...modalData,lat:e.target.value})} style={iS}/></div>
              <div><label style={lS}>LNG</label><input type="number" step="any" value={modalData.lng||''} onChange={e=>setModalData({...modalData,lng:e.target.value})} style={iS}/></div>
            </div>
          </div>
          {/* Sub-plants */}
          {(modalData.plants||[]).map((pl,i)=>(
            <div key={i} style={{background:'#f8f9fb',borderRadius:8,padding:10,marginBottom:4,border:'1px solid #eef0f2',position:'relative'}}>
              <button onClick={()=>{const pls=[...(modalData.plants||[])];pls.splice(i,1);setModalData(p=>({...p,plants:pls}));}} style={{position:'absolute',top:6,right:8,border:'none',background:'none',color:'#dc2626',cursor:'pointer',fontSize:14}}>x</button>
              <div style={{display:'grid',gridTemplateColumns:'1.5fr 2.5fr auto',gap:6,marginBottom:4}}>
                <div><label style={lS}>PLANT NAME</label><input value={pl.name||''} onChange={e=>{const pls=[...(modalData.plants||[])];pls[i]={...pls[i],name:e.target.value};setModalData(p=>({...p,plants:pls}));}} list={'plantNames'+i} placeholder="e.g. Sioux City" style={iS}/><datalist id={'plantNames'+i}>{[...new Set(customers.flatMap(c=>(c.plants||[]).map(p=>p.name)).filter(Boolean))].sort().map(n=><option key={n} value={n}/>)}</datalist></div>
                <div><label style={lS}>ADDRESS</label><input value={pl.address||''} onChange={e=>{const pls=[...(modalData.plants||[])];pls[i]={...pls[i],address:e.target.value};setModalData(p=>({...p,plants:pls}));}} style={iS}/></div>
                <div style={{alignSelf:'flex-end'}}><button onClick={async()=>{const a=[pl.address,pl.city,pl.state,pl.country].filter(Boolean).join(', ');if(!a)return;try{const r=await fetch('/api/field-map/geocode',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address:a})});if(r.ok){const d=await r.json();const pls=[...(modalData.plants||[])];pls[i]={...pls[i],lat:d.lat,lng:d.lng};setModalData(p=>({...p,plants:pls}));}else alert('Not found');}catch{alert('Failed');}}} style={{padding:'6px 8px',borderRadius:6,border:'1px solid #003250',background:'none',color:'#003250',fontSize:9,fontWeight:600,cursor:'pointer'}}>📍</button></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',gap:6}}>
                <div><label style={lS}>CITY</label><input value={pl.city||''} onChange={e=>{const pls=[...(modalData.plants||[])];pls[i]={...pls[i],city:e.target.value};setModalData(p=>({...p,plants:pls}));}} style={iS}/></div>
                <div><label style={lS}>STATE</label><input value={pl.state||''} onChange={e=>{const pls=[...(modalData.plants||[])];pls[i]={...pls[i],state:e.target.value};setModalData(p=>({...p,plants:pls}));}} style={iS}/></div>
                <div><label style={lS}>COUNTRY</label><input value={pl.country||''} onChange={e=>{const pls=[...(modalData.plants||[])];pls[i]={...pls[i],country:e.target.value};setModalData(p=>({...p,plants:pls}));}} style={iS}/></div>
                <div><label style={lS}>LAT</label><input type="number" step="any" value={pl.lat||''} onChange={e=>{const pls=[...(modalData.plants||[])];pls[i]={...pls[i],lat:e.target.value};setModalData(p=>({...p,plants:pls}));}} style={iS}/></div>
                <div><label style={lS}>LNG</label><input type="number" step="any" value={pl.lng||''} onChange={e=>{const pls=[...(modalData.plants||[])];pls[i]={...pls[i],lng:e.target.value};setModalData(p=>({...p,plants:pls}));}} style={iS}/></div>
              </div>
            </div>
          ))}

          {/* ── Contacts ── */}
          <div style={{fontSize:12,fontWeight:700,color:'#003250',marginTop:12,marginBottom:6,paddingBottom:4,borderBottom:'1px solid #00325040',display:'flex',justifyContent:'space-between'}}>
            <span>CONTACTS</span>
            <button onClick={()=>setModalData(p=>({...p,contacts:[...(p.contacts||[]),{name:'',role:'',email:'',phone:'',isPrimary:false}]}))} style={{padding:'2px 8px',borderRadius:4,border:'1px dashed #003250',background:'none',color:'#003250',fontSize:9,fontWeight:600,cursor:'pointer'}}>+ Add Contact</button>
          </div>
          {(modalData.contacts||[]).length===0&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:8}}>
            <div><label style={lS}>CONTACT</label><input value={modalData.contact||''} onChange={e=>setModalData({...modalData,contact:e.target.value})} style={iS}/></div>
            <div><label style={lS}>EMAIL</label><input value={modalData.email||''} onChange={e=>setModalData({...modalData,email:e.target.value})} style={iS}/></div>
            <div><label style={lS}>PHONE</label><input value={modalData.phone||''} onChange={e=>setModalData({...modalData,phone:e.target.value})} style={iS}/></div>
          </div>}
          {(modalData.contacts||[]).map((ct,i)=>(
            <div key={i} style={{background:'#f8f9fb',borderRadius:8,padding:10,marginBottom:4,border:'1px solid #eef0f2',position:'relative'}}>
              <button onClick={()=>{const cts=[...(modalData.contacts||[])];cts.splice(i,1);setModalData(p=>({...p,contacts:cts}));}} style={{position:'absolute',top:6,right:8,border:'none',background:'none',color:'#dc2626',cursor:'pointer',fontSize:14}}>x</button>
              <div style={{display:'grid',gridTemplateColumns:'1.5fr 1.5fr 1.5fr 1fr',gap:6}}>
                <div><label style={lS}>NAME</label><input value={ct.name||''} onChange={e=>{const cts=[...(modalData.contacts||[])];cts[i]={...cts[i],name:e.target.value};setModalData(p=>({...p,contacts:cts}));}} style={iS}/></div>
                <div><label style={lS}>ROLE / TITLE</label><input value={ct.role||''} onChange={e=>{const cts=[...(modalData.contacts||[])];cts[i]={...cts[i],role:e.target.value};setModalData(p=>({...p,contacts:cts}));}} placeholder="Plant Manager" style={iS}/></div>
                <div><label style={lS}>EMAIL</label><input value={ct.email||''} onChange={e=>{const cts=[...(modalData.contacts||[])];cts[i]={...cts[i],email:e.target.value};setModalData(p=>({...p,contacts:cts}));}} style={iS}/></div>
                <div><label style={lS}>PHONE</label><input value={ct.phone||''} onChange={e=>{const cts=[...(modalData.contacts||[])];cts[i]={...cts[i],phone:e.target.value};setModalData(p=>({...p,contacts:cts}));}} style={iS}/></div>
              </div>
              <label style={{fontSize:9,display:'flex',alignItems:'center',gap:4,marginTop:4,color:'#8b919e'}}><input type="checkbox" checked={ct.isPrimary||false} onChange={e=>{const cts=[...(modalData.contacts||[])];cts[i]={...cts[i],isPrimary:e.target.checked};setModalData(p=>({...p,contacts:cts}));}} /> Primary contact</label>
            </div>
          ))}

          {/* ── Equipment ── */}
          <div style={{fontSize:12,fontWeight:700,color:'#003250',marginTop:12,marginBottom:6,paddingBottom:4,borderBottom:'1px solid #00325040',display:'flex',justifyContent:'space-between'}}>
            <span>INSTALLED EQUIPMENT</span>
            <button onClick={()=>setModalData(p=>({...p,equipment:[...(p.equipment||[]),{model:'',serial:'',year:'',status:'active',companyId:'',notes:''}]}))} style={{padding:'2px 8px',borderRadius:4,border:'1px dashed #003250',background:'none',color:'#003250',fontSize:9,fontWeight:600,cursor:'pointer'}}>+ Add Equipment</button>
          </div>
          {(modalData.equipment||[]).map((eq,i)=>(
            <div key={i} style={{background:'#f8f9fb',borderRadius:8,padding:10,marginBottom:4,border:'1px solid #eef0f2',position:'relative'}}>
              <button onClick={()=>{const eqs=[...(modalData.equipment||[])];eqs.splice(i,1);setModalData(p=>({...p,equipment:eqs}));}} style={{position:'absolute',top:6,right:8,border:'none',background:'none',color:'#dc2626',cursor:'pointer',fontSize:14}}>x</button>
              <div style={{display:'grid',gridTemplateColumns:'1.2fr 1.5fr 1fr 0.6fr 0.8fr',gap:6}}>
                <div><label style={lS}>BRAND</label><select value={eq.companyId||''} onChange={e=>{const eqs=[...(modalData.equipment||[])];eqs[i]={...eqs[i],companyId:e.target.value||null};setModalData(p=>({...p,equipment:eqs}));}} style={iS}><option value="">Select...</option>{dbCos.map(co=><option key={co.id} value={co.id}>{co.name}</option>)}</select></div>
                <div><label style={lS}>MODEL</label><input value={eq.model||''} onChange={e=>{const eqs=[...(modalData.equipment||[])];eqs[i]={...eqs[i],model:e.target.value};setModalData(p=>({...p,equipment:eqs}));}} placeholder="e.g. VP125" style={iS}/></div>
                <div><label style={lS}>SERIAL #</label><input value={eq.serial||''} onChange={e=>{const eqs=[...(modalData.equipment||[])];eqs[i]={...eqs[i],serial:e.target.value};setModalData(p=>({...p,equipment:eqs}));}} style={iS}/></div>
                <div><label style={lS}>YEAR</label><input type="number" value={eq.year||''} onChange={e=>{const eqs=[...(modalData.equipment||[])];eqs[i]={...eqs[i],year:e.target.value};setModalData(p=>({...p,equipment:eqs}));}} style={iS}/></div>
                <div><label style={lS}>STATUS</label><select value={eq.status||'active'} onChange={e=>{const eqs=[...(modalData.equipment||[])];eqs[i]={...eqs[i],status:e.target.value};setModalData(p=>({...p,equipment:eqs}));}} style={iS}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              </div>
              <div style={{marginTop:4}}><label style={lS}>EQUIPMENT NOTES</label><input value={eq.notes||''} onChange={e=>{const eqs=[...(modalData.equipment||[])];eqs[i]={...eqs[i],notes:e.target.value};setModalData(p=>({...p,equipment:eqs}));}} placeholder="Notes..." style={iS}/></div>
            </div>
          ))}

          {/* ── Keywords & Notes (bottom) ── */}
          <div style={{fontSize:12,fontWeight:700,color:'#003250',marginTop:12,marginBottom:6,paddingBottom:4,borderBottom:'1px solid #00325040'}}>KEYWORDS & NOTES</div>
          <div style={{marginBottom:8}}><label style={lS}>KEYWORDS</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:4,padding:'6px 8px',border:'1px solid #e2e4e9',borderRadius:6,minHeight:34,alignItems:'center'}}>
              {(modalData.keywords||[]).map((kw,i)=><span key={i} style={{fontSize:10,background:'#e0e7ff',color:'#3b5998',padding:'2px 8px',borderRadius:4,display:'flex',alignItems:'center',gap:4}}>{kw}<button onClick={()=>setModalData(p=>({...p,keywords:(p.keywords||[]).filter((_,j)=>j!==i)}))} style={{border:'none',background:'none',color:'#3b5998',cursor:'pointer',fontSize:12,padding:0}}>x</button></span>)}
              <input placeholder="Type & press Enter..." onKeyDown={e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();e.stopPropagation();const v=e.target.value.trim();if(v){setModalData(p=>({...p,keywords:[...(p.keywords||[]),v]}));e.target.value='';}}}} style={{border:'none',outline:'none',fontSize:11,flex:1,minWidth:100,padding:'2px 0'}}/>
            </div>
          </div>
          <div style={{marginBottom:12}}><label style={lS}>NOTES</label><textarea value={modalData.notes||''} onChange={e=>setModalData({...modalData,notes:e.target.value})} rows={2} placeholder="Account notes..." style={{...iS,fontFamily:'inherit',resize:'vertical'}}/></div>

          <div style={{display:'flex',gap:8,marginTop:16,paddingTop:12,borderTop:'1px solid #e2e4e9'}}>
            <button onClick={()=>saveCust(modalData,showModal==='addCust')} style={{flex:1,padding:10,background:'#003250',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>{showModal==='addCust'?'Add Customer':'Save Changes'}</button>
            <button onClick={()=>setShowModal(null)} style={{padding:'10px 20px',background:'#f3f4f6',color:'#8b919e',border:'none',borderRadius:8,cursor:'pointer'}}>Cancel</button></div>
        </div>}
      </div></div>}

      {/* Import Modal */}
      {showImport&&<ImportModal type={showImport} companyId={cd?.id||null} onClose={()=>setShowImport(null)} onDone={()=>window.location.reload()}/>}
    </div>
  );
}
