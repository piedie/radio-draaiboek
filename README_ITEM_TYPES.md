# Radio Draaiboek - Custom Item Types

## Overzicht

De radio draaiboek app ondersteunt nu **custom item types per gebruiker**. Dit betekent dat elke gebruiker zijn eigen item types kan aanmaken, bewerken en beheren naast de standaard types.

## Nieuwe Functionaliteiten

### 1. Item Type Manager
- **Toegang**: Via het ⚙️ icoon bij "ITEMS TOEVOEGEN"
- **Functionaliteit**: 
  - Bekijk alle beschikbare item types (standaard + custom)
  - Maak nieuwe custom item types aan
  - Bewerk bestaande custom item types
  - Verwijder custom item types (soft delete)

### 2. Flexibele Quick-Add Knoppen
- Quick-add knoppen worden nu dynamisch gegenereerd op basis van gebruiker's item types
- Elke knop toont de kleur van het item type als linker border
- Maximaal 6 knoppen zichtbaar, daarna "Meer..." knop

### 3. Nieuwe Item Form (Experimenteel)
- **Toggle**: Via 📝/🆕 knop naast "Debug DB"
- Werkt met custom item types
- Toekomst-klaar voor custom fields per item type

## Database Structuur

### Nieuwe Tabellen

#### `user_item_types`
```sql
- id (PRIMARY KEY)
- user_id (UUID, FOREIGN KEY naar auth.users)
- name (VARCHAR, systeemnaam zoals 'sponsor', 'verkeer')
- display_name (VARCHAR, weergavenaam zoals 'Sponsor', 'Verkeer')
- color (VARCHAR, hex kleur)
- default_duration (INTEGER, seconden)
- custom_fields (JSONB, toekomstige uitbreiding)
- is_active (BOOLEAN)
- created_at, updated_at
```

#### `item_type_templates` (Toekomstige uitbreiding)
```sql
- id (PRIMARY KEY)
- user_item_type_id (FOREIGN KEY)
- name (VARCHAR, template naam)
- template_data (JSONB, vooringevulde data)
```

#### `items` (Uitgebreid)
```sql
- user_item_type_id (INTEGER, FOREIGN KEY naar user_item_types)
```

## Installatie & Migratie

### 1. Database Migratie
```bash
# Voer de SQL uit in je Supabase SQL editor:
cat database_migration.sql
```

### 2. Bestaande Data Migreren
```javascript
// In de browser console of via API:
import { migrateExistingItems } from './src/utils/itemTypeManager.js';
await migrateExistingItems(currentUserId);
```

## Gebruik

### Item Type Aanmaken
1. Klik op ⚙️ naast "ITEMS TOEVOEGEN"
2. Klik "Nieuw Type"
3. Vul in:
   - **Weergavenaam**: Hoe het type wordt getoond (bijv. "Sponsor")
   - **Systeemnaam**: Wordt automatisch gegenereerd (bijv. "sponsor")
   - **Kleur**: Hex kleur voor het type
   - **Standaard duur**: In seconden
4. Klik "Opslaan"

### Item Type Bewerken
1. Open Item Type Manager
2. Klik ✏️ naast een custom type
3. Wijzig gewenste velden
4. Klik "Opslaan"

### Item Type Verwijderen
1. Open Item Type Manager
2. Klik 🗑️ naast een custom type
3. Bevestig verwijdering

> **Let op**: Standaard types (muziek, presentatie, jingle, etc.) kunnen niet worden bewerkt of verwijderd.

## Standaard Item Types

De volgende types zijn altijd beschikbaar:
- **Muziek** (#ef4444, 180s)
- **Presentatie** (#22c55e, 120s)
- **Jingle** (#3b82f6, 30s)
- **Reportage** (#f59e0b, 180s)
- **Live** (#8b5cf6, 300s)
- **Spel** (#f59e0b, 240s)

## Toekomstige Uitbreidingen

### Custom Fields
- Elke item type kan zijn eigen velden definiëren
- Ondersteunde veld types:
  - `text`: Tekstveld
  - `textarea`: Tekst gebied
  - `select`: Dropdown met opties
  - `file_array`: Meerdere bestanden uploaden
  - `url`: URL veld
  - `number`: Numeriek veld

### Templates
- Vooringevulde sjablonen per item type
- Snelle creatie van vaak gebruikte items

### Import/Export
- Item types exporteren/importeren tussen gebruikers
- Backup functionaliteit

## API Functies

```javascript
// Laad alle item types voor gebruiker
const itemTypes = await loadUserItemTypes(userId);

// Maak nieuw item type
const newType = await createUserItemType(userId, {
  name: 'sponsor',
  display_name: 'Sponsor',
  color: '#ff6b6b',
  default_duration: 60
});

// Update item type
await updateUserItemType(typeId, updates);

// Verwijder item type
await deleteUserItemType(typeId);

// Valideer item type data
const errors = validateItemType(itemTypeData);
```

## Troubleshooting

### "Item type not found" error
- Controleer of het item type bestaat in `user_item_types`
- Voer migratie uit als nodig

### Knoppen laden niet
- Controleer of `userItemTypes` state gevuld is
- Vernieuw pagina of log opnieuw in

### Database errors
- Controleer of alle tabellen bestaan
- Voer database migratie opnieuw uit

## Contact

Voor vragen of problemen, check de browser console (F12) voor debug informatie.
