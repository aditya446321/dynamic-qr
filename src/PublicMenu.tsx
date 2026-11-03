import { useState } from 'react';
import { MapPin, Phone, QrCode } from 'lucide-react';

type MenuItem = { id:string; name:string; description?:string; price:string; imageUrl?:string; available?:boolean; diet?:'veg'|'nonveg' };
type MenuSection = { id:string; name:string; items:MenuItem[] };
type MenuRecord = { title:string; payload:Record<string,any> };

export default function PublicMenuView({record,loading}:{record:MenuRecord|null;loading:boolean}){
  const [activeSection,setActiveSection]=useState(0);
  if(loading)return <main className="public-menu-loading">Opening menu…</main>;
  if(!record)return <main className="public-menu-loading"><div className="public-menu-error"><QrCode size={30}/><h1>Menu unavailable</h1><p>This menu may have been paused or the link may be incorrect.</p></div></main>;
  const p=record.payload||{};
  const sections=(Array.isArray(p.sections)?p.sections:[]) as MenuSection[];
  const theme=['cream','dark','sage','rose'].includes(p.menuTheme)?p.menuTheme:'cream';
  const currency=p.currency||'INR';
  const symbols:Record<string,string>={INR:'₹',USD:'$',EUR:'€',GBP:'£'};
  const symbol=symbols[currency]||currency+' ';
  return <main className={'public-menu-page theme-'+theme}>
    <header className="public-menu-top"><span className="public-menu-brand">Qraft Menu</span><span className="public-menu-open">DIGITAL MENU</span></header>
    <section className="public-menu-hero"><div className="public-menu-ornament">EST. FOR GOOD TASTE</div><div className="public-menu-hero-card"><span className="public-menu-kicker">WELCOME TO</span><h1>{p.restaurantName||record.title}</h1>{p.tagline&&<p className="public-menu-tagline">{p.tagline}</p>}{p.restaurantDescription&&<p className="public-menu-description">{p.restaurantDescription}</p>}<div className="public-menu-contact">{p.restaurantAddress&&<span><MapPin size={14}/>{p.restaurantAddress}</span>}{p.restaurantPhone&&<a href={'tel:'+p.restaurantPhone}><Phone size={14}/>{p.restaurantPhone}</a>}</div></div></section>
    <nav className="public-menu-tabs">{sections.map((s,i)=><button key={s.id} className={activeSection===i?'active':''} onClick={()=>{setActiveSection(i);document.getElementById('menu-section-'+s.id)?.scrollIntoView({behavior:'smooth',block:'start'});}}>{s.name}</button>)}</nav>
    <section className="public-menu-content"><div className="public-menu-heading"><span>MADE FRESH FOR YOU</span><h2>Explore our menu</h2><p>Thoughtfully prepared. Happily served.</p></div>
      {sections.map((section,i)=><section className="public-menu-category" id={'menu-section-'+section.id} key={section.id}><div className="public-menu-category-title"><span>{String(i+1).padStart(2,'0')}</span><h3>{section.name}</h3><i/></div><div className="public-menu-items">{section.items.filter(item=>item.name?.trim()&&item.available!==false).map(item=><article className="public-menu-item" key={item.id}><div className="public-menu-item-copy"><div className={'diet-mark '+(item.diet==='nonveg'?'nonveg':'')}><span/></div><h4>{item.name}</h4>{item.description&&<p>{item.description}</p>}<strong>{symbol}{Number(item.price||0).toLocaleString('en-IN',{maximumFractionDigits:2})}</strong></div>{item.imageUrl&&<img className="public-menu-food-image" src={item.imageUrl} alt={item.name} loading="lazy"/>}</article>)}</div></section>)}
      {sections.length===0&&<p className="public-menu-empty">The restaurant is updating its menu. Please check back soon.</p>}
    </section>
    <footer className="public-menu-footer"><span>{p.restaurantName||record.title}</span><small>Menu powered by Qraft</small></footer>
  </main>;
}
