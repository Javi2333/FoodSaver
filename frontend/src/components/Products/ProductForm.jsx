import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../../services/productService';
import { cacheDel } from '../../services/cache';
import { Beef, Droplets, Package } from 'lucide-react';
import './ProductForm.css';

const CATEGORIES = ['Lácteos', 'Carnes', 'Pescados', 'Frutas', 'Legumbres', 'Salsas', 'Verduras', 'Tubérculos', 'Embutidos', 'Congelados', 'Bebidas', 'Otros'];

const UNITS = {
  solid:  ['g', 'kg'],
  liquid: ['ml', 'L'],
  unit:   ['unidades'],
};

const ProductForm = () => {
  const navigate = useNavigate();
  const [productType, setProductType] = useState('solid'); // 'solid' | 'liquid' | 'unit'
  const [unit, setUnit] = useState('g');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    expiration_date: '',
    notes: '',
    min_quantity: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTypeChange = (type) => {
    setProductType(type);
    if (type === 'solid') setUnit('g');
    else if (type === 'liquid') setUnit('ml');
    else setUnit('unidades');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const location = formData.category === 'Congelados' ? 'congelador' : 'despensa';
      await createProduct({
        ...formData,
        unit,
        location,
        min_quantity: formData.min_quantity ? parseFloat(formData.min_quantity) : null,
      });
      cacheDel('products');
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const unitLabel = productType === 'solid' ? 'Peso' : productType === 'liquid' ? 'Volumen' : 'Cantidad';

  const getPlaceholder = () => {
    if (productType === 'solid') return 'Ej: 500';
    if (productType === 'liquid') return 'Ej: 1000';
    return 'Ej: 12';
  };

  return (
    <div className="mobile-container product-form-page">
      <div className="form-header">
        <h1>Añadir Producto</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="add-product-form">

        {/* Nombre */}
        <div className="form-group">
          <label htmlFor="name" className="form-label">Nombre</label>
          <input
            type="text" id="name" name="name"
            className="form-input"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Toggle Sólido / Líquido / Unidades */}
        <div className="form-group">
          <label className="form-label">Tipo de producto</label>
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

        {/* Cantidad + Unidad */}
        <div className="form-group">
          <label htmlFor="quantity" className="form-label">
            {unitLabel}
          </label>
          <div className="quantity-row">
            <input
              type="number"
              id="quantity" name="quantity"
              className="form-input quantity-input"
              placeholder={getPlaceholder()}
              value={formData.quantity}
              onChange={handleChange}
              min="0.01" step="any"
              required
            />
            <div className="unit-selector">
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

        {/* Categoría */}
        <div className="form-group">
          <label htmlFor="category" className="form-label">Categoría</label>
          <select
            id="category" name="category"
            className="form-input"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Seleccionar...</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Fecha de caducidad */}
        <div className="form-group">
          <label htmlFor="expiration_date" className="form-label">
            Fecha de caducidad
            {formData.category === 'Congelados' && (
              <span style={{ fontWeight: 400, color: '#888', fontSize: '0.85em' }}> (opcional)</span>
            )}
          </label>
          <input
            type="date"
            id="expiration_date" name="expiration_date"
            className="form-input"
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

        {/* Stock mínimo (opcional) */}
        <div className="form-group">
          <label htmlFor="min_quantity" className="form-label">
            Stock mínimo <span style={{ fontWeight: 400, color: '#888', fontSize: '0.85em' }}>(opcional)</span>
          </label>
          <div className="quantity-row">
            <input
              type="number"
              id="min_quantity" name="min_quantity"
              className="form-input quantity-input"
              placeholder="Ej: 200"
              value={formData.min_quantity}
              onChange={handleChange}
              min="0.01" step="any"
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
          <span style={{ fontSize: '0.8em', color: '#888' }}>
            Se añadirá a la lista de compra cuando el stock baje de esta cantidad.
          </span>
        </div>

        {/* Notas (opcional) */}
        <div className="form-group">
          <label htmlFor="notes" className="form-label">Notas <span style={{ fontWeight: 400, color: '#888', fontSize: '0.85em' }}>(opcional)</span></label>
          <textarea
            id="notes" name="notes"
            className="form-input"
            style={{ resize: 'vertical', minHeight: '70px' }}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Observaciones, marca, procedencia..."
          />
        </div>

        <div className="form-actions-bottom">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Añadir
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/products')}
            style={{ marginTop: '1rem', border: '2px solid #2F4F4F', color: '#2F4F4F' }}
          >
            Cancelar
          </button>
          <p className="cancel-hint">vuelve a Despensa</p>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
