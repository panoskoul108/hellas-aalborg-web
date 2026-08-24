'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from './supabase'; 

const translations = {
  da: {
    menu: 'Menu', location: 'Find Os', orderWolt: 'Bestil via Wolt', tag: 'Smagen af Grækenland',
    title1: 'Ægte Græsk Gyros', title2: 'i hjertet af Aalborg',
    desc: 'Oplev den autentiske græske stemning. Vi bringer opskrifterne direkte fra Grækenland til dig. Velkommen!',
    btnTakeaway: 'Se Vores Menu', menuTitle: 'Vores Menu',
    menuDesc: 'Vælg mellem vores fordelagtige Takeaway-priser for afhentning, eller få det leveret via Wolt.',
    popular: 'Vores Favorit', takeawayLabel: 'Takeaway', deliveryLabel: 'Wolt Pris',
    tabTakeaway: 'Takeaway Menu', tabDelivery: 'Wolt Menu',
    aboutTitle: 'Græsk Hjerte, Dansk Hygge',
    aboutDesc: 'Hos Hellas Aalborg forener vi den varme græske gæstfrihed med nordisk kvalitet. Vores gyros laves efter originale familieopskrifter med kød af højeste kvalitet og håndlavet tzatziki.',
    hoursTitle: 'Åbningstider', monThu: 'Mandag - Torsdag', friSat: 'Fredag - Lørdag', sun: 'Søndag',
    footerDesc: 'Dit lille stykke Grækenland i Nordjylland. Vi glæder os til at se dig.',
    footerDelivery: 'Bestil Delivery', allergies: 'Allergier eller særlige behov? Spørg vores personale!',
    veg: 'Vegetarisk', smiley: 'Se Fødevarestyrelsens smiley-rapport', followUs: 'Følg os på Instagram', callNow: 'Ring nu'
  },
  en: {
    menu: 'Menu', location: 'Find Us', orderWolt: 'Order Wolt', tag: 'Taste of Greece',
    title1: 'Authentic Greek Gyros', title2: 'in the heart of Aalborg',
    desc: 'Experience the true Greek vibe. We bring original recipes straight from Greece to you. Welcome!',
    btnTakeaway: 'See Our Menu', menuTitle: 'Our Menu',
    menuDesc: 'Choose our great Takeaway prices for pick-up, or get it delivered via Wolt.',
    popular: 'Our Favorite', takeawayLabel: 'Takeaway', deliveryLabel: 'Wolt Price',
    tabTakeaway: 'Takeaway Menu', tabDelivery: 'Wolt Menu',
    aboutTitle: 'Greek Heart, Danish Hygge',
    aboutDesc: 'At Hellas Aalborg, we combine warm Greek hospitality with Nordic quality. Our gyros are made using original family recipes, premium meat, and handmade tzatziki.',
    hoursTitle: 'Opening Hours', monThu: 'Monday - Thursday', friSat: 'Friday - Saturday', sun: 'Sunday',
    footerDesc: 'Your little piece of Greece in North Jutland. We look forward to seeing you.',
    footerDelivery: 'Order Delivery', allergies: 'Allergies or dietary needs? Please ask our staff!',
    veg: 'Vegetarian', smiley: 'Food safety inspection report', followUs: 'Follow us on Instagram', callNow: 'Call Now'
  },
  el: {
    menu: 'Μενού', location: 'Βρείτε μας', orderWolt: 'Μέσω Wolt', tag: 'Η Γεύση της Ελλάδας',
    title1: 'Αυθεντικός Ελληνικός Γύρος', title2: 'στην καρδιά του Aalborg',
    desc: 'Ζήστε την πραγματική ελληνική ατμόσφαιρα. Φέραμε τις αυθεντικές συνταγές απευθείας στο Aalborg. Καλώς ήρθατε!',
    btnTakeaway: 'Δείτε το Μενού', menuTitle: 'Το Μενού μας',
    menuDesc: 'Επιλέξτε τις χαμηλότερες τιμές μας για παραλαβή από το κατάστημα, ή παραγγείλετε μέσω Wolt.',
    popular: 'Αγαπημένο', takeawayLabel: 'Takeaway', deliveryLabel: 'Τιμή Wolt',
    tabTakeaway: 'Μενού Takeaway', tabDelivery: 'Μενού Wolt',
    aboutTitle: 'Ελληνική Ψυχή, Δανέζικη Ποιότητα',
    aboutDesc: 'Στο Hellas Aalborg ενώνουμε τη ζεστή ελληνική φιλοξενία με την ποιότητα του Βορρά. Ο γύρος μας φτιάχνεται με αυθεντικές οικογενειακές συνταγές, εκλεκτά κρέατα και χειροποίητο τζατζίκι.',
    hoursTitle: 'Ωράριο Λειτουργίας', monThu: 'Δευτέρα - Πέμπτη', friSat: 'Παρασκευή - Σάββατο', sun: 'Κυριακή',
    footerDesc: 'Το δικό σας κομμάτι Ελλάδας στη Βόρεια Γιουτλάνδη. Σας περιμένουμε.',
    footerDelivery: 'Παραγγελία Delivery', allergies: 'Έχετε αλλεργίες; Ρωτήστε το προσωπικό μας!',
    veg: 'Χορτοφαγικό', smiley: 'Αναφορά υγειονομικού ελέγχου', followUs: 'Ακολουθήστε μας στο Instagram', callNow: 'Κλήση'
  }
};

