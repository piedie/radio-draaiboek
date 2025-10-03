// src/components/ItemTypeManager.jsx
// Component voor het beheren van custom item types per gebruiker

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import { 
  loadUserItemTypes, 
  createUserItemType, 
  updateUserItemType, 
  deleteUserItemType,
  validateItemType,
  generateUniqueTypeName,
  DEFAULT_ITEM_TYPES
} from '../utils/itemTypeManager';

const ItemTypeManager = ({ 
  currentUser, 
  theme, 
  onClose,
  onItemTypesChanged 
}) => {
  const [itemTypes, setItemTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    display_name: '',
    color: '#3b82f6',
    default_duration: 180,
    custom_fields: []
  });
  
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const t = theme === 'light' ? {
    bg: 'bg-gray-50', card: 'bg-white', text: 'text-gray-900', textSecondary: 'text-gray-600',
    border: 'border-gray-200', input: 'bg-white border-gray-300 text-gray-900',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    buttonDanger: 'bg-red-600 hover:bg-red-700 text-white'
  } : {
    bg: 'bg-gray-900', card: 'bg-gray-800', text: 'text-white', textSecondary: 'text-gray-400',
    border: 'border-gray-700', input: 'bg-gray-700 border-gray-600 text-white',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: 'bg-gray-600 hover:bg-gray-500 text-white',
    buttonDanger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  // Laad item types bij component mount
  useEffect(() => {
    loadItemTypes();
  }, [currentUser]);

  const loadItemTypes = async () => {
    try {
      setLoading(true);
      const types = await loadUserItemTypes(currentUser.id);
      setItemTypes(types);
    } catch (error) {
      console.error('Error loading item types:', error);
      alert('Fout bij laden van item types');
    } finally {
      setLoading(false);
    }
  };

  const startCreating = () => {
    setIsCreating(true);
    setEditingType(null);
    setForm({
      name: '',
      display_name: '',
      color: '#3b82f6',
      default_duration: 180,
      custom_fields: []
    });
    setErrors([]);
  };

  const startEditing = (itemType) => {
    if (!itemType.is_custom) {
      alert('Standaard item types kunnen niet worden bewerkt');
      return;
    }
    
    setEditingType(itemType);
    setIsCreating(false);
    setForm({
      name: itemType.name,
      display_name: itemType.display_name,
      color: itemType.color,
      default_duration: itemType.default_duration,
      custom_fields: itemType.custom_fields || []
    });
    setErrors([]);
  };

  const cancelEditing = () => {
    setEditingType(null);
    setIsCreating(false);
    setForm({
      name: '',
      display_name: '',
      color: '#3b82f6',
      default_duration: 180,
      custom_fields: []
    });
    setErrors([]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrors([]);

      // Validatie
      const validationErrors = validateItemType(form);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Check unieke naam (voor nieuwe types)
      if (isCreating) {
        const existingType = itemTypes.find(type => type.name === form.name);
        if (existingType) {
          setErrors(['Een item type met deze naam bestaat al']);
          return;
        }
      }

      if (isCreating) {
        // Maak nieuw item type
        await createUserItemType(currentUser.id, form);
      } else if (editingType) {
        // Update bestaand item type
        await updateUserItemType(editingType.id, form);
      }

      // Reload item types
      await loadItemTypes();
      
      // Notify parent component
      console.log('🔄 Notifying parent component about item types change');
      if (onItemTypesChanged) {
        onItemTypesChanged();
      }

      cancelEditing();
      console.log('✅ Item type saved and UI updated');
      
    } catch (error) {
      console.error('Error saving item type:', error);
      setErrors(['Fout bij opslaan: ' + error.message]);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemType) => {
    if (!itemType.is_custom) {
      alert('Standaard item types kunnen niet worden verwijderd');
      return;
    }

    if (!confirm(`Weet je zeker dat je "${itemType.display_name}" wilt verwijderen?`)) {
      return;
    }

    try {
      await deleteUserItemType(itemType.id);
      await loadItemTypes();
      
      if (onItemTypesChanged) {
        onItemTypesChanged();
      }
      
    } catch (error) {
      console.error('Error deleting item type:', error);
      alert('Fout bij verwijderen: ' + error.message);
    }
  };

  const generateNameFromDisplayName = (displayName) => {
    const baseName = displayName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return generateUniqueTypeName(itemTypes, baseName);
  };

  const handleDisplayNameChange = (value) => {
    setForm(prev => {
      const newForm = { ...prev, display_name: value };
      
      // Auto-generate name voor nieuwe types
      if (isCreating && value) {
        newForm.name = generateNameFromDisplayName(value);
      }
      
      return newForm;
    });
  };

  if (loading) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`}>
        <div className={`${t.card} p-8 rounded-lg`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={t.text}>Item types laden...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${t.card} w-full max-w-4xl h-5/6 rounded-lg flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${t.border}`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className={`p-2 rounded-lg ${t.buttonSecondary}`}
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className={`text-xl font-bold ${t.text}`}>
              Item Types Beheren
            </h2>
          </div>
          
          <button 
            onClick={startCreating}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${t.button}`}
            disabled={isCreating || editingType}
          >
            <Plus size={20} />
            Nieuw Type
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Item Types List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {itemTypes.map(itemType => (
                <div key={itemType.name} className={`p-4 rounded-lg border ${t.border} ${t.card}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: itemType.color }}
                      ></div>
                      
                      <div>
                        <h3 className={`font-medium ${t.text}`}>
                          {itemType.display_name}
                          {!itemType.is_custom && (
                            <span className={`ml-2 text-sm ${t.textSecondary}`}>
                              (standaard)
                            </span>
                          )}
                        </h3>
                        <p className={`text-sm ${t.textSecondary}`}>
                          {itemType.name} • {Math.floor(itemType.default_duration / 60)}:{(itemType.default_duration % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                    
                    {itemType.is_custom && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => startEditing(itemType)}
                          className={`p-2 rounded ${t.buttonSecondary}`}
                          disabled={isCreating || editingType}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(itemType)}
                          className={`p-2 rounded ${t.buttonDanger}`}
                          disabled={isCreating || editingType}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Custom fields preview */}
                  {itemType.custom_fields && itemType.custom_fields.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className={`text-sm ${t.textSecondary} mb-2`}>Custom velden:</p>
                      <div className="flex flex-wrap gap-2">
                        {itemType.custom_fields.map((field, index) => (
                          <span 
                            key={index}
                            className={`px-2 py-1 text-xs rounded ${t.buttonSecondary}`}
                          >
                            {field.label} ({field.type})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Edit Form */}
          {(isCreating || editingType) && (
            <div className={`w-1/2 border-l ${t.border} p-6 overflow-y-auto`}>
              <div className="space-y-4">
                <h3 className={`text-lg font-medium ${t.text}`}>
                  {isCreating ? 'Nieuw Item Type' : 'Item Type Bewerken'}
                </h3>

                {/* Errors */}
                {errors.length > 0 && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <ul className="list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weergavenaam */}
                <div>
                  <label className={`block text-sm mb-1 ${t.text}`}>Weergavenaam</label>
                  <input 
                    type="text" 
                    value={form.display_name}
                    onChange={(e) => handleDisplayNameChange(e.target.value)}
                    placeholder="bijv. Sponsor, Weerbericht, Verkeer"
                    className={`w-full px-3 py-2 rounded border ${t.input}`} 
                  />
                </div>

                {/* Naam (system name) */}
                <div>
                  <label className={`block text-sm mb-1 ${t.text}`}>
                    Systeemnaam
                    <span className={`text-xs ${t.textSecondary} ml-2`}>
                      (alleen kleine letters en underscores)
                    </span>
                  </label>
                  <input 
                    type="text" 
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    placeholder="bijv. sponsor, weerbericht, verkeer"
                    className={`w-full px-3 py-2 rounded border ${t.input}`}
                    disabled={!isCreating} // Naam mag niet worden gewijzigd na creatie
                  />
                </div>

                {/* Kleur */}
                <div>
                  <label className={`block text-sm mb-1 ${t.text}`}>Kleur</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={form.color}
                      onChange={(e) => setForm({...form, color: e.target.value})}
                      className="w-12 h-10 rounded border border-gray-300" 
                    />
                    <input 
                      type="text" 
                      value={form.color}
                      onChange={(e) => setForm({...form, color: e.target.value})}
                      placeholder="#3b82f6"
                      className={`flex-1 px-3 py-2 rounded border ${t.input}`} 
                    />
                  </div>
                </div>

                {/* Standaard duur */}
                <div>
                  <label className={`block text-sm mb-1 ${t.text}`}>Standaard duur (seconden)</label>
                  <input 
                    type="number" 
                    value={form.default_duration}
                    onChange={(e) => setForm({...form, default_duration: parseInt(e.target.value) || 0})}
                    min="1"
                    className={`w-full px-3 py-2 rounded border ${t.input}`} 
                  />
                </div>

                {/* TODO: Custom fields editor hier toevoegen in toekomst */}
                <div className={`p-4 rounded border ${t.border} bg-gray-50 dark:bg-gray-700`}>
                  <p className={`text-sm ${t.textSecondary}`}>
                    <strong>Custom velden:</strong> Deze functie wordt binnenkort toegevoegd. 
                    Voor nu worden de standaard velden gebruikt (titel, artiest, notities, etc.)
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-4">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-4 py-2 rounded ${t.button}`}
                  >
                    <Save size={16} />
                    {saving ? 'Opslaan...' : 'Opslaan'}
                  </button>
                  
                  <button 
                    onClick={cancelEditing}
                    disabled={saving}
                    className={`flex items-center gap-2 px-4 py-2 rounded ${t.buttonSecondary}`}
                  >
                    <X size={16} />
                    Annuleren
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemTypeManager;
