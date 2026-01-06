﻿import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/common/context/AuthContext';
import { NotificationProvider } from '@/common/context/NotificationContext';
import LoginForm from '@/common/components/LoginForm';
import Navbar from '@/common/components/Navbar';

// Home
import HomePage from '@/features/home/pages/HomePage';

// Admin
import AdminPanel from '@/features/admin/pages/AdminPanel';
import UstawieniaFirmyPage from '@/features/admin/pages/UstawieniaFirmyPage';

// Invoice (Faktury)
import KontrahenciPage from '@/features/invoice/pages/KontrahenciPage';
import FakturyLayout from '@/features/invoice/pages/FakturyLayout';
import FakturyListPage from '@/features/invoice/pages/FakturyListPage';
import NowaFakturaPage from '@/features/invoice/pages/NowaFakturaPage';
import EdytujFakturaPage from '@/features/invoice/pages/EdytujFakturaPage';
import KorektaFakturaPage from '@/features/invoice/pages/KorektaFakturaPage';

// Reports (Raporty)
import RaportyListPage from '@/features/reports/pages/RaportyListPage';
import RaportDetailPage from '@/features/reports/pages/RaportDetailPage';

// Client (Klienci)
import KlienciLayout from '@/features/client/pages/KlienciLayout';
import KlienciPage from '@/features/client/pages/KlienciPage';
import GrupyPage from '@/features/client/pages/GrupyPage';
import ImportKlientow from '@/features/client/pages/ImportKlientow';

// Offer (Oferty)
import OfertaLayout from '@/features/offer/pages/OfertaLayout';
import KonfiguracjaLayout from '@/features/offer/pages/KonfiguracjaLayout';
import DestynacjaPage from '@/features/offer/pages/DestynacjaPage';
import TransportPage from '@/features/offer/pages/TransportPage';
import WyzywieniePage from '@/features/offer/pages/WyzywieniePage';
import MiejsceOdjazduPage from '@/features/offer/pages/MiejsceOdjazduPage';
import GaleriaPage from '@/features/offer/pages/GaleriaPage';
import PromocjePage from '@/features/offer/pages/PromocjePage';
import OsrodkiPage from '@/features/offer/pages/OsrodkiPage';
import OsrodekDetailsPage from '@/features/offer/pages/OsrodekDetailsPage';
import OsrodekGaleriaPage from '@/features/offer/pages/OsrodekGaleriaPage';
import OfertaListPage from '@/features/offer/pages/OfertaListPage';
import OfertaDetailPage from '@/features/offer/pages/OfertaDetailPage';
import CreateOfertaPage from '@/features/offer/pages/CreateOfertaPage';
import EditOfertaPage from '@/features/offer/pages/EditOfertaPage';
import OfertaGaleriaPage from '@/features/offer/pages/OfertaGaleriaPage';

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

    if (!isAuthenticated) {
        return (
            <NotificationProvider>
                <LoginForm />
            </NotificationProvider>
        );
    }

    return (
        <NotificationProvider>
            <Router>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<HomePage />} />

                        {/* Główna strona modułu faktur */}
                        <Route path="/faktury" element={<FakturyLayout />} />
                        <Route path="/faktury/lista" element={<FakturyListPage />} />
                        <Route path="/faktury/nowa" element={<NowaFakturaPage />} />
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="/admin/ustawienia-firmy" element={<UstawieniaFirmyPage />} />
                        <Route path="/admin/raporty" element={<RaportyListPage />} />
                        <Route path="/admin/raporty/:rok/:miesiac" element={<RaportDetailPage />} />
                        <Route path="/faktury/edytuj/:id" element={<EdytujFakturaPage />} />
                        <Route path="/faktury/korekta/:id" element={<KorektaFakturaPage />} />


                        {/* Strona kontrahentów */}
                        <Route path="/kontrahenci" element={<KontrahenciPage />} />

                        {/* Moduł klientów */}
                        <Route path="/klienci" element={<KlienciLayout />} />
                        <Route path="/klienci/lista" element={<KlienciPage />} />
                        <Route path="/klienci/grupy" element={<GrupyPage />} />
                        <Route path="/klienci/import" element={<ImportKlientow />} />

                        {/* ============================================ */}
                        {/* MODUŁ OFERT */}
                        {/* ============================================ */}

                        {/* Dashboard ofert (kafelki) */}
                        <Route path="/oferta" element={<OfertaLayout />} />

                        {/* Lista ofert */}
                        <Route path="/oferta/lista" element={<OfertaListPage />} />
                        <Route path="/oferta/nowa" element={<CreateOfertaPage />} />
                        <Route path="/oferta/edytuj/:id" element={<EditOfertaPage />} />

                        {/* Szczegóły oferty */}
                        <Route path="/oferta/szczegoly/:id" element={<OfertaDetailPage />} />
                        <Route path="/oferta/:id/galeria" element={<OfertaGaleriaPage />} />


                        {/* Konfiguracja (strona pośrednia) */}
                        <Route path="/oferta/konfiguracja" element={<KonfiguracjaLayout />} />

                        {/* Słowniki (pod konfiguracją) */}
                        <Route path="/oferta/konfiguracja/destynacje" element={<DestynacjaPage />} />
                        <Route path="/oferta/konfiguracja/transport" element={<TransportPage />} />
                        <Route path="/oferta/konfiguracja/wyzywienie" element={<WyzywieniePage />} />
                        <Route path="/oferta/konfiguracja/miejsca-odjazdu" element={<MiejsceOdjazduPage />} />

                        {/* Promocje */}
                        <Route path="/oferta/promocje" element={<PromocjePage />} />

                        {/* Ośrodki */}
                        <Route path="/oferta/osrodki" element={<OsrodkiPage />} />
                        <Route path="/oferta/osrodki/:id" element={<OsrodekDetailsPage />} />
                        <Route path="/oferta/osrodki/:id/galeria" element={<OsrodekGaleriaPage />} />

                        {/* Galeria */}
                        <Route path="/oferta/galeria" element={<GaleriaPage />} />

                        {/* Przekierowanie dla nieznalezionych adresów */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Route>
                </Routes>
            </Router>
        </NotificationProvider>
    );
}

export default App;
