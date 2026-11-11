import { useMemo, useState } from 'react';
import { ArrowUpRight, Coffee, CreditCard, MapPin, Star, Utensils, Wifi, Ticket, Instagram, Search, X, Download, Upload, Check } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';

type Design = { foreground:string; background:string; cornerColor:string; dots:string; corners:string; logoUrl?:string; logoSize?:number; margin?:number; [key:string]:any };
type Template = { id:string; name:string; category:string; description:string; type:string; fields:Record<string,string>; design:Design; dynamic?:boolean };
type Props = { templates:Template[]; QrPreview:React.ComponentType<{value:string;design:Design;className?:string}>; brandName?:string; brandColor?:string; onUse:(template:Template)=>void };
const demo='https://getkinetiqr.vercel.app/demo';
const swatches=['#F26A0A','#173B2F','#173B63','#54264E','#171717','#8A4B2B'];
const dotStyles=[{id:'square',label:'Square'},{id:'rounded',label:'Rounded'},{id:'dots',label:'Dots'}];
const titles:Record<string,string>={'restaurant-menu':'Table Tent','cafe-menu':'Table Tent','upi-pay':'Counter Pay','google-review':'Review Card','wifi-guest':'Wi-Fi Card','digital-contact':'Business Card','social-follow':'Social Follow','event-pass':'Event Ticket','location-pin':'Store Location'};
const useCases:Record<string,string>={'restaurant-menu':'Menus for tables and takeaway','cafe-menu':'Menus for cafés and counters','upi-pay':'Fast payments at your counter','google-review':'Collect customer feedback','wifi-guest':'Guest Wi-Fi access','digital-contact':'Share your contact details','social-follow':'Grow your social community','event-pass':'Entry and event information','location-pin':'Help customers find your store'};
function Poster({t,design,brandName,brandColor,QrPreview}:{t:Template;design:Design;brandName:string;brandColor:string;QrPreview:Props['QrPreview']}) {
 const name=titles[t.id]||t.name;
 const qr=<div className="kq-poster-qr"><QrPreview value={demo} design={design}/></div>;
 return <div className={'kq-poster kq-poster-'+(t.id==='restaurant-menu'||t.id==='cafe-menu'?'table':t.id==='upi-pay'?'pay':t.id==='google-review'?'review':t.id==='wifi-guest'?'wifi':t.id==='digital-contact'?'business':t.id==='social-follow'?'social':t.id==='event-pass'?'event':'location')} style={{'--poster-accent':brandColor,'--poster-paper':design.background} as React.CSSProperties}>
 {t.id==='restaurant-menu'||t.id==='cafe-menu'?<><div className="kq-poster-top"><Utensils/><span>MENU</span></div><h3>Scan for Menu</h3><p>Fresh flavours, made for you</p>{qr}<small>Powered by {brandName}</small></>:
 t.id==='upi-pay'?<><div className="kq-pay-bar"><CreditCard/> SCAN & PAY</div><div className="kq-poster-center">{qr}<b>{brandName}</b></div><div className="kq-pay-strip">Accepted: any UPI app</div></>:
 t.id==='google-review'?<><div className="kq-stars">★★★★★</div><h3>Loved it? Rate us</h3><p>Your feedback means a lot</p>{qr}<small>Review {brandName}</small></>:
 t.id==='wifi-guest'?<><Wifi size={30}/><h3>Guest Wi-Fi</h3><div className="kq-wifi-lines"><b>{t.fields.ssid||'Guest Network'}</b><span>Password: ••••••••</span></div>{qr}<small>Scan to connect</small></>:
 t.id==='digital-contact'?<div className="kq-business-layout"><div><small>HELLO, I'M</small><h3>{brandName}</h3><p>Business owner</p><span>Connect with us</span></div>{qr}</div>:
 t.id==='social-follow'?<><Instagram size={27}/><h3>Follow us</h3><p>@yourbrand</p>{qr}<small>Stay connected</small></>:
 t.id==='event-pass'?<div className="kq-ticket-layout"><div><small>ADMIT ONE</small><h3>You're invited</h3><p>{brandName}</p></div><div className="kq-ticket-stub">{qr}<small>SCAN</small></div></div>:
 <><MapPin size={29}/><h3>Find us here</h3><p>{brandName}</p>{qr}<small>Open directions</small></>}
 </div>;
}
export default function TemplateStudio({templates,QrPreview,brandName='Your Business',brandColor='#F26A0A',onUse}:Props){
 const [category,setCategory]=useState('All'),[search,setSearch]=useState(''),[selected,setSelected]=useState<Template|null>(null),[color,setColor]=useState(brandColor),[dots,setDots]=useState('rounded'),[logo,setLogo]=useState(''),[printSize,setPrintSize]=useState('A6');
 const cats=['All','Restaurant','Payment','Social','Business','Marketing','Events'];
 const filtered=useMemo(()=>templates.filter(t=>(category==='All'||(category==='Restaurant'&&t.category==='Hospitality')||(category==='Payment'&&t.category==='Payments')||(category==='Social'&&t.type==='social')||(category==='Business'&&t.category==='Business')||(category==='Marketing'&&t.category==='Marketing')||(category==='Events'&&t.category==='Events'))&&(!search||[t.name,t.description,t.category].join(' ').toLowerCase().includes(search.toLowerCase()))),[templates,category,search]);
 const previewDesign=(t:Template):Design=>({...t.design,foreground:'#202020',background:'#ffffff',cornerColor:color,dots,margin:24,logoUrl:logo||undefined,logoSize:.18});
 const downloadPng=async()=>{if(!selected)return;const qr=new QRCodeStyling({width:1200,height:1200,type:'canvas',data:demo,margin:4,qrOptions:{errorCorrectionLevel:'H'},dotsOptions:{color:'#202020',type:dots as any},cornersSquareOptions:{color:color,type:'extra-rounded'},cornersDotOptions:{color:color,type:'dot'},backgroundOptions:{color:'#ffffff'},image:logo||undefined,imageOptions:{imageSize:.18,margin:5,hideBackgroundDots:true}});const blob=await qr.getRawData('png');if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(selected.id||'kinetiqr-template')+'-sample.png';a.click();URL.revokeObjectURL(url);};
 const useSelected=()=>{if(!selected)return;onUse({...selected,design:previewDesign(selected)});setSelected(null);};
 return <section className="kq-template-studio">
 <div className="kq-template-head"><div><span className="kq-template-kicker">PRINT-READY QR DESIGNS</span><h2>Templates that belong on your counter.</h2><p>Choose a layout, make it yours, then add your real QR destination.</p></div><label className="kq-template-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search templates…"/>{search&&<button onClick={()=>setSearch('')} aria-label="Clear search"><X size={14}/></button>}</label></div>
 <div className="kq-template-chips">{cats.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
 <div className="kq-template-grid">{filtered.map(t=><button type="button" className="kq-template-card" key={t.id} onClick={()=>{setSelected(t);setColor(brandColor);setDots(t.design.dots==='square'?'square':t.design.dots==='dots'?'dots':'rounded');setLogo('');}}>
 <div className="kq-poster-wrap"><Poster t={t} design={{...t.design,foreground:'#202020',background:'#fff',cornerColor:brandColor,margin:24}} brandName={brandName} brandColor={brandColor} QrPreview={QrPreview}/></div>
 <div className="kq-template-card-foot"><span><b>{titles[t.id]||t.name}</b><small>{useCases[t.id]||t.description}</small></span><i>Dynamic</i></div></button>)}</div>
 {filtered.length===0&&<p className="kq-template-empty">No matching templates. Try another search.</p>}
 {selected&&<div className="kq-sheet-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}><section className="kq-template-sheet" role="dialog" aria-modal="true" aria-label={selected.name+' template'}><header><div><small>TEMPLATE CUSTOMIZER</small><h2>{titles[selected.id]||selected.name}</h2></div><button onClick={()=>setSelected(null)} aria-label="Close"><X/></button></header>
 <div className="kq-sheet-scroll"><div className="kq-sheet-poster"><Poster t={selected} design={previewDesign(selected)} brandName={brandName} brandColor={color} QrPreview={QrPreview}/></div>
 <label className="kq-control-label">Brand colour</label><div className="kq-swatches">{swatches.map(c=><button key={c} style={{background:c}} aria-label={'Choose '+c} aria-pressed={color===c} onClick={()=>setColor(c)}>{color===c&&<Check size={15}/>}</button>)}</div>
 <label className="kq-control-label">QR dot style</label><div className="kq-dot-picker">{dotStyles.map(d=><button key={d.id} className={dots===d.id?'active':''} onClick={()=>setDots(d.id)}>{d.label}</button>)}</div>
 <label className="kq-control-label">Center logo (optional)</label><label className="kq-logo-upload"><Upload size={16}/> Upload logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>1024*1024)return;const reader=new FileReader();reader.onload=()=>setLogo(String(reader.result));reader.readAsDataURL(f);}}/></label>
 <label className="kq-control-label">Print size</label><select className="kq-print-select" value={printSize} onChange={e=>setPrintSize(e.target.value)}><option value="5x5">Sticker · 5×5 cm</option><option value="A6">Table tent · A6</option><option value="A4">Poster · A4</option></select>
 <p className="kq-print-note">Sample PNG exports at 1200px. Print PDF with 300 DPI and bleed will be enabled in the print export flow.</p></div>
 <footer><button className="kq-sheet-secondary" onClick={downloadPng}><Download size={16}/> Download sample PNG</button><button className="kq-sheet-primary" onClick={useSelected}>Use this template <ArrowUpRight size={16}/></button></footer>
 </section></div>}
 </section>;
}
