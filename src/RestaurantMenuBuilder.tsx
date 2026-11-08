import { useEffect, useState } from 'react';
import { FileImage, Plus, Trash2, Check, Palette } from 'lucide-react';

type MenuItem = {id:string;name:string;description:string;price:string;imageUrl?:string;imageFile?:File;available:boolean;diet:'veg'|'nonveg'};
type MenuSection = {id:string;name:string;items:MenuItem[]};
type Props = {value:Record<string,any>;onChange:(next:Record<string,any>)=>void;sections:MenuSection[];onSectionsChange:(next:MenuSection[])=>void};

function MenuPhotoPreview({file,url}:{file?:File;url?:string}){
  const [src,setSrc]=useState(url||'');
  useEffect(()=>{if(!file){setSrc(url||'');return;}const objectUrl=URL.createObjectURL(file);setSrc(objectUrl);return()=>URL.revokeObjectURL(objectUrl);},[file,url]);
  if(!src)return null;
  return <div className="menu-photo-preview"><img src={src} alt="Dish preview"/><span>{file?.name||'Current photo'}</span></div>;
}

export default function RestaurantMenuBuilder({value,onChange,sections,onSectionsChange}:Props){
  const set=(key:string,val:string)=>onChange({...value,[key]:val});
  const updateSection=(id:string,patch:Partial<MenuSection>)=>onSectionsChange(sections.map(s=>s.id===id?{...s,...patch}:s));
  const updateItem=(sectionId:string,itemId:string,patch:Partial<MenuItem>)=>onSectionsChange(sections.map(s=>s.id===sectionId?{...s,items:s.items.map(i=>i.id===itemId?{...i,...patch}:i)}:s));
  const addSection=()=>onSectionsChange([...sections,{id:crypto.randomUUID().slice(0,8),name:'New category',items:[]}]);
  const addItem=(sectionId:string)=>onSectionsChange(sections.map(s=>s.id===sectionId?{...s,items:[...s.items,{id:crypto.randomUUID().slice(0,8),name:'',description:'',price:'',available:true,diet:'veg'}]}:s));
  const themes=[{id:'midnight',name:'Midnight Dark',note:'Deep charcoal · warm gold'},{id:'cream',name:'Warm Cream',note:'Soft ivory · espresso'},{id:'sage',name:'Fresh Sage',note:'Herbal green · natural'},{id:'rose',name:'Fresh Shop Rose',note:'Muted rose · berry'},{id:'terracotta',name:'Terracotta Table',note:'Clay · warm sand'},{id:'cobalt',name:'Cobalt Studio',note:'Ink blue · crisp white'},{id:'lavender',name:'Lavender Haze',note:'Soft lilac · plum'},{id:'noir',name:'Noir & Gold',note:'Elegant black · brass'}];
  return <div className="menu-builder">
    <div className="menu-intro"><div><span className="menu-editor-eyebrow">RESTAURANT STUDIO</span><strong>Build a menu customers love.</strong><small>Design your digital menu, organise dishes and publish updates without reprinting your QR code.</small></div><span className="menu-live-pill"><i/> LIVE MENU BUILDER</span></div><div className="menu-editor-summary"><div><span className="menu-summary-icon"><FileImage size={16}/></span><span><strong>{sections.length}</strong><small>Categories</small></span></div><div><span className="menu-summary-icon"><Check size={16}/></span><span><strong>{sections.reduce((n,s)=>n+s.items.length,0)}</strong><small>Menu items</small></span></div><div><span className="menu-summary-icon"><Palette size={16}/></span><span><strong>{value.menuTheme||"cream"}</strong><small>Selected style</small></span></div></div>
    <div className="menu-profile-grid">
      <div><label className="input-label">Restaurant name *</label><input className="builder-input" value={value.restaurantName||''} onChange={e=>set('restaurantName',e.target.value)} placeholder="e.g. The Olive Kitchen"/></div>
      <div><label className="input-label">Phone number</label><input className="builder-input" value={value.restaurantPhone||''} onChange={e=>set('restaurantPhone',e.target.value)} placeholder="+91 98765 43210"/></div>
      <div><label className="input-label">Tagline</label><input className="builder-input" value={value.tagline||''} onChange={e=>set('tagline',e.target.value)} placeholder="Fresh food, made with care"/></div>
      <div><label className="input-label">Address</label><input className="builder-input" value={value.restaurantAddress||''} onChange={e=>set('restaurantAddress',e.target.value)} placeholder="Restaurant address"/></div>
      <div className="menu-wide"><label className="input-label">About the restaurant</label><textarea className="builder-input textarea" value={value.restaurantDescription||''} onChange={e=>set('restaurantDescription',e.target.value)} placeholder="A short introduction for your customers…"/></div>
    </div>
    <div className="menu-theme-picker"><div className="menu-theme-heading"><div><label className="input-label">Choose your menu style</label><small>Preview the mood before publishing. You can change it any time.</small></div><Palette size={18}/></div><div className="menu-theme-cards">{themes.map(theme=><button type="button" key={theme.id} className={`menu-theme-card theme-swatch-${theme.id} ${(value.menuTheme||'cream')===theme.id?'selected':''}`} onClick={()=>set('menuTheme',theme.id)}><span className="theme-swatch-preview"><i/><i/><i/></span><span className="theme-card-copy"><strong>{theme.name}</strong><small>{theme.note}</small></span>{(value.menuTheme||'cream')===theme.id&&<Check size={15}/>}</button>)}</div></div>
    <div className="menu-theme-row">
      <div><label className="input-label">Currency</label><select className="builder-input" value={value.currency||'INR'} onChange={e=>set('currency',e.target.value)}><option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option></select></div>
    </div>
    <div className="menu-section-list">
      {sections.map((section,index)=><section className="menu-editor-section" key={section.id}>
        <div className="menu-section-head"><span className="menu-section-index">{String(index+1).padStart(2,'0')}</span><input className="builder-input" value={section.name} onChange={e=>updateSection(section.id,{name:e.target.value})} placeholder="Category name e.g. Starters"/><button type="button" className="icon-button danger-icon" onClick={()=>onSectionsChange(sections.filter(s=>s.id!==section.id))} title="Remove category"><Trash2 size={16}/></button></div>
        {section.items.map((item,itemIndex)=><div className="menu-item-editor" key={item.id}>
          <div className="menu-item-number">{String(itemIndex+1).padStart(2,'0')}</div>
          <div className="menu-item-fields">
            <div className="menu-item-main-grid"><input className="builder-input" value={item.name} onChange={e=>updateItem(section.id,item.id,{name:e.target.value})} placeholder="Dish name"/><input className="builder-input price-input" type="number" min="0" step="0.01" value={item.price} onChange={e=>updateItem(section.id,item.id,{price:e.target.value})} placeholder="Price"/><select className="builder-input diet-select" value={item.diet} onChange={e=>updateItem(section.id,item.id,{diet:e.target.value as 'veg'|'nonveg'})}><option value="veg">Veg</option><option value="nonveg">Non-veg</option></select></div>
            <textarea className="builder-input menu-description" value={item.description} onChange={e=>updateItem(section.id,item.id,{description:e.target.value})} placeholder="Short dish description (optional)"/>
            <div className="menu-item-bottom"><label className="upload-button small-upload"><FileImage size={14}/>{item.imageUrl||item.imageFile?'Change photo':'Add food photo'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>updateItem(section.id,item.id,{imageFile:e.target.files?.[0],imageUrl:undefined})}/></label><label className="menu-available"><input type="checkbox" checked={item.available} onChange={e=>updateItem(section.id,item.id,{available:e.target.checked})}/> Available</label><button type="button" className="text-danger" onClick={()=>onSectionsChange(sections.map(s=>s.id===section.id?{...s,items:s.items.filter(i=>i.id!==item.id)}:s))}>Remove item</button></div>
            {(item.imageUrl||item.imageFile)&&<MenuPhotoPreview file={item.imageFile} url={item.imageUrl}/>}
          </div>
        </div>)}
        <button type="button" className="add-item-button" onClick={()=>addItem(section.id)}><Plus size={16}/> Add menu item</button>
      </section>)}
    </div>
    <div className="menu-builder-footer"><button type="button" className="upload-button" onClick={addSection}><Plus size={16}/> Add menu category</button><small>{sections.reduce((n,s)=>n+s.items.length,0)} item slots · Add as many items as you need</small></div>
  </div>;
}
