import React, { useState } from 'react';

const defaultTypes = [
  { name: 'Interview', color: '#22c55e', duration: 300, type: 'talk' },
  { name: 'Eigen Jingle', color: '#3b82f6', duration: 10, type: 'jingle' },
];

const ItemTypesSettings = ({ itemTypes, setItemTypes, t }) => {
  const [form, setForm] = useState({ name: '', color: '#ef4444', duration: 60, type: 'music' });

  const addType = () => {
    if (!form.name) return;
    setItemTypes([...itemTypes, { ...form }]);
    setForm({ name: '', color: '#ef4444', duration: 60, type: 'music' });
  };

  const removeType = (idx) => {
    setItemTypes(itemTypes.filter((_, i) => i !== idx));
  };

  // Fix: check of itemTypes een array is, anders default leeg array
  const safeItemTypes = Array.isArray(itemTypes) ? itemTypes : [];

  return (
    <div className={t.card + ' rounded-lg p-6 shadow border ' + t.border}>
      <h2 className={'text-xl font-semibold mb-4 ' + t.text}>Eigen Item Types</h2>
      <div className="mb-4">
        <input type="text" placeholder="Naam" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={'px-3 py-2 rounded border mr-2 ' + t.input} />
        <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="mr-2" />
        <input type="number" min={1} value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 1 })} className={'px-2 py-2 rounded border mr-2 w-20 ' + t.input} />
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={'px-2 py-2 rounded border mr-2 ' + t.input}>
          <option value="music">Muziek</option>
          <option value="talk">Presentatie</option>
          <option value="jingle">Jingle</option>
          <option value="reportage">Reportage</option>
          <option value="live">Live</option>
          <option value="game">Spel</option>
        </select>
        <button onClick={addType} className={t.button + ' px-4 py-2 rounded'}>Toevoegen</button>
      </div>
      <ul>
        {safeItemTypes.map((type, idx) => (
          <li key={idx} className="flex items-center gap-2 mb-2">
            <span style={{ background: type.color, width: 20, height: 20, display: 'inline-block', borderRadius: 4 }}></span>
            <span className={t.text}>{type.name}</span>
            <span className="text-xs">({type.type}, {type.duration}s)</span>
            <button onClick={() => removeType(idx)} className={t.buttonSecondary + ' px-2 py-1 rounded'}>Verwijder</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ItemTypesSettings;
