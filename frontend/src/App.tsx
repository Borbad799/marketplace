import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './components/Layout'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import ListingPage, { NearbyPage } from './pages/ListingPage'
import AuthPage from './pages/AuthPage'
import ProfilePage, { FavoritesPage, MyListingsPage, NotificationsPage, PublicProfilePage, SettingsPage } from './pages/ProfilePages'
import MessagesPage from './pages/MessagesPage'
import PostSelectPage, { ListingFormPage } from './pages/PostPage'
import { AdminHome, AdminLayout, AdminListings, AdminReports, AdminTablePage, AdminUsers } from './pages/AdminPages'

function Shell({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="listings" element={<AdminListings />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="messages" element={<AdminTablePage kind="messages" />} />
        <Route path="payments" element={<AdminTablePage kind="payments" />} />
        <Route path="banners" element={<AdminTablePage kind="banners" />} />
        <Route path="cities" element={<AdminTablePage kind="cities" />} />
        <Route path="categories" element={<AdminTablePage kind="categories" />} />
        <Route path="settings" element={<AdminTablePage kind="settings" />} />
      </Route>
      <Route path="/" element={<Shell><HomePage /></Shell>} />
      <Route path="/real-estate" element={<Shell><CatalogPage type="real_estate" /></Shell>} />
      <Route path="/cars" element={<Shell><CatalogPage type="cars" /></Shell>} />
      <Route path="/freelance" element={<Shell><CatalogPage type="freelance" /></Shell>} />
      <Route path="/men" element={<Shell><CatalogPage type="clothing" clothingCategory="men" /></Shell>} />
      <Route path="/women" element={<Shell><CatalogPage type="clothing" clothingCategory="women" /></Shell>} />
      <Route path="/kids" element={<Shell><CatalogPage type="clothing" clothingCategory="kids" /></Shell>} />
      <Route path="/shoes" element={<Shell><CatalogPage type="clothing" clothingCategory="shoes" /></Shell>} />
      <Route path="/electronics" element={<Shell><CatalogPage type="clothing" clothingCategory="electronics" /></Shell>} />
      <Route path="/home" element={<Shell><CatalogPage type="clothing" clothingCategory="home" /></Shell>} />
      <Route path="/beauty" element={<Shell><CatalogPage type="clothing" clothingCategory="beauty" /></Shell>} />
      <Route path="/sport" element={<Shell><CatalogPage type="clothing" clothingCategory="sport" /></Shell>} />
      <Route path="/search" element={<Shell><CatalogPage /></Shell>} />
      <Route path="/nearby" element={<Shell><NearbyPage /></Shell>} />
      <Route path="/listings/:id" element={<Shell><ListingPage /></Shell>} />
      <Route path="/listings/:id/edit" element={<Shell><ListingFormPage /></Shell>} />
      <Route path="/login" element={<Shell><AuthPage mode="login" /></Shell>} />
      <Route path="/register" element={<Shell><AuthPage mode="register" /></Shell>} />
      <Route path="/forgot" element={<Shell><AuthPage mode="forgot" /></Shell>} />
      <Route path="/profile" element={<Shell><ProfilePage /></Shell>} />
      <Route path="/profile/listings" element={<Shell><MyListingsPage /></Shell>} />
      <Route path="/profile/settings" element={<Shell><SettingsPage /></Shell>} />
      <Route path="/favorites" element={<Shell><FavoritesPage /></Shell>} />
      <Route path="/messages" element={<Shell><MessagesPage /></Shell>} />
      <Route path="/messages/:id" element={<Shell><MessagesPage /></Shell>} />
      <Route path="/notifications" element={<Shell><NotificationsPage /></Shell>} />
      <Route path="/users/:id" element={<Shell><PublicProfilePage /></Shell>} />
      <Route path="/post" element={<Shell><PostSelectPage /></Shell>} />
      <Route path="/post/:type" element={<Shell><ListingFormPage /></Shell>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
