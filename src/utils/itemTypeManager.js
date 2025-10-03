// src/utils/itemTypeManager.js
// Utility functies voor het beheren van custom item types per gebruiker

import { supabase } from '../supabaseClient';

/**
 * Standaard item types die altijd beschikbaar zijn
 */
export const DEFAULT_ITEM_TYPES = [
  {
    name: 'music',
    display_name: 'Muziek',
    color: '#ef4444',
    default_duration: 180,
    custom_fields: [
      { name: 'artist', type: 'text', label: 'Artiest', required: false },
      { name: 'spotify_preview_url', type: 'url', label: 'Spotify Preview', required: false }
    ]
  },
  {
    name: 'talk',
    display_name: 'Presentatie',
    color: '#22c55e',
    default_duration: 120,
    custom_fields: [
      { name: 'first_words', type: 'textarea', label: 'Eerste woorden', required: false },
      { name: 'last_words', type: 'textarea', label: 'Laatste woorden', required: false }
    ]
  },
  {
    name: 'jingle',
    display_name: 'Jingle',
    color: '#3b82f6',
    default_duration: 30,
    custom_fields: []
  },
  {
    name: 'reportage',
    display_name: 'Reportage',
    color: '#f59e0b',
    default_duration: 180,
    custom_fields: [
      { name: 'first_words', type: 'textarea', label: 'Eerste woorden', required: false },
      { name: 'last_words', type: 'textarea', label: 'Laatste woorden', required: false }
    ]
  },
  {
    name: 'live',
    display_name: 'Live',
    color: '#8b5cf6',
    default_duration: 300,
    custom_fields: [
      { name: 'connection_type', type: 'select', label: 'Verbinding type', 
        options: ['Telefoon', 'Skype', 'Teams', 'Zoom', 'Studio'], required: false },
      { name: 'phone_number', type: 'text', label: 'Telefoonnummer', required: false }
    ]
  },
  {
    name: 'game',
    display_name: 'Spel',
    color: '#f59e0b',
    default_duration: 240,
    custom_fields: [
      { name: 'audio_files', type: 'file_array', label: 'Geluidseffectjes', 
        accept: 'audio/*', max_files: 4, required: false }
    ]
  }
];

/**
 * Laad alle item types voor een gebruiker (standaard + custom)
 */
export const loadUserItemTypes = async (userId) => {
  try {
    console.log('🔄 Loading item types for user:', userId);
    
    // Laad custom item types van gebruiker
    const { data: customTypes, error } = await supabase
      .from('user_item_types')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('display_name');
    
    if (error) {
      console.error('❌ Error loading custom item types:', error);
      throw error;
    }
    
    // Converteer custom types naar juiste format
    const formattedCustomTypes = (customTypes || []).map(type => ({
      id: type.id,
      name: type.name,
      display_name: type.display_name,
      color: type.color,
      default_duration: type.default_duration,
      custom_fields: type.custom_fields || [],
      is_custom: true
    }));
    
    console.log('🔄 Found custom types:', formattedCustomTypes);
    
    // Combineer standaard types met custom types
    const allTypes = [
      ...DEFAULT_ITEM_TYPES.map(type => ({ ...type, is_custom: false })),
      ...formattedCustomTypes
    ];
    
    console.log('✅ Loaded item types:', allTypes);
    return allTypes;
    
  } catch (error) {
    console.error('❌ Error in loadUserItemTypes:', error);
    throw error;
  }
};

/**
 * Maak een nieuw custom item type
 */
