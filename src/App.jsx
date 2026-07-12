import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider } from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import Login from './auth/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import BusinessList from './pages/business/BusinessList';
import BusinessNew from './pages/business/BusinessNew';
import BusinessDetail from './pages/business/BusinessDetail';
import BusinessEdit from './pages/business/BusinessEdit';
import OrderList from './pages/orders/OrderList';
import OrderDetail from './pages/orders/OrderDetail';
import OrderNew from './pages/orders/OrderNew';
import TicketList from './pages/tickets/TicketList';
import TicketDetail from './pages/tickets/TicketDetail';
import Billing from './pages/billing/Billing';
import Team from './pages/team/Team';
import Templates from './pages/templates/Templates';
import Sops from './pages/sops/Sops';
import styles from './App.module.css';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className={styles.layout}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
      <div className={styles.main}>
        <Header />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/business" element={<BusinessList />} />
                  <Route path="/business/new" element={<BusinessNew />} />
                  <Route path="/business/:businessId" element={<BusinessDetail />} />
                  <Route path="/business/:businessId/edit" element={<BusinessEdit />} />
                  <Route path="/orders" element={<OrderList />} />
                  <Route path="/orders/new" element={<OrderNew />} />
                  <Route path="/orders/:orderId" element={<OrderDetail />} />
                  <Route path="/tickets" element={<TicketList />} />
                  <Route path="/tickets/:ticketId" element={<TicketDetail />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/sops" element={<Sops />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
