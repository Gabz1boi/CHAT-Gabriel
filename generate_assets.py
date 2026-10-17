import json, math, html, re, pathlib
root=pathlib.Path(__file__).parent
categories={
'Kriya':['Miniatur Rumah Bolon','Ukiran Gorga Singa-singa','Hiasan Dinding Gorga','Tas Anyaman Pandan','Keranjang Rotan Samosir','Kotak Perhiasan Kayu','Gantungan Kunci Gorga','Patung Kayu Sigale-gale','Bingkai Foto Gorga','Tatakan Gelas Anyaman','Lampu Meja Rotan','Miniatur Perahu Danau Toba','Topeng Kayu Batak','Kalung Manik Tradisional','Hiasan Pintu Ukir','Dompet Anyaman Pandan','Tempat Tisu Anyaman','Miniatur Gondang'],
'Fesyen':['Ulos Ragidup','Ulos Sadum','Ulos Ragi Hotang','Ulos Sibolang','Selendang Ulos Modern','Outer Tenun Kontemporer','Kemeja Aksen Ulos','Dress Motif Ulos','Pouch Tenun Batak','Tas Selempang Ulos','Scarf Tenun Etnik','Dasi Motif Ulos','Topi Bordir Gorga','Totebag Motif Batak','Dompet Tenun Ulos','Jaket Aksen Tenun','Gelang Kain Ulos','Rok Tenun Kontemporer'],
'Kuliner':['Mi Gomak Andaliman','Sambal Andaliman','Kopi Arabika Samosir','Bubuk Andaliman','Kacang Sihobuk','Keripik Pisang Lokal','Panggang Kopi Premium','Teh Rempah Toba','Cookies Andaliman','Kue Ombus-ombus','Boluk Pisang Panggang','Madu Hutan Samosir','Bumbu Arsik Racik','Sasagun Tradisional','Keripik Ubi Balado','Kue Lapet','Sirup Markisa','Paket Oleh-oleh Toba'],
'Musik':['Sulim Bambu','Hasapi Kayu','Taganing Mini','Sarune Bolon','Garantung Kayu','Ogung Miniatur','Paket Belajar Gondang','Suling Bambu Ukir','Kotak Alat Musik','Gendang Mini Batak','Aksesori Senar Hasapi','Album Gondang Digital','Lagu Tradisi Aransemen','Kelas Musik Tradisional','Workshop Sulim Pemula','Gondang Cendera Mata','Miniatur Instrumen Batak','Paket Audio Budaya'],
'Seni Pertunjukan':['Tari Tor-tor Edukasi','Pentas Sigale-gale','Workshop Gerak Tor-tor','Pertunjukan Gondang','Paket Pentas Budaya','Teater Legenda Toba','Pementasan Cerita Rakyat','Kelas Tari Komunitas','Pertunjukan Musik Akustik','Pentas Seni Pelajar','Paket MC Budaya','Pelatihan Tari Tradisional','Pertunjukan Kolaborasi','Sesi Storytelling Batak','Paket Pertunjukan Festival','Koreografi Kreasi Baru','Kelas Ekspresi Panggung','Pentas Mini Budaya'],
'Seni Rupa':['Lukisan Danau Toba','Ilustrasi Rumah Bolon','Poster Tipografi Horas','Lukisan Pusuk Buhit','Cetak Seni Gorga','Sketsa Kampung Ulos','Ilustrasi Tor-tor','Lukisan Perahu Toba','Kanvas Motif Tradisi','Poster Modern Batak','Seni Kolase Tenun','Ilustrasi Kopi Samosir','Karya Digital Lake Toba','Cetak Seni Panorama','Sketsa Hitam Putih','Lukisan Sunset Toba','Kaligrafi Aksara Batak','Paket Poster Budaya'],
'Fotografi':['Paket Foto Produk UMKM','Foto Portrait Kreator','Foto Wisata Danau Toba','Foto Editorial Ulos','Foto Dokumentasi Budaya','Foto Kuliner Lokal','Foto Katalog Kerajinan','Foto Aerial Panorama','Foto Acara Komunitas','Foto Arsitektur Batak','Foto Kegiatan Workshop','Foto Landscape Premium','Paket Konten Sosial Media','Foto Profil Usaha','Foto Destinasi Alam','Foto Pameran Kreatif','Foto Storytelling Lokal','Paket Foto Festival'],
'Aplikasi & Game':['Tur Virtual Samosir','Game Tebak Motif Ulos','Peta Digital Desa Wisata','Kuis Budaya Batak','AR Rumah Bolon','Website Profil UMKM','Katalog Digital Pengrajin','Audio Guide Wisata','Aplikasi Jadwal Festival','Game Puzzle Gorga','Generator Poster Ekraf','Media Belajar Aksara','Kartu Digital Budaya','Website Booking Workshop','Mini Game Danau Toba','Digital Storybook Batak','QR Museum Interaktif','Template Portofolio Kreator']}
areas=['Pangururan','Tomok','Simanindo','Ambarita','Harian','Onan Runggu','Palipi','Nainggolan','Sianjur Mula-mula','Ronggur Nihuta']
colors=[('#af3027','#eeded4'),('#313837','#f2e9df'),('#c28b44','#f6eee2'),('#6b4b6d','#f3e8f0'),('#4f7281','#eaf1ef'),('#92723f','#f6f0d9'),('#ad5950','#f7eae4'),('#567664','#e8f1e5')]
slugs={'Kriya':'kriya','Fesyen':'fesyen','Kuliner':'kuliner','Musik':'musik','Seni Pertunjukan':'seni-pertunjukan','Seni Rupa':'seni-rupa','Fotografi':'fotografi','Aplikasi & Game':'aplikasi-game'}
icons={'Kriya':'◇','Fesyen':'✺','Kuliner':'✦','Musik':'♫','Seni Pertunjukan':'❋','Seni Rupa':'✧','Fotografi':'◎','Aplikasi & Game':'⌘'}
# SVG vector artwork inspired by local design elements. Every output is a standalone image, locally bundled.
def svg_art(label, cat, idx, landscape=False):
    n=list(categories).index(cat)
    primary,bg=colors[(n+idx//5)%len(colors)]
    icon=icons[cat]
    rotate=(idx%6)*9-21
    diamonds=''.join(f'<path d="M {x} 48 l 16 15 -16 15 -16 -15 Z" fill="none" stroke="{primary}" opacity=".28" stroke-width="2"/>' for x in range(30,710,55))
    # Icon drawings differ across categories and items, with no implied exact product likeness.
    base=f'<circle cx="360" cy="279" r="185" fill="{primary}" opacity=".075"/><circle cx="360" cy="279" r="151" fill="none" stroke="{primary}" stroke-width="1.5" opacity=".23"/>'
    if cat=='Fesyen':
        motif=''.join(f'<path d="M{x} {y} l13 11 -13 11 -13 -11Z" fill="none" stroke="#fff" stroke-width="3" opacity=".65"/>' for x in range(272,460,38) for y in range(180,370,38) if (x+y+idx)%3!=1)
        illustration=f'<g transform="rotate({rotate} 360 280)"><rect x="253" y="121" width="214" height="335" rx="12" fill="{primary}"/><path d="M278 122 V456 M442 122 V456" stroke="#fff" stroke-width="11" opacity=".8"/><path d="M322 122V455 M400 122V455" stroke="#e6ba79" stroke-width="4"/>{motif}<path d="M263 432h195" stroke="#e6ba79" stroke-width="9"/></g>'
    elif cat=='Kriya':
        illustration=f'<g transform="rotate({rotate/3} 360 276)"><path d="M225 268 L359 135 L496 268 V434 H225Z" fill="{primary}"/><path d="M199 268 L359 125 L520 268" fill="none" stroke="#311e1b" stroke-width="25" stroke-linejoin="round"/><rect x="250" y="280" width="218" height="130" rx="4" fill="#fff4e5"/><path d="M272 318 Q359 255 448 318 Q359 385 272 318" fill="none" stroke="{primary}" stroke-width="16"/><path d="M359 281v126 M285 381H433" stroke="{primary}" stroke-width="12"/><path d="M254 430V470M467 430V470" stroke="#311e1b" stroke-width="16"/></g>'
    elif cat=='Kuliner':
        illustration=f'<ellipse cx="358" cy="392" rx="165" ry="49" fill="{primary}" opacity=".18"/><path d="M223 264 Q360 332 498 264L461 400Q358 444 260 400Z" fill="#fff" stroke="{primary}" stroke-width="13"/><ellipse cx="361" cy="269" rx="137" ry="44" fill="#e0a65a" stroke="{primary}" stroke-width="10"/><path d="M268 272 Q290 243 313 271T358 271T404 271T452 271" fill="none" stroke="#fff3bd" stroke-width="11"/><circle cx="319" cy="256" r="15" fill="#559074"/><circle cx="402" cy="253" r="18" fill="#b3261e"/><path d="M304 205q-25-35 2-67 M360 202q-23-30 4-71 M415 210q-26-34 5-65" stroke="{primary}" stroke-width="7" fill="none" opacity=".5"/>'
    elif cat=='Musik':
        illustration=f'<g transform="rotate({rotate/2} 360 275)"><path d="M371 112v265" stroke="#7a5033" stroke-width="37" stroke-linecap="round"/><ellipse cx="366" cy="335" rx="112" ry="119" fill="{primary}" stroke="#442b24" stroke-width="10"/><ellipse cx="366" cy="339" rx="77" ry="85" fill="#e6bd8c"/><path d="M340 113V408M392 113V408" stroke="#fff4df" stroke-width="3"/><circle cx="335" cy="151" r="9" fill="#b8892b"/><circle cx="405" cy="151" r="9" fill="#b8892b"/></g><text x="491" y="184" font-size="48" fill="{primary}" opacity=".56">♫</text>'
    elif cat=='Seni Pertunjukan':
        illustration=f'<path d="M190 376 Q360 470 530 376V425Q360 516 190 425Z" fill="{primary}"/><path d="M239 173Q359 116 480 173L452 362Q358 400 267 362Z" fill="{primary}"/><circle cx="360" cy="218" r="55" fill="#e7b783"/><path d="M288 334Q359 261 429 334" stroke="#fff5dd" stroke-width="35" fill="none"/><path d="M264 283L200 251M456 283L520 248" stroke="{primary}" stroke-width="19" stroke-linecap="round"/><path d="M230 410h260" stroke="#b8892b" stroke-width="7"/>'
    elif cat=='Seni Rupa':
        illustration=f'<g transform="rotate({rotate/3} 355 275)"><rect x="224" y="132" width="274" height="313" rx="5" fill="#4b3025"/><rect x="244" y="152" width="234" height="273" fill="#f7ebd9"/><circle cx="380" cy="246" r="41" fill="#dfad6a"/><path d="M252 356L320 249L366 323L423 231L470 338V417H252Z" fill="{primary}"/><path d="M252 384Q352 332 473 388V417H252Z" fill="#7c9b9f"/></g>'
    elif cat=='Fotografi':
        illustration=f'<rect x="214" y="203" width="293" height="218" rx="35" fill="{primary}"/><rect x="266" y="176" width="111" height="45" rx="10" fill="{primary}"/><circle cx="360" cy="305" r="89" fill="#f5eade" stroke="#fff" stroke-width="11"/><circle cx="360" cy="305" r="61" fill="{primary}"/><circle cx="360" cy="305" r="27" fill="#f5eade"/><rect x="445" y="235" width="40" height="16" rx="8" fill="#f3c77f"/>'
    else:
        illustration=f'<rect x="222" y="158" width="281" height="244" rx="25" fill="{primary}"/><rect x="244" y="181" width="237" height="198" rx="11" fill="#fff9f0"/><path d="M283 295l57-58 46 46 35-41" stroke="{primary}" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="303" cy="230" r="15" fill="#e7b982"/><path d="M267 413H459" stroke="{primary}" stroke-width="17" stroke-linecap="round"/><text x="351" y="355" text-anchor="middle" font-size="33" font-weight="bold" fill="{primary}">&lt;/&gt;</text>'
    words=html.escape(label)
    sub=html.escape(cat.upper())
    # svg includes subtle repeated stripe, illustration & product-specific title, great as fallback/local art
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 580" role="img" aria-label="Ilustrasi {words}"><defs><linearGradient id="b" x2="1" y2="1"><stop stop-color="{bg}"/><stop offset="1" stop-color="#fffdfb"/></linearGradient></defs><rect width="720" height="580" fill="url(#b)"/><path d="M0 0H720V10H0Z" fill="{primary}"/>{diamonds}{base}{illustration}<rect x="32" y="468" width="656" height="88" rx="14" fill="#fff" opacity=".93"/><text x="53" y="499" font-family="Arial,sans-serif" font-size="14" letter-spacing="3" font-weight="bold" fill="{primary}">{sub}</text><text x="53" y="532" font-family="Arial,sans-serif" font-size="25" font-weight="bold" fill="#211d1b">{words[:32]}</text><circle cx="646" cy="515" r="18" fill="{primary}"/><path d="M640 515h12m-6-6v12" stroke="#fff" stroke-width="2.5"/></svg>'''

data=[]
for cat, names in categories.items():
    for idx,name in enumerate(names):
        slug=slugs[cat]
        pid=f'{slug}-{idx+1:02}'
        path=f'/images/products/{pid}.svg'
        (root/'public'/path.lstrip('/')).write_text(svg_art(name,cat,idx),encoding='utf-8')
        base=39000 if cat in ('Kuliner','Aplikasi & Game') else 119000 if cat in ('Kriya','Fesyen','Seni Rupa') else 89000
        if cat=='Fotografi':base=185000
        if cat=='Seni Pertunjukan':base=295000
        if cat=='Musik':base=150000
        price=base+((idx*37+n if (n:=list(categories).index(cat)) is not None else idx)%14)*18000
        desc={
          'Kriya':'Karya kriya terinspirasi ukiran, tenun, dan keterampilan tradisional Batak Toba.',
          'Fesyen':'Rancangan fesyen yang mengeksplorasi warna dan inspirasi motif tekstil Batak.',
          'Kuliner':'Pilihan cita rasa khas kawasan Danau Toba dan olahan rempah lokal.',
          'Musik':'Instrumen, pembelajaran, dan karya audio yang terinspirasi musik Batak Toba.',
          'Seni Pertunjukan':'Pengalaman seni budaya dengan inspirasi cerita dan tradisi Batak Toba.',
          'Seni Rupa':'Karya visual yang mengangkat lanskap Samosir dan ragam budaya Batak.',
          'Fotografi':'Layanan dan karya visual untuk mendukung promosi ekonomi kreatif Samosir.',
          'Aplikasi & Game':'Konsep teknologi kreatif untuk pembelajaran, wisata, dan promosi UMKM.'}[cat]
        data.append(dict(id=pid,name=name,subsector=cat,price=price,stock=(idx*3+n*4)%35,location=areas[(idx+n*3)%len(areas)],craftsman=f'Mitra Contoh {areas[(idx+n)%len(areas)]}',description=desc,image=path,featured=(idx in [0,3,6,11]),published=True,createdAt=f'2026-10-{(idx%16)+1:02}T10:00:00.000Z',isDemo=True))
    (root/'public'/'images'/'categories'/f'{slugs[cat]}.svg').write_text(svg_art(cat+' • Samosir',cat,1),encoding='utf-8')
(root/'src'/'data'/'catalog.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'created {len(data)} products and {len(categories)} category illustrations')
