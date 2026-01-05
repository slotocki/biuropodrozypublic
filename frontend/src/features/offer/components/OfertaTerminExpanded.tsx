// src/components/offer/OfertaTerminExpanded.tsx
import React from 'react';
import type { OfertaDetail } from '@/common/api/ofertaApi';

interface OfertaTerminExpandedProps {
    oferta: OfertaDetail;
}

export const OfertaTerminExpanded: React.FC<OfertaTerminExpandedProps> = ({ oferta }) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return 'Brak daty';
        const date = new Date(dateString);
        return date.toLocaleString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-4">
            {/* Termin i noclegi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                        <div className="font-semibold text-gray-700">Termin</div>
                        <div className="text-sm text-gray-600">
                            {formatDate(oferta.terminOd)} - {formatDate(oferta.terminDo)}
                        </div>
                        <div className="text-sm text-gray-500">
                            {oferta.iloscNoclegow} {oferta.iloscNoclegow === 1 ? 'noc' : 'noce/i'}
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                        <div className="font-semibold text-gray-700">Zakwaterowanie</div>
                        <div className="text-sm text-gray-600">{formatDateTime(oferta.dataZakwaterowania)}</div>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <span className="text-2xl">❌</span>
                    <div>
                        <div className="font-semibold text-gray-700">Wykwaterowanie</div>
                        <div className="text-sm text-gray-600">{formatDateTime(oferta.dataWykwaterowania)}</div>
                    </div>
                </div>
            </div>

            {/* Ośrodki */}
            <div>
                <h4 className="font-semibold text-gray-700 mb-3">
                    🏨 Ośrodki i wyżywienie
                </h4>
                <div className="space-y-2">
                    {oferta.osrodki.map((osrodek) => (
                        <div
                            key={osrodek.idOsrodek}
                            className="bg-gray-50 p-3 rounded-md flex justify-between items-center"
                        >
                            <div>
                                <div className="font-medium text-gray-900">{osrodek.nazwaOsrodka}</div>
                                {osrodek.rodzajWyzywienia && (
                                    <div className="text-sm text-gray-600 mt-1">
                                        🍽️ {osrodek.rodzajWyzywienia}
                                    </div>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                    Pokoje: {osrodek.pokoje.length}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-blue-600">
                                    {osrodek.cenaOs.toFixed(2)} zł
                                </div>
                                <div className="text-xs text-gray-500">za osobę</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OfertaTerminExpanded;
