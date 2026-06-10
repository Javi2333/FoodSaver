import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import BottomNav from './components/Layout/BottomNav';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import LandingPage from './pages/LandingPage';
import Dashboard from './components/Dashboard/Dashboard';
import ProductList from './components/Products/ProductList';
import ProductForm from './components/Products/ProductForm';
import ProductDetail from './components/Products/ProductDetail';
import RecipeList from './components/Recipes/RecipeList';
import RecipeDetail from './components/Recipes/RecipeDetail';
import RecipeForm from './components/Recipes/RecipeForm';
import ShoppingList from './components/Shopping/ShoppingList';
import PrivateRoute from './components/PrivateRoute';
import Notifications from './components/Notifications/Notifications';
import Profile from './components/Profile/Profile';
import Stats from './components/Stats/Stats';
import { registerServiceWorker, checkAndNotifyExpiring, subscribeToWebPush } from './services/notificationService';
import { getAllProducts } from './services/productService';
import './App.css';

function ServerWakeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    if (baseUrl.includes('localhost')) return;

    const timer = setTimeout(() => setVisible(true), 3000);

    fetch(baseUrl + '/')
      .then(() => { clearTimeout(timer); setVisible(false); })
      .catch(() => { clearTimeout(timer); setVisible(false); });

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#4A6767', color: 'white', textAlign: 'center',
      padding: '0.75rem 1rem', fontSize: '0.9rem', lineHeight: '1.4',
    }}>
      Iniciando servidor, espera hasta 1 minuto...
    </div>
  );
}

// Componente interno para acceder al contexto de auth
function NotificationBootstrap() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Comprueba productos al iniciar sesión y lanza notificaciones si procede
    getAllProducts()
      .then(res => {
        const products = res.products ?? res.data?.products ?? [];
        checkAndNotifyExpiring(products);
      })
      .catch(() => {});
    // Suscribe al usuario a Web Push si tiene permiso
    subscribeToWebPush();
  }, [isAuthenticated]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <ServerWakeBanner />
          <NotificationBootstrap />
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/" element={<LandingPage />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/products" 
                element={
                  <PrivateRoute>
                    <ProductList />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/add-product" 
                element={
                  <PrivateRoute>
                    <ProductForm />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/products/:id" 
                element={
                  <PrivateRoute>
                    <ProductDetail />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/recipes" 
                element={
                  <PrivateRoute>
                    <RecipeList />
                  </PrivateRoute>
                } 
              />
               <Route
                path="/recipes/:id"
                element={
                  <PrivateRoute>
                    <RecipeDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/add-recipe"
                element={
                  <PrivateRoute>
                    <RecipeForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/recipes/:id/edit"
                element={
                  <PrivateRoute>
                    <RecipeForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/shopping"
                element={
                  <PrivateRoute>
                    <ShoppingList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <PrivateRoute>
                    <Notifications />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/stats"
                element={
                  <PrivateRoute>
                    <Stats />
                  </PrivateRoute>
                }
              />

            </Routes>
          </main>
          <BottomNav />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
