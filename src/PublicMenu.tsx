import { useState } from 'react';
import { MapPin, Phone, QrCode, Search, ArrowUpRight, Clock3, Utensils } from 'lucide-react';

type MenuItem = { id:string; name:string; description?:string; price:string; imageUrl?:string; available?:boolean; diet?:'veg'|'nonveg' };
type MenuSection = { id:string; name:string; items:MenuItem[] };
type MenuRecord = { title:string; payload:Record<string,any> };

export default function PublicMenuView({record,loading}:{record:MenuRecord|null;loading:boolean}){
  const [activeSection,setActiveSection]=useState(0);
  const [search,setSearch]=useState('');
  if(loading)return <main className="public-menu-loading">Opening menu…</main>;
  if(!record)return <main className="public-menu-loading"><div className="public-menu-error"><QrCode size={30}/><h1>Menu unavailable</h1><p>This menu may have been paused or the link may be incorrect.</p></div></main>;
  const p=record.payload||{};
  const sections=(Array.isArray(p.sections)?p.sections:[]) as MenuSection[];
  const theme=['cream','midnight','sage','rose','terracotta','cobalt','lavender','noir'].includes(p.menuTheme)?p.menuTheme:'cream';
  const currency=p.currency||'INR';
  const symbols:Record<string,string>={INR:'₹',USD:'$',EUR:'€',GBP:'£'};
  const symbol=symbols[currency]||currency+' ';
  const visibleSections=sections.map(section=>({...section,items:section.items.filter(item=>item.available!==false&&item.name?.trim()&&(!search||item.name.toLowerCase().includes(search.toLowerCase())||(item.description||'').toLowerCase().includes(search.toLowerCase())))})).filter(section=>section.items.length>0);
  const totalItems=sections.reduce((n,s)=>n+s.items.filter(i=>i.available!==false&&i.name?.trim()).length,0);
  return <main className={'public-menu-page theme-'+theme}>
    <header className="public-menu-top"><span className="public-menu-brand"><span className="public-menu-brand-mark"><QrCode size={17}/></span>{p.restaurantName||record.title}<i>MENU</i></span><span className="public-menu-open">DIGITAL MENU</span></header>
    <section className="restaurant-menu-hero"><div className="restaurant-menu-hero-copy"><span className="public-menu-kicker">WELCOME TO OUR TABLE</span><h1>{p.restaurantName||record.title}</h1>{p.tagline&&<p className="public-menu-tagline">{p.tagline}</p>}{p.restaurantDescription&&<p className="public-menu-description">{p.restaurantDescription}</p>}<div className="public-menu-contact">{p.restaurantAddress&&<span><MapPin size={14}/>{p.restaurantAddress}</span>}{p.restaurantPhone&&<a href={'tel:'+p.restaurantPhone}><Phone size={14}/>{p.restaurantPhone}</a>}<span><Utensils size={14}/>{totalItems} menu items</span></div></div><div className="restaurant-menu-hero-stamp"><span>FRESH</span><strong>Made<br/>with care.</strong><small>GOOD FOOD · GOOD MOOD</small></div></section>
    <div className="restaurant-menu-toolbar"><div><span className="restaurant-menu-eyebrow">THE GOOD STUFF</span><h2>Explore the menu</h2><p>Find something you'll love.</p></div><label className="restaurant-menu-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search dishes…"/></label></div>
    <nav className="public-menu-tabs" aria-label="Menu categories">{sections.map((s,i)=><button key={s.id} className={activeSection===i?'active':''} onClick={()=>{setActiveSection(i);document.getElementById('menu-section-'+s.id)?.scrollIntoView({behavior:'smooth',block:'start'});}}>{s.name}</button>)}</nav>
    <section className="restaurant-menu-layout"><aside className="restaurant-menu-sidebar"><span className="restaurant-menu-eyebrow">ON THE MENU</span>{sections.map((s,i)=><button key={s.id} className={activeSection===i?'active':''} onClick={()=>{setActiveSection(i);document.getElementById('menu-section-'+s.id)?.scrollIntoView({behavior:'smooth',block:'start'});}}><span>{String(i+1).padStart(2,'0')}</span>{s.name}<ArrowUpRight size={13}/></button>)}<div className="restaurant-menu-sidebar-note"><Clock3 size={16}/><span>Freshly prepared<br/>with care</span></div></aside>
      <div className="restaurant-menu-sections">{visibleSections.map((section,i)=><section className="public-menu-category" id={'menu-section-'+section.id} key={section.id}><div className="public-menu-category-title"><span>{String(i+1).padStart(2,'0')}</span><h3>{section.name}</h3><i/></div><div className="restaurant-menu-dish-grid">{section.items.map((item,j)=><article className="restaurant-menu-dish" key={item.id}><div className="restaurant-menu-dish-photo">{item.imageUrl?<img src={item.imageUrl} alt={item.name} loading="lazy"/>:<div className="restaurant-menu-photo-placeholder"><Utensils size={25}/><span>{section.name}</span></div>}<span className={'diet-mark '+(item.diet==='nonveg'?'nonveg':'')}><span/></span></div><div className="restaurant-menu-dish-body"><div className="restaurant-menu-dish-title"><h4>{item.name}</h4><strong>{symbol}{Number(item.price||0).toLocaleString('en-IN',{maximumFractionDigits:2})}</strong></div>{item.description&&<p>{item.description}</p>}<span className="restaurant-menu-dish-meta">{item.diet==='nonveg'?'NON-VEG':'VEGETARIAN'} <i/> PREPARED FRESH</span></div></article>)}</div></section>)}{visibleSections.length===0&&<div className="public-menu-empty"><Utensils size={25}/><h3>{search?'No dishes match your search':'The menu is being refreshed'}</h3><p>{search?'Try another dish or clear your search.':'Please check back soon.'}</p></div>}</div>
    </section>
    <footer className="public-menu-footer"><span>{p.restaurantName||record.title}</span><small>Digital menu · Powered by KinetiQR</small></footer>
  </main>;
}
