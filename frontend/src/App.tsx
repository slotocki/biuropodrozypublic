import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import LoginForm from '@/components/LoginForm';
import Navbar from '@/components/Navbar';
import HomePage from '@/pages/HomePage';
import KontrahenciPage from '@/pages/invoice_vat/KontrahenciPage';
import FakturyLayout from '@/pages/invoice_vat/FakturyLayout';
import FakturyListPage from '@/pages/invoice_vat/FakturyListPage';
import NowaFakturaPage from '@/pages/invoice_vat/NowaFakturaPage';
import AdminPanel from '@/pages/AdminPanel';
import EdytujFakturaPage from '@/pages/invoice_vat/EdytujFakturaPage';
import KlienciLayout from '@/pages/client/KlienciLayout';
import KlienciPage from '@/pages/client/KlienciPage';
import GrupyPage from '@/pages/client/GrupyPage';
import ImportKlientow from '@/pages/client/ImportKlientow';
import OfertaLayout from '@/pages/offer/OfertaLayout';
import KonfiguracjaLayout from '@/pages/offer/KonfiguracjaLayout';
import DestynacjaPage from '@/pages/offer/DestynacjaPage';
import TransportPage from '@/pages/offer/TransportPage';
import WyzywieniePage from '@/pages/offer/WyzywieniePage';
import MiejsceOdjazduPage from '@/pages/offer/MiejsceOdjazduPage';
import GaleriaPage from '@/pages/offer/GaleriaPage';
import PromocjePage from '@/pages/offer/PromocjePage';
import OsrodkiPage from '@/pages/offer/OsrodkiPage';
import OsrodekDetailsPage from '@/pages/offer/OsrodekDetailsPage';
import OsrodekGaleriaPage from '@/pages/offer/OsrodekGaleriaPage';

// Główny layout aplikacji po zalogowaniu (z paskiem nawigacyjnym)
const AppLayout = () => {
    return (
        <div className="app-container">
            <Navbar />
            <main className="content">
                <Outlet />
            </main>
        </div>
    );
};

function App() {
    const { isAuthenticated } = useAuth();

    // Jeśli użytkownik nie jest zalogowany, pokaż tylko formularz logowania
    if (!isAuthenticated) {
        return (
            <NotificationProvider>
                <LoginForm />
            </NotificationProvider>
        );
    }

    // Jeśli jest zalogowany, pokaż pełną aplikację z routingiem
    return (
        <NotificationProvider>
            <Router>
                <Routes>
                    {/* Wszystkie chronione trasy są zagnieżdżone w AppLayout */}
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<HomePage />} />

                        {/* Główna strona modułu faktur */}
                        <Route path="/faktury" element={<FakturyLayout />} />

                        {/* Podstrony modułu faktur */}
                        <Route path="/faktury/lista" element={<FakturyListPage />} />
                        <Route path="/faktury/nowa" element={<NowaFakturaPage />} />
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="/faktury/edytuj/:id" element={<EdytujFakturaPage />} />

                        {/* Strona kontrahentów */}
                        <Route path="/kontrahenci" element={<KontrahenciPage />} />

                        {/* Moduł klientów */}
                        <Route path="/klienci" element={<KlienciLayout />} />
                        <Route path="/klienci/lista" element={<KlienciPage />} />
                        <Route path="/klienci/grupy" element={<GrupyPage />} />
                        <Route path="/klienci/import" element={<ImportKlientow />} />

                        {/* MODUŁ OFERT - Główna strona */}
                        <Route path="/oferta" element={<OfertaLayout />} />

                        {/* MODUŁ OFERT - Konfiguracja (strona pośrednia) */}
                        <Route path="/oferta/konfiguracja" element={<KonfiguracjaLayout />} />

                        {/* MODUŁ OFERT - Słowniki (pod konfiguracją) */}
                        <Route path="/oferta/konfiguracja/destynacje" element={<DestynacjaPage />} />
                        <Route path="/oferta/konfiguracja/transport" element={<TransportPage />} />
                        <Route path="/oferta/konfiguracja/wyzywienie" element={<WyzywieniePage />} />
                        <Route path="/oferta/konfiguracja/miejsca-odjazdu" element={<MiejsceOdjazduPage />} />
                        <Route path="/oferta/promocje" element={<PromocjePage />} />
                        <Route path="/oferta/osrodki" element={<OsrodkiPage />} />
                        <Route path="/oferta/osrodki/:id" element={<OsrodekDetailsPage />} />
                        {/* MODUŁ OFERT - Galeria */}
                        <Route path="/oferta/galeria" element={<GaleriaPage />} />
                        <Route path="/oferta/osrodki/:id/galeria" element={<OsrodekGaleriaPage />} />

                        {/* Przekierowanie dla nieznalezionych adresów */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Route>
                </Routes>
            </Router>
        </NotificationProvider>
    );
}

export default App;
