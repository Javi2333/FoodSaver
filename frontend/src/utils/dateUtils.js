import { parseISO, differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Calcula el estado de un producto basado en su fecha de caducidad
 * @param {string} expirationDate - Fecha de caducidad en formato ISO
 * @returns {string} - 'fresh', 'warning', 'urgent', 'expired'
 */
export const getProductStatus = (expirationDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expDate = parseISO(expirationDate);
  const daysUntilExpiration = differenceInDays(expDate, today);

  if (daysUntilExpiration < 0) return 'expired';
  if (daysUntilExpiration <= 2) return 'urgent';
  if (daysUntilExpiration <= 7) return 'warning';
  return 'fresh';
};

/**
 * Obtiene el color asociado a un estado de producto
 * @param {string} status - Estado del producto
 * @returns {string} - Clase CSS para el color
 */
export const getStatusColor = (status) => {
  const colors = {
    fresh: 'green',
    warning: 'yellow',
    urgent: 'orange',
    expired: 'red'
  };
  return colors[status] || 'gray';
};

/**
 * Obtiene el texto descriptivo de un estado
 * @param {string} status - Estado del producto
 * @returns {string} - Texto descriptivo
 */
export const getStatusText = (status) => {
  const texts = {
    fresh: 'Fresco',
    warning: 'Próximo a caducar',
    urgent: 'Caducidad inminente',
    expired: 'Caducado'
  };
  return texts[status] || 'Desconocido';
};

/**
 * Calcula los días restantes hasta la caducidad
 * @param {string} expirationDate - Fecha de caducidad en formato ISO
 * @returns {number} - Días restantes (negativo si ya caducó)
 */
export const getDaysUntilExpiration = (expirationDate) => {
  if (!expirationDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = parseISO(expirationDate);
  return differenceInDays(expDate, today);
};

/**
 * Formatea una fecha para mostrar en la interfaz
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} - Fecha formateada
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = parseISO(dateString);
  return format(date, 'dd/MM/yyyy', { locale: es });
};

/**
 * Formatea una fecha para input tipo date
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = parseISO(dateString);
  return format(date, 'yyyy-MM-dd');
};
