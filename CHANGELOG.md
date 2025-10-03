# Radio Rundown Pro - Changelog

Alle belangrijke wijzigingen worden hier gedocumenteerd.

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
