import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, markProductStatus, updateProduct } from '../../services/productService';
import { ArrowLeft, Beef, Droplets, Package, Snowflake, Minus } from 'lucide-react';
import './ProductDetail.css';

const UNITS = {
  solid:  ['g', 'kg'],
  liquid: ['ml', 'L'],
  unit:   ['unidades'],
};

const CATEGORIES = ['Lácteos', 'Carnes', 'Pescados', 'Frutas', 'Legumbres', 'Salsas', 'Verduras', 'Tubérculos', 'Embutidos', 'Congelados', 'Bebidas', 'Otros'];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [productType, setProductType] = useState('solid');
  const [unit, setUnit] = useState('g');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    expiration_date: '',
    quantity: '',
    notes: '',
    min_quantity: '',
  });

  // Estado del modal "Usar cantidad"
  const [showUseModal, setShowUseModal] = useState(false);
  const [useAmount, setUseAmount] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Estado del modal "¿Qué hiciste con este producto?"
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await getProduct(id);
      const p = response.data.product;
      setProduct(p);

      const pUnit = p.unit || 'g';
      let pType = 'solid';
      if (UNITS.liquid.includes(pUnit)) pType = 'liquid';
      else if (UNITS.unit.includes(pUnit) || pUnit === 'ud') pType = 'unit';

      setProductType(pType);
      setUnit(pUnit);
      setFormData({
        name: p.name || '',
        category: p.category || '',
        expiration_date: p.expiration_date ? p.expiration_date.split('T')[0] : '',
        quantity: p.quantity,
        notes: p.notes || '',
        min_quantity: p.min_quantity ?? '',
      });
    } catch (err) {
      setError('Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type) => {
    setProductType(type);
    if (type === 'solid') setUnit('g');
    else if (type === 'liquid') setUnit('ml');
    else setUnit('unidades');
  };

  const handleDelete = () => {
    setShowStatusModal(true);
  };

  const commitStatus = async (status) => {
    try {
      await markProductStatus(id, status);
      navigate('/products');
    } catch (err) {
      alert('Error al eliminar el producto');
    }
  };

  const handleUpdate = async () => {
    try {
      const location = formData.category === 'Congelados' ? 'congelador' : (product.location || 'despensa');
      await updateProduct(id, {
        name: formData.name,
        category: formData.category,
        unit,
        location,
        expiration_date: formData.expiration_date || null,
        quantity: formData.quantity,
        notes: formData.notes || null,
        min_quantity: formData.min_quantity ? parseFloat(formData.min_quantity) : null,
      });
      alert('Producto actualizado correctamente');
      fetchProduct();
    } catch (err) {
      alert('Error al actualizar el producto');
    }
  };

  const closeUseModal = () => {
    setShowUseModal(false);
    setUseAmount('');
    setConfirmDelete(false);
  };

  // Paso 1: el usuario pulsa Confirmar en el modal
  const handleUse = () => {
    const amount = parseFloat(useAmount);
    const available = parseFloat(formData.quantity);
    if (!amount || amount <= 0) {
      alert('Introduce una cantidad válida');
      return;
    }
    if (isNaN(available)) {
      alert('Error en la cantidad disponible');
      return;
    }
    // Redondear a 2 decimales para evitar problemas de precisión flotante
    const remaining = parseFloat((available - amount).toFixed(2));
    // Si lo que queda es menor que el mínimo del sistema (0.01), tratar como agotado
    if (remaining < 0.01) {
      setConfirmDelete(true);
    } else {
      commitUse(remaining);
    }
  };

  // Paso 2a: confirmar uso parcial
  const commitUse = async (remaining) => {
    try {
      await updateProduct(id, {
        name: formData.name,
        category: formData.category,
        unit,
        location: product.location || 'despensa',
        expiration_date: formData.expiration_date || null,
        quantity: remaining,
        notes: formData.notes || null,
        min_quantity: formData.min_quantity ? parseFloat(formData.min_quantity) : null,
      });
      closeUseModal();
      fetchProduct();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error desconocido';
      alert(`Error al actualizar el producto: ${msg}`);
    }
  };

  // Paso 2b: stock agotado → se marca automáticamente como consumido
  const commitDelete = async () => {
    try {
      await markProductStatus(id, 'consumed');
      navigate('/products');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error desconocido';
      alert(`Error al eliminar el producto: ${msg}`);
      closeUseModal();
    }
  };

  // Toggle congelar / descongelar
  const handleFreeze = async () => {
    const isFrozen = product.location === 'congelador';
    const newLocation = isFrozen ? 'nevera' : 'congelador';
    try {
      await updateProduct(id, {
        name: formData.name,
        category: formData.category,
        unit,
        location: newLocation,
        expiration_date: formData.expiration_date || null,
        quantity: formData.quantity,
        notes: formData.notes || null,
        min_quantity: formData.min_quantity ? parseFloat(formData.min_quantity) : null,
      });
      fetchProduct();
    } catch (err) {
      alert('Error al actualizar la ubicación');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (!product) return <div className="error-message">Producto no encontrado</div>;

  const unitLabel = productType === 'solid' ? 'Peso' : productType === 'liquid' ? 'Volumen' : 'Cantidad';
  const isFrozen = product.location === 'congelador';

  const locationLabel = {
    nevera: 'Nevera',
    congelador: 'Congelador',
    despensa: 'Despensa',
  }[product.location] || 'Sin ubicación';

  return (
    <div className="mobile-container product-detail-page">
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate('/products')}>
          <ArrowLeft size={24} />
        </button>
        <h2>Detalle de producto</h2>
      </div>

      <div className="detail-content">
        <div className="product-title-row">
          <h1 className="product-title">{formData.name || product.name}</h1>
          <span className={`location-badge ${isFrozen ? 'frozen' : ''}`}>
            {isFrozen && <Snowflake size={13} />} {locationLabel}
          </span>
        </div>

        <div className="detail-form">
          <div className="form-group">
            <label className="detail-label">Nombre</label>
            <input
              type="text"
              name="name"
              className="detail-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="detail-label">Categoría</label>
            <select
              name="category"
              className="detail-input"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="detail-label">
              Fecha de caducidad
              {formData.category === 'Congelados' && (
                <span style={{ fontWeight: 400, color: '#888', fontSize: '0.85em' }}> (opcional)</span>
              )}
            </label>
            <input
              type="date"
              name="expiration_date"
              className="detail-input"
              value={formData.expiration_date}
              onChange={handleChange}
              required={formData.category !== 'Congelados'}
            />
            {formData.category === 'Congelados' && (
              <span style={{ fontSize: '0.8em', color: '#888' }}>
                Los congelados pueden no tener fecha de caducidad definida.
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="detail-label">Tipo de producto</label>
            <div className="type-toggle">
              <button
                type="button"
                className={`type-btn ${productType === 'solid' ? 'active' : ''}`}
                onClick={() => handleTypeChange('solid')}
              >
                <Beef size={18} /> Sólido
              </button>
              <button
                type="button"
                className={`type-btn ${productType === 'liquid' ? 'active' : ''}`}
                onClick={() => handleTypeChange('liquid')}
              >
                <Droplets size={18} /> Líquido
              </button>
              <button
                type="button"
                className={`type-btn ${productType === 'unit' ? 'active' : ''}`}
                onClick={() => handleTypeChange('unit')}
              >
                <Package size={18} /> Unidades
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="detail-label">{unitLabel}</label>
            <div className="quantity-row" style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                name="quantity"
                className="detail-input"
                style={{ flex: 1 }}
                value={formData.quantity}
                onChange={handleChange}
                min="0.01" step="any"
              />
              <div className="unit-selector" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {UNITS[productType].map(u => (
                  <button
                    key={u}
                    type="button"
                    className={`unit-btn ${unit === u ? 'active' : ''}`}
                    onClick={() => setUnit(u)}
                  >
                    {u === 'unidades' ? 'ud' : u}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="detail-label">Stock mínimo (opcional)</label>
            <div className="quantity-row" style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                name="min_quantity"
                className="detail-input"
                style={{ flex: 1 }}
                value={formData.min_quantity}
                onChange={handleChange}
                min="0.01" step="any"
                placeholder="Ej: 200"
              />
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 0.75rem', background: '#f0f4f4', border: '1px solid #c8d8d8',
                borderRadius: '8px', fontWeight: 600, color: '#4A6767', fontSize: '0.9em',
                whiteSpace: 'nowrap',
              }}>
                {unit === 'unidades' ? 'ud' : unit}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="detail-label">Notas</label>
            <textarea
              name="notes"
              className="detail-input"
              style={{ resize: 'vertical', minHeight: '70px' }}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Observaciones opcionales..."
            />
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="quick-actions">
          <button
            className="btn-quick use-btn"
            onClick={() => setShowUseModal(true)}
          >
            <Minus size={16} /> Usar cantidad
          </button>
          <button
            className={`btn-quick freeze-btn ${isFrozen ? 'unfreeze' : ''}`}
            onClick={handleFreeze}
          >
            <Snowflake size={16} /> {isFrozen ? 'Descongelar' : 'Congelar'}
          </button>
        </div>

        <div className="detail-actions">
          <button className="btn btn-action" onClick={handleUpdate}>Editar</button>
          <button className="btn btn-action btn-danger" onClick={handleDelete}>Eliminar</button>
        </div>
      </div>

      {/* Modal: Usar cantidad */}
      {showUseModal && (
        <div className="modal-overlay" onClick={closeUseModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            {!confirmDelete ? (
              /* Paso 1: introducir cantidad */
              <>
                <h3 className="modal-title">¿Cuánto vas a usar?</h3>
                <p className="modal-sub">
                  Disponible: <strong>{formData.quantity} {unit}</strong>
                </p>
                <div className="modal-input-row">
                  <input
                    type="number"
                    className="detail-input"
                    value={useAmount}
                    onChange={e => setUseAmount(e.target.value)}
                    min="0.01"
                    step="any"
                    placeholder={`Cantidad en ${unit}`}
                    autoFocus
                  />
                  <span className="modal-unit">{unit}</span>
                </div>
                <div className="modal-actions">
                  <button className="btn-modal cancel" onClick={closeUseModal}>
                    Cancelar
                  </button>
                  <button className="btn-modal confirm" onClick={handleUse}>
                    Confirmar
                  </button>
                </div>
              </>
            ) : (
              /* Paso 2: confirmar eliminación por stock agotado */
              <>
                <h3 className="modal-title">Stock agotado</h3>
                <p className="modal-sub">
                  Has usado todo el stock de <strong>{product.name}</strong>.
                  ¿Eliminarlo del inventario?
                </p>
                <div className="modal-actions">
                  <button className="btn-modal cancel" onClick={closeUseModal}>
                    Cancelar
                  </button>
                  <button className="btn-modal confirm" onClick={commitDelete}>
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Modal: ¿Qué hiciste con este producto? */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">¿Qué hiciste con "{product.name}"?</h3>
            <p className="modal-sub">Esto nos ayuda a calcular tu impacto anti-desperdicio.</p>
            <div className="modal-actions status-actions">
              <button className="btn-modal consumed" onClick={() => commitStatus('consumed')}>
                ✓ Lo consumí
              </button>
              <button className="btn-modal wasted" onClick={() => commitStatus('wasted')}>
                🗑 Lo tiré
              </button>
              <button className="btn-modal cancel" onClick={() => setShowStatusModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductDetail;