const heroImages = ["/foto1.jpg", "/foto2.jpg", "/foto3.jpg", "/foto4.jpg"];

export default function Home() {
  const [lang, setLang] = useState('da'); 
  const [menuType, setMenuType] = useState('takeaway');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (data) {
        const formattedData = data.map(item => ({
          id: item.id,
          category: item.category,
          title: { da: item.title_da, en: item.title_en, el: item.title_el },
          desc: { da: item.desc_da, en: item.desc_en, el: item.desc_el },
          priceTakeaway: item.price_takeaway,
          priceDelivery: item.price_delivery,
          popular: item.popular,
          vegetarian: item.vegetarian,
          featured: item.featured
        }));
        setMenuItems(formattedData);
      }
      setIsLoading(false);
    };

    fetchMenu();

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 6000);

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const t = translations[lang as keyof typeof translations];

  return (
    <div className="min-h-screen font-sans bg-[#0B1120] text-gray-200 flex flex-col selection:bg-[#38BDF8] selection:text-[#0B1120]">
      
      {/* NAVIGATION BAR */}
      <nav className={`flex items-center justify-between px-6 py-4 sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/5 shadow-lg' : 'bg-transparent'
      }`}>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Hellas Aalborg Logo" width={70} height={70} priority className="object-contain" />
        </div>
        
        <div className="hidden md:flex gap-8 font-semibold text-gray-300">
          <a href="#menu" className="hover:text-[#38BDF8] transition-colors">{t.menu}</a>
          <a href="#location" className="hover:text-[#38BDF8] transition-colors">{t.location}</a>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            className="bg-[#1E293B]/80 backdrop-blur-md border border-white/10 text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#38BDF8] cursor-pointer font-medium transition"
          >
            <option value="da">🇩🇰 DA</option>
            <option value="en">🇬🇧 EN</option>
            <option value="el">🇬🇷 EL</option>
          </select>
          <a href="https://wolt.com/da/dnk/aalborg/restaurant/hellas-food1" target="_blank" rel="noopener noreferrer" className="hidden md:block bg-gradient-to-r from-[#009de0] to-[#007fb5] text-white px-7 py-2.5 rounded-full font-bold shadow-[0_0_20px_rgba(0,157,224,0.3)] hover:shadow-[0_0_25px_rgba(0,157,224,0.5)] transition-all hover:-translate-y-0.5">
            {t.orderWolt}
          </a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center text-center overflow-hidden border-b border-white/5 -mt-[98px] pt-[98px] pb-24">
        {heroImages.map((src, index) => (
          <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}>
            <Image src={src} alt="Hellas Aalborg Vibe" fill priority={index === 0} className={`object-cover transition-transform duration-[7000ms] ease-out ${index === currentSlide ? 'scale-105' : 'scale-100'}`} />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120]/80 via-[#0B1120]/50 to-[#0B1120] z-0"></div>
        
        <div className="relative z-10 px-4 flex flex-col items-center justify-center w-full h-full"> 
          <span className="text-[#38BDF8] font-bold tracking-[0.25em] uppercase mb-6 md:mb-8 text-[10px] md:text-xs bg-[#0F172A]/50 backdrop-blur-md px-4 py-1.5 md:px-5 md:py-1.5 rounded-full border border-[#38BDF8]/20 shadow-lg">
            {t.tag}
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-4 md:mb-6 drop-shadow-2xl leading-tight tracking-tight">
            {t.title1} <br className="hidden md:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500 font-light italic">{t.title2}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 md:mb-14 max-w-2xl font-light drop-shadow-md px-4">{t.desc}</p>
          <a href="#menu" className="bg-white hover:bg-gray-100 text-[#0B1120] font-bold py-3.5 px-8 md:py-4 md:px-10 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all transform hover:-translate-y-1 text-sm md:text-base">
            {t.btnTakeaway}
          </a>
        </div>
        
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-20">
          {heroImages.map((_, index) => (
             <button key={index} onClick={() => setCurrentSlide(index)} className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ${index === currentSlide ? 'bg-[#38BDF8] w-6 md:w-8 shadow-[0_0_10px_rgba(56,189,248,0.8)]' : 'bg-white/30 w-1.5 md:w-2 hover:bg-white/60'}`} aria-label={`Go to slide ${index + 1}`} />
          ))}
        </div>
      </header>

      {/* ABOUT SECTION */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex justify-center gap-2 mb-8 opacity-60">
            <span className="w-16 h-1 bg-gradient-to-r from-transparent to-white rounded-full"></span>
            <span className="w-4 h-1 bg-[#38BDF8] rounded-full shadow-[0_0_8px_#38BDF8]"></span>
            <span className="w-16 h-1 bg-gradient-to-l from-transparent to-white rounded-full"></span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 tracking-tight">{t.aboutTitle}</h2>
          <p className="text-gray-400 text-lg md:text-xl leading-relaxed font-light">{t.aboutDesc}</p>
        </div>
      </section>

      {/* MENU SECTION */}
      <section id="menu" className="py-16 px-4 md:px-8 max-w-7xl mx-auto flex-grow relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">{t.menuTitle}</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">{t.menuDesc}</p>
          
          <div className="inline-flex items-center bg-[#1E293B]/60 backdrop-blur-md p-1.5 rounded-full border border-white/5 shadow-inner">
            <button onClick={() => setMenuType('takeaway')} className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${menuType === 'takeaway' ? 'bg-white text-[#0B1120] shadow-md' : 'text-gray-400 hover:text-white'}`}>
              {t.tabTakeaway}
            </button>
            <button onClick={() => setMenuType('wolt')} className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${menuType === 'wolt' ? 'bg-gradient-to-r from-[#009de0] to-[#007fb5] text-white shadow-[0_0_15px_rgba(0,157,224,0.4)]' : 'text-gray-400 hover:text-white'}`}>
              {t.tabDelivery}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-[#38BDF8] text-xl font-bold animate-pulse">
            Indlæser menu... / Loading Menu...
          </div>
        ) : (
          /* ΣΥΜΠΙΕΣΜΕΝΟ ΠΛΕΓΜΑ ΚΑΡΤΩΝ (Gap-5 αντί για Gap-6) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {menuItems.map((item) => (
              /* PREMIUM ΚΑΡΤΑ - Dark Luxe Glass */
              <div key={item.id} className={`bg-[#0B1120]/40 backdrop-blur-xl rounded-xl p-5 relative flex flex-col group border border-white/5 shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-white/10 transition-all duration-500 ${item.featured ? 'md:col-span-2 lg:col-span-2 bg-[#0F172A]/40' : 'col-span-1'}`}>
                
                {/* Εφέ γυαλιού: Απαλή λευκή γραμμή στην κορυφή όταν περνάς το ποντίκι */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="flex justify-between items-start mb-3">
                  <div className="text-[10px] text-gray-500 font-medium uppercase tracking-[0.2em]">
                    {item.category}
                  </div>
                  <div className="flex gap-1.5">
                    {item.vegetarian && (
                      <span className="text-[9px] uppercase tracking-widest font-semibold text-emerald-400/80 border border-emerald-500/20 px-2 py-0.5 rounded">
                        VEG
                      </span>
                    )}
                    {item.popular && (
                      <span className="text-[9px] uppercase tracking-widest font-semibold text-amber-400/80 border border-amber-500/20 px-2 py-0.5 rounded">
                        POPULAR
                      </span>
                    )}
                  </div>
                </div>
                
                <h3 className={`${item.featured ? 'text-2xl' : 'text-xl'} font-semibold text-white mb-2 tracking-tight`}>
                  {item.title[lang as keyof typeof item.title] || item.title.da}
                </h3>
                <p className={`text-gray-400 text-xs md:text-sm mb-5 leading-relaxed font-light flex-grow ${item.featured ? 'max-w-xl' : ''}`}>
                  {item.desc[lang as keyof typeof item.desc] || item.desc.da}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <div>
                    <span className="text-xl md:text-2xl font-light text-white tracking-tight">
                      {menuType === 'takeaway' ? item.priceTakeaway : item.priceDelivery}
                    </span>
                    <span className="text-xs font-light text-gray-500 ml-1">DKK</span>
                  </div>
                  <span className="text-[9px] font-medium text-gray-500 uppercase tracking-widest px-2 py-1 bg-white/5 rounded border border-white/5">
                    {menuType === 'takeaway' ? t.takeawayLabel : t.deliveryLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12"><p className="text-gray-500 text-sm font-medium"><span className="text-[#38BDF8]">ℹ️</span> {t.allergies}</p></div>
        {menuType === 'wolt' && (
          <div className="text-center mt-12 animate-fade-in-up pb-10">
            <a href="https://wolt.com/da/dnk/aalborg/restaurant/hellas-food1" target="_blank" rel="noopener noreferrer" className="inline-block bg-gradient-to-r from-[#009de0] to-[#007fb5] text-white font-bold py-4 px-14 rounded-full shadow-[0_0_25px_rgba(0,157,224,0.4)] transition-all transform hover:scale-105 hover:shadow-[0_0_35px_rgba(0,157,224,0.6)]">
              {t.orderWolt}
            </a>
          </div>
        )}
      </section>

      {/* INSTAGRAM & FOOTER COPIED DIRECTLY FROM PREVIOUS */}
      <section id="instagram" className="py-16 bg-[#0B1120] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-10 flex items-center justify-center gap-3 tracking-tight"><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 text-3xl">📸</span> {t.followUs}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <a key={i} href="#" target="_blank" rel="noopener noreferrer" className="relative aspect-square bg-slate-800/30 rounded-2xl overflow-hidden group border border-white/5 flex items-center justify-center hover:border-[#38BDF8]/50 transition-all duration-300">
                <span className="text-gray-600 group-hover:text-[#38BDF8] text-sm font-medium transition-colors">Instagram Post {i}</span>
                <div className="absolute inset-0 bg-[#0B1120]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm"><span className="text-white font-bold tracking-wide">View Post</span></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer id="location" className="bg-[#040812] text-gray-400 pt-20 pb-28 md:pb-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-16">
          <div>
            <Image src="/logo.png" alt="Hellas Aalborg Logo" width={100} height={100} className="object-contain mb-6 opacity-90 hover:opacity-100 transition-opacity" />
            <p className="mb-8 text-sm leading-relaxed text-gray-500">{t.footerDesc}</p>
            <div className="space-y-4 text-sm font-medium text-gray-300 mb-8">
              <p className="flex items-center gap-4"><span className="text-[#38BDF8] text-xl bg-[#38BDF8]/10 p-2 rounded-full">📍</span>Ved Stranden 21, 9000 Aalborg</p>
              <p className="flex items-center gap-4"><span className="text-[#38BDF8] text-xl bg-[#38BDF8]/10 p-2 rounded-full">📞</span>+45 42 17 77 54</p>
            </div>
            <a href="https://www.findsmiley.dk/Sider/VirkSide.aspx?virk=1579068" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 bg-white/5 hover:bg-white/10 px-5 py-3 rounded-xl border border-white/10 transition-colors"><span className="text-2xl">😃</span><span className="text-sm font-medium text-gray-300">{t.smiley}</span></a>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-8 tracking-wide">{t.hoursTitle}</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex justify-between border-b border-white/5 pb-3"><span className="text-gray-400">{t.monThu}</span><span className="font-bold text-white">18:00 - 24:00</span></li>
              <li className="flex justify-between border-b border-white/5 pb-3"><span className="text-[#38BDF8] font-medium">{t.friSat}</span><span className="font-bold text-[#38BDF8]">18:00 - 04:00</span></li>
              <li className="flex justify-between border-b border-white/5 pb-3"><span className="text-gray-400">{t.sun}</span><span className="font-bold text-white">18:00 - 24:00</span></li>
            </ul>
          </div>
          <div className="h-72 w-full rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] opacity-80 hover:opacity-100 transition-opacity border border-white/10 relative">
            <iframe title="Hellas Aalborg Map" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2170.198305602497!2d9.919427015949516!3d57.04944898092288!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x464932b144fc894f%3A0xc3c940b3c5a6c38b!2sVed%20Stranden%2021%2C%209000%20Aalborg%2C%20Denmark!5e0!3m2!1sen!2sgr!4v1680000000000!5m2!1sen!2sgr" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0"></iframe>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-8 mt-20 pt-8 border-t border-white/5 text-center text-xs text-gray-600 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Hellas Aalborg. All rights reserved.</p>
          <a href="https://wolt.com/da/dnk/aalborg/restaurant/hellas-food1" target="_blank" rel="noreferrer" className="text-[#38BDF8] hover:text-white transition font-bold tracking-widest uppercase">{t.footerDelivery}</a>
        </div>
      </footer>

      {/* MOBILE BAR */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0B1120]/90 backdrop-blur-xl border-t border-white/10 px-4 py-3 z-50 flex justify-between gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <a href="tel:+4542177754" className="flex-1 bg-white text-[#0B1120] text-center font-bold py-3 rounded-2xl flex justify-center items-center gap-2 active:scale-95 transition-transform">📞 {t.callNow}</a>
        <a href="https://wolt.com/da/dnk/aalborg/restaurant/hellas-food1" target="_blank" rel="noopener noreferrer" className="flex-1 bg-gradient-to-r from-[#009de0] to-[#007fb5] text-white text-center font-bold py-3 rounded-2xl flex justify-center items-center gap-2 active:scale-95 transition-transform">🛵 {t.orderWolt}</a>
      </div>
    </div>
  );
}
