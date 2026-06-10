import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAllProducts, getExpiringProducts } from '../../services/productService';
import { cacheGet, cacheSet } from '../../services/cache';
import ProductItem from './ProductItem';
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import './ProductList.css';

const CATEGORIES = ['Todas', 'Lácteos', 'Carnes', 'Pescados', 'Frutas', 'Legumbres', 'Salsas', 'Verduras', 'Tubérculos', 'Embutidos', 'Congelados', 'Bebidas', 'Otros'];
const LOCATIONS = [
  { label: 'Todas',      value: 'todas' },
  { label: 'Nevera',     value: 'nevera' },
  { label: 'Despensa',   value: 'despensa' },
  { label: 'Congelador', value: 'congelador' },
];

const SORT_OPTIONS = [
  { value: 'expiry_asc',    label: 'Caducidad: más pronto' },
  { value: 'expiry_desc',   label: 'Caducidad: más lejana' },
  { value: 'quantity_asc',  label: 'Cantidad: menor a mayor' },
  { value: 'quantity_desc', label: 'Cantidad: mayor a menor' },
  { value: 'alpha_asc',     label: 'A – Z' },
  { value: 'alpha_desc',    label: 'Z – A' },
];

const ProductList = () => {
  const navigate   = useNavigate();
  const location   = useLocation();

  const isExpiring = new URLSearchParams(location.search).get('filter') === 'expiring';
  const title      = isExpiring ? 'Próximos a caducar' : 'Despensa';
  const cacheKey   = isExpiring ? 'products-expiring' : 'products';

  const [products, setProducts]           = useState(() => cacheGet(cacheKey) ?? []);
  const [loading, setLoading]             = useState(!cacheGet(cacheKey));
  const [error, setError]                 = useState('');
  const [search, setSearch]               = useState('');
  const [selectedCategory, setCategory]   = useState('Todas');
  const [selectedLocation, setLocation]   = useState('todas');
  const [sortBy, setSortBy]               = useState('expiry_asc');
  const [showFilters, setShowFilters]     = useState(false);

  useEffect(() => { fetchProducts(); }, [isExpiring]);

  const fetchProducts = async () => {
    try {
      const response = isExpiring ? await getExpiringProducts() : await getAllProducts();
      const data = response.products ?? response.data?.products ?? [];
      setProducts(data);
      cacheSet(cacheKey, data);
    } catch (err) {
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  // ── filtrado y ordenación ────────────────────────────
  const processed = [...products]
    .filter(p => {
      const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
      const matchLocation = selectedLocation === 'todas' || p.location === selectedLocation;
      return matchSearch && matchCategory && matchLocation;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'expiry_asc':    return new Date(a.expiration_date) - new Date(b.expiration_date);
        case 'expiry_desc':   return new Date(b.expiration_date) - new Date(a.expiration_date);
        case 'quantity_asc':  return Number(a.quantity) - Number(b.quantity);
        case 'quantity_desc': return Number(b.quantity) - Number(a.quantity);
        case 'alpha_asc':     return a.name.localeCompare(b.name, 'es');
        case 'alpha_desc':    return b.name.localeCompare(a.name, 'es');
        default:              return 0;
      }
    });

  const hasActiveFilters = selectedCategory !== 'Todas' || selectedLocation !== 'todas' || sortBy !== 'expiry_asc';

  if (loading) return <div className="loading">Cargando {title.toLowerCase()}...</div>;

  return (
    <div className="mobile-container product-list-page">
      <div className="list-header">
        <h1>{title}</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Barra de búsqueda */}
      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Botón para mostrar/ocultar filtros */}
      {!isExpiring && (
        <button
          className={`filter-toggle ${hasActiveFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(f => !f)}
        >
          <SlidersHorizontal size={16} />
          Filtros y orden
          {hasActiveFilters && <span className="filter-badge" />}
        </button>
      )}

      {/* Panel de filtros */}
      {showFilters && !isExpiring && (
        <div className="filter-panel">
          <div className="filter-group">
            <p className="filter-label">Ubicación</p>
            <div className="category-chips">
              {LOCATIONS.map(loc => (
                <button
                  key={loc.value}
                  className={`chip ${selectedLocation === loc.value ? 'chip-active' : ''}`}
                  onClick={() => setLocation(loc.value)}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <p className="filter-label">Categoría</p>
            <div className="category-chips">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`chip ${selectedCategory === cat ? 'chip-active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <p className="filter-label">Ordenar por</p>
            <select
              className="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button
            className="filter-reset"
            onClick={() => { setCategory('Todas'); setLocation('todas'); setSortBy('expiry_asc'); }}
          >
            Restablecer filtros
          </button>
        </div>
      )}

      {/* Contador de resultados */}
      <p className="results-count">
        {processed.length} producto{processed.length !== 1 ? 's' : ''}
        {(search || selectedCategory !== 'Todas') ? ' encontrados' : ''}
      </p>

      <div className="product-list">
        {processed.length === 0 ? (
          <div className="empty-state">
            <p>{search || selectedCategory !== 'Todas'
              ? 'No hay productos que coincidan con tu búsqueda'
              : isExpiring ? 'No hay productos próximos a caducar' : 'Tu despensa está vacía'}
            </p>
          </div>
        ) : (
          processed.map(product => (
            <ProductItem key={product.id} product={product} />
          ))
        )}
      </div>

      {!isExpiring && (
        <button className="fab" onClick={() => navigate('/add-product')}>
          <Plus size={32} />
        </button>
      )}
    </div>
  );
};

export default ProductList;