export const createUserItemType = async (userId, itemType) => {
  try {
    console.log('🔄 Creating custom item type:', itemType);
    
    const { data, error } = await supabase
      .from('user_item_types')
      .insert({
        user_id: userId,
        name: itemType.name,
        display_name: itemType.display_name,
        color: itemType.color,
        default_duration: itemType.default_duration,
        custom_fields: itemType.custom_fields || []
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating item type:', error);
      throw error;
    }
    
    console.log('✅ Created item type:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error in createUserItemType:', error);
    throw error;
  }
};

/**
 * Update een custom item type
 */
export const updateUserItemType = async (itemTypeId, updates) => {
  try {
    console.log('🔄 Updating item type:', itemTypeId, updates);
    
    const { data, error } = await supabase
      .from('user_item_types')
      .update({
        display_name: updates.display_name,
        color: updates.color,
        default_duration: updates.default_duration,
        custom_fields: updates.custom_fields,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemTypeId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error updating item type:', error);
      throw error;
    }
    
    console.log('✅ Updated item type:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error in updateUserItemType:', error);
    throw error;
  }
};

/**
 * Verwijder een custom item type (soft delete door is_active = false)
 */
export const deleteUserItemType = async (itemTypeId) => {
  try {
    console.log('🔄 Deleting item type:', itemTypeId);
    
    const { error } = await supabase
      .from('user_item_types')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemTypeId);
    
    if (error) {
      console.error('❌ Error deleting item type:', error);
      throw error;
    }
    
    console.log('✅ Deleted item type:', itemTypeId);
    
  } catch (error) {
    console.error('❌ Error in deleteUserItemType:', error);
    throw error;
  }
};

/**
 * Zoek een item type op naam
 */
export const getItemTypeByName = (itemTypes, typeName) => {
  return itemTypes.find(type => type.name === typeName);
};

/**
 * Genereer een unieke naam voor een nieuw item type
 */
export const generateUniqueTypeName = (itemTypes, baseName) => {
  let counter = 1;
  let newName = baseName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  while (itemTypes.some(type => type.name === newName)) {
    newName = `${baseName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${counter}`;
    counter++;
  }
  
  return newName;
};

/**
 * Valideer item type data
 */
export const validateItemType = (itemType) => {
  const errors = [];
  
  if (!itemType.name || itemType.name.length < 2) {
    errors.push('Naam moet minimaal 2 tekens lang zijn');
  }
  
  if (!/^[a-z_]+$/.test(itemType.name)) {
    errors.push('Naam mag alleen kleine letters en underscores bevatten');
  }
  
  if (!itemType.display_name || itemType.display_name.length < 2) {
    errors.push('Weergavenaam moet minimaal 2 tekens lang zijn');
  }
  
  if (!itemType.color || !/^#[0-9a-fA-F]{6}$/.test(itemType.color)) {
    errors.push('Kleur moet een geldige hex-waarde zijn (#RRGGBB)');
  }
  
  if (!itemType.default_duration || itemType.default_duration <= 0) {
    errors.push('Standaard duur moet groter dan 0 zijn');
  }
  
  return errors;
};

/**
 * Migratie: Converteer bestaande items naar nieuwe structuur
 * Deze functie koppelt bestaande items aan de juiste user_item_types
 */
export const migrateExistingItems = async (userId) => {
  try {
    console.log('🔄 Migrating existing items for user:', userId);
    
    // Laad alle user item types
    const itemTypes = await loadUserItemTypes(userId);
    
    // Laad alle items van gebruiker die nog geen user_item_type_id hebben
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, type')
      .eq('user_id', userId)
      .is('user_item_type_id', null);
    
    if (itemsError) {
      console.error('❌ Error loading items for migration:', itemsError);
      throw itemsError;
    }
    
    console.log(`🔄 Found ${items?.length || 0} items to migrate`);
    
    // Update items met de juiste user_item_type_id
    for (const item of items || []) {
      const itemType = getItemTypeByName(itemTypes, item.type);
      
      if (itemType && itemType.id) {
        const { error: updateError } = await supabase
          .from('items')
          .update({ user_item_type_id: itemType.id })
          .eq('id', item.id);
        
        if (updateError) {
          console.error('❌ Error updating item:', item.id, updateError);
        } else {
          console.log('✅ Migrated item:', item.id, 'to type:', itemType.name);
        }
      }
    }
    
    console.log('✅ Migration completed');
    
  } catch (error) {
    console.error('❌ Error in migrateExistingItems:', error);
    throw error;
  }
};
