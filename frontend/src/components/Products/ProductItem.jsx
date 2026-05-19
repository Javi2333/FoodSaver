import { Link } from 'react-router-dom';
import { ChevronRight, Milk, Drumstick, Fish, Apple, Carrot, Snowflake, CupSoda, Package } from 'lucide-react';
import { getDaysUntilExpiration } from '../../utils/dateUtils';
import './ProductItem.css';

const ProductItem = ({ product }) => {
  const daysLeft = getDaysUntilExpiration(product.expiration_date);
  
  const getIcon = (category) => {
    switch(category) {
      case 'Lácteos': return <Milk />;
      case 'Carnes': return <Drumstick />;
      case 'Pescados': return <Fish />;
      case 'Frutas': return <Apple />;
      case 'Verduras': return <Carrot />;
      case 'Congelados': return <Snowflake />;
      case 'Bebidas': return <CupSoda />;
      default: return <Package />;
    }
  };

  return (
    <Link to={`/products/${product.id}`} className="product-item">
      <div className="product-icon-container">
        {getIcon(product.category)}
      </div>
      
      <div className="product-info-main">
        <h3>
          {product.name}
          {product.location === 'congelador' && (
            <span className="frozen-badge" title="Congelado">
              <Snowflake size={13} />
            </span>
          )}
        </h3>
        <p className="category-text">
          {product.category}
        </p>
        {product.location === 'congelador' ? (
          <p className="expiry-text" style={{ color: '#5b8fa8' }}>En el congelador</p>
        ) : daysLeft === null ? (
          <p className="expiry-text" style={{ color: '#888' }}>Sin fecha de caducidad</p>
        ) : (
          <p className={`expiry-text ${daysLeft < 3 ? 'urgent' : ''}`}>
            caduca en {daysLeft} días
          </p>
        )}
      </div>
      
      <div className="product-arrow">
        <ChevronRight color="#2F4F4F" />
      </div>
    </Link>
  );
};

export default ProductItem;
