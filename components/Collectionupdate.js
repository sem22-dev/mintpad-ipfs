import React, { useState } from 'react';

const ChangeCollectionDetails = ({ onUpdate }) => {
  const [newName, setNewName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');

  const handleUpdate = () => {
    if (newName && newSymbol) {
      onUpdate(newName, newSymbol);
      setNewName(''); 
      setNewSymbol(''); 
    } else {
      alert('Both fields must be filled.');
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3>Change Collection Details</h3>
      <label>
        Collection Name:
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ width: '100%', padding: '8px', color: 'black' }}
        />
      </label>
      <label>
        Collection Symbol:
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          style={{ width: '100%', padding: '8px', color: 'black' }}
        />
      </label>
      <button
        onClick={handleUpdate}
        style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', marginTop: '10px' }}
      >
        Update Collection
      </button>
    </div>
  );
};

export default ChangeCollectionDetails;
