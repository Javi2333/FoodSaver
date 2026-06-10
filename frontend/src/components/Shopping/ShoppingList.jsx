import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, Check, X, Package, AlertTriangle } from 'lucide-react';
import { getAllItems, addItems, toggleItem, deleteItem, clearChecked } from '../../services/shoppingService';
import { createProduct, getBelowMinimum, restockProduct } from '../../services/productService';
import { cacheGet, cacheSet } from '../../services/cache';
import './ShoppingList.css';

const UNITS = ['unidades', 'kg', 'g', 'L', 'ml'];
const CATEGORIES = ['Lácteos', 'Carnes', 'Pescados', 'Frutas', 'Legumbres', 'Salsas', 'Verduras', 'Tubérculos', 'Embutidos', 'Congelados', 'Bebidas', 'Otros'];
const LOCATIONS = ['despensa', 'nevera', 'congelador'];

const ShoppingList = () => {
  const [items, setItems]       = useState(() => cacheGet('shopping') ?? []);
  const [loading, setLoading]   = useState(!cacheGet('shopping'));
  const [error, setError]       = useState('');

  // Formulario añadir
  const [newName, setNewName]   = useState('');
  const [newQty, setNewQty]     = useState('');
  const [newUnit, setNewUnit]   = useState('unidades');
  const [adding, setAdding]     = useState(false);

  const [addingMinimums, setAddingMinimums] = useState(false);

  // Modal añadir a despensa
  const [pantryModal, setPantryModal] = useState(null); // item object or null
  const [pantryForm, setPantryForm]   = useState({});
  const [pantryLoading, setPantryLoading] = useState(false);
  const [pantrySuccess, setPantrySuccess] = useState(false);

  const load = () => {
    getAllItems()
      .then(res => {
        const data = res.data?.data?.items ?? [];
        setItems(data);
        cacheSet('shopping', data);
      })
      .catch(() => setError('Error al cargar la lista'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await addItems({ name: newName.trim(), quantity: newQty || null, unit: newUnit });
      setNewName('');
      setNewQty('');
      setNewUnit('unidades');
      load();
    } catch {
      setError('Error al añadir el ítem');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleItem(id);
      setItems(prev => {
        const updated = prev.map(it => it.id === id ? { ...it, checked: !it.checked } : it);
        cacheSet('shopping', updated);
        return updated;
      });
    } catch {
      setError('Error al actualizar');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteItem(id);
      setItems(prev => {
        const updated = prev.filter(it => it.id !== id);
        cacheSet('shopping', updated);
        return updated;
      });
    } catch {
      setError('Error al eliminar');
    }
  };

  const handleAddBelowMinimum = async () => {
    setAddingMinimums(true);
    try {
      const res = await getBelowMinimum();
      const products = res.data?.products ?? [];
      if (products.length === 0) {
        alert('No hay productos por debajo del stock mínimo.');
        return;
      }
      const newItems = products.map(p => ({
        name: p.name,
        quantity: parseFloat((parseFloat(p.min_quantity) - parseFloat(p.quantity)).toFixed(2)),
        unit: p.unit,
        product_id: p.id,
      }));
      await addItems(newItems);
      load();
    } catch {
      setError('Error al añadir productos bajo mínimos');
    } finally {
      setAddingMinimums(false);
    }
  };

  const handleClearChecked = async () => {
    try {
      await clearChecked();
      setItems(prev => prev.filter(it => !it.checked));
    } catch {
      setError('Error al limpiar');
    }
  };

  const openPantryModal = (item) => {
    setPantrySuccess(false);
    setPantryForm({
      name: item.name,
      quantity: item.quantity || '',
      unit: item.unit || 'unidades',
      category: '',
      expiration_date: '',
      location: '',
    });
    setPantryModal(item);
  };

  // Reposición: el ítem estaba vinculado a un producto existente → sumar cantidad
  const handleRestock = async (e) => {
    e.preventDefault();
    if (!pantryForm.quantity) return;
    setPantryLoading(true);
    try {
      await restockProduct(pantryModal.product_id, {
        quantity_to_add: parseFloat(pantryForm.quantity),
        expiration_date: pantryForm.expiration_date || undefined,
      });
      await deleteItem(pantryModal.id);
      setItems(prev => prev.filter(it => it.id !== pantryModal.id));
      setPantrySuccess(true);
      setTimeout(() => setPantryModal(null), 1200);
    } catch {
      setError('Error al reponer stock');
    } finally {
      setPantryLoading(false);
    }
  };

  // Producto nuevo: el ítem se añadió manualmente → crear producto
  const handleAddToPantry = async (e) => {
    e.preventDefault();
    if (!pantryForm.category || !pantryForm.expiration_date || !pantryForm.quantity) return;
    setPantryLoading(true);
    try {
      await createProduct({
        name: pantryForm.name,
        quantity: parseFloat(pantryForm.quantity),
        unit: pantryForm.unit,
        category: pantryForm.category,
        expiration_date: pantryForm.expiration_date,
        location: pantryForm.location || undefined,
      });
      await deleteItem(pantryModal.id);
      setItems(prev => prev.filter(it => it.id !== pantryModal.id));
      setPantrySuccess(true);
      setTimeout(() => setPantryModal(null), 1200);
    } catch {
      setError('Error al añadir a despensa');
    } finally {
      setPantryLoading(false);
    }
  };

  const pending  = items.filter(it => !it.checked);
  const checked  = items.filter(it =>  it.checked);
  const hasChecked = checked.length > 0;

  return (
    <div className="mobile-container shopping-page">
      <div className="list-header">
        <h1><ShoppingCart size={22} /> Lista de la compra</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Botón añadir productos bajo mínimos */}
      <button
        className="btn-below-minimum"
        onClick={handleAddBelowMinimum}
        disabled={addingMinimums}
      >
        <AlertTriangle size={16} />
        {addingMinimums ? 'Añadiendo…' : 'Añadir bajo mínimos'}
      </button>

      {/* Formulario añadir */}
      <form className="shopping-add-form" onSubmit={handleAdd}>
        <input
          className="shopping-input"
          type="text"
          placeholder="Añadir producto…"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          maxLength={150}
        />
        <div className="shopping-add-row">
          <input
            className="shopping-input qty-input"
            type="number"
            placeholder="Cant."
            min="0.01"
            step="any"
            value={newQty}
            onChange={e => setNewQty(e.target.value)}
          />
          <select
            className="shopping-select"
            value={newUnit}
            onChange={e => setNewUnit(e.target.value)}
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <button className="btn-add-item" type="submit" disabled={adding || !newName.trim()}>
            <Plus size={18} />
          </button>
        </div>
      </form>

      {loading ? (
        <div className="loading">Cargando lista…</div>
      ) : (
        <>
          {/* Ítems pendientes */}
          {pending.length === 0 && checked.length === 0 && (
            <div className="shopping-empty">
              <ShoppingCart size={48} className="empty-icon" />
              <p>Tu lista está vacía.</p>
              <p className="empty-hint">Añade productos arriba o usa el botón en las recetas.</p>
            </div>
          )}

          <ul className="shopping-list">
            {pending.map(item => (
              <ShoppingRow
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </ul>

          {/* Ítems marcados */}
          {hasChecked && (
            <>
              <div className="checked-header">
                <span>Comprados ({checked.length})</span>
                <button className="btn-clear-checked" onClick={handleClearChecked}>
                  <Trash2 size={14} /> Limpiar
                </button>
              </div>
              <ul className="shopping-list checked-section">
                {checked.map(item => (
                  <ShoppingRow
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onAddToPantry={openPantryModal}
                  />
                ))}
              </ul>
            </>
          )}

          {/* Modal añadir a despensa */}
          {pantryModal && (
            <div className="modal-overlay" onClick={() => setPantryModal(null)}>
              <div className="pantry-modal" onClick={e => e.stopPropagation()}>
                {pantrySuccess ? (
                  <div className="pantry-success">
                    <Package size={32} />
                    <p>{pantryModal.product_id ? '¡Stock repuesto!' : '¡Añadido a la despensa!'}</p>
                  </div>
                ) : pantryModal.product_id ? (
                  /* Reposición: ítem vinculado a producto existente */
                  <>
                    <div className="pantry-modal-header">
                      <Package size={20} />
                      <h3>Reponer stock</h3>
                      <button className="pantry-modal-close" onClick={() => setPantryModal(null)}><X size={18} /></button>
                    </div>
                    <form className="pantry-modal-form" onSubmit={handleRestock}>
                      <p style={{ margin: '0 0 0.75rem', color: '#555', fontSize: '0.9em' }}>
                        Se sumará al inventario existente de <strong>{pantryModal.name}</strong>.
                      </p>
                      <div className="pantry-row">
                        <label>Cantidad a añadir *
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={pantryForm.quantity}
                            onChange={e => setPantryForm(f => ({ ...f, quantity: e.target.value }))}
                            required
                          />
                        </label>
                        <label>Unidad
                          <input type="text" value={pantryForm.unit} readOnly style={{ background: '#f5f5f5', cursor: 'default' }} />
                        </label>
                      </div>
                      <label>Nueva caducidad <span style={{ color: '#888', fontWeight: 400 }}>(opcional)</span>
                        <input
                          type="date"
                          value={pantryForm.expiration_date}
                          onChange={e => setPantryForm(f => ({ ...f, expiration_date: e.target.value }))}
                        />
                      </label>
                      <button className="btn-pantry-submit" type="submit" disabled={pantryLoading}>
                        {pantryLoading ? 'Reponiendo…' : 'Reponer stock'}
                      </button>
                    </form>
                  </>
                ) : (
                  /* Producto nuevo: ítem manual → crear en despensa */
                  <>
                    <div className="pantry-modal-header">
                      <Package size={20} />
                      <h3>Añadir a despensa</h3>
                      <button className="pantry-modal-close" onClick={() => setPantryModal(null)}><X size={18} /></button>
                    </div>
                    <form className="pantry-modal-form" onSubmit={handleAddToPantry}>
                      <label>Nombre
                        <input
                          type="text"
                          value={pantryForm.name}
                          onChange={e => setPantryForm(f => ({ ...f, name: e.target.value }))}
                          required
                        />
                      </label>
                      <div className="pantry-row">
                        <label>Cantidad
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={pantryForm.quantity}
                            onChange={e => setPantryForm(f => ({ ...f, quantity: e.target.value }))}
                            required
                          />
                        </label>
                        <label>Unidad
                          <select
                            value={pantryForm.unit}
                            onChange={e => setPantryForm(f => ({ ...f, unit: e.target.value }))}
                          >
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </label>
                      </div>
                      <label>Categoría *
                        <select
                          value={pantryForm.category}
                          onChange={e => setPantryForm(f => ({ ...f, category: e.target.value }))}
                          required
                        >
                          <option value="">Selecciona…</option>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </label>
                      <label>Fecha de caducidad *
                        <input
                          type="date"
                          value={pantryForm.expiration_date}
                          onChange={e => setPantryForm(f => ({ ...f, expiration_date: e.target.value }))}
                          required
                        />
                      </label>
                      <label>Ubicación
                        <select
                          value={pantryForm.location}
                          onChange={e => setPantryForm(f => ({ ...f, location: e.target.value }))}
                        >
                          <option value="">Sin especificar</option>
                          {LOCATIONS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                        </select>
                      </label>
                      <button className="btn-pantry-submit" type="submit" disabled={pantryLoading}>
                        {pantryLoading ? 'Añadiendo…' : 'Añadir a despensa'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ShoppingRow = ({ item, onToggle, onDelete, onAddToPantry }) => (
  <li className={`shopping-item ${item.checked ? 'item-checked' : ''}`}>
    <button
      className={`item-check ${item.checked ? 'checked' : ''}`}
      onClick={() => onToggle(item.id)}
      aria-label={item.checked ? 'Desmarcar' : 'Marcar como comprado'}
    >
      {item.checked ? <Check size={16} /> : null}
    </button>
    <span className="item-name">{item.name}</span>
    {item.quantity && (
      <span className="item-qty">{Number(item.quantity)} {item.unit}</span>
    )}
    {item.checked && onAddToPantry && (
      <button
        className="item-add-pantry"
        onClick={() => onAddToPantry(item)}
        aria-label="Añadir a despensa"
        title="Añadir a despensa"
      >
        <Package size={15} />
      </button>
    )}
    <button
      className="item-delete"
      onClick={() => onDelete(item.id)}
      aria-label="Eliminar"
    >
      <X size={16} />
    </button>
  </li>
);

export default ShoppingList;
