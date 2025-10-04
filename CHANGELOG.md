# Radio Rundown Pro - Changelog

Alle belangrijke wijzigingen worden hier gedocumenteerd.

## [3.1.0] - 2025-10-05

### ✨ Toegevoegd
- **📺 Live Radio Dashboard (3-kolommen)**
  - Uitgebreide Live blok met verkeer, tijd en nieuws
  - **Links**: Nederlandse verkeersinformatie (km file totaal)
  - **Midden**: Live atoomtijd (behouden van v3.0)
  - **Rechts**: Top 3 nieuws headlines van Nu.nl
  - RSS2JSON API integratie voor Nu.nl nieuwsfeeds
  - Auto-refresh elke 5 minuten voor actuele data
  - Responsive 3-kolommen grid layout
  - Loading states en graceful fallbacks

### 🔧 Verbeterd
- Live dashboard vervangt eenvoudige tijdweergave
- Geoptimaliseerde data-refresh cycles
- Betere spacing en visuele hiërarchie
- Professional radio-studio dashboard uitstraling

### 🎨 UI Verbeteringen
- Logo toegevoegd aan inlogpagina (96x96px)
- Gecentreerde logo positionering
- Betere branding en professionele uitstraling

---

## [3.0.0] - 2025-10-04

### ✨ Toegevoegd
- **🔴 Live Atoomtijd Functionaliteit**
  - Nieuwe "Live" knop in hoofdmenu met groene styling
  - Realtime atoomtijd via WorldTimeAPI (Nederlandse tijd)
  - Grote, duidelijke digitale klok-weergave (23:12:11 formaat)
  - NTP offset berekening voor nauwkeurige tijdsynchronisatie
  - Intelligente layout: boven klok of boven rundown (bij verborgen klok)
  - Compacte hoogte (~80px) om layout niet te verstoren
  - Monospace lettertype voor professionele uitstraling

### 🔧 Verbeterd
- **Klok Labels Zichtbaarheid**
  - SVG grootte vergroot van 320x320px naar 380x380px
  - Klok centrum aangepast voor betere label-positionering
  - Tijd-labels (0, 15, 30, 45) nu altijd zichtbaar binnen viewport
  - Label-afstand geoptimaliseerd voor betere leesbaarheid

### 🎨 UI Verbeteringen
- Datum format gewijzigd naar DD-MM-YYYY (Nederlandse standaard)
- Hoofdletter consistentie doorgeheel de app:
  - "Mijn draaiboeken" (was: "Mijn Draaiboeken")
  - "Download alle" (was: "Download Alle")
  - "Verberg klok" / "Toon klok" (was: hoofdletters)
  - "Externe klok" (was: "Externe Klok")
  - "Zoek met Spotify" (was: "Spotify Zoeken")

---

## [2.9.0] - 2025-10-04

### ✨ Toegevoegd
- **Bulk Export Functionaliteit**
  - "Download Alle" knop in draaiboek overzicht
  - Alle draaiboeken als aparte TXT-bestanden downloaden
  - Volledige export met alle item details (eerste woorden, hoofdtekst, laatste woorden)
  - Spotify ID's, audio URL's en scoreboard informatie
  - Veilige bestandsnamen met datum

### 🔧 Verbeterd
- **Externe Klok Synchronisatie**
  - Items worden nu altijd meegestuurd tijdens timer updates
  - Verbeterde update-frequentie voor rundown items in externe klok
  - Betere detectie van item-wijzigingen
  - Artist-veld toegevoegd aan sync data
  - Debug logging toegevoegd voor troubleshooting

### 🐛 Opgelost
- Taartpunten en rundown items waren niet zichtbaar in externe clock.html tijdens afspelen
- Items synchronisatie tijdens klok-timing verbeterd

---

## [2.1.0] - 2025-10-04

### ✨ Toegevoegd
- **Custom Item Types per gebruiker**
  - Database structuur voor user_item_types
  - Item Type Manager UI component (⚙️ knop)
  - Dynamische quick-add knoppen op basis van user types
  - Flexibele item type configuratie met kleuren en standaard duur
- **Professionele footer**
  - Copyright Landstede MBO
  - Versienummer display (v2.1)
  - Build datum (2025-10-04)
  - Responsive design voor mobiel en desktop
- **Nieuwe Item Form (experimenteel)**
  - Toggle tussen oude en nieuwe form (📝/🆕 knop)
  - Toekomst-klaar voor custom fields
  - Werkt met alle item types

### 🔧 Verbeterd
- Database migratie systeem voor toekomstige updates
- Fallback systeem voor backward compatibility
- Betere error handling voor ontbrekende database kolommen
- Debug logging voor item type functionaliteit

### 🐛 Bug fixes
- Spotify preview URL kolom toegevoegd aan database
- user_item_type_id kolom support in items tabel
- Verbeterde foutmelding bij ontbrekende database migraties

---

## [1.2.0] - 2025-10-03

### Toegevoegd
- Multi-user login systeem
- Meerdere draaiboeken per gebruiker
- Klok visualisatie met kleuren
- Spotify API integratie
- Print functie (TXT export)
- Live items met verbindingsopties (LUCI, Teams, WZ, Telefoon)
- Eerste Woorden en Laatste Woorden velden
- Drag & drop voor items herschikken
- Custom kleuren per item
- Light/Dark mode toggle
- Items uitklappen voor volledige scripts
- Jingles dropdown menu
- Spel item type
- Instellingen voor gebruiker en Spotify credentials

### Te doen
- Real-time samenwerking tussen gebruikers
- PDF/DOCX directe export
- Spotify playlist import
- Template draaiboeken
- Gebruikers rechten beheer
- Notificaties voor presentatoren
- Mobiele app versie
