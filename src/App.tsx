import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import HomePage from './components/HomePage'
import SearchPage from './components/SearchPage'
import ProductDetail from './components/ProductDetail'
import FavoritesPage from './components/FavoritesPage'
import ProfilePage from './components/ProfilePage'
import LoginPage from './components/LoginPage'
import AdminPage from './components/admin/AdminPage'
import RecentViewsPage from './components/RecentViewsPage'
import DefaultShippingPage from './components/DefaultShippingPage'
import NotFound from './components/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/recent-views" element={<RecentViewsPage />} />
        <Route path="/default-shipping" element={<DefaultShippingPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminPage />} />
        <Route path="users" element={<AdminPage />} />
        <Route path="products" element={<AdminPage />} />
        <Route path="carriers" element={<AdminPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  )
}
